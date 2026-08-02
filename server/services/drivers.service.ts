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
