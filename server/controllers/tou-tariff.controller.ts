import { Request, Response } from 'express';
import { touTariffService } from '../services/tou-tariff.service';

export const TouTariffController = {
  getSchedule(req: Request, res: Response) {
    try {
      const schedule = touTariffService.getNigelecTouSchedule();
      res.json({ success: true, schedule });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async generateTariffToken(req: Request, res: Response) {
    try {
      const { meterId, tariffIndex = 1 } = req.body;
      if (!meterId) {
        return res.status(400).json({ success: false, message: 'ID du compteur requis' });
      }

      const result = await touTariffService.generateTariffRateToken(meterId, Number(tariffIndex));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
