import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import pg from "pg";
const { Pool } = pg;

const isEnterpriseMode = process.env.DB_TYPE === 'postgres';
console.log(`[SYS] Initialisation Mode Base de Données : ${isEnterpriseMode ? 'Enterprise (PostgreSQL/TimescaleDB)' : 'Local (SQLite)'}`);

const JWT_SECRET = process.env.JWT_SECRET || 'ami-sts-secret-key-nigelec-2026-change-in-prod';
const JWT_EXPIRES_IN = '8h'; // Session valide 8 heures
const BCRYPT_ROUNDS = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration PostgreSQL (via variables d'environnement)
const pgPool = isEnterpriseMode ? new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ami_smart_meter',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : null;

const sqliteDb = !isEnterpriseMode ? new Database("ami_smart_meter.db") : null;

// Service d'abstraction de base de données (Hybride Async)
const db = {
  async exec(sql: string) {
    if (isEnterpriseMode) {
      // Nettoyage sommaire pour compatibilité (SQLite vs PG)
      const pgSql = sql.replace(/REAL/g, 'DOUBLE PRECISION').replace(/TEXT PRIMARY KEY/g, 'VARCHAR(255) PRIMARY KEY');
      return pgPool!.query(pgSql);
    }
    return sqliteDb!.exec(sql);
  },
  
  prepare(sql: string) {
    // Conversion des paramètres ? en $1, $2 pour PostgreSQL
    let pgSql = sql;
    if (isEnterpriseMode) {
      let count = 1;
      pgSql = sql.replace(/\?/g, () => `$${count++}`);
    }

    return {
      async all(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return res.rows;
        }
        return sqliteDb!.prepare(sql).all(...params);
      },
      async get(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return res.rows[0];
        }
        return sqliteDb!.prepare(sql).get(...params);
      },
      async run(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return { changes: res.rowCount, lastInsertRowid: null };
        }
        return sqliteDb!.prepare(sql).run(...params);
      }
    };
  }
};

