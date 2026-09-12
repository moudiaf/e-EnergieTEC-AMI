import { Request, Response } from 'express';
import { CustomerRepository, DCURepository, RegionRepository } from '../repositories';
import { auditService } from '../services/audit.service';

export const CustomerController = {
  async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await CustomerRepository.getAll();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getCustomerById(req: Request, res: Response) {
    try {
      const customer = await CustomerRepository.getById(req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Client non trouvé' });
      }
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateCustomer(req: Request, res: Response) {
    try {
      await CustomerRepository.update(req.params.id, req.body);
      await auditService.log('CUSTOMER_UPDATE', `Mise à jour client (${req.params.id})`, (req as any).user?.username);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createCustomer(req: Request, res: Response) {
    try {
      const { id, name } = req.body;
      await CustomerRepository.insert(req.body);
      await auditService.log('CUSTOMER_CREATE', `Création du client ${name} (${id})`, (req as any).user?.username);
      res.status(201).json({ id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteCustomer(req: Request, res: Response) {
    try {
      await CustomerRepository.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY')) {
        res.status(409).json({ 
          success: false, 
          message: "Impossible de supprimer ce client car il possède des compteurs, tickets ou factures associés." 
        });
      } else {
        res.status(500).json({ success: false, message: "Erreur lors de la suppression du client.", error: err.message });
      }
    }
  },

  // --- DCUs ---
  async getAllDCUs(req: Request, res: Response) {
    try {
      res.json(await DCURepository.getAll());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createDCU(req: Request, res: Response) {
    try {
      const { id, name } = req.body;
      await DCURepository.insert(req.body);
      await auditService.log('DCU_CREATE', `Création du DCU ${name} (${id})`, (req as any).user?.username);
      res.status(201).json({ success: true, message: 'DCU created' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteDCU(req: Request, res: Response) {
    try {
      await DCURepository.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY')) {
        res.status(409).json({ 
          success: false, 
          message: "Impossible de supprimer ce concentrateur (DCU) car des compteurs y sont rattachés." 
        });
      } else {
        res.status(500).json({ success: false, message: "Erreur lors de la suppression du DCU.", error: err.message });
      }
    }
  },

  async updateDCU(req: Request, res: Response) {
    try {
      const existing = await DCURepository.getById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'DCU non trouvé' });
      await DCURepository.update(req.params.id, req.body);
      await auditService.log('DCU_UPDATE', `Mise à jour du DCU ${req.params.id}`, (req as any).user?.username);
      res.json({ success: true, message: 'DCU mis à jour' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // --- REGIONS ---
  async getAllRegions(req: Request, res: Response) {
    try {
      res.json(await RegionRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async createRegion(req: Request, res: Response) {
    try {
      await RegionRepository.insert(req.body);
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateRegion(req: Request, res: Response) {
    try {
      await RegionRepository.update(req.params.id, req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteRegion(req: Request, res: Response) {
    try {
      await RegionRepository.delete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY')) {
        res.status(409).json({ 
          success: false, 
          message: "Impossible de supprimer cette région car elle contient des clients ou des sous-régions." 
        });
      } else {
        res.status(500).json({ success: false, message: "Erreur lors de la suppression de la région.", error: err.message });
      }
    }
  }
};
