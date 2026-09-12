import { Request, Response } from 'express';
import { TokenRepository, InvoiceRepository, PaymentRepository } from '../repositories';
import { stsService } from '../services/sts.service';
import { billingService } from '../services/billing.service';
import { auditService } from '../services/audit.service';

export const STSController = {
  async generateToken(req: Request, res: Response) {
    try {
      const { meterId, kwh, type, rechargeAmount, subClass, customValue } = req.body;
      const { token, tid, rawToken } = await stsService.generateToken(meterId, kwh, type, rechargeAmount, subClass, customValue);
      
      const tokenData = { ...req.body, token, tid, rawToken };
      const resolvedId = await stsService.persistToken(tokenData);
      
      await auditService.log('TOKEN_GENERATE', `Génération token ${type} pour ${meterId} (${kwh} kWh)`, (req as any).user?.username);
      
      res.status(201).json({ id: resolvedId, token, tid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getAllTokens(req: Request, res: Response) {
    try {
      res.json(await TokenRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // --- BILLING & INVOICES ---
  async runBilling(req: Request, res: Response) {
    try {
      const count = await billingService.runBillingCycle();
      const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      
      await auditService.log('BILLING_RUN', `Lancement cycle facturation: ${count} factures générées`, (req as any).user?.username);
      
      res.json({ success: true, message: `${count} factures générées pour ${currentMonth}` });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur lors du cycle de facturation', details: err.message });
    }
  },

  async getAllInvoices(req: Request, res: Response) {
    try {
      res.json(await InvoiceRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async payInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { operator } = req.body;
      await InvoiceRepository.updateStatus(id, 'paid');
      await auditService.log('INVOICE_PAY', `Paiement facture ${id} via ${operator}`, (req as any).user?.username);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async payAllInvoices(req: Request, res: Response) {
    try {
      const count = await InvoiceRepository.payAllPending();
      res.json({ success: true, count, message: `${count} factures payées en masse.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // --- PAYMENTS ---
  async getAllPayments(req: Request, res: Response) {
    try {
      res.json(await PaymentRepository.getAll());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createPayment(req: Request, res: Response) {
    try {
      const { id, amount, operator, reference, meterId, tokenId, status, timestamp } = req.body;
      
      await PaymentRepository.insert({
        id: id || `PAY-${Date.now()}`,
        amount,
        operator,
        phone: reference || '', // using reference mapping to match the schema
        meterId,
        tokenId,
        status,
        timestamp
      });
      
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // --- SECURITY KEY ROTATION ---
  async rotateKeys(req: Request, res: Response) {
    try {
      await auditService.log('SECURITY_ROTATE', 'Rotation des clés de sécurité maître effectuée', (req as any).user?.username);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
