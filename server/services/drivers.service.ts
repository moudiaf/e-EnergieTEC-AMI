/**
 * Interface standard pour les événements de compteurs
 */
export interface MeterRawEvent {
  code: string;
  timestamp: string;
  value?: any;
}

export interface MeterParsedEvent {
  type: string;
  title: string;
  message: string;
  meterId: string;
  priority: string;
}

/**
 * Driver pour les compteurs HEXING
 */
export const HexingDriver = {
  parseEvent: (meterId: string, event: MeterRawEvent): MeterParsedEvent => {
    let type = 'info';
    let title = 'Événement Hexing';
    let message = `Code brut reçu: ${event.code}`;
    let priority = 'Normale';

    switch (event.code) {
      case 'E-01':
        type = 'danger';
        title = 'Fraude : Ouverture Capot';
        message = `Le compteur Hexing ${meterId} a détecté une tentative d'ouverture physique (Tamper).`;
        priority = 'Critique';
        break;
      case 'E-04':
        type = 'warning';
        title = 'Alimentation : Tension Basse';
        message = `Seuil de tension critique atteint sur ${meterId}. Vérification réseau requise.`;
        break;
      case 'E-25':
        type = 'danger';
        title = 'Système : Erreur Relais';
        message = `Échec mécanique du relais de coupure sur le compteur ${meterId}. Coupure impossible.`;
        priority = 'Critique';
        break;
      case 'L-01':
        type = 'warning';
        title = 'Prépaiement : Crédit Bas';
        message = `Le compteur Hexing ${meterId} signale un crédit résiduel inférieur au seuil de sécurité.`;
        break;
      default:
        message = `Événement non répertorié (${event.code}) sur le compteur Hexing ${meterId}.`;
    }

    return { type, title, message, meterId, priority };
  }
};

export const FUTURISE_DLMS_SECURITY_CONFIG = {
  // --- Clés Cryptographiques DLMS HLS5 (lues depuis l'écran Security du compteur) ---
  blockCipherKey: '000102030405060708090A0B0C0D0E0F',   // EK - AES-128 Block Cipher Key
  authenticationKey: 'D0D1D2D3D4D5D6D7D8D9DADBDCDDDEDF', // AK - GMAC Authentication Key
  securityPolicy: 'AuthenticationEncryption',              // HLS5 - Niveau 5 Sécurité Forte
  systemTitle: 'ABCDEFGH',                                 // System Title (ASCII)
  systemTitleHex: '4142434445464748',                       // System Title (Hex 8 octets)
};

/**
 * Registres OBIS STS lus directement depuis les compteurs physiques Futurise
 * Source: Capture écran Futurise Meter Tool — Registres OBIS compteur 0128260224786
 */
