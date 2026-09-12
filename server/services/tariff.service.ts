/**
 * Service de Tarification Officielle NIGELEC Édition 2024 (ARSE Niger)
 * Alignement strict sur la grille NIGELEC (TS, BT-D, BT-P, MT-G, HT).
 */

export interface NigelecTariffDetail {
  amountFcfa: number;
  tariffCategory: string; // 'BT-D' | 'BT-P' | 'TS' | 'MT-G'
  kwhNet: number;
  tranchesBreakdown: {
    palier1Kwh: number; // 0 - 50 kWh @ 59.45 FCFA/kWh
    palier1Fcfa: number;
    palier2Kwh: number; // 51 - 250 kWh @ 79.25 FCFA/kWh
    palier2Fcfa: number;
    palier3Kwh: number; // 251 - 500 kWh @ 94.13 FCFA/kWh
    palier3Fcfa: number;
    palier4Kwh: number; // > 500 kWh @ 120.35 FCFA/kWh
    palier4Fcfa: number;
  };
}

export class NigelecTariffService {
  // Grille Officielle NIGELEC 2024 (Basse Tension Domestique BT-D)
  public static readonly BTD_P1_PRIX = 59.45; // 0 - 50 kWh
  public static readonly BTD_P1_SEUIL = 50;

  public static readonly BTD_P2_PRIX = 79.25; // 51 - 250 kWh
  public static readonly BTD_P2_SEUIL = 200; // 200 kWh additionnels

  public static readonly BTD_P3_PRIX = 94.13; // 251 - 500 kWh
  public static readonly BTD_P3_SEUIL = 250; // 250 kWh additionnels

  public static readonly BTD_P4_PRIX = 120.35; // > 500 kWh

  // Grille Professionnelle BT-P (Triphasé / Commercial)
  public static readonly BTP_P1_PRIX = 98.50; // 0 - 500 kWh
  public static readonly BTP_P2_PRIX = 115.75; // > 500 kWh

  /**
   * Calcule le volume exact en kWh selon le segment sélectionné (BT-D, BT-P, etc.)
   */
  public static calculateKwh(
    amountFcfa: number,
    tariffCategory: 'BT-D' | 'BT-P' | 'TS' | 'monophase' | 'triphase' | string = 'BT-D',
    currentMonthlyKwh: number = 0
  ): number {
    const detail = this.calculateFullDetails(amountFcfa, tariffCategory, currentMonthlyKwh);
    return detail.kwhNet;
  }

  /**
   * Décomposition complète de la grille tarifaire NIGELEC (BT-D)
   */
  public static calculateFullDetails(
    amountFcfa: number,
    tariffCategory: 'BT-D' | 'BT-P' | 'TS' | 'monophase' | 'triphase' | string = 'BT-D',
    currentMonthlyKwh: number = 0
  ): NigelecTariffDetail {
    const cleanCategory = tariffCategory.toUpperCase();
    const isCommercial = cleanCategory.includes('BT-P') || cleanCategory.includes('TRI') || cleanCategory.endsWith('86');

    if (isCommercial) {
      // Professionnel BT-P : Palier 1 à 98.50 FCFA/kWh (0-500 kWh)
      const kwhNet = Number((amountFcfa / this.BTP_P1_PRIX).toFixed(2));
      return {
        amountFcfa,
        tariffCategory: 'BT-P',
        kwhNet,
        tranchesBreakdown: {
          palier1Kwh: kwhNet,
          palier1Fcfa: amountFcfa,
          palier2Kwh: 0, palier2Fcfa: 0,
          palier3Kwh: 0, palier3Fcfa: 0,
          palier4Kwh: 0, palier4Fcfa: 0
        }
      };
    }

    // Basse Tension Domestique (BT-D) : Grille NIGELEC 4 Paliers (59.45 / 79.25 / 94.13 / 120.35)
    let remainingMoney = amountFcfa;
    let p1Kwh = 0, p1Money = 0;
    let p2Kwh = 0, p2Money = 0;
    let p3Kwh = 0, p3Money = 0;
    let p4Kwh = 0, p4Money = 0;

    let kwhPos = currentMonthlyKwh;

    // Palier 1 (0 à 50 kWh @ 59.45 FCFA/kWh)
    if (kwhPos < 50 && remainingMoney > 0) {
      const availKwh = 50 - kwhPos;
      const maxCost = availKwh * this.BTD_P1_PRIX;

      if (remainingMoney <= maxCost) {
        p1Kwh = remainingMoney / this.BTD_P1_PRIX;
        p1Money = remainingMoney;
        remainingMoney = 0;
      } else {
        p1Kwh = availKwh;
        p1Money = maxCost;
        remainingMoney -= maxCost;
      }
      kwhPos += p1Kwh;
    }

    // Palier 2 (51 à 250 kWh @ 79.25 FCFA/kWh)
    if (kwhPos >= 50 && kwhPos < 250 && remainingMoney > 0) {
      const availKwh = 250 - kwhPos;
      const maxCost = availKwh * this.BTD_P2_PRIX;

      if (remainingMoney <= maxCost) {
        p2Kwh = remainingMoney / this.BTD_P2_PRIX;
        p2Money = remainingMoney;
        remainingMoney = 0;
      } else {
        p2Kwh = availKwh;
        p2Money = maxCost;
        remainingMoney -= maxCost;
      }
      kwhPos += p2Kwh;
    }

    // Palier 3 (251 à 500 kWh @ 94.13 FCFA/kWh)
    if (kwhPos >= 250 && kwhPos < 500 && remainingMoney > 0) {
      const availKwh = 500 - kwhPos;
      const maxCost = availKwh * this.BTD_P3_PRIX;

      if (remainingMoney <= maxCost) {
        p3Kwh = remainingMoney / this.BTD_P3_PRIX;
        p3Money = remainingMoney;
        remainingMoney = 0;
      } else {
        p3Kwh = availKwh;
        p3Money = maxCost;
        remainingMoney -= maxCost;
      }
      kwhPos += p3Kwh;
    }

    // Palier 4 (> 500 kWh @ 120.35 FCFA/kWh)
    if (remainingMoney > 0) {
      p4Kwh = remainingMoney / this.BTD_P4_PRIX;
      p4Money = remainingMoney;
      remainingMoney = 0;
    }

    const totalKwh = p1Kwh + p2Kwh + p3Kwh + p4Kwh;

    return {
      amountFcfa,
      tariffCategory: 'BT-D',
      kwhNet: Number(totalKwh.toFixed(2)),
      tranchesBreakdown: {
        palier1Kwh: Number(p1Kwh.toFixed(2)),
        palier1Fcfa: Number(p1Money.toFixed(2)),
        palier2Kwh: Number(p2Kwh.toFixed(2)),
        palier2Fcfa: Number(p2Money.toFixed(2)),
        palier3Kwh: Number(p3Kwh.toFixed(2)),
        palier3Fcfa: Number(p3Money.toFixed(2)),
        palier4Kwh: Number(p4Kwh.toFixed(2)),
        palier4Fcfa: Number(p4Money.toFixed(2))
      }
    };
  }
}
