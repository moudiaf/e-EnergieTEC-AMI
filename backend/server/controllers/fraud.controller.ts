import { Request, Response } from 'express';
import { fraudDetectionService } from '../services/fraud-detection.service';
import { futuriseApiClient } from '../services/futurise-api.client';

export const FraudController = {
  async evaluateMeter(req: Request, res: Response) {
    try {
      const { meterId } = req.body;
      if (!meterId) {
        return res.status(400).json({ success: false, message: 'ID du compteur requis' });
      }

      // Lecture Télé-mesure GPRS Temps-Réel
      const teleRes = await futuriseApiClient.readMeterValue(meterId);
      const evalRes = await fraudDetectionService.evaluateMeterTelemetry(meterId, teleRes.parsedTelemetry || {});

      res.json({
        success: true,
        evaluation: evalRes,
        rawTelemetry: teleRes.parsedTelemetry
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async generateClearTamperToken(req: Request, res: Response) {
    try {
      const { meterId } = req.body;
      if (!meterId) {
        return res.status(400).json({ success: false, message: 'ID du compteur requis' });
      }

      const result = await fraudDetectionService.generateClearTamperToken(meterId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFraudAlerts(req: Request, res: Response) {
    try {
      const alerts = await fraudDetectionService.getActiveFraudAlerts();
      res.json({ success: true, alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
