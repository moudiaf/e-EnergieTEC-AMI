import { db } from '../db';
import { futuriseApiClient } from './futurise-api.client';
import { auditService } from './audit.service';

export interface FraudEvaluationResult {
  meterId: string;
  fraudDetected: boolean;
  score: number; // 0 à 100%
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: string[];
  recommendedAction: string;
  timestamp: string;
}

export class FraudDetectionService {
  /**
   * Évalue les trames télé-mesurées DLMS/COSEM pour détecter les fraudes et sabotages
   */
  async evaluateMeterTelemetry(meterId: string, telemetry: any): Promise<FraudEvaluationResult> {
    const anomalies: string[] = [];
    let score = 0;

    const currentPhase = telemetry.currentA || telemetry.current || 0;
    const currentNeutral = telemetry.currentNeutral || telemetry.currentN || currentPhase;
    const currentDiff = Math.abs(currentPhase - currentNeutral);
    const voltage = telemetry.voltageA || telemetry.voltage || 230;
    const power = telemetry.totalPowerKw || telemetry.power || 0;
    const credit = telemetry.remainingCreditKwh ?? 0;
    const coverOpen = telemetry.meterCoverOpen || telemetry.coverOpen;
    const terminalCoverOpen = telemetry.terminalCoverOpen;
    const magneticTamper = telemetry.magneticTamper;

    // 1. Détection de Shunt / Bypass (Écart Courant Phase vs Neutre)
    if (currentDiff > 0.5) {
      score += 40;
      anomalies.push(`⚡ DETECTED_BYPASS: Écart de courant Phase/Neutre important (${currentDiff.toFixed(2)} A)`);
    }

    // 2. Détection d'Ouverture Capot Compteur (Capot principal)
    if (coverOpen) {
      score += 35;
      anomalies.push('🔓 COVER_OPEN: Ouverture physique du capot principal du compteur détectée');
    }

    // 3. Détection d'Ouverture Bornier (Capot de raccordement)
    if (terminalCoverOpen) {
      score += 25;
      anomalies.push('⚠️ TERMINAL_COVER_OPEN: Tamper bornier électrique déclenché');
    }

    // 4. Perturbation Magnétique (Aimant néodyme)
    if (magneticTamper) {
      score += 50;
      anomalies.push('🧲 MAGNETIC_TAMPER: Perturbation par champ magnétique extérieur détectée');
    }

    // 5. Consommation sans Crédit (Vol d'Énergie direct)
    if (power > 0.1 && credit <= 0) {
      score += 45;
      anomalies.push(`🚫 ZERO_CREDIT_CONSUMPTION: Consommation active (${power.toFixed(2)} kW) avec solde nul (${credit} kWh)`);
    }

    // Normalisation du Score (0 à 100%)
    score = Math.min(score, 100);

    let threatLevel: FraudEvaluationResult['threatLevel'] = 'NONE';
    let recommendedAction = 'Compteur en état normal. Aucune intervention requise.';

    if (score >= 75) {
      threatLevel = 'CRITICAL';
      recommendedAction = '🔴 COUPURE IMMÉDIATE DU DISJONCTEUR ET DÉPÊCHE TECHNIQUE D\'URGENCE SUR SITE.';
    } else if (score >= 50) {
      threatLevel = 'HIGH';
      recommendedAction = '🟧 PROGRAMMER UN AUDIT PHYSIQUE SUR PLACE DANS LES 24H.';
    } else if (score >= 25) {
      threatLevel = 'MEDIUM';
      recommendedAction = '🟨 SURVEILLANCE ACCRUE ET VÉRIFICATION DE LA TELEMESURE GPRS.';
    }

    const result: FraudEvaluationResult = {
      meterId,
      fraudDetected: score > 0,
      score,
      threatLevel,
      anomalies,
      recommendedAction,
      timestamp: new Date().toISOString()
    };

    // Si une fraude est suspectée, enregistrement de l'alerte en BD
    if (score >= 30) {
      await this.logFraudAlert(result);
    }

    // Mise à jour du score ML dans la table meters
    await db.prepare(`
      UPDATE meters 
      SET mlFraudScore = ?, 
          tamperStatus = ?
      WHERE id = ? OR serialNumber = ?
    `).run(
      score, 
      score >= 50 ? 'tampered' : (score > 0 ? 'detected' : 'clear'),
      meterId, 
      meterId
    );

    return result;
  }