export const METER_STS_OBIS_REGISTERS = {
  SGC:             { obis: '0-68:128.0.8.255',    value: 600876,          description: 'Supply Group Code (Numéro de Groupe d\'Approvisionnement NIGELEC)' },
  Ti:              { obis: '0-68:128.0.1.255',    value: 1,               description: 'Tariff Index (Index Tarifaire Actif)' },
  MFC:             { obis: '1.0.129.129.10.255',  value: '0128',          description: 'Manufacturer Code (Code Constructeur Futurise)' },
  KRN:             { obis: '0-68:128.0.3.255',    value: 2,               description: 'Key Revision Number (Numéro de Révision de Clé)' },
  KT:              { obis: '0-68:128.0.4.255',    value: 2,               description: 'Key Type (Type de Clé STS)' },
  KCT:             { obis: '1.0.129.129.13.255',  value: 3,               description: 'Key Change Token (Compteur de Changement de Clé)' },
  KEN:             { obis: '0-68:128.0.2.255',    value: 255,             description: 'Key Expiry Number (Numéro d\'Expiration de Clé)' },
  EA:              { obis: '0-68:128.0.11.255',   value: 7,               description: 'EA07 — Electricity Algorithm (Algorithme de Chiffrement STS)' },
  CSG:             { obis: '0.0.97.97.3.255',     value: 28,              description: 'Module CSG (Code Segment Compteur)' },
  CREDIT:          { obis: '0.0.96.60.0.255',   value: null,            description: 'Crédit Prépayé Restant (kWh) — Dynamique' },
  // Registres Certifiés Futurise — Relevés sur 0128260224778
  SIM_CCID:        { obis: '0.0.96.1.148.255',    value: '892270201058604...', description: 'SIM CCID (Identifiant Carte SIM Modem GPRS/4G)' },
  MODULE_IMEI:     { obis: '0.0.96.1.149.255',    value: '864804076987783',    description: 'Module IMEI (Numéro IMEI Modem Cellulaire)' },
  HEARTBEAT_PERIOD:{ obis: '0.0.51.2.1.255',      value: 300,                  description: 'Heart Period (Intervalle de Ping Périodique : 300s / 5 min)' },
  ALARM_STATUS:    { obis: '1.0.97.129.0.255',    value: '0',                  description: 'Meter Event Alarm Status (Statut Alarme Evénement)' },
  ALARM_CURRENT:   { obis: '1.0.97.129.1.255',    value: '0',                  description: 'Meter Event Alarm Current Status (Statut Alarme Actuel)' },
  RUN_STATUS:      { obis: '1-0:129.129.6.255',   value: 0,                    description: 'Meter Run Status (Statut Fonctionnement : 0 = Normal)' },
  METER_MODE:      { obis: '1-0:1.199.0.255',     value: 0,                    description: 'Meter Mode (Mode Fonctionnement : 0 = Mode Prépayé STS)' },
  MAX_CURRENT:     { obis: '1.0.0.6.3.255',       value: '80.000 A',           description: 'Max. Current (Courant Maximal Imax = 80A)' },
  FREQUENCY:       { obis: '1.0.0.6.2.255',       value: '50.00 Hz',           description: 'Frequency (Fréquence Nominale Réseau = 50Hz)' },
  BASIC_CURRENT:   { obis: '1.0.0.6.1.255',       value: '5.000 A',            description: 'Basic Current (Courant de Base Ib = 5A / 5(80)A Classe 1)' },
  VOLTAGE:         { obis: '1.0.0.6.0.255',       value: '220.00 V',           description: 'Voltage (Tension Nominale Un = 220V / 230V)' },
  CONSTANT_ACTIVE: { obis: '1.0.0.3.0.255',       value: 1000,                 description: 'Constant Active (Constante Impulsionnelle = 1000 imp/kWh)' },
  METER_NUMBER:    { obis: '0-0:96.1.0.255',      value: '0128260224778',      description: 'Meter Number (Numéro de Série Compteur)' },
  LOGICAL_NAME:    { obis: '0-0:42.0.0.255',      value: 'FTCM21070600000...', description: 'COSEM Logical Name (Identifiant Logique System)' },
};

/**
 * Driver pour les compteurs FUTURISE
 */
export const FuturiseDriver = {
  parseEvent: (meterId: string, event: MeterRawEvent): MeterParsedEvent => {
    const code = parseInt(event.code);
    if (code === 101) {
      return { 
        type: 'danger', 
        title: 'Fraude Magnétique', 
        message: `Détection de champ magnétique puissant sur ${meterId}`, 
        priority: 'Critique',
        meterId 
      };
    }
    if (code === 404) {
      return { 
        type: 'info', 
        title: 'Maintenance : Pile Faible', 
        message: `La pile de sauvegarde de l'horloge sur ${meterId} est faible.`,
        priority: 'Normale',
        meterId 
      };
    }

    return { 
      type: 'info', 
      title: 'Événement Futurise', 
      message: `Code Futurise ${event.code} reçu pour ${meterId}`,
      priority: 'Normale',
      meterId
    };
  }
};

/**
 * Registre Central des Drivers de Compteurs
 */
export const MeterDriverRegistry: Record<string, { parseEvent: (id: string, ev: MeterRawEvent) => MeterParsedEvent }> = {
  'Hexing': HexingDriver,
  'Futurise': FuturiseDriver,
  'Default': {
    parseEvent: (id: string, ev: MeterRawEvent) => ({ 
      type: 'info', 
      title: 'Événement Générique', 
      message: `Événement ${ev.code} reçu du compteur ${id}`,
      priority: 'Normale',
      meterId: id
    })
  }
};
