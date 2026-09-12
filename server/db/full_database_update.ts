import { db } from '../db';

async function updateFullDatabase() {
  console.log(`========================================================================`);
  console.log(`=== MISE À JOUR COMPLÈTE DE LA BASE DE DONNÉES AMI / HES (SQLITE)    ===`);
  console.log(`========================================================================\n`);

  await db.initSchema();

  // 1. MISE À JOUR ABONNÉ PRINCIPAL
  const customerId = 'CUST-Z8RD';
  await db.prepare(`
    INSERT OR REPLACE INTO customers (id, name, email, phone, type, meters, credit, address, joinDate, status, regionId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customerId,
    'Diafara Moussa',
    'moudiaf@gmail.com',
    '96335368',
    'mixed',
    2,
    13.00,
    'Koubia, Niamey',
    '2026-08-20',
    'active',
    'NIAMEY'
  );
  console.log(`✅ [1/5] Abonné ${customerId} mis à jour avec 2 compteurs rattachés.`);

  // 2. MISE À JOUR COMPTEUR DOMESTIQUE 0128260224778 (Solde physique 6.00 kWh)
  await db.prepare(`
    INSERT OR REPLACE INTO meters (
      id, serialNumber, customerId, location, type, phaseType, credit, totalConsumption, status,
      power, voltage, subscribedPower, paymentMode, tamperStatus, protocol,
      lifecycleStatus, batchId, latitude, longitude, registeredAt, lastTid
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    '0128260224778',
    '0128260224778',
    customerId,
    'Niamey / Koubia',
    'domestic',
    'monophase',
    6.00,
    0.00,
    'online',
    0.0,
    230.0,
    9.0,
    'prepaid',
    'clear',
    'DLMS/COSEM',
    'installed',
    'BATCH-2026-NIG-01',
    13.512000,
    2.125000,
    '2026-08-21',
    1
  );
  console.log(`✅ [2/5] Compteur Domestique 0128260224778 mis à jour (Solde: 6.00 kWh, Conso: 0.00 kWh, 230V, Monophasé).`);

  // 3. MISE À JOUR COMPTEUR COMMERCIAL 0128260224786 (Solde physique 7.00 kWh)
  await db.prepare(`
    INSERT OR REPLACE INTO meters (
      id, serialNumber, customerId, location, type, phaseType, credit, totalConsumption, status,
      power, voltage, subscribedPower, paymentMode, tamperStatus, protocol,
      lifecycleStatus, batchId, latitude, longitude, registeredAt, lastTid
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    '0128260224786',
    '0128260224786',
    customerId,
    'Industrie C',
    'commercial',
    'triphase',
    7.00,
    0.00,
    'online',
    0.0,
    400.0,
    9.0,
    'prepaid',
    'clear',
    'DLMS/COSEM',
    'installed',
    'BATCH-2026-EEN-02',
    13.513000,
    2.126000,
    '2026-08-21',
    1
  );
  console.log(`✅ [3/5] Compteur Commercial 0128260224786 mis à jour (Solde: 7.00 kWh, Conso: 0.00 kWh, 400V, Triphasé).`);

  // 4. SYNCHRONISATION DES RECHARGES STS EN BASE
  await db.prepare(`
    INSERT OR REPLACE INTO tokens (id, meterId, customerId, token, amount, kwh, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, 'success', datetime('now'))
  `).run('TOK-0128260224778-INIT', '0128260224778', customerId, '4209-7447-7956-4945-9914', 500, 6.00);

  await db.prepare(`
    INSERT OR REPLACE INTO tokens (id, meterId, customerId, token, amount, kwh, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, 'success', datetime('now'))
  `).run('TOK-0128260224786-INIT', '0128260224786', customerId, '5128-9472-8316-4786-2007', 690, 7.00);
  console.log(`✅ [4/5] Historique des Jetons STS synchronisé.`);

  // 5. SYNCHRONISATION DES CONCENTRATEURS REGIONAUX DCU
  const dcus = [
    { id: 'DCU-Nord-01', name: 'Concentrateur Nord', regionId: 'NIAMEY', ipAddress: '10.0.1.5', modemType: '4G', performance: 99.8, status: 'active', latitude: 13.52, longitude: 2.11 },
    { id: 'DCU-Sud-02', name: 'Concentrateur Sud', regionId: 'PLATEAU', ipAddress: '10.0.1.6', modemType: 'GPRS', performance: 98.5, status: 'active', latitude: 13.50, longitude: 2.10 },
    { id: 'DCU-West-04', name: 'DCU Tillabéri Ouest', regionId: 'TILLABERI', ipAddress: '10.0.4.1', modemType: 'PLC-G3', performance: 97.2, status: 'active', latitude: 14.21, longitude: 1.45 },
    { id: 'DCU-East-05', name: 'DCU Zinder Centre', regionId: 'ZINDER', ipAddress: '10.0.5.1', modemType: 'LTE', performance: 96.5, status: 'active', latitude: 13.80, longitude: 8.98 },
    { id: 'DCU-North-06', name: 'DCU Agadez Nord', regionId: 'AGADEZ', ipAddress: '10.0.6.1', modemType: 'SATELLITE', performance: 99.1, status: 'active', latitude: 16.97, longitude: 7.99 }
  ];

  for (const d of dcus) {
    await db.prepare(`
      INSERT OR REPLACE INTO dcus (id, name, regionId, ipAddress, modemType, performance, status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(d.id, d.name, d.regionId, d.ipAddress, d.modemType, d.performance, d.status, d.latitude, d.longitude);
  }
  console.log(`✅ [5/5] ${dcus.length} Concentrateurs régionaux DCU synchronisés.`);

  console.log(`\n========================================================================`);
  console.log(`=== BASE DE DONNÉES SYNCHRONISÉE ET MISE À JOUR À 100% AVEC SUCCÈS 🟢 ===`);
  console.log(`========================================================================\n`);
}

updateFullDatabase().catch(err => {
  console.error("❌ Erreur mise à jour base :", err);
  process.exit(1);
});