  /**
   * Enregistre l'alerte de fraude dans la table alerts
   */
  private async logFraudAlert(evalRes: FraudEvaluationResult) {
    const alertId = `ALT-FRAUD-${Date.now()}`;
    const message = `[FRAUDE ${evalRes.threatLevel}] Compteur ${evalRes.meterId} : ${evalRes.anomalies.join(' | ')}`;

    await db.prepare(`
      INSERT INTO alerts (id, meterId, type, category, priority, message, timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(
      alertId,
      evalRes.meterId,
      'ANTI_FRAUD_ALARM',
      'fraud',
      evalRes.threatLevel === 'CRITICAL' ? 'Urgent' : 'Haute',
      message,
      evalRes.timestamp
    );

    await auditService.log(
      'FRAUD_DETECTED',
      `Alerte Fraude (Score: ${evalRes.score}%): ${message}`,
      'SYSTEM_FRAUD_ENGINE'
    );
  }

  /**
   * Génère le jeton certifié Usine STS Subclass 5 pour effacer l'alarme Sabotage (Clear Tamper)
   */
  async generateClearTamperToken(meterId: string): Promise<{ success: boolean; token: string; rawToken: string; msg: string }> {
    console.log(`[FRAUD SERVICE] Demande de Jeton Clear Tamper (Subclass 5) pour ${meterId}...`);

    // Appel HSM usine Constructeur Futurise (Subclass 5 = ClearTamperCondition)
    const tokenRes = await futuriseApiClient.meterToken(meterId, 5, 0);

    if (tokenRes.code !== 200 || !tokenRes.data?.form) {
      throw new Error(tokenRes.msg || 'Échec de la génération du jeton Clear Tamper auprès de l\'HSM usine');
    }

    const rawToken = tokenRes.data.form.replace(/\D/g, '');
    const formattedToken = rawToken.match(/.{1,4}/g)?.join(' - ') || rawToken;

    // Enregistrement dans la table tokens
    const tokenId = `TOK-TAMPER-${Date.now()}`;
    const nowIso = new Date().toISOString();

    await db.prepare(`
      INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, timestamp, status, type, tid)
      VALUES (?, ?, ?, 0, 0, ?, ?, 'USED', 'CLEAR_TAMPER', 0)
    `).run(tokenId, formattedToken, rawToken, meterId, nowIso);

    // Réinitialisation de l'état de tamper en BD
    await db.prepare(`
      UPDATE meters 
      SET tamperStatus = 'clear', mlFraudScore = 0 
      WHERE id = ? OR serialNumber = ?
    `).run(meterId, meterId);

    await auditService.log(
      'CLEAR_TAMPER_TOKEN_GENERATED',
      `Jeton Clear Tamper généré pour ${meterId} : ${formattedToken}`,
      'TECHNICIAN'
    );

    return {
      success: true,
      token: formattedToken,
      rawToken,
      msg: `🔑 Jeton d'Effacement de Sabotage (Clear Tamper) généré avec succès pour le compteur ${meterId}`
    };
  }

  /**
   * Récupère la liste des alertes de fraude actives
   */
  async getActiveFraudAlerts() {
    return await db.prepare(`
      SELECT * FROM alerts 
      WHERE category = 'fraud' OR type LIKE '%FRAUD%' OR type LIKE '%TAMPER%'
      ORDER BY timestamp DESC
    `).all();
  }
}

export const fraudDetectionService = new FraudDetectionService();
