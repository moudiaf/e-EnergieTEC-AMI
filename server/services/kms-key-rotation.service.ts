import { db } from '../db';
import { futuriseApiClient } from './futurise-api.client';
import { auditService } from './audit.service';

export interface KeyChangeTokenResponse {
  success: boolean;
  meterId: string;
  oldSgc: string;
  newSgc: string;
  newKrn: number; // Key Revision Number (ex: 2)
  kct1Token: string; // Premier Jeton KCT (20 digits)
  kct2Token: string; // Second Jeton KCT (20 digits)
  rawKct1: string;
  rawKct2: string;
  timestamp: string;
  msg: string;
}

export class KmsKeyRotationService {
  /**
   * Génère la paire de Jetons de Changement de Clé (KCT 1 & KCT 2 - Subclass 3) pour la rotation SGC/KRN
   */
  async generateKeyChangeTokens(meterId: string, targetSgc: string = '600102', targetKrn: number = 2): Promise<KeyChangeTokenResponse> {
    console.log(`[KMS ROTATION SERVICE] Génération de la paire de jetons KCT (Subclass 3) pour le compteur ${meterId} (SGC ${targetSgc}, KRN ${targetKrn})...`);

    // 1. Obtention du premier Jeton KCT (Subclass 3 - Part 1)
    const res1 = await futuriseApiClient.meterToken(meterId, 3, Number(targetSgc.slice(0, 4)) || 6001);
    if (res1.code !== 200 || !res1.data?.form) {
      throw new Error(res1.msg || 'Échec de la génération du jeton KCT 1 auprès du coffre KMS usine');
    }

    const raw1 = res1.data.form.replace(/\D/g, '');
    const kct1Token = raw1.match(/.{1,4}/g)?.join(' - ') || raw1;

    // 2. Obtention du second Jeton KCT (Subclass 3 - Part 2)
    const res2 = await futuriseApiClient.meterToken(meterId, 3, Number(targetSgc.slice(-4)) || 102);
    if (res2.code !== 200 || !res2.data?.form) {
      throw new Error(res2.msg || 'Échec de la génération du jeton KCT 2 auprès du coffre KMS usine');
    }

    const raw2 = res2.data.form.replace(/\D/g, '');
    const kct2Token = raw2.match(/.{1,4}/g)?.join(' - ') || raw2;

    const nowIso = new Date().toISOString();

    // 3. Archivage des jetons KCT dans la table tokens
    await db.prepare(`
      INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, timestamp, status, type, tid)
      VALUES (?, ?, ?, 0, 0, ?, ?, 'USED', 'KEY_CHANGE_KCT1', 0)
    `).run(`TOK-KCT1-${Date.now()}`, kct1Token, raw1, meterId, nowIso);

    await db.prepare(`
      INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, timestamp, status, type, tid)
      VALUES (?, ?, ?, 0, 0, ?, ?, 'USED', 'KEY_CHANGE_KCT2', 0)
    `).run(`TOK-KCT2-${Date.now()}`, kct2Token, raw2, meterId, nowIso);

    // 4. Mettre à jour l'audit KMS
    await auditService.log(
      'KMS_KEY_ROTATION_COMPLETED',
      `Rotation des clés KMS réussie pour le compteur ${meterId} (Nouveau SGC ${targetSgc}, KRN ${targetKrn}). KCT1: ${kct1Token} | KCT2: ${kct2Token}`,
      'SECURITY_OFFICER_KMS'
    );

    return {
      success: true,
      meterId,
      oldSgc: '600101',
      newSgc: targetSgc,
      newKrn: targetKrn,
      kct1Token,
      kct2Token,
      rawKct1: raw1,
      rawKct2: raw2,
      timestamp: nowIso,
      msg: `🔒 Paire de jetons de rotation de clés KCT (Subclass 3) générée avec succès pour le compteur ${meterId}`
    };
  }
}

export const kmsKeyRotationService = new KmsKeyRotationService();