// Initialize Database Function
async function initDb() {
  await db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    type TEXT,
    meters INTEGER,
    credit REAL,
    address TEXT,
    joinDate TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS meters (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    location TEXT,
    type TEXT,
    credit REAL,
    status TEXT,
    lastUpdate TEXT,
    power REAL,
    voltage REAL,
    firmware TEXT,
    installationDate TEXT,
    subscribedPower REAL,
    paymentMode TEXT,
    tamperStatus TEXT,
    protocol TEXT,
    lastReading DATE,
    totalConsumption DECIMAL(12, 2) DEFAULT 0,
    lifecycleStatus TEXT DEFAULT 'installed',
    serialNumber TEXT,
    batchId TEXT,
    supplier TEXT,
    purchaseDate DATE,
    warehouseLocation TEXT,
    touEnabled INTEGER DEFAULT 0,
    solarInjection DECIMAL(12, 2) DEFAULT 0,
    mlFraudScore DECIMAL(4, 2) DEFAULT 0,
    latitude REAL,
    longitude REAL,
    dcuId TEXT,
    FOREIGN KEY(customerId) REFERENCES customers(id),
    FOREIGN KEY(dcuId) REFERENCES dcus(id)
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    token TEXT,
    rawToken TEXT,
    amount REAL,
    kwh REAL,
    meterId TEXT,
    customerId TEXT,
    timestamp TEXT,
    expiry TEXT,
    status TEXT,
    type TEXT,
    FOREIGN KEY(meterId) REFERENCES meters(id),
    FOREIGN KEY(customerId) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT,
    category TEXT DEFAULT 'standard',
    priority TEXT DEFAULT 'Moyenne',
    title TEXT,
    message TEXT,
    timestamp TEXT,
    status TEXT,
    meterId TEXT
  );

  CREATE TABLE IF NOT EXISTS tariffs (
    id TEXT PRIMARY KEY,
    name TEXT,
    rate REAL,
    description TEXT,
    tiers TEXT,
    isTou INTEGER DEFAULT 0,
    touRates TEXT,
    fixedMonthlyFee REAL DEFAULT 0,
    taxRate REAL DEFAULT 0,
    currency TEXT DEFAULT 'FCFA'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    superiorRegionId TEXT,
    areaName TEXT,
    label INTEGER,
    principal TEXT,
    contact TEXT,
    email TEXT,
    status TEXT,
    blazon TEXT,
    FOREIGN KEY(superiorRegionId) REFERENCES regions(id)
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    action TEXT,
    details TEXT,
    user TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    associatedCustomerId TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    meterId TEXT,
    month TEXT,
    kwhConsumed REAL,
    amountHT REAL,
    tva REAL,
    totalTTC REAL,
    status TEXT,
    dueDate TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    subject TEXT,
    description TEXT,
    customerId TEXT,
    meterId TEXT,
    status TEXT,
    priority TEXT,
    assignedTo TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    amount REAL,
    operator TEXT,
    phone TEXT,
    meterId TEXT,
    tokenId TEXT,
    status TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT,
    type TEXT,
    recipient TEXT,
    title TEXT,
    message TEXT,
    status TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS alert_rules (
    id TEXT PRIMARY KEY,
    name TEXT,
    condition TEXT,
    notifySms BOOLEAN,
    notifyEmail BOOLEAN,
    active BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS dcus (
    id TEXT PRIMARY KEY,
    name TEXT,
    regionId TEXT,
    status TEXT,
    ipAddress TEXT,
    macAddress TEXT,
    firmware TEXT,
    lastPing TEXT,
    performance REAL,
    latitude REAL,
    longitude REAL,
    modemType TEXT,
    signalStrength INTEGER,
    connectedMeters INTEGER,
    cpuUsage REAL,
    memUsage REAL
  );

  CREATE TABLE IF NOT EXISTS interval_data (
    id TEXT PRIMARY KEY,
    meterId TEXT,
    timestamp TEXT,
    reading REAL,
    consumption REAL,
    voltage REAL,
    current REAL,
    powerFactor REAL,
    status TEXT,
    validationNotes TEXT,
    FOREIGN KEY(meterId) REFERENCES meters(id)
  );

  CREATE INDEX IF NOT EXISTS idx_interval_meter_time ON interval_data(meterId, timestamp);
  `);

  if (isEnterpriseMode) {
    try {
      console.log('[SYS] Configuration de TimescaleDB pour interval_data...');
      await db.exec("CREATE EXTENSION IF NOT EXISTS timescaledb;");
      await db.exec("SELECT create_hypertable('interval_data', 'timestamp', migrate_data => true, if_not_exists => true);").catch(e => {
        // @ts-ignore
        if (e.message && !e.message.includes('already a hypertable')) throw e;
      });
      console.log('[SYS] Hypertable TimescaleDB activée avec succès.');
    } catch (e) {
      console.warn('[SYS] Note: TimescaleDB non disponible ou déjà configuré.');
    }
  }

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assignedTo);
    CREATE INDEX IF NOT EXISTS idx_tokens_meter ON tokens(meterId);
  `);
}

// API to simulate SMS/Email
const sendNotification = async (type: 'SMS' | 'EMAIL', recipient: string, title: string, message: string, userId?: string) => {
  const id = `NOTIF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, userId, type, recipient, title, message, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.run(id, userId || 'SYSTEM', type, recipient, title, message, 'sent', timestamp);
  console.log(`[NOTIF] ${type} sent to ${recipient}: ${title} - ${message}`);
  return id;
};

// Centralized Alert & Notification Logic
const triggerAlert = async (type: string, title: string, message: string, meterId?: string, priority: string = 'Moyenne', category: string = 'standard') => {
  const alertId = `ALR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  // 1. Insert into alerts table
  await db.prepare(`
    INSERT INTO alerts(id, type, category, priority, title, message, timestamp, status, meterId)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(alertId, type, category, priority, title, message, timestamp, 'unread', meterId || null);

  // 2. High Priority Logic: Notifications + Automated Ticket
  if (type === 'danger' || priority === 'Critique' || category === 'fraud') {
    const adminPhone = '+227 90 00 00 00';
    const adminEmail = 'maintenance@nigelec.ne';

    await sendNotification('SMS', adminPhone, `ALERTE AMI: ${title}`, message);
    await sendNotification('EMAIL', adminEmail, `ANOMALIE RÉSEAU: ${title}`, `${message}\n\nCompteur: ${meterId || 'N/A'}\nDate: ${new Date().toLocaleString('fr-FR')}`);

    // Create Field Technician Ticket
    const ticketId = `TKT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await db.prepare(`
      INSERT INTO tickets (id, subject, description, meterId, status, priority, assignedTo, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ticketId, `INTERVENTION: ${title}`, message, meterId || 'N/A', 'Nouveau', priority === 'Critique' ? 'Critique' : 'Haute', 'Technicien Réseau', timestamp);

    console.log(`[ALERT] Critical alert triggered: ${title}. SMS/Email sent and ticket ${ticketId} created.`);
  } else {
    console.log(`[ALERT] Standard alert triggered: ${title}`);
  }

  return alertId;
};

// --- METER DRIVER MODULE (INTEROPERABILITY LAYER) ---

/**
 * Interface standard pour les événements de compteurs
 */
interface MeterRawEvent {
  code: string;
  timestamp: string;
  value?: any;
}

/**
 * Driver pour les compteurs HEXING
 */
const HexingDriver = {
  parseEvent: (meterId: string, event: MeterRawEvent) => {
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
const FuturiseDriver = {
  parseEvent: (meterId: string, event: MeterRawEvent) => {
    // Futurise utilise souvent des codes numériques
    const code = parseInt(event.code);
    if (code === 101) return { type: 'danger', title: 'Fraude Magnétique', message: `Détection de champ magnétique puissant sur ${meterId}`, priority: 'Critique' };
    if (code === 404) return { type: 'info', title: 'Maintenance : Pile Faible', message: `La pile de sauvegarde de l'horloge sur ${meterId} est faible.` };
    
    return { 
      type: 'info', 
      title: 'Événement Futurise', 
      message: `Code Futurise ${event.code} reçu pour ${meterId}`,
      priority: 'Normale'
    };
  }
};

/**
 * Registre Central des Drivers
 */
const MeterDriverRegistry: Record<string, any> = {
  'Hexing': HexingDriver,
  'Futurise': FuturiseDriver,
  'Default': {
    parseEvent: (id: string, ev: any) => ({ 
      type: 'info', 
      title: 'Événement Générique', 
      message: `Événement ${ev.code} reçu du compteur ${id}`,
      priority: 'Normale'
    })
  }
};

  try { await db.exec("ALTER TABLE meters ADD COLUMN subscribedPower DOUBLE PRECISION DEFAULT 9.0"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN paymentMode VARCHAR(20) DEFAULT 'prepaid'"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN tamperStatus VARCHAR(20) DEFAULT 'clear'"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN tiers TEXT DEFAULT '[]'"); } catch (e) { }
  try { await db.exec("ALTER TABLE users ADD COLUMN associatedCustomerId VARCHAR(255)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN protocol VARCHAR(50) DEFAULT 'DLMS/COSEM'"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN ipAddress VARCHAR(50)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN macAddress VARCHAR(50)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN dcuId VARCHAR(255)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN lifecycleStatus VARCHAR(50) DEFAULT 'installed'"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN serialNumber VARCHAR(100)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN batchId VARCHAR(100)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN supplier VARCHAR(100)"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN purchaseDate DATE"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN warehouseLocation TEXT"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN touEnabled INTEGER DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN solarInjection DECIMAL(12, 2) DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN mlFraudScore DECIMAL(4, 2) DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN latitude DOUBLE PRECISION"); } catch (e) { }
  try { await db.exec("ALTER TABLE meters ADD COLUMN longitude DOUBLE PRECISION"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN latitude DOUBLE PRECISION"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN longitude DOUBLE PRECISION"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN fixedMonthlyFee DOUBLE PRECISION DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN taxRate DOUBLE PRECISION DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN currency VARCHAR(10) DEFAULT 'FCFA'"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN isTou INTEGER DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE tariffs ADD COLUMN touRates TEXT"); } catch (e) { }
  try { await db.exec("ALTER TABLE alerts ADD COLUMN category VARCHAR(50) DEFAULT 'standard'"); } catch (e) { }
  try { await db.exec("ALTER TABLE alerts ADD COLUMN priority VARCHAR(50) DEFAULT 'Moyenne'"); } catch (e) { }
  try { await db.exec("ALTER TABLE alerts ADD COLUMN meterId VARCHAR(255)"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN modemType VARCHAR(50) DEFAULT 'GPRS'"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN signalStrength INTEGER DEFAULT 80"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN connectedMeters INTEGER DEFAULT 0"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN cpuUsage DOUBLE PRECISION DEFAULT 15.5"); } catch (e) { }
  try { await db.exec("ALTER TABLE dcus ADD COLUMN memUsage DOUBLE PRECISION DEFAULT 42.0"); } catch (e) { }
  try { await db.exec("ALTER TABLE regions ADD COLUMN blazon TEXT"); } catch (e) { }

  // Seed Database if empty
  const customerCount = await db.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
  if (customerCount.count === 0) {
    // ... seed customers
    const seedCustomers = [
      { id: 'C001', name: 'Jean Dupont', email: 'jean.dupont@email.com', phone: '06 12 34 56 78', type: 'domestic', meters: 1, credit: 45.20, address: '12 Rue de la Paix, Paris', joinDate: '2023-01-15', status: 'active' },
      { id: 'C002', name: 'Marie Martin', email: 'marie.martin@email.com', phone: '06 23 45 67 89', type: 'domestic', meters: 1, credit: 12.50, address: '45 Avenue des Champs-Élysées, Paris', joinDate: '2023-03-20', status: 'active' },
      { id: 'C003', name: 'Commerce ABC', email: 'contact@abc.fr', phone: '01 45 67 89 01', type: 'commercial', meters: 2, credit: 234.80, address: '88 Boulevard Haussmann, Paris', joinDate: '2022-11-05', status: 'active' },
      { id: 'C004', name: 'Industrie XYZ', email: 'admin@xyz.fr', phone: '01 56 78 90 12', type: 'industrial', meters: 5, credit: 1245.00, address: 'Zone Industrielle Nord, Lyon', joinDate: '2021-06-12', status: 'active' },
      { id: 'C005', name: 'Ibrahim Moussa', email: 'imoussa@niamey.ne', phone: '90 11 22 33', type: 'domestic', meters: 1, credit: 50.00, address: 'Quartier Plateau, Niamey', joinDate: '2024-01-10', status: 'active' },
      { id: 'C006', name: 'Hotel de Ville', email: 'contact@mairie-niamey.ne', phone: '88 77 66 55', type: 'commercial', meters: 3, credit: 5500.00, address: 'Centre Ville, Niamey', joinDate: '2020-05-15', status: 'active' }
    ];

    const insertCustomer = db.prepare(`
      INSERT INTO customers(id, name, email, phone, type, meters, credit, address, joinDate, status)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of seedCustomers) {
      await insertCustomer.run(c.id, c.name, c.email, c.phone, c.type, c.meters, c.credit, c.address, c.joinDate, c.status);
    }

  const seedMeters = [
    { id: '541-234-567', customerId: 'C001', location: 'Plateau - Niamey', type: 'domestic', credit: 45.20, status: 'online', lastUpdate: '2 min', power: 2.4, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-01-16', lat: 13.5350, lng: 2.1020, dcuId: 'DCU-Nord-01' },
    { id: '541-234-568', customerId: 'C002', location: 'Plateau - Niamey', type: 'domestic', credit: 12.50, status: 'warning', lastUpdate: '5 min', power: 1.8, voltage: 230, firmware: 'v2.4.1', installationDate: '2023-03-21', lat: 13.5380, lng: 2.1050, dcuId: 'DCU-Nord-01' },
    { id: '541-234-569', customerId: 'C003', location: 'Centre Ville', type: 'commercial', credit: 234.80, status: 'online', lastUpdate: '1 min', power: 8.5, voltage: 230, firmware: 'v2.5.0', installationDate: '2022-11-06', lat: 13.5150, lng: 2.1120, dcuId: 'DCU-Sud-02' },
    { id: '541-234-570', customerId: 'C004', location: 'Zone Industrielle', type: 'industrial', credit: 1245.00, status: 'online', lastUpdate: '30 sec', power: 45.2, voltage: 400, firmware: 'v2.5.0', installationDate: '2021-06-13', lat: 13.5250, lng: 2.1220, dcuId: 'DCU-Sud-02' },
    // New regional seed data for Tillabéri
    { id: '541-800-001', customerId: 'C005', location: 'Tillabéri Ville', type: 'domestic', credit: 10.00, status: 'offline', lastUpdate: '14h', power: 0, voltage: 0, firmware: 'v2.4.1', installationDate: '2024-01-01', lat: 14.2000, lng: 2.0800, dcuId: 'DCU-West-04' },
    { id: '541-800-002', customerId: 'C005', location: 'Sakoira - Tillabéri', type: 'domestic', credit: 85.00, status: 'online', lastUpdate: '3 min', power: 1.2, voltage: 228, firmware: 'v2.4.1', installationDate: '2024-01-05', lat: 14.2500, lng: 2.1000, dcuId: 'DCU-West-04' },
    // Zinder
    { id: '541-900-001', customerId: 'C006', location: 'Zinder Sabon Gari', type: 'commercial', credit: 500.00, status: 'online', lastUpdate: '1 min', power: 3.4, voltage: 225, firmware: 'v2.5.0', installationDate: '2024-02-10', lat: 13.8000, lng: 8.9800, dcuId: 'DCU-East-05' },
    // Agadez 
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
      INSERT INTO meters(id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, installationDate, lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation, latitude, longitude, dcuId)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of seedMeters) {
      await insertMeter.run(m.id, m.customerId, m.location, m.type, m.credit, m.status, m.lastUpdate, m.power, m.voltage, m.firmware, m.installationDate, 'installed', m.id, 'BATCH-LEGACY', 'Ancien Stock', '2022-01-01', 'N/A', m.lat, m.lng, m.dcuId);
    }
    
    for (const m of seedWarehouse) {
      await insertMeter.run(m.id, null, 'Magasin', 'domestic', 0, 'offline', 'N/A', 0, 0, 'v1.0.0', null, m.lifecycleStatus, m.serialNumber, m.batchId, m.supplier, m.purchaseDate, m.warehouseLocation, null, null, null);
    }

  const seedAlerts = [
    { id: 'A001', type: 'warning', title: 'Crédit faible détecté', message: 'Le compteur 541-234-568 dispose de moins de 5.00 kWh de crédit', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), status: 'unread' },
    { id: 'A002', type: 'danger', title: 'Crédit critique', message: 'Le compteur 541-234-571 dispose de seulement 0.50 kWh - Recharge urgente', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), status: 'unread' },
    { id: 'A003', type: 'success', title: 'Token généré avec succès', message: 'Recharge de 10.00 kWh effectuée pour le compteur 541-234-567', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), status: 'read' },
    { id: 'A004', type: 'info', title: 'Mise à jour tarifaire', message: 'Nouveau tarif domestique: 68.37 FCFA/kWh applicable dès demain', timestamp: new Date(Date.now() - 300 * 60000).toISOString(), status: 'read' }
  ];

    const insertAlert = db.prepare("INSERT INTO alerts (id, type, title, message, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)");
    for (const a of seedAlerts) {
      await insertAlert.run(a.id, a.type, a.title, a.message, a.timestamp, a.status);
    }

    const seedUsers = [
      { id: 'U001', username: 'admin', password: 'password123', role: 'admin', name: 'Administrateur', associatedCustomerId: null },
      { id: 'U002', username: 'vendor', password: 'password123', role: 'vendor', name: 'Kiosque Vente 1', associatedCustomerId: null },
      { id: 'U003', username: 'tech', password: 'password123', role: 'tech', name: 'Technicien Réseau', associatedCustomerId: null },
      { id: 'U004', username: 'jean', password: 'password123', role: 'customer', name: 'Jean Dupont', associatedCustomerId: 'C001' }
    ];

    const insertUser = db.prepare("INSERT INTO users (id, username, password, role, name, associatedCustomerId) VALUES (?, ?, ?, ?, ?, ?)");
    for (const u of seedUsers) {
      try {
        await insertUser.run(u.id, u.username, u.password, u.role, u.name, u.associatedCustomerId);
      } catch (err) {
        // Ignore if exists
      }
    }

    const seedSettings = [
      { key: 'sts_encryption_key', value: '••••••••••••••••' },
      { key: 'low_credit_threshold', value: '10' },
      { key: 'auto_validation', value: 'true' },
      { key: 'sms_verification', value: 'false' },
      { key: 'audit_log', value: 'true' }
    ];

    const insertSetting = db.prepare(`
      INSERT INTO settings(key, value)
  VALUES(?, ?)
    `);

    for (const s of seedSettings) {
      await insertSetting.run(s.key, s.value);
    }

  const getSvg = (name, symbolPath, isPrimary = false) => {
    const primaryColor = "#FF6B35"; // Orange NIGELEC
    const secondaryColor = "#00A651"; // Vert Niger
    const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor}"/>
          <stop offset="100%" style="stop-color:${secondaryColor}"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="46" fill="black" fill-opacity="0.6" stroke="url(#ringGrad)" stroke-width="3" filter="url(#glow)"/>
      <g stroke="white" stroke-width="2.5" fill="none" opacity="0.95" stroke-linecap="round" stroke-linejoin="round">
        ${symbolPath}
      </g>
      <text x="50" y="82" font-family="Arial" font-size="7" fill="white" font-weight="900" text-anchor="middle" letter-spacing="1">
        ${name.toUpperCase()}
      </text>
    </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  };

  const seedRegions = [
    { id: 'NIAMEY', superiorRegionId: null, areaName: 'Niamey', label: 1, principal: 'Abdoul Karim', contact: '90 12 34 56', email: 'niamey_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Niamey', '<path d="M30 60 L50 20 L70 60 Z M20 60 H80 M50 20 V60"/>') },
    { id: 'PLATEAU', superiorRegionId: 'NIAMEY', areaName: 'Niamey Plateau', label: 2, principal: 'Fatima Moussa', contact: '88 23 45 67', email: 'fmoussa@nigelec.ne', status: 'enabled', blazon: getSvg('Plateau', '<rect x="30" y="30" width="40" height="40" rx="4"/><path d="M30 50 H70 M50 30 V70" opacity="0.5"/>') },
    { id: 'YANTALA', superiorRegionId: 'NIAMEY', areaName: 'Niamey Yantala', label: 2, principal: 'Oumarou Ibrahim', contact: '96 34 56 78', email: 'oibrahim@nigelec.ne', status: 'enabled', blazon: getSvg('Yantala', '<circle cx="50" cy="50" r="20"/><path d="M35 35 L65 65 M65 35 L35 65" opacity="0.5"/>') },
    
    { id: 'AGADEZ', superiorRegionId: null, areaName: 'Agadez', label: 1, principal: 'Ifo El Moctar', contact: '90 00 11 22', email: 'agadez_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Agadez', '<path d="M50 15 L65 40 L50 65 L35 40 Z M50 65 L65 90 L50 115 L35 90 Z" transform="scale(0.7) translate(20, 15)"/>') },
    { id: 'DIFFA', superiorRegionId: null, areaName: 'Diffa', label: 1, principal: 'Moussa Mamane', contact: '90 33 44 55', email: 'diffa_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Diffa', '<path d="M20 50 Q50 20 80 50 T20 50 M30 50 Q50 40 70 50"/>') },
    { id: 'DOSSO', superiorRegionId: null, areaName: 'Dosso', label: 1, principal: 'Salifou Adamou', contact: '90 66 77 88', email: 'dosso_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Dosso', '<path d="M30 30 H70 V70 H30 Z M40 30 V20 M60 30 V20 M30 50 H70"/>') },
    { id: 'MARADI', superiorRegionId: null, areaName: 'Maradi', label: 1, principal: 'Sani Bello', contact: '91 45 67 89', email: 'maradi_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Maradi', '<path d="M30 45 L50 20 L70 45 L50 85 Z M40 45 H60"/>') },
    { id: 'TAHOUA', superiorRegionId: null, areaName: 'Tahoua', label: 1, principal: 'Issaka Mahamadou', contact: '90 99 88 77', email: 'tahoua_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Tahoua', '<circle cx="50" cy="40" r="15"/><path d="M30 70 Q50 45 70 70 M50 40 V55"/>') },
    { id: 'TILLABERI', superiorRegionId: null, areaName: 'Tillabéri', label: 1, principal: 'Souleymane Gado', contact: '90 22 44 66', email: 'tillaberi_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Tillaberi', '<path d="M20 60 H80 M30 50 L50 20 L70 50 Z M50 20 V60"/>') },
    { id: 'ZINDER', superiorRegionId: null, areaName: 'Zinder', label: 1, principal: 'Lawan Bachir', contact: '90 55 11 33', email: 'zinder_ops@nigelec.ne', status: 'enabled', blazon: getSvg('Zinder', '<path d="M25 40 H75 V70 H25 Z M50 20 L50 40 M35 40 L35 30 M65 40 L65 30"/>') },
  ];

  const insertRegion = db.prepare(`
    INSERT INTO regions(id, superiorRegionId, areaName, label, principal, contact, email, status, blazon)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const r of seedRegions) {
    await insertRegion.run(r.id, r.superiorRegionId, r.areaName, r.label, r.principal, r.contact, r.email, r.status, r.blazon);
  }

  const seedDCUs = [
    { id: 'DCU-Nord-01', name: 'Concentrateur Nord', regionId: 'NIAMEY', status: 'active', ipAddress: '10.0.1.5', macAddress: '00:1A:2B:3C:4D:5E', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 99.8, lat: 13.5350, lng: 2.1020, modemType: '4G', signal: 92, meters: 145 },
    { id: 'DCU-Sud-02', name: 'Concentrateur Sud', regionId: 'PLATEAU', status: 'active', ipAddress: '10.0.1.6', macAddress: '00:1A:2B:3C:4D:5F', firmware: 'v2.0', lastPing: new Date().toISOString(), performance: 98.5, lat: 13.5150, lng: 2.1120, modemType: 'GPRS', signal: 65, meters: 88 },
    { id: 'DCU-West-04', name: 'DCU Tillabéri Ouest', regionId: 'TILLABERI', status: 'active', ipAddress: '10.0.4.1', macAddress: '00:1A:2B:3C:4D:77', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 97.2, lat: 14.2000, lng: 2.0800, modemType: 'PLC-G3', signal: 88, meters: 240 },
    { id: 'DCU-East-05', name: 'DCU Zinder Centre', regionId: 'ZINDER', status: 'active', ipAddress: '10.0.5.1', macAddress: '00:1A:2B:3C:4D:88', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 96.5, lat: 13.8000, lng: 8.9800, modemType: 'LTE', signal: 75, meters: 310 },
    { id: 'DCU-North-06', name: 'DCU Agadez Nord', regionId: 'AGADEZ', status: 'active', ipAddress: '10.0.6.1', macAddress: '00:1A:2B:3C:4D:99', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 99.1, lat: 16.9700, lng: 7.9800, modemType: 'SATELLITE', signal: 95, meters: 120 }
  ];

  const insertDCU = db.prepare(`
    INSERT INTO dcus(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude, modemType, signalStrength, connectedMeters, cpuUsage, memUsage)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const d of seedDCUs) {
      await insertDCU.run(d.id, d.name, d.regionId, d.status, d.ipAddress, d.macAddress, d.firmware, d.lastPing, d.performance, d.lat, d.lng, d.modemType, d.signal, d.meters, 12.5, 38.4);
    }

  // Hash existing plain-text passwords (migration one-time)
  const allUsers = await db.prepare("SELECT id, password FROM users").all() as { id: string, password: string }[];
  for (const u of allUsers) {
    if (!u.password.startsWith('$2b$') && !u.password.startsWith('$2a$')) {
      const hashed = bcrypt.hashSync(u.password, BCRYPT_ROUNDS);
      await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, u.id);
    }
  }

  // Ensure specific users exist (with hashed passwords)
  const seedDefaultUsers = [
    { id: 'U001', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrateur', associatedCustomerId: null },
    { id: 'U002', username: 'vendor', password: 'vendor123', role: 'vendor', name: 'Kiosque Vente 1', associatedCustomerId: null },
    { id: 'U003', username: 'tech', password: 'tech123', role: 'tech', name: 'Technicien Réseau', associatedCustomerId: null },
    { id: 'U004', username: 'jean', password: 'password123', role: 'customer', name: 'Jean Dupont', associatedCustomerId: 'C001' }
  ];
  for (const u of seedDefaultUsers) {
    const existing = await db.prepare("SELECT id FROM users WHERE id = ?").get(u.id);
    if (!existing) {
      const hashed = bcrypt.hashSync(u.password, BCRYPT_ROUNDS);
      const sql = isEnterpriseMode 
        ? "INSERT INTO users (id, username, password, role, name, associatedCustomerId) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING"
        : "INSERT OR IGNORE INTO users (id, username, password, role, name, associatedCustomerId) VALUES (?, ?, ?, ?, ?, ?)";
      await db.prepare(sql).run(u.id, u.username, hashed, u.role, u.name, u.associatedCustomerId);
    }
  }

  const ruleCount = await db.prepare("SELECT COUNT(*) as count FROM alert_rules").get() as { count: number };
  if (ruleCount.count === 0) {
    const seedRules = [
      { id: 'R001', name: 'Fraude (Tamper)', condition: 'tamper', notifySms: 1, notifyEmail: 1, active: 1 },
      { id: 'R002', name: 'Crédit Bas', condition: 'low_credit', notifySms: 1, notifyEmail: 0, active: 1 },
      { id: 'R003', name: 'Déconnexion', condition: 'offline', notifySms: 0, notifyEmail: 1, active: 1 }
    ];
    const insertRule = db.prepare("INSERT INTO alert_rules (id, name, condition, notifySms, notifyEmail, active) VALUES (?, ?, ?, ?, ?, ?)");
    for (const r of seedRules) {
      await insertRule.run(r.id, r.name, r.condition, r.notifySms, r.notifyEmail, r.active);
    }
  } // fin if customerCount

  // =======================================================
  // SYNCHRONISATION TARIFAIRE NIGELEC — exécutée à chaque
  // démarrage du serveur pour garantir la conformité
  // =======================================================
  console.log('[NIGELEC] Synchronisation de la grille tarifaire officielle...');

  const NIGELEC_TARIFFS_ALWAYS = [
    {
      id: 'social', name: 'Tranche Sociale (TS)', rate: 59.43,
      description: 'Tarif subventionné NIGELEC — Puissance ≤ 2,2 kW — Plafond 50 kWh/mois — Exonération TVA et Taxe Habitat.',
      fixedMonthlyFee: 0, taxRate: 0,
      tiers: JSON.stringify([
        { id: 'ts-t1', minKwh: 0, maxKwh: 50, rate: 59.43, primeFixe: 0, taxeHabitat: 0, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 0 }
      ])
    },
    {
      id: 'domestic', name: 'Domestique BT (BT-D)', rate: 79.25,
      description: 'Résidentiel BT — Puissance 3 à 6 kW — Prime fixe 1 278 FCFA/mois — Taxe Habitat 100 FCFA — 4 paliers progressifs.',
      fixedMonthlyFee: 1278, taxRate: 19,
      tiers: JSON.stringify([
        { id: 'btd-t1', minKwh: 0,   maxKwh: 50,   rate: 59.45,  primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19 },
        { id: 'btd-t2', minKwh: 51,  maxKwh: 250,  rate: 79.25,  primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19 },
        { id: 'btd-t3', minKwh: 251, maxKwh: 500,  rate: 94.13,  primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19 },
        { id: 'btd-t4', minKwh: 501, maxKwh: null, rate: 120.35, primeFixe: 1278, taxeHabitat: 100, taxeORNT: 3, taxeMunicipale: 2, redevance: 250, vatRate: 19 }
      ])
    },
    {
      id: 'commercial', name: 'Professionnel / Commercial BT (BT-P)', rate: 98.50,
      description: 'Professionnel BT — Puissance ≥ 6 kW — Prime fixe 2 557 FCFA/mois — Taxe Habitat 200 FCFA — 2 paliers.',
      fixedMonthlyFee: 2557, taxRate: 19,
      tiers: JSON.stringify([
        { id: 'btp-t1', minKwh: 0,   maxKwh: 500,  rate: 98.50,  primeFixe: 2557, taxeHabitat: 200, taxeORNT: 3, taxeMunicipale: 2, redevance: 500, vatRate: 19 },
        { id: 'btp-t2', minKwh: 501, maxKwh: null, rate: 115.75, primeFixe: 2557, taxeHabitat: 200, taxeORNT: 3, taxeMunicipale: 2, redevance: 500, vatRate: 19 }
      ])
    },
    {
      id: 'industrial', name: 'Industriel / Moyenne Tension (MT-G)', rate: 89.19,
      description: 'Moyenne Tension — Puissance ≥ 36 kVA — Poste privé — Prime fixe 6 151 FCFA/mois — Taxe Habitat 500 FCFA.',
      fixedMonthlyFee: 6151, taxRate: 19,
      tiers: JSON.stringify([
        { id: 'mtg-t1', minKwh: 0, maxKwh: null, rate: 89.19, primeFixe: 6151, taxeHabitat: 500, taxeORNT: 3, taxeMunicipale: 2, redevance: 0, vatRate: 19 }
      ])
    },
    {
      id: 'haute_tension', name: 'Haute Tension (HT) — Grands Comptes', rate: 68.50,
      description: 'HT — Puissance > 1 000 kVA — Mines, cimenteries — Prime indicative 45 000 FCFA/mois — Contrat sur mesure.',
      fixedMonthlyFee: 45000, taxRate: 19,
      tiers: JSON.stringify([
        { id: 'ht-t1', minKwh: 0, maxKwh: null, rate: 68.50, primeFixe: 45000, taxeHabitat: 0, taxeORNT: 3, taxeMunicipale: 0, redevance: 0, vatRate: 19 }
      ])
    },
    {
      id: 'eclairage_public', name: 'Éclairage Public (EP)', rate: 75.00,
      description: 'EP — Communes et collectivités — 500 FCFA/point lumineux/mois — TVA 19%.',
      fixedMonthlyFee: 500, taxRate: 19,
      tiers: JSON.stringify([
        { id: 'ep-t1', minKwh: 0, maxKwh: null, rate: 75.00, primeFixe: 500, taxeHabitat: 0, taxeORNT: 3, taxeMunicipale: 2, redevance: 0, vatRate: 19 }
      ])
    }
  ];

  const _insertTariff = db.prepare(`INSERT INTO tariffs(id, name, rate, description, tiers, fixedMonthlyFee, taxRate) VALUES(?, ?, ?, ?, ?, ?, ?)`);
  for (const t of NIGELEC_TARIFFS_ALWAYS) {
    const ex = await db.prepare("SELECT id FROM tariffs WHERE id = ?").get(t.id) as any;
    if (!ex) {
      await _insertTariff.run(t.id, t.name, t.rate, t.description, t.tiers, t.fixedMonthlyFee, t.taxRate);
    } else {
      await db.prepare(`UPDATE tariffs SET name=?, rate=?, description=?, tiers=?, fixedMonthlyFee=?, taxRate=? WHERE id=?`)
        .run(t.name, t.rate, t.description, t.tiers, t.fixedMonthlyFee, t.taxRate, t.id);
    }
  }
  console.log('[NIGELEC] Grille tarifaire synchronisée: ' + NIGELEC_TARIFFS_ALWAYS.length + ' segments.');
}

// Initialisation au démarrage
initDb().catch(e => console.error("[DB] Erreur lors de l'initialisation:", e));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // Generate JWT token (8h)
    const tokenPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return user without password
    const { password: _pw, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: accessToken });
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.path === '/login' || req.originalUrl === '/api/login') return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Accès refusé - Authentification requise' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Token invalide ou expiré - Reconnectez-vous' });
    }
  };


  app.use('/api', requireAuth);

  // API Routes
  app.get("/api/customers", async (req, res) => {
    const customers = await db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const { id, name, email, phone, type, meters, credit, address, joinDate, status } = req.body;
      const stmt = db.prepare(`
        INSERT INTO customers(id, name, email, phone, type, meters, credit, address, joinDate, status)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
      await stmt.run(id, name, email, phone, type, meters || 0, credit || 0, address, joinDate, status || 'active');
      res.status(201).json({ id });
    } catch (err: any) {
      console.error("Customer creation failed:", err);
      res.status(400).json({ success: false, message: err.message || "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { name, email, phone, type, address, status } = req.body;
      await db.prepare(`
        UPDATE customers SET name = ?, email = ?, phone = ?, type = ?, address = ?, status = ?
  WHERE id = ?
    `).run(name, email, phone, type, address, status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Customer update failed:", err);
      res.status(400).json({ success: false, message: err.message || "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    await db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/meters", async (req, res) => {
    const meters = await db.prepare("SELECT * FROM meters").all();
    res.json(meters);
  });

  app.post("/api/meters", async (req, res) => {
    const {
      id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware,
      installationDate, subscribedPower, paymentMode, tamperStatus, protocol, ipAddress, macAddress,
      lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation,
      touEnabled, solarInjection, mlFraudScore, latitude, longitude, dcuId
    } = req.body;

    const sql = isEnterpriseMode 
      ? `INSERT INTO meters(
        id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, 
        installationDate, subscribedPower, paymentMode, tamperStatus, protocol, ipAddress, macAddress,
        lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation,
        touEnabled, solarInjection, mlFraudScore, latitude, longitude, dcuId
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`
      : `INSERT INTO meters(
        id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, 
        installationDate, subscribedPower, paymentMode, tamperStatus, protocol, ipAddress, macAddress,
        lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation,
        touEnabled, solarInjection, mlFraudScore, latitude, longitude, dcuId
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const stmt = db.prepare(sql);

    await stmt.run(
      id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware,
      installationDate, subscribedPower || 9.0, paymentMode || 'prepaid', tamperStatus || 'clear', protocol || 'DLMS/COSEM', ipAddress || null, macAddress || null,
      lifecycleStatus || 'installed', serialNumber || id, batchId || 'STD', supplier || 'N/A', purchaseDate || null, warehouseLocation || 'N/A',
      touEnabled ? 1 : 0, solarInjection || 0, mlFraudScore || 0, latitude || null, longitude || null, dcuId || null
    );
    res.status(201).json({ id });
  });

  app.put("/api/meters/:id", async (req, res) => {
    const {
      customerId, location, type, credit, status, lastUpdate, power, voltage, firmware,
      subscribedPower, paymentMode, tamperStatus, protocol, ipAddress, macAddress,
      lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation,
      touEnabled, solarInjection, mlFraudScore, latitude, longitude, dcuId
    } = req.body;

    // Auto-update lifecycle if customer assigned
    const finalStatus = customerId ? 'installed' : (lifecycleStatus || 'in_stock');

    const stmt = db.prepare(`
      UPDATE meters SET 
        customerId = ?, location = ?, type = ?, credit = ?, status = ?, lastUpdate = ?, 
        power = ?, voltage = ?, firmware = ?, subscribedPower = ?, paymentMode = ?, 
        tamperStatus = ?, protocol = ?, ipAddress = ?, macAddress = ?,
        lifecycleStatus = ?, serialNumber = ?, batchId = ?, supplier = ?, 
        purchaseDate = ?, warehouseLocation = ?,
        touEnabled = ?, solarInjection = ?, mlFraudScore = ?,
        latitude = ?, longitude = ?, dcuId = ?
      WHERE id = ?
    `);

    await stmt.run(
      customerId, location, type, credit, status, lastUpdate, power, voltage, firmware,
      subscribedPower, paymentMode, tamperStatus, protocol, ipAddress, macAddress,
      finalStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation,
      touEnabled ? 1 : 0, solarInjection || 0, mlFraudScore || 0,
      latitude || null, longitude || null, dcuId || null,
      req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/meters/:id", async (req, res) => {
    await db.prepare("DELETE FROM meters WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  /**
   * Endpoint pour recevoir les événements bruts des compteurs (Simulation HES/IoT)
   */
  app.post("/api/meters/:id/events", async (req, res) => {
    const { id } = req.params;
    const { code, timestamp, value } = req.body;

    try {
      // 1. Identifier le fabricant via la DB
      const meter = await db.prepare("SELECT supplier FROM meters WHERE id = ?").get(id) as any;
      if (!meter) {
        return res.status(404).json({ success: false, message: "Compteur non trouvé" });
      }

      // 2. Sélectionner le driver approprié
      const supplierName = meter.supplier || 'Default';
      const driver = MeterDriverRegistry[supplierName] || MeterDriverRegistry['Default'];

      // 3. Parser l'événement
      const alertData = driver.parseEvent(id, { code, timestamp: timestamp || new Date().toISOString(), value });

      // 4. Déclencher l'alerte plateforme (avec notification si critique)
      const alertId = await triggerAlert(
        alertData.type,
        alertData.title,
        alertData.message,
        id,
        alertData.priority
      );

      res.json({ 
        success: true, 
        processedBy: supplierName, 
        alertId,
        impact: alertData.priority 
      });

    } catch (err: any) {
      console.error("Meter event processing failed:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/tokens", async (req, res) => {
    const tokens = await db.prepare("SELECT * FROM tokens ORDER BY timestamp DESC").all();
    res.json(tokens);
  });

  app.get("/api/alerts", async (req, res) => {
    const alerts = await db.prepare("SELECT * FROM alerts ORDER BY timestamp DESC").all();
    res.json(alerts);
  });

  app.put("/api/meters/:id/lifecycle", async (req, res) => {
    try {
      const { status } = req.body;
      await db.prepare("UPDATE meters SET lifecycleStatus = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const { type, title, message, meterId, priority, category } = req.body;
      const id = await triggerAlert(type, title, message, meterId, priority, category);
      res.status(201).json({ success: true, id });
    } catch (err: any) {
      console.error("Alert creation failed:", err);
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    const notifications = await db.prepare("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 100").all();
    res.json(notifications);
  });

  app.get("/api/audits", async (req, res) => {
    const audits = await db.prepare("SELECT * FROM audits ORDER BY timestamp DESC LIMIT 200").all();
    res.json(audits);
  });

  app.post("/api/audits", async (req, res) => {
    let { id, action, details, user, timestamp } = req.body;
    id = id || `AUDIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    timestamp = timestamp || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audits(id, action, details, user, timestamp)
      VALUES(?, ?, ?, ?, ?)
    `);
    await stmt.run(id, action, details, user, timestamp);
    res.status(201).json({ id });
  });


  app.put("/api/alerts/:id/read", async (req, res) => {
    await db.prepare("UPDATE alerts SET status = 'read' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    await db.prepare("DELETE FROM alerts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/tariffs", async (req, res) => {
    const tariffs = await db.prepare("SELECT * FROM tariffs").all();
    res.json(tariffs);
  });

  app.put("/api/tariffs/:id", async (req, res) => {
    const { name, rate, description, tiers, isTou, touRates, fixedMonthlyFee, taxRate, currency } = req.body;
    await db.prepare(`
      UPDATE tariffs 
      SET name = ?, rate = ?, description = ?, tiers = ?, isTou = ?, touRates = ?, fixedMonthlyFee = ?, taxRate = ?, currency = ? 
      WHERE id = ?
    `).run(
      name, rate, description, JSON.stringify(tiers || []), isTou ? 1 : 0, 
      JSON.stringify(touRates || []), fixedMonthlyFee || 0, taxRate || 0, currency || 'FCFA', 
      req.params.id
    );
    res.json({ success: true });
  });

  app.post("/api/tariffs", async (req, res) => {
    const { id, name, rate, description, tiers, isTou, touRates, fixedMonthlyFee, taxRate, currency } = req.body;
    await db.prepare(`
      INSERT INTO tariffs (id, name, rate, description, tiers, isTou, touRates, fixedMonthlyFee, taxRate, currency) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, rate, description, JSON.stringify(tiers || []), isTou ? 1 : 0, 
      JSON.stringify(touRates || []), fixedMonthlyFee || 0, taxRate || 0, currency || 'FCFA'
    );
    res.json({ success: true });
  });

  app.delete("/api/tariffs/:id", async (req, res) => {
    await db.prepare("DELETE FROM tariffs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", async (req, res) => {
    const settings = await db.prepare("SELECT * FROM settings").all();
    res.json(settings);
  });

  // --- REGIONS ENDPOINTS ---
  app.get('/api/regions', async (req, res) => {
    const regions = await db.prepare("SELECT * FROM regions").all();
    res.json(regions);
  });

  // --- DCUS ENDPOINTS ---
  app.get('/api/dcus', async (req, res) => {
    try {
      const dcus = await db.prepare("SELECT * FROM dcus").all();
      res.json(dcus);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch DCUs' });
    }
  });

  app.post('/api/dcus', async (req, res) => {
    const { id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude } = req.body;
    try {
      const sql = isEnterpriseMode 
        ? "INSERT INTO dcus(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)"
        : "INSERT INTO dcus(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      
      await db.prepare(sql).run(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude || null, longitude || null);
      res.status(201).json({ message: 'DCU created' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create DCU' });
    }
  });

  app.put('/api/dcus/:id', async (req, res) => {
    const { name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude } = req.body;
    try {
      await db.prepare(`
        UPDATE dcus SET name = ?, regionId = ?, status = ?, ipAddress = ?, macAddress = ?, firmware = ?, lastPing = ?, performance = ?, latitude = ?, longitude = ?
        WHERE id = ?
      `).run(name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude || null, longitude || null, req.params.id);
      res.json({ message: 'DCU updated' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update DCU' });
    }
  });

  app.delete('/api/dcus/:id', async (req, res) => {
    try {
      await db.prepare("DELETE FROM dcus WHERE id = ?").run(req.params.id);
      res.json({ message: 'DCU deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete DCU' });
    }
  });

  app.post("/api/regions", async (req, res) => {
    const { id, superiorRegionId, areaName, label, principal, contact, email, status } = req.body;
    const stmt = db.prepare(`
      INSERT INTO regions(id, superiorRegionId, areaName, label, principal, contact, email, status)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);
    await stmt.run(id, superiorRegionId || null, areaName, label, principal, contact, email, status);
    res.status(201).json({ id });
  });

  app.put("/api/regions/:id", async (req, res) => {
    const { superiorRegionId, areaName, label, principal, contact, email, status } = req.body;
    const stmt = db.prepare(`
      UPDATE regions SET superiorRegionId = ?, areaName = ?, label = ?, principal = ?, contact = ?, email = ?, status = ?
  WHERE id = ?
    `);
    await stmt.run(superiorRegionId || null, areaName, label, principal, contact, email, status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/regions/:id", async (req, res) => {
    await db.prepare("DELETE FROM regions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.put("/api/settings", async (req, res) => {
    const settings = req.body; 
    const isPG = isEnterpriseMode;
    const sql = isPG ? "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value" : "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    for (const [key, value] of Object.entries(settings)) {
      await stmt.run(key, String(value));
    }
    res.json({ success: true });
  });

  app.post("/api/tokens", async (req, res) => {
    const { id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type } = req.body;
    const stmt = db.prepare(`
      INSERT INTO tokens(id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await stmt.run(id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type);

    // Update meter credit if it's a recharge (Use kWh instead of amount)
    if (type === 'recharge') {
      await db.prepare("UPDATE meters SET credit = credit + ? WHERE id = ?").run(kwh, meterId);
    } else if (type === 'clear-credit') {
      await db.prepare("UPDATE meters SET credit = 0 WHERE id = ?").run(meterId);
    } else if (type === 'clear-tamper') {
      await db.prepare("UPDATE meters SET tamperStatus = 'clear' WHERE id = ?").run(meterId);
    } else if (type === 'payment-mode') {
      await db.prepare("UPDATE meters SET paymentMode = CASE WHEN paymentMode = 'prepaid' THEN 'postpaid' ELSE 'prepaid' END WHERE id = ?").run(meterId);
    }

    res.status(201).json({ id });
  });

  app.get("/api/invoices", async (req, res) => {
    const invoices = await db.prepare("SELECT * FROM invoices ORDER BY timestamp DESC").all();
    res.json(invoices);
  });

  app.post("/api/billing/run", async (req, res) => {
    const meters = await db.prepare("SELECT * FROM meters WHERE paymentMode = 'postpaid'").all() as any[];
    const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    let createdCount = 0;

    // Load tariffs for calculation
    const tariffs = await db.prepare("SELECT * FROM tariffs").all() as any[];
    const tariffMap = tariffs.reduce((acc, t) => {
      acc[t.id] = { ...t, tiers: JSON.parse(t.tiers) };
      return acc;
    }, {} as any);

    for (const m of meters) {
      const consumption = await db.prepare("SELECT SUM(consumption) as total FROM interval_data WHERE meterId = ?").get(m.id) as any;
      const totalKwh = consumption?.total || 0;

      if (totalKwh > 0) {
        const tariff = tariffMap[m.type] || Object.values(tariffMap)[0];
        const tiers = tariff ? tariff.tiers : [];

        let totalHT = 0;
        let remainingKwh = totalKwh;

        if (tiers && tiers.length > 0) {
          for (const tier of tiers) {
            const tierMax = tier.maxKwh || Infinity;
            const tierMin = tier.minKwh || 0;
            const tierCapacity = (tierMax === Infinity) ? Infinity : (tierMax - tierMin);

            if (remainingKwh <= tierCapacity) {
              totalHT += remainingKwh * tier.rate;
              remainingKwh = 0;
              break;
            } else {
              totalHT += tierCapacity * tier.rate;
              remainingKwh -= tierCapacity;
            }
          }
        } else {
          totalHT = totalKwh * (tariff ? tariff.rate : 50);
        }

        const baseRedevance = tiers && tiers[0] ? Number(tiers[0].redevance || 0) : 0;
        const basePrime = tiers && tiers[0] ? Number(tiers[0].primeFixe || 0) : 0;
        const taxeHabitat = tiers && tiers[0] ? Number(tiers[0].taxeHabitat || 0) : 0;

        const subtotal = totalHT + baseRedevance + basePrime;
        const tva = +(subtotal * 0.19).toFixed(2); // Niger TVA 19%
        const totalTTC = +(subtotal + tva + taxeHabitat).toFixed(2);

        const invoiceId = `FAC-${currentMonth.substring(0, 3).toUpperCase()}-${m.id.substring(0, 4)}-${Math.random().toString(36).substr(2, 4)}`;

        const sql = isEnterpriseMode 
          ? "INSERT INTO invoices(id, customerId, meterId, month, kwhConsumed, amountHT, tva, totalTTC, status, dueDate, timestamp) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING"
          : "INSERT OR IGNORE INTO invoices(id, customerId, meterId, month, kwhConsumed, amountHT, tva, totalTTC, status, dueDate, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        const stmt = db.prepare(sql);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        await stmt.run(invoiceId, m.customerId, m.id, currentMonth, totalKwh, subtotal, tva, totalTTC, 'unpaid', dueDate.toISOString(), new Date().toISOString());
        createdCount++;
      }
    }

    res.json({ success: true, message: `${createdCount} factures générées pour ${currentMonth} ` });
  });

  app.post("/api/invoices/pay-all", async (req, res) => {
    const unpaidInvoices = await db.prepare("SELECT * FROM invoices WHERE status = 'unpaid'").all() as any[];
    let paidCount = 0;
    const operator = 'Orange Money';
    const timestamp = new Date().toISOString();

    const updateInvoiceStmt = db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?");
    const insertPaymentStmt = db.prepare(`
      INSERT INTO payments(id, amount, operator, phone, meterId, status, timestamp)
VALUES(?, ?, ?, ?, ?, 'Success', ?)
    `);

    for (const inv of unpaidInvoices) {
      await updateInvoiceStmt.run(inv.id);
      const paymentId = `PAY-MASS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      await insertPaymentStmt.run(paymentId, inv.totalTTC, operator, '99999999', inv.meterId, timestamp);
      paidCount++;
    }

    res.json({ success: true, message: `${paidCount} factures payées en masse via ${operator}.` });
  });

  app.put("/api/invoices/:id/pay", async (req, res) => {
    const { operator, phone } = req.body;
    const invoiceId = req.params.id;

    // Simulation de délai Mobile Money Gateway
    (async () => {
      try {
        await new Promise(r => setTimeout(r, 1000));
        await db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(invoiceId);

        // Log payment
        const paymentId = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await db.prepare(`
          INSERT INTO payments(id, amount, operator, phone, meterId, status, timestamp)
          SELECT ?, totalTTC, ?, ?, meterId, 'Success', ? FROM invoices WHERE id = ?
        `).run(paymentId, operator || 'Orange', phone || '00000000', new Date().toISOString(), invoiceId);
      } catch (err) {
        console.error("Delayed payment process failed:", err);
      }
    })();

    res.json({ success: true, message: 'Paiement en cours de traitement via gateway...' });
  });

  // Ticket APIs
  app.get("/api/tickets", async (req, res) => {
    const tickets = await db.prepare("SELECT * FROM tickets ORDER BY timestamp DESC").all();
    res.json(tickets);
  });

  app.post("/api/tickets", async (req, res) => {
    const { id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp } = req.body;
    const stmt = db.prepare(`
      INSERT INTO tickets(id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    await stmt.run(id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp);
    res.status(201).json({ id });
  });

  app.put("/api/tickets/:id", async (req, res) => {
    const { subject, description, priority, status, assignedTo } = req.body;
    await db.prepare(`
      UPDATE tickets 
      SET subject = COALESCE(?, subject),
  description = COALESCE(?, description),
  priority = COALESCE(?, priority),
  status = COALESCE(?, status),
  assignedTo = COALESCE(?, assignedTo)
      WHERE id = ?
  `).run(subject, description, priority, status, assignedTo, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    await db.prepare("DELETE FROM tickets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Payment APIs
  app.get("/api/payments", async (req, res) => {
    const payments = await db.prepare("SELECT * FROM payments ORDER BY timestamp DESC").all();
    res.json(payments);
  });

  app.post("/api/payments", async (req, res) => {
    const { id, amount, operator, phone, meterId, tokenId, status, timestamp } = req.body;
    const stmt = db.prepare(`
      INSERT INTO payments(id, amount, operator, phone, meterId, tokenId, status, timestamp)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `);
    await stmt.run(id, amount, operator, phone, meterId, tokenId, status, timestamp);
    res.status(201).json({ id });
  });

  // Alert Rules APIs
  app.get("/api/alert_rules", async (req, res) => {
    const rules = await db.prepare("SELECT * FROM alert_rules").all();
    res.json(rules.map((r: any) => ({
      ...r,
      notifySms: !!r.notifySms,
      notifyEmail: !!r.notifyEmail,
      active: !!r.active
    })));
  });

  app.put("/api/alert_rules/:id", async (req, res) => {
    const { notifySms, notifyEmail, active } = req.body;
    await db.prepare("UPDATE alert_rules SET notifySms = ?, notifyEmail = ?, active = ? WHERE id = ?").run(notifySms ? 1 : 0, notifyEmail ? 1 : 0, active ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/meters/:id/communication", async (req, res) => {
    const { protocol, ipAddress, macAddress } = req.body;
    await db.prepare("UPDATE meters SET protocol = ?, ipAddress = ?, macAddress = ? WHERE id = ?").run(protocol, ipAddress, macAddress, req.params.id);
    res.json({ success: true });
  });

  // User APIs
  app.get("/api/users", async (req, res) => {
    const users = await db.prepare("SELECT id, username, role, name, associatedCustomerId FROM users").all();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    const { id, username, password, role, name, associatedCustomerId } = req.body;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const stmt = db.prepare(`
      INSERT INTO users(id, username, password, role, name, associatedCustomerId)
VALUES(?, ?, ?, ?, ?, ?)
    `);
    await stmt.run(id, username, hashedPassword, role, name, associatedCustomerId || null);
    res.status(201).json({ id });
  });

  app.put("/api/users/:id", async (req, res) => {
    const { username, password, role, name, associatedCustomerId } = req.body;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db.prepare(`UPDATE users SET username = ?, password = ?, role = ?, name = ?, associatedCustomerId = ? WHERE id = ? `)
        .run(username, hashedPassword, role, name, associatedCustomerId || null, req.params.id);
    } else {
      await db.prepare(`UPDATE users SET username = ?, role = ?, name = ?, associatedCustomerId = ? WHERE id = ? `)
        .run(username, role, name, associatedCustomerId || null, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id", async (req, res) => {
    await db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // MDMS APIs
  app.get("/api/interval_data", async (req, res) => {
    const intervals = await db.prepare("SELECT * FROM interval_data ORDER BY timestamp DESC LIMIT 300").all();
    res.json(intervals);
  });

  app.get("/api/meters/:id/intervals", async (req, res) => {
    const intervals = await db.prepare("SELECT * FROM interval_data WHERE meterId = ? ORDER BY timestamp DESC LIMIT 100").all(req.params.id);
    res.json(intervals);
  });

  app.get("/api/mdms/stats", async (req, res) => {
    const totalReadings = await db.prepare("SELECT COUNT(*) as count FROM interval_data").get() as any;
    const validationStats = await db.prepare("SELECT status, COUNT(*) as count FROM interval_data GROUP BY status").all();
    const peakConsumption = await db.prepare("SELECT MAX(consumption) as peak FROM interval_data").get() as any;

    res.json({
      totalReadings: totalReadings.count,
      validationStats,
      peakConsumption: peakConsumption.peak
    });
  });

  app.get("/api/analytics/trends", async (req, res) => {
    // Get last 30 days consumption trends per day
    const sql = isEnterpriseMode 
      ? `SELECT to_char(timestamp::timestamp, 'DD/MM') as name, SUM(consumption) as val 
         FROM interval_data 
         WHERE timestamp::timestamp > CURRENT_DATE - INTERVAL '30 days' 
         GROUP BY name ORDER BY name ASC`
      : `SELECT strftime('%d/%m', timestamp) as name, SUM(consumption) as val
         FROM interval_data
         WHERE timestamp > date('now', '-30 days')
         GROUP BY name
         ORDER BY timestamp ASC`;
    
    const trends = await db.prepare(sql).all();
    res.json(trends);
  });

  app.get("/api/analytics/distribution", async (req, res) => {
    const distribution = await db.prepare(`
      SELECT r.areaName as name, COUNT(DISTINCT c.id) as value
      FROM regions r
      JOIN dcus d ON r.id = d.regionId
      JOIN meters m ON d.id = m.dcuId
      JOIN customers c ON m.customerId = c.id
      GROUP BY r.areaName
    `).all();
    res.json(distribution);
  });

  app.get("/api/analytics/energy-balance", async (req, res) => {
    const sqlMetered = isEnterpriseMode 
      ? `SELECT r.id as regionId, r.areaName, SUM(id.consumption) as meteredKwh
         FROM regions r
         JOIN dcus d ON r.id = d.regionId
         JOIN meters m ON d.id = m.dcuId
         JOIN interval_data id ON m.id = id.meterId
         WHERE id.timestamp::timestamp > CURRENT_DATE - INTERVAL '30 days'
         GROUP BY r.id, r.areaName`
      : `SELECT r.id as regionId, r.areaName, SUM(id.consumption) as meteredKwh
         FROM regions r
         JOIN dcus d ON r.id = d.regionId
         JOIN meters m ON d.id = m.dcuId
         JOIN interval_data id ON m.id = id.meterId
         WHERE id.timestamp > date('now', '-30 days')
         GROUP BY r.id, r.areaName`;

    let metered = await db.prepare(sqlMetered).all() as any[];

    if (metered.length === 0) {
      metered = await db.prepare(`
        SELECT r.id as regionId, r.areaName, (COUNT(m.id) * 150) as meteredKwh
        FROM regions r
        JOIN dcus d ON r.id = d.regionId
        JOIN meters m ON d.id = m.dcuId
        GROUP BY r.id, r.areaName
      `).all() as any[];
    }

    const balance = metered.map(row => {
      const isNiamey = row.areaName.toLowerCase().includes('niamey');
      const baseLoss = isNiamey ? 0.08 : 0.15;
      const fraudVariance = Math.random() * 0.12;
      const lossFactor = baseLoss + fraudVariance;
      const injected = row.meteredKwh / (1 - lossFactor);
      const losses = injected - row.meteredKwh;

      return {
        id: `EB-${row.regionId}-${Date.now()}`,
        regionId: row.regionId,
        areaName: row.areaName,
        injectedKwh: +injected.toFixed(2),
        meteredKwh: +row.meteredKwh.toFixed(2),
        lossesKwh: +losses.toFixed(2),
        lossPercentage: +(lossFactor * 100).toFixed(1),
        timestamp: new Date().toISOString()
      };
    });

    res.json(balance);
  });

  app.post("/api/mdms/simulate-mass", async (req, res) => {
    const { count = 96 } = req.body;
    const startTime = Date.now();

    try {
      await simulateMDMS(count);
      const duration = Date.now() - startTime;
      res.json({
        success: true,
        message: `Simulation terminée: ${count} lectures par compteur traitées.`,
        durationMs: duration
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Tickets Support APIs
  app.get("/api/tickets", (req, res) => {
    const tickets = db.prepare("SELECT * FROM tickets ORDER BY timestamp DESC").all();
    res.json(tickets);
  });

  app.post("/api/tickets", (req, res) => {
    const { id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp } = req.body;
    const stmt = db.prepare(`
      INSERT INTO tickets(id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, subject, description, customerId || null, meterId || null, status, priority, assignedTo || null, timestamp);
    res.status(201).json({ id });
  });

  app.put("/api/tickets/:id", (req, res) => {
    const { subject, description, status, priority, assignedTo } = req.body;
    const stmt = db.prepare(`
      UPDATE tickets SET subject = ?, description = ?, status = ?, priority = ?, assignedTo = ?
  WHERE id = ?
    `);
    stmt.run(subject, description, status, priority, assignedTo, req.params.id);
    res.json({ success: true });
  });

  // MDMS Simulation & VEE Logic
  const simulateMDMS = async (countValue = 1) => {
    const meters = await db.prepare("SELECT id FROM meters").all() as { id: string }[];
    const now = Date.now();

    const sqlInsert = isEnterpriseMode 
      ? "INSERT INTO interval_data(id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status, validationNotes) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING"
      : "INSERT OR IGNORE INTO interval_data(id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status, validationNotes) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const stmt = db.prepare(sqlInsert);

    for (const m of meters) {
      for (let i = 0; i < countValue; i++) {
        const intervalTime = new Date(now - i * 900000);
        const consumption = +(Math.random() * 2.4 + 0.1).toFixed(3);
        const voltage = +(210 + Math.random() * 35).toFixed(1);
        const current = +(consumption * 1000 / voltage).toFixed(2);
        const powerFactor = +(0.85 + Math.random() * 0.14).toFixed(2);

        let status = 'valid';
        let notes = '';

        if (voltage < 200 || voltage > 250) {
          status = 'invalid';
          notes = 'Voltage out of range';
          if (voltage > 260 && Math.random() < 0.1) {
            await triggerAlert('warning', 'Surtension Critique', `Surtension de ${voltage}V détectée sur le compteur ${m.id}. Risque pour les équipements.`, m.id, 'Haute');
          }
        }

        if (Math.random() < 0.08) {
          status = 'estimated';
          notes = 'Gap Filling: Interpolation linéaire appliquée';
          await db.prepare("INSERT INTO audits(id, action, details, user, timestamp) VALUES(?, ?, ?, ?, ?)")
            .run(`VEE_GAP_FILL_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`, 'MDMS_ESTIMATION', `Estimation de donnée pour le compteur ${m.id}`, 'SYSTEM_VEE', new Date().toISOString());
        }

        if (Math.random() < 0.001) {
          await triggerAlert('danger', 'FRAUDE DÉTECTÉE', `Ouverture de capot détectée sur ${m.id}.`, m.id, 'Critique');
          await db.prepare("UPDATE meters SET tamperStatus = 'tampered' WHERE id = ?").run(m.id);
        }

        const intId = `INT-${intervalTime.getTime()}-${m.id}`;
        await stmt.run(intId, m.id, intervalTime.toISOString(), 0, consumption, voltage, current, powerFactor, status, notes);
      }
    }
    console.log(`[MDMS] Processed ${meters.length * countValue} reading(s).`);
  };

  // Run simulation every minute
  setInterval(async () => {
    try { await simulateMDMS(1); } catch(e) {}
  }, 60000);

  // Seed historical data
  const dataCount = await db.prepare("SELECT COUNT(*) as count FROM interval_data").get() as any;
  if (dataCount?.count === 0) {
    console.log("[MDMS] Seeding historical data...");
    await simulateMDMS(96);
  }

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
