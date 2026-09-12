import { Request, Response } from 'express';
import { vending2Service } from '../services/vending2.service';
import { db } from '../db';

export const Vending2Controller = {
  async recharge(req: Request, res: Response) {
    try {
      const { meterNo, money, customerId } = req.body;
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!meterNo || typeof money !== 'number') {
        return res.status(400).json({ error: "Champs requis manquants: meterNo et money (nombre) sont obligatoires." });
      }

      const tx = await vending2Service.rechargeMeter(meterNo, money, operatorUser, customerId);

      if (tx.status === 'SUCCESS') {
        res.status(200).json(tx);
      } else if (tx.status === 'UNKNOWN') {
        res.status(504).json({
          error: "Délai d'attente dépassé (Timeout) lors de l'appel Vending2. Transaction marquée UNKNOWN.",
          transaction: tx
        });
      } else {
        res.status(400).json({
          error: tx.failureReason || "Échec de la transaction de recharge auprès de Vending2.",
          transaction: tx
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async generateToken(req: Request, res: Response) {
    try {
      const { meterNo, method = 1, subClass = 1, value = 0, customerId } = req.body;
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!meterNo) {
        return res.status(400).json({ error: "Champ requis manquant: meterNo est obligatoire." });
      }

      const tx = await vending2Service.generateMeterToken(meterNo, method, subClass, value, operatorUser, customerId);

      if (tx.status === 'SUCCESS') {
        res.status(200).json(tx);
      } else if (tx.status === 'UNKNOWN') {
        res.status(504).json({
          error: "Délai d'attente dépassé (Timeout) lors de l'appel Vending2. Transaction marquée UNKNOWN.",
          transaction: tx
        });
      } else {
        res.status(400).json({
          error: tx.failureReason || "Échec de la génération du jeton de gestion.",
          transaction: tx
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTransactions(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const meterNo = req.query.meterNo as string | undefined;
      const status = req.query.status as string | undefined;

      const transactions = await vending2Service.getTransactions(limit, meterNo, status);
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tx = await vending2Service.getTransactionById(id);

      if (!tx) {
        return res.status(404).json({ error: `Transaction ${id} introuvable.` });
      }

      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async readTelemetry(req: Request, res: Response) {
    try {
      const targetNo = (req.body.meterNo || req.body.meterId || req.body.serialNumber || '').trim();
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!targetNo) {
        return res.status(400).json({ error: "Champ requis manquant: meterNo ou meterId est obligatoire." });
      }

      const telemetry = await vending2Service.readMeterValue(targetNo, operatorUser);
      res.json(telemetry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async readRegion(req: Request, res: Response) {
    try {
      const { regionId } = req.body;
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!regionId) {
        return res.status(400).json({ error: "Champ requis manquant: regionId est obligatoire." });
      }

      const cleanReg = regionId.trim().toUpperCase();
      const meters = await db.prepare(`
        SELECT m.id, m.location, m.phaseType, m.voltage, m.credit, m.power 
        FROM meters m
        LEFT JOIN customers c ON m.customerId = c.id
        LEFT JOIN dcus d ON m.dcuId = d.id
        WHERE UPPER(m.location) LIKE ? 
           OR UPPER(c.regionId) = ?
           OR UPPER(d.regionId) = ?
           OR UPPER(m.id) LIKE ?
      `).all(`%${cleanReg}%`, cleanReg, cleanReg, `%${cleanReg}%`) as any[];

      const results = [];
      for (const m of meters) {
        try {
          const t = await vending2Service.readMeterValue(m.id, operatorUser);
          results.push({ meterId: m.id, success: true, telemetry: (t as any).parsedTelemetry });
        } catch (e: any) {
          results.push({ meterId: m.id, success: false, error: e.message });
        }
      }

      res.json({
        success: true,
        regionId: cleanReg,
        totalMeters: meters.length,
        polledCount: results.filter(r => r.success).length,
        timestamp: new Date().toISOString(),
        readings: results
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async relayControl(req: Request, res: Response) {
    try {
      const { meterNo, action, roomName } = req.body;
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!meterNo || !action || !['open', 'close'].includes(action)) {
        return res.status(400).json({ error: "Champs requis manquants: meterNo et action ('open' ou 'close') sont obligatoires." });
      }

      let result;
      if (action === 'open') {
        result = await vending2Service.remoteControlRelayOpen(meterNo, roomName || "10", operatorUser);
      } else {
        result = await vending2Service.remoteControlRelayClose(meterNo, roomName || "10", operatorUser);
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async getRecordByFlowNo(req: Request, res: Response) {
    try {
      const { flowNo } = req.params;
      if (!flowNo) {
        return res.status(400).json({ error: "flowNo est obligatoire." });
      }

      const record = await vending2Service.getChargeRecordByFlowNo(flowNo);
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async syncClock(req: Request, res: Response) {
    try {
      const { meterNo, timestamp } = req.body;
      const operatorUser = (req as any).user?.username || 'SYSTEM';

      if (!meterNo) {
        return res.status(400).json({ error: "Champ requis manquant: meterNo est obligatoire." });
      }

      const result = await vending2Service.syncClock(meterNo, timestamp, operatorUser);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async checkHealth(req: Request, res: Response) {
    try {
      const health = await vending2Service.checkHealth();
      res.json(health);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};
