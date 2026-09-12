/**
/**
 * 📚 DICTIONNAIRE ET CARTOGRAPHIE NATIVE DES CODES OBIS DLMS/COSEM (IEC 62056)
 * Plateforme RenTEC AMI & STS 2.0 (NIGELEC)
 */

export interface ObisCodeDefinition {
  index: number;
  code: string;
  nameFr: string;
  nameEn: string;
  unit: string;
  category: 'ENERGY' | 'INSTANTANEOUS' | 'DEMAND' | 'STATUS' | 'TEMPERATURE';
}

export const OBIS_DICTIONARY: Record<string, ObisCodeDefinition> = {
  // --- SÉCURITÉ, DÉTECTION DE FRAUDE & SABOTAGE (TAMPER - IEC 62056-61) ---
  '0.0.96.11.0.255': { index: 16, code: '0.0.96.11.0.255', nameFr: 'Alerteur Ouverture Capot Principal (Meter Cover)', nameEn: 'Meter Cover Open Tamper', unit: 'FLAG', category: 'STATUS' },
  '0.0.96.11.1.255': { index: 17, code: '0.0.96.11.1.255', nameFr: 'Alerteur Ouverture Cache-Bornes (Terminal Cover)', nameEn: 'Terminal Cover Open Tamper', unit: 'FLAG', category: 'STATUS' },
  '0.0.96.11.2.255': { index: 18, code: '0.0.96.11.2.255', nameFr: 'Détection Champ Magnétique Anormal (Aimant)', nameEn: 'Strong Magnetic Field Tamper', unit: 'FLAG', category: 'STATUS' },
  '0.0.96.11.3.255': { index: 19, code: '0.0.96.11.3.255', nameFr: 'Détection Inversion Courant / Bypass Neutre', nameEn: 'Current Reversal / Neutral Bypass', unit: 'FLAG', category: 'STATUS' },
  '0.0.96.3.10.255': { index: 22, code: '0.0.96.3.10.255', nameFr: 'Statut Organe de Coupure (Relais Disjoncteur)', nameEn: 'Disconnect Control Relay Status', unit: 'STATE', category: 'STATUS' },
  '0.0.96.50.0.255': { index: 23, code: '0.0.96.50.0.255', nameFr: 'Mot d\'État Global Événements de Fraude', nameEn: 'Tamper Status Word', unit: 'HEX', category: 'STATUS' },
  '0.0.99.98.0.255': { index: 24, code: '0.0.99.98.0.255', nameFr: 'Journal d\'Historique Événements de Fraude (Event Log)', nameEn: 'Fraud & Tamper Event Log Profile', unit: 'LOG', category: 'STATUS' },

  // --- COMPTEUR & RELEVE DE FOND ---
  '0.0.96.60.0.255': { index: 69, code: '0.0.96.60.0.255', nameFr: 'Solde Crédit Résiduel', nameEn: 'Credit', unit: 'kWh', category: 'STATUS' },
  '0.0.51.2.1.255':  { index: 276, code: '0.0.51.2.1.255', nameFr: 'Intervalle Heartbeat Keep-Alive', nameEn: 'Heart Period', unit: 's', category: 'STATUS' },
  '0.0.96.9.0.255':  { index: 181, code: '0.0.96.9.0.255', nameFr: 'Température Ambiante Compteur', nameEn: 'Ambient Temperature', unit: '°C', category: 'TEMPERATURE' },

  // --- ÉNERGIE ACTIVE TOTALE & TARIFS T1 à T8 ---
  '1.0.15.8.0.255': { index: 70, code: '1.0.15.8.0.255', nameFr: 'Énergie Active Totale (Import + Export)', nameEn: 'Total Active Energy', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.1.255': { index: 71, code: '1.0.15.8.1.255', nameFr: 'Énergie Active Totale Tarif T1', nameEn: 'Total Active Energy T1', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.2.255': { index: 72, code: '1.0.15.8.2.255', nameFr: 'Énergie Active Totale Tarif T2', nameEn: 'Total Active Energy T2', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.3.255': { index: 73, code: '1.0.15.8.3.255', nameFr: 'Énergie Active Totale Tarif T3', nameEn: 'Total Active Energy T3', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.4.255': { index: 74, code: '1.0.15.8.4.255', nameFr: 'Énergie Active Totale Tarif T4', nameEn: 'Total Active Energy T4', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.5.255': { index: 75, code: '1.0.15.8.5.255', nameFr: 'Énergie Active Totale Tarif T5', nameEn: 'Total Active Energy T5', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.6.255': { index: 76, code: '1.0.15.8.6.255', nameFr: 'Énergie Active Totale Tarif T6', nameEn: 'Total Active Energy T6', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.7.255': { index: 77, code: '1.0.15.8.7.255', nameFr: 'Énergie Active Totale Tarif T7', nameEn: 'Total Active Energy T7', unit: 'kWh', category: 'ENERGY' },
  '1.0.15.8.8.255': { index: 78, code: '1.0.15.8.8.255', nameFr: 'Énergie Active Totale Tarif T8', nameEn: 'Total Active Energy T8', unit: 'kWh', category: 'ENERGY' },

  // --- ÉNERGIE ACTIVE IMPORT & TARIFS T1 à T8 ---
  '1.0.1.8.0.255': { index: 79, code: '1.0.1.8.0.255', nameFr: 'Énergie Active Importée Totale', nameEn: 'Total Import Active Energy', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.1.255': { index: 80, code: '1.0.1.8.1.255', nameFr: 'Énergie Active Importée Tarif T1', nameEn: 'Import Active Energy T1', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.2.255': { index: 81, code: '1.0.1.8.2.255', nameFr: 'Énergie Active Importée Tarif T2', nameEn: 'Import Active Energy T2', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.3.255': { index: 82, code: '1.0.1.8.3.255', nameFr: 'Énergie Active Importée Tarif T3', nameEn: 'Import Active Energy T3', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.4.255': { index: 83, code: '1.0.1.8.4.255', nameFr: 'Énergie Active Importée Tarif T4', nameEn: 'Import Active Energy T4', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.5.255': { index: 84, code: '1.0.1.8.5.255', nameFr: 'Énergie Active Importée Tarif T5', nameEn: 'Import Active Energy T5', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.6.255': { index: 85, code: '1.0.1.8.6.255', nameFr: 'Énergie Active Importée Tarif T6', nameEn: 'Import Active Energy T6', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.7.255': { index: 86, code: '1.0.1.8.7.255', nameFr: 'Énergie Active Importée Tarif T7', nameEn: 'Import Active Energy T7', unit: 'kWh', category: 'ENERGY' },
  '1.0.1.8.8.255': { index: 87, code: '1.0.1.8.8.255', nameFr: 'Énergie Active Importée Tarif T8', nameEn: 'Import Active Energy T8', unit: 'kWh', category: 'ENERGY' },

  // --- ÉNERGIE ACTIVE EXPORT (Injection Solaire / Microgrid) ---
  '1.0.2.8.0.255': { index: 88, code: '1.0.2.8.0.255', nameFr: 'Énergie Active Exportée Totale', nameEn: 'Total Export Active Energy', unit: 'kWh', category: 'ENERGY' },
  '1.0.2.8.1.255': { index: 89, code: '1.0.2.8.1.255', nameFr: 'Énergie Active Exportée Tarif T1', nameEn: 'Export Active Energy T1', unit: 'kWh', category: 'ENERGY' },

  // --- GRANDEURS ÉLECTRIQUES INSTANTANÉES PAR PHASE (3φ & 1φ) ---
  '1.0.32.7.0.255': { index: 182, code: '1.0.32.7.0.255', nameFr: 'Tension Instantanée Phase L1 (V1)', nameEn: 'L1 Instantaneous Voltage', unit: 'V', category: 'INSTANTANEOUS' },
  '1.0.52.7.0.255': { index: 183, code: '1.0.52.7.0.255', nameFr: 'Tension Instantanée Phase L2 (V2)', nameEn: 'L2 Instantaneous Voltage', unit: 'V', category: 'INSTANTANEOUS' },
  '1.0.72.7.0.255': { index: 184, code: '1.0.72.7.0.255', nameFr: 'Tension Instantanée Phase L3 (V3)', nameEn: 'L3 Instantaneous Voltage', unit: 'V', category: 'INSTANTANEOUS' },

  '1.0.31.7.0.255': { index: 185, code: '1.0.31.7.0.255', nameFr: 'Courant Instantané Phase L1 (I1)', nameEn: 'L1 Instantaneous Current', unit: 'A', category: 'INSTANTANEOUS' },
  '1.0.51.7.0.255': { index: 186, code: '1.0.51.7.0.255', nameFr: 'Courant Instantané Phase L2 (I2)', nameEn: 'L2 Instantaneous Current', unit: 'A', category: 'INSTANTANEOUS' },
  '1.0.71.7.0.255': { index: 187, code: '1.0.71.7.0.255', nameFr: 'Courant Instantané Phase L3 (I3)', nameEn: 'L3 Instantaneous Current', unit: 'A', category: 'INSTANTANEOUS' },

  '1.0.15.7.0.255': { index: 188, code: '1.0.15.7.0.255', nameFr: 'Puissance Active Totale Instantanée', nameEn: 'Total Instantaneous Active Power', unit: 'kW', category: 'INSTANTANEOUS' },
  '1.0.35.7.0.255': { index: 189, code: '1.0.35.7.0.255', nameFr: 'Puissance Active Instantanée Phase L1', nameEn: 'L1 Instantaneous Active Power', unit: 'kW', category: 'INSTANTANEOUS' },
  '1.0.55.7.0.255': { index: 190, code: '1.0.55.7.0.255', nameFr: 'Puissance Active Instantanée Phase L2', nameEn: 'L2 Instantaneous Active Power', unit: 'kW', category: 'INSTANTANEOUS' },
  '1.0.75.7.0.255': { index: 191, code: '1.0.75.7.0.255', nameFr: 'Puissance Active Instantanée Phase L3', nameEn: 'L3 Instantaneous Active Power', unit: 'kW', category: 'INSTANTANEOUS' },

  '1.0.13.7.0.255': { index: 200, code: '1.0.13.7.0.255', nameFr: 'Facteur de Puissance Instantané (Cos Phi)', nameEn: 'Total Instantaneous Power Factor', unit: '', category: 'INSTANTANEOUS' },
  '1.0.33.7.0.255': { index: 201, code: '1.0.33.7.0.255', nameFr: 'Facteur de Puissance L1', nameEn: 'L1 Instantaneous Power Factor', unit: '', category: 'INSTANTANEOUS' },
  '1.0.53.7.0.255': { index: 203, code: '1.0.53.7.0.255', nameFr: 'Facteur de Puissance L2', nameEn: 'L2 Instantaneous Power Factor', unit: '', category: 'INSTANTANEOUS' },
  '1.0.73.7.0.255': { index: 204, code: '1.0.73.7.0.255', nameFr: 'Facteur de Puissance L3', nameEn: 'L3 Instantaneous Power Factor', unit: '', category: 'INSTANTANEOUS' },

  '1.0.14.7.0.255': { index: 205, code: '1.0.14.7.0.255', nameFr: 'Fréquence Réseau Instantanée', nameEn: 'Instantaneous Frequency', unit: 'Hz', category: 'INSTANTANEOUS' },

  // --- DEMANDES DE PUISSANCE MAXIMALE (MAX DEMAND) ---
  '1.0.1.6.0.255': { index: 207, code: '1.0.1.6.0.255', nameFr: 'Puissance Active Maximale Appelée (Max Demand)', nameEn: 'Total Import Active Demand', unit: 'kW', category: 'DEMAND' }
};

export function lookupObisCode(code: string): ObisCodeDefinition | null {
  return OBIS_DICTIONARY[code.trim()] || null;
}
