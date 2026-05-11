import { Customer, Meter, Tariff, Alert } from './types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'C001',
    name: 'Jean Dupont',
    email: 'jean.dupont@email.com',
    phone: '06 12 34 56 78',
    type: 'domestic',
    meters: 1,
    credit: 45.20,
    address: '12 Rue de la Paix, Paris',
    joinDate: '2023-01-15',
    status: 'active'
  },
  {
    id: 'C002',
    name: 'Marie Martin',
    email: 'marie.martin@email.com',
    phone: '06 23 45 67 89',
    type: 'domestic',
    meters: 1,
    credit: 12.50,
    address: '45 Avenue des Champs-Élysées, Paris',
    joinDate: '2023-03-20',
    status: 'active'
  },
  {
    id: 'C003',
    name: 'Commerce ABC',
    email: 'contact@abc.fr',
    phone: '01 45 67 89 01',
    type: 'commercial',
    meters: 2,
    credit: 234.80,
    address: '88 Boulevard Haussmann, Paris',
    joinDate: '2022-11-05',
    status: 'active'
  },
  {
    id: 'C004',
    name: 'Industrie XYZ',
    email: 'admin@xyz.fr',
    phone: '01 56 78 90 12',
    type: 'industrial',
    meters: 5,
    credit: 1245.00,
    address: 'Zone Industrielle Nord, Lyon',
    joinDate: '2021-06-12',
    status: 'active'
  }
];

