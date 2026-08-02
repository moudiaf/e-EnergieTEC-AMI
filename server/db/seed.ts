import { db } from '../db';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

async function seed() {
  console.log("[SEED] Initialisation de la base de données de test...");

  // 1. Clients de test
  const seedCustomers = [
    { id: 'C001', name: 'Jean Dupont', email: 'jean.dupont@email.com', phone: '06 12 34 56 78', type: 'domestic', meters: 1, credit: 45.20, address: '12 Rue de la Paix, Niamey Plateau', joinDate: '2023-01-15', status: 'active', regionId: 'PLATEAU' },
    { id: 'C002', name: 'Marie Martin', email: 'marie.martin@email.com', phone: '06 23 45 67 89', type: 'domestic', meters: 1, credit: 12.50, address: '45 Avenue des Champs-Élysées, Niamey Plateau', joinDate: '2023-03-20', status: 'active', regionId: 'PLATEAU' },
    { id: 'C003', name: 'Commerce ABC', email: 'contact@abc.fr', phone: '01 45 67 89 01', type: 'commercial', meters: 2, credit: 234.80, address: '88 Boulevard Haussmann, Niamey Yantala', joinDate: '2022-11-05', status: 'active', regionId: 'YANTALA' },
    { id: 'C004', name: 'Industrie XYZ', email: 'admin@xyz.fr', phone: '01 56 78 90 12', type: 'industrial', meters: 5, credit: 1245.00, address: 'Zone Industrielle Nord, Niamey', joinDate: '2021-06-12', status: 'active', regionId: 'NIAMEY' },
    { id: 'C005', name: 'Ibrahim Moussa', email: 'imoussa@niamey.ne', phone: '90 11 22 33', type: 'domestic', meters: 1, credit: 50.00, address: 'Quartier Plateau, Agadez', joinDate: '2024-01-10', status: 'active', regionId: 'AGADEZ' },
    { id: 'C006', name: 'Hotel de Ville', email: 'contact@mairie-niamey.ne', phone: '88 77 66 55', type: 'commercial', meters: 3, credit: 5500.00, address: 'Centre Ville, Niamey', joinDate: '2020-05-15', status: 'active', regionId: 'NIAMEY' }
  ];

  const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers(id, name, email, phone, type, meters, credit, address, joinDate, status, regionId)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of seedCustomers) {
    await insertCustomer.run(c.id, c.name, c.email, c.phone, c.type, c.meters, c.credit, c.address, c.joinDate, c.status, c.regionId);
  }
  console.log("[SEED] Clients insérés.");

  // 2. Compteurs de test (Installés et en Stock)
  const seedMeters = [
    { id: '541-234-567', customerId: 'C001', location: 'Plateau - Niamey', type: 'domestic', credit: 45.20, status: 'online', lastUpdate: '2 min', power: 2.4, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-01-16', lat: 13.5350, lng: 2.1020, dcuId: 'DCU-Nord-01' },
    { id: '541-234-568', customerId: 'C002', location: 'Plateau - Niamey', type: 'domestic', credit: 12.50, status: 'warning', lastUpdate: '5 min', power: 1.8, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-03-21', lat: 13.5380, lng: 2.1050, dcuId: 'DCU-Nord-01' },
    { id: '541-234-569', customerId: 'C003', location: 'Centre Ville', type: 'commercial', credit: 234.80, status: 'online', lastUpdate: '1 min', power: 8.5, voltage: 230, firmware: 'v2.5.0', installationDate: '2022-11-06', lat: 13.5150, lng: 2.1120, dcuId: 'DCU-Sud-02' },
    { id: '541-234-570', customerId: 'C004', location: 'Zone Industrielle', type: 'industrial', credit: 1245.00, status: 'online', lastUpdate: '30 sec', power: 45.2, voltage: 400, firmware: 'v2.5.0', installationDate: '2021-06-13', lat: 13.5250, lng: 2.1220, dcuId: 'DCU-Sud-02' },
    { id: '541-800-001', customerId: 'C005', location: 'Tillabéri Ville', type: 'domestic', credit: 10.00, status: 'offline', lastUpdate: '14h', power: 0, voltage: 0, firmware: 'v2.4.1', installationDate: '2024-01-01', lat: 14.2000, lng: 2.0800, dcuId: 'DCU-West-04' },
    { id: '541-800-002', customerId: 'C005', location: 'Sakoira - Tillabéri', type: 'domestic', credit: 85.00, status: 'online', lastUpdate: '3 min', power: 1.2, voltage: 228, firmware: 'v2.4.1', installationDate: '2024-01-05', lat: 14.2500, lng: 2.1000, dcuId: 'DCU-West-04' },
    { id: '541-900-001', customerId: 'C006', location: 'Zinder Sabon Gari', type: 'commercial', credit: 500.00, status: 'online', lastUpdate: '1 min', power: 3.4, voltage: 225, firmware: 'v2.5.0', installationDate: '2024-02-10', lat: 13.8000, lng: 8.9800, dcuId: 'DCU-East-05' },
    { id: '541-700-001', customerId: 'C004', location: 'Agadez Toudou', type: 'industrial', credit: 2000.00, status: 'online', lastUpdate: '10 sec', power: 55.0, voltage: 405, firmware: 'v2.5.1', installationDate: '2023-10-10', lat: 16.9700, lng: 7.9800, dcuId: 'DCU-North-06' }
  ];

  const seedWarehouse = [
    { id: '542-001-001', serialNumber: 'SN-NIG-2026-001', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon A' },
    { id: '542-001-002', serialNumber: 'SN-NIG-2026-002', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon A' },
    { id: '542-001-003', serialNumber: 'SN-NIG-2026-003', batchId: 'BATCH-2026-A', supplier: 'Itron France', purchaseDate: '2026-01-05', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Central Niamey - Rayon B' },
    { id: '542-001-004', serialNumber: 'SN-NIG-2026-004', batchId: 'BATCH-2026-B', supplier: 'Landis+Gyr', purchaseDate: '2026-02-10', lifecycleStatus: 'in_stock', warehouseLocation: 'Magasin Maradi' },
    { id: '542-001-005', serialNumber: 'SN-NIG-2026-005', batchId: 'BATCH-2026-B', supplier: 'Landis+Gyr', purchaseDate: '2026-02-10', lifecycleStatus: 'faulty', warehouseLocation: 'Zone Réparation Niamey' }
  ];

  const insertMeter = db.prepare(`
    INSERT OR IGNORE INTO meters(id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, installationDate, lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation, latitude, longitude, dcuId, registeredAt)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of seedMeters) {
    await insertMeter.run(m.id, m.customerId, m.location, m.type, m.credit, m.status, m.lastUpdate, m.power, m.voltage, m.firmware, m.installationDate, 'installed', m.id, 'BATCH-2024-NIG', 'Nigelec Official', '2024-01-01', 'N/A', m.lat, m.lng, m.dcuId, '2024-01-01');
  }
  
  for (const m of seedWarehouse) {
    await insertMeter.run(m.id, null, 'Magasin', 'domestic', 0, 'offline', 'N/A', 0, 0, 'v1.0.0', null, m.lifecycleStatus, m.serialNumber, m.batchId, m.supplier, m.purchaseDate, m.warehouseLocation, null, null, null, m.purchaseDate);
  }
  console.log("[SEED] Compteurs insérés.");

  // 3. Alertes historiques de test
  const seedAlerts = [
    { id: 'A001', type: 'warning', title: 'Crédit faible détecté', message: 'Le compteur 541-234-568 dispose de moins de 5.00 kWh de crédit', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), status: 'unread' },
    { id: 'A002', type: 'danger', title: 'Crédit critique', message: 'Le compteur 541-234-571 dispose de seulement 0.50 kWh - Recharge urgente', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), status: 'unread' },
    { id: 'A003', type: 'success', title: 'Token généré avec succès', message: 'Recharge de 10.00 kWh effectuée pour le compteur 541-234-567', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), status: 'read' },
    { id: 'A004', type: 'info', title: 'Mise à jour tarifaire', message: 'Nouveau tarif domestique: 68.37 FCFA/kWh applicable dès demain', timestamp: new Date(Date.now() - 300 * 60000).toISOString(), status: 'read' }
  ];

  const insertAlert = db.prepare("INSERT OR IGNORE INTO alerts (id, type, title, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)");
  for (const a of seedAlerts) {
    await insertAlert.run(a.id, a.type, a.title, a.message, a.timestamp, a.status);
  }
  console.log("[SEED] Alertes insérées.");

  // 4. Paiements de test
  const seedPayments = [
    { id: 'P001', amount: 15000, operator: 'Orange', phone: '90123456', meterId: '541-234-567', status: 'Success', timestamp: new Date().toISOString() },
    { id: 'P002', amount: 8000,  operator: 'Airtel', phone: '88234567', meterId: '541-234-568', status: 'Success', timestamp: new Date().toISOString() },
    { id: 'P003', amount: 5000,  operator: 'NITA',   phone: '96345678', meterId: '541-234-569', status: 'Success', timestamp: new Date().toISOString() },
    { id: 'P004', amount: 12000, operator: 'CASH',   phone: '91456789', meterId: '541-234-570', status: 'Success', timestamp: new Date().toISOString() },
    { id: 'P005', amount: 20000, operator: 'Orange', phone: '90224466', meterId: '541-800-002', status: 'Success', timestamp: new Date().toISOString() },
  ];

  const insertPayment = db.prepare("INSERT OR IGNORE INTO payments (id, amount, operator, phone, meterId, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (const p of seedPayments) {
    await insertPayment.run(p.id, p.amount, p.operator, p.phone, p.meterId, p.status, p.timestamp);
  }
  console.log("[SEED] Paiements insérés.");

  // 5. Utilisateurs de test
  const hashedJean = bcrypt.hashSync('password123', BCRYPT_ROUNDS);
  await db.prepare("INSERT OR IGNORE INTO users (id, username, password, role, name, associatedCustomerId) VALUES (?, ?, ?, ?, ?, ?)")
    .run('U004', 'jean', hashedJean, 'customer', 'Jean Dupont', 'C001');
  
  const hashedAuditor = bcrypt.hashSync('auditor123', BCRYPT_ROUNDS);
  await db.prepare("INSERT OR IGNORE INTO users (id, username, password, role, name, associatedCustomerId) VALUES (?, ?, ?, ?, ?, ?)")
    .run('U005', 'auditor', hashedAuditor, 'auditor', 'Auditeur ARSE', null);

  console.log("[SEED] Utilisateurs 'jean' et 'auditor' insérés.");

  console.log("[SEED] Seeding terminé avec succès ! 🟢");
}

seed().catch(err => {
  console.error("[SEED] Erreur de seeding:", err);
  process.exit(1);
});
