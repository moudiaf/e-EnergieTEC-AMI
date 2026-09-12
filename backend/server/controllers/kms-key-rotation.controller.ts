import { Request, Response } from 'express';
import { kmsKeyRotationService } from '../services/kms-key-rotation.service';

export const KmsKeyRotationController = {
  async rotateKeysToken(req: Request, res: Response) {
    try {
      const { meterId, targetSgc = '600102', targetKrn = 2 } = req.body;
      if (!meterId) {
        return res.status(400).json({ success: false, message: 'ID du compteur requis' });
      }

      const result = await kmsKeyRotationService.generateKeyChangeTokens(meterId, targetSgc, Number(targetKrn));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
