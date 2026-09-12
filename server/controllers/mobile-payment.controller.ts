import { Request, Response } from 'express';
import { mobilePaymentService } from '../services/mobile-payment.service';
import { db } from '../db';

export const MobilePaymentController = {
  async processPayment(req: Request, res: Response) {
    try {
      const { meterId, phone, amountFcfa, operator = 'AIRTEL_MONEY' } = req.body;

      if (!meterId || !phone || !amountFcfa) {
        return res.status(400).json({ success: false, message: 'ID Compteur, Numéro Téléphone (+227) et Montant (FCFA) requis' });
      }

      const result = await mobilePaymentService.processMobileMoneyPayment({
        meterId,
        phone,
        amountFcfa: Number(amountFcfa),
        operator
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPaymentHistory(req: Request, res: Response) {
    try {
      const { meterId } = req.params;
      const history = await db.prepare(`
        SELECT * FROM payments 
        WHERE meterId = ? 
        ORDER BY timestamp DESC 
        LIMIT 50
      `).all(meterId);

      res.json({ success: true, history });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
