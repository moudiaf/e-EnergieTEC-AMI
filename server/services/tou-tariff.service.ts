import { db } from '../db';
import { futuriseApiClient } from './futurise-api.client';
import { auditService } from './audit.service';

export interface TouTimeSlot {
  slotId: string;
  name: 'HEURES_CREUSES' | 'HEURES_NORMALES' | 'HEURES_POINTE';
  startHour: number; // ex: 18
  endHour: number;   // ex: 23
  rateFcfaPerKwh: number;
  colorBadge: string;
}

export interface TouScheduleConfig {
  tariffId: string;
  tariffName: string;
  timeSlots: TouTimeSlot[];
  activeSlotNow: TouTimeSlot;
}

export class TouTariffService {
  /**
   * Retourne la grille des tranches horaires (Time-of-Use) NIGELEC
   */
  getNigelecTouSchedule(): TouScheduleConfig {
    const currentHour = new Date().getHours();

    const timeSlots: TouTimeSlot[] = [
      {
        slotId: 'SLOT-OFFPEAK',
        name: 'HEURES_CREUSES',
        startHour: 23,
        endHour: 6,
        rateFcfaPerKwh: 59.45,
        colorBadge: 'emerald'
      },
      {
        slotId: 'SLOT-NORMAL',
        name: 'HEURES_NORMALES',
        startHour: 6,
        endHour: 18,
        rateFcfaPerKwh: 79.25,
        colorBadge: 'cyan'
      },
      {
        slotId: 'SLOT-PEAK',
        name: 'HEURES_POINTE',
        startHour: 18,
        endHour: 23,
        rateFcfaPerKwh: 120.35,
        colorBadge: 'amber'
      }
    ];

    // Détermination de la tranche active selon l'heure courante
    let activeSlotNow = timeSlots[1]; // Par défaut Heures Normales
    if (currentHour >= 18 && currentHour < 23) {
      activeSlotNow = timeSlots[2]; // Heures de Pointe
    } else if (currentHour >= 23 || currentHour < 6) {
      activeSlotNow = timeSlots[0]; // Heures Creuses
    }

    return {
      tariffId: 'NIG-TOU-2026',
      tariffName: 'Tarification Horaire Dynamique NIGELEC (TOU)',
      timeSlots,
      activeSlotNow
    };
  }

  /**
   * Génère le jeton certifié usine STS Subclass 2 (Tariff Rate) pour changer la grille tarifaire du compteur
   */
  async generateTariffRateToken(meterId: string, tariffIndex: number): Promise<{ success: boolean; token: string; rawToken: string; msg: string }> {
    console.log(`[TOU SERVICE] Demande de Jeton de Tarif STS (Subclass 2) pour ${meterId} (Index ${tariffIndex})...`);

    // Appel HSM usine Constructeur Futurise (Subclass 2 = TariffRate)
    const tokenRes = await futuriseApiClient.meterToken(meterId, 2, tariffIndex);

    if (tokenRes.code !== 200 || !tokenRes.data?.form) {
      throw new Error(tokenRes.msg || 'Échec de la génération du jeton de tarif auprès de l\'HSM usine');
    }

    const rawToken = tokenRes.data.form.replace(/\D/g, '');
    const formattedToken = rawToken.match(/.{1,4}/g)?.join(' - ') || rawToken;

    // Enregistrement dans la table tokens
    const tokenId = `TOK-TARIFF-${Date.now()}`;
    const nowIso = new Date().toISOString();

    await db.prepare(`
      INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, timestamp, status, type, tid)
      VALUES (?, ?, ?, 0, 0, ?, ?, 'USED', 'CHANGE_TARIFF', ?)
    `).run(tokenId, formattedToken, rawToken, meterId, nowIso, tariffIndex);

    // Activation du mode TOU en BD
    await db.prepare(`
      UPDATE meters 
      SET touEnabled = 1
      WHERE id = ? OR serialNumber = ?
    `).run(meterId, meterId);

    await auditService.log(
      'TARIFF_TOKEN_GENERATED',
      `Jeton de Tarif STS (Subclass 2 - Index ${tariffIndex}) généré pour ${meterId} : ${formattedToken}`,
      'NIGELEC_COMMERCIAL'
    );

    return {
      success: true,
      token: formattedToken,
      rawToken,
      msg: `🔑 Jeton de Mise à Jour Tarifaire STS (Subclass 2) généré avec succès pour le compteur ${meterId}`
    };
  }
}

export const touTariffService = new TouTariffService();
