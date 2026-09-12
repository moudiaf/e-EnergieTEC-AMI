import { Request, Response } from 'express';
import { mdmsEnergyBalanceService } from '../services/mdms-energy-balance.service';

export const MdmsController = {
  async getDcuEnergyBalance(req: Request, res: Response) {
    try {
      const { dcuId } = req.body;
      if (!dcuId) {
        return res.status(400).json({ success: false, message: 'ID du DCU / Transformateur requis' });
      }

      const report = await mdmsEnergyBalanceService.calculateDcuEnergyBalance(dcuId);
      res.json({ success: true, report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getNationalSummary(req: Request, res: Response) {
    try {
      const summary = await mdmsEnergyBalanceService.getNationalNetworkLossSummary();
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
