import { Request, Response } from 'express';
import { MeterRepository, AlertRepository, TicketRepository, AlertRuleRepository } from '../repositories';
import { auditService } from '../services/audit.service';

export const MeterController = {
  async getAllMeters(req: Request, res: Response) {
    try {
      res.json(await MeterRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getMeterById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const meter = await MeterRepository.getById(id);
      if (!meter) {
        return res.status(404).json({ success: false, message: `Compteur ${id} non trouvé.` });
      }
      res.json(meter);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateMeter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await MeterRepository.update(id, req.body);
      await auditService.log('METER_UPDATE', `Mise à jour du compteur ${id}`, (req as any).user?.username);
      res.json({ success: true, message: `Compteur ${id} mis à jour avec succès.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async registerMeter(req: Request, res: Response) {
    try {
      const { id, serialNumber } = req.body;
      await MeterRepository.insert(req.body);
      await auditService.log('METER_REGISTER', `Enregistrement du compteur ${serialNumber || id}`, (req as any).user?.username);
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteMeter(req: Request, res: Response) {
    try {
      await MeterRepository.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY')) {
        res.status(409).json({ 
          success: false, 
          message: "Impossible de supprimer ce compteur car il possède des relevés, jetons ou alertes associés." 
        });
      } else {
        res.status(500).json({ success: false, message: "Erreur lors de la suppression du compteur.", error: err.message });
      }
    }
  },

  async tamperMeter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { tamperStatus } = req.body;
      await MeterRepository.updateTamperStatus(id, tamperStatus);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateLifecycle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await MeterRepository.updateLifecycleStatus(id, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // --- ALERTS ---
  async getAllAlerts(req: Request, res: Response) {
    try {
      res.json(await AlertRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createAlert(req: Request, res: Response) {
    try {
      const { type, title, message, meterId, priority, category } = req.body;
      const id = `ALT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await AlertRepository.insert({
        id,
        type,
        title,
        message,
        meterId,
        timestamp: new Date().toISOString(),
        status: 'unread',
        priority: priority || 'medium',
        category: category || 'system'
      });
      
      res.status(201).json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async readAlert(req: Request, res: Response) {
    try {
      await AlertRepository.updateStatus(req.params.id, 'read');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateAlertRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { enabled, active, notifySms, notifyEmail } = req.body;
      const isActive = active !== undefined ? active : enabled;
      await AlertRuleRepository.update(id, { 
        active: isActive, 
        notifySms, 
        notifyEmail 
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // --- TICKETS ---
  async getAllTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const allTickets = await TicketRepository.getAll();
      if (user && user.role === 'customer' && user.associatedCustomerId) {
        return res.json(allTickets.filter(t => t.customerId === user.associatedCustomerId));
      }
      res.json(allTickets);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createTicket(req: Request, res: Response) {
    try {
      const { id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp } = req.body;
      await TicketRepository.insert(req.body);
      await auditService.log('TICKET_OPEN', `Ouverture ticket: ${subject}`, (req as any).user?.username);
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateTicket(req: Request, res: Response) {
    try {
      await TicketRepository.update(req.params.id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateTicketStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await TicketRepository.updateStatus(id, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // --- SIMULATIONS DÉFINITIVEMENT DÉSACTIVÉES EN MODE PRODUCTION PURE ---
  async simulateAnomaly(req: Request, res: Response) {
    return res.status(403).json({
      success: false,
      error: "Mode Production Pure NIGELEC verrouillé : les simulations d'anomalies artificielles sont définitivement désactivées. Seules les télémesures matérielles réelles font foi."
    });
  },

  async simulateFraud(req: Request, res: Response) {
    return res.status(403).json({
      success: false,
      error: "Mode Production Pure NIGELEC verrouillé : les simulations de fraudes artificielles sont définitivement désactivées. Seule la détection physique par FraudDetectionService est autorisée."
    });
  }
};