export const INITIAL_METERS: Meter[] = [
  { id: '541-234-567', customerId: 'C001', location: 'Résidence A - Apt 101', type: 'domestic', credit: 45.20, status: 'online', lastUpdate: '2 min', power: 2.4, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-01-16', lifecycleStatus: 'installed' },
  { id: '541-234-568', customerId: 'C002', location: 'Résidence A - Apt 102', type: 'domestic', credit: 12.50, status: 'warning', lastUpdate: '5 min', power: 1.8, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-03-21', lifecycleStatus: 'installed' },
  { id: '541-234-569', customerId: 'C003', location: 'Commerce B - Zone 01', type: 'commercial', credit: 234.80, status: 'online', lastUpdate: '1 min', power: 8.5, voltage: 230, firmware: 'v2.5.0', installationDate: '2022-11-06', lifecycleStatus: 'installed' },
  { id: '541-234-570', customerId: 'C004', location: 'Industrie C - Bât 5', type: 'industrial', credit: 1245.00, status: 'online', lastUpdate: '30 sec', power: 45.2, voltage: 400, firmware: 'v2.5.0', installationDate: '2021-06-13', lifecycleStatus: 'installed' }
];

// =================================================================
// GRILLE TARIFAIRE OFFICIELLE NIGELEC - NIGER (Édition 2024)
// Source: Décisions ARSE / Arrêtés tarifaires en vigueur
// =================================================================
export const TARIFFS: Record<string, Tariff> = {

  // ----------------------------------------------------------------
  // 1. TRANCHE SOCIALE (TS)  |  Puissance ≤ 2,2 kW  |  Plafond 50 kWh
  //    Exonéré de TVA et de Taxe Habitat
  // ----------------------------------------------------------------
  social: {
    rate: 59.43,
    name: 'Tranche Sociale (TS)',
    description: 'Tarif subventionné pour ménages à faible revenu. Puissance souscrite ≤ 2,2 kW. Plafond 50 kWh/mois. Exonération TVA et Taxe Habitat.',
    minConsumption: 0, maxConsumption: 50,
    fixedMonthlyFee: 0,   // Pas de prime fixe
    taxRate: 0,           // Exonération TVA
    tiers: [
      {
        id: 'ts-t1', minKwh: 0, maxKwh: 50,
        rate: 59.43,          // Énergie FCFA/kWh
        primeFixe: 0,         // Pas d'abonnement
        taxeHabitat: 0,       // Exonéré
        taxeORNT: 3,          // Redevance ORTN (FCFA/kWh)
        taxeMunicipale: 2,    // Redevance Municipale (FCFA/kWh)
        redevance: 250,       // Éclairage Public (FCFA/mois)
        vatRate: 0            // Exonération TVA
      }
    ]
  },

  // ----------------------------------------------------------------
  // 2. BASSE TENSION DOMESTIQUE (BT-D)  |  Puissance 3-6 kW
  //    4 paliers progressifs  |  TVA 19%  |  Taxe Habitat 100F
  // ----------------------------------------------------------------
  domestic: {
    rate: 79.25,
    name: 'Domestique BT (BT-D)',
    description: 'Résidentiel Basse Tension. Puissance 3 à 6 kW. Prime fixe 1 278 FCFA/mois. Taxe Habitat 100 FCFA/mois. Grille progressive sur 4 paliers.',
    minConsumption: 0, maxConsumption: null,
    fixedMonthlyFee: 1278,   // Abonnement mensuel (FCFA)
    taxRate: 19,              // TVA 19%
    tiers: [
      {
        id: 'btd-t1', minKwh: 0, maxKwh: 50,
        rate: 59.45,          // Palier 1 : 0-50 kWh
        primeFixe: 1278,      // Prime fixe abonnement
        taxeHabitat: 100,     // Taxe Habitat (FCFA/mois)
        taxeORNT: 3,          // ORTN (FCFA/kWh)
        taxeMunicipale: 2,    // Municipale (FCFA/kWh)
        redevance: 250,       // Éclairage Public (FCFA/mois)
        vatRate: 19           // TVA 19%
      },
      {
        id: 'btd-t2', minKwh: 51, maxKwh: 250,
        rate: 79.25,          // Palier 2 : 51-250 kWh
        primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19
      },
      {
        id: 'btd-t3', minKwh: 251, maxKwh: 500,
        rate: 94.13,          // Palier 3 : 251-500 kWh
        primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19
      },
      {
        id: 'btd-t4', minKwh: 501, maxKwh: null,
        rate: 120.35,         // Palier 4 : > 500 kWh
        primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19
      }
    ]
  },

  // ----------------------------------------------------------------
  // 3. BASSE TENSION PROFESSIONNELLE (BT-P)  |  Puissance ≥ 6 kW
  //    2 paliers  |  TVA 19%  |  Taxe Habitat 200F
  // ----------------------------------------------------------------
  commercial: {
    rate: 98.50,
    name: 'Professionnel / Commercial BT (BT-P)',
    description: 'Professionnels et commerces en Basse Tension. Puissance ≥ 6 kW. Prime fixe 2 557 FCFA/mois. Taxe Habitat 200 FCFA/mois. 2 paliers progressifs.',
    minConsumption: 0, maxConsumption: null,
    fixedMonthlyFee: 2557,   // Abonnement mensuel (FCFA)
    taxRate: 19,
    tiers: [
      {
        id: 'btp-t1', minKwh: 0, maxKwh: 500,
        rate: 98.50,          // Palier 1 : 0-500 kWh
        primeFixe: 2557, taxeHabitat: 200, taxeORNT: 3, taxeMunicipale: 2, redevance: 500, vatRate: 19
      },
      {
        id: 'btp-t2', minKwh: 501, maxKwh: null,
        rate: 115.75,         // Palier 2 : > 500 kWh
        primeFixe: 2557, taxeHabitat: 200, taxeORNT: 3, taxeMunicipale: 2, redevance: 500, vatRate: 19
      }
    ]
  },

  // ----------------------------------------------------------------
  // 4. MOYENNE TENSION GÉNÉRALE (MT-G)  |  Puissance ≥ 36 kVA
  //    Tarif unique  |  TVA 19%  |  Taxe Habitat 500F
  // ----------------------------------------------------------------
  industrial: {
    rate: 89.19,
    name: 'Industriel / Moyenne Tension (MT-G)',
    description: 'Moyenne Tension générale. Puissance ≥ 36 kVA. Poste de transformation privé. Prime fixe 6 151 FCFA/mois. Taxe Habitat 500 FCFA/mois. Tarif unique kWh.',
    minConsumption: 0, maxConsumption: null,
    fixedMonthlyFee: 6151,   // Abonnement mensuel (FCFA)
    taxRate: 19,
    tiers: [
      {
        id: 'mtg-t1', minKwh: 0, maxKwh: null,
        rate: 89.19,          // Tarif unique MT
        primeFixe: 6151, taxeHabitat: 500, taxeORNT: 3, taxeMunicipale: 2, redevance: 0, vatRate: 19
      }
    ]
  },

  // ----------------------------------------------------------------
  // 5. HAUTE TENSION (HT)  |  Puissance > 1 000 kVA
  //    Grands comptes : mines, cimenteries, industries lourdes
  // ----------------------------------------------------------------
  haute_tension: {
    rate: 68.50,
    name: 'Haute Tension (HT) — Grands Comptes',
    description: 'Tarif HT pour très grands consommateurs (mines, cimenteries). Puissance > 1 000 kVA. Tarif préférentiel à haute tension directe. Prime fixe indicative 45 000 FCFA/mois.',
    minConsumption: 0, maxConsumption: null,
    fixedMonthlyFee: 45000,  // Indicatif – contrat sur mesure
    taxRate: 19,
    tiers: [
      {
        id: 'ht-t1', minKwh: 0, maxKwh: null,
        rate: 68.50,          // Tarif HT (FCFA/kWh)
        primeFixe: 45000, taxeHabitat: 0, taxeORNT: 3, taxeMunicipale: 0, redevance: 0, vatRate: 19
      }
    ]
  },

  // ----------------------------------------------------------------
  // 6. ÉCLAIRAGE PUBLIC (EP)
  //    Communes et collectivités — Compteurs EP dédiés
  // ----------------------------------------------------------------
  eclairage_public: {
    rate: 75.00,
    name: 'Éclairage Public (EP)',
    description: 'Tarif spécial communes et collectivités pour l\'éclairage de voirie. Compteurs EP dédiés. Prime fixe 500 FCFA/point lumineux/mois. TVA 19%.',
    minConsumption: 0, maxConsumption: null,
    fixedMonthlyFee: 500,    // Par point lumineux (FCFA/mois)
    taxRate: 19,
    tiers: [
      {
        id: 'ep-t1', minKwh: 0, maxKwh: null,
        rate: 75.00,          // Tarif EP (FCFA/kWh)
        primeFixe: 500, taxeHabitat: 0, taxeORNT: 3, taxeMunicipale: 2, redevance: 0, vatRate: 19
      }
    ]
  }
};

export const INITIAL_ALERTS: Alert[] = [
  { id: '1', type: 'warning', title: 'Crédit faible détecté', message: 'Le compteur 541-234-568 dispose de moins de 1 500 FCFA de crédit', timestamp: new Date(Date.now() - 600000), status: 'unread' },
  { id: '2', type: 'danger', title: 'Crédit critique', message: 'Le compteur 541-234-571 dispose de seulement 320 FCFA - Recharge urgente', timestamp: new Date(Date.now() - 900000), status: 'unread' },
  { id: '3', type: 'success', title: 'Token généré avec succès', message: 'Recharge de 5 000 FCFA effectuée pour le compteur 541-234-567', timestamp: new Date(Date.now() - 7200000), status: 'read' },
  { id: '4', type: 'info', title: 'Mise à jour tarifaire', message: 'Les tarifs NIGELEC ont été synchronisés avec succès', timestamp: new Date(Date.now() - 18000000), status: 'read' }
];
