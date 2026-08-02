import express from "express";
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';
const JWT_EXPIRES_IN = '1h';
const BCRYPT_ROUNDS = 10;

const isEnterpriseMode = process.env.DB_TYPE === 'postgres';

import { db } from './server/db';
import apiRouter from './server/routes/api.routes';
import { requireAuth } from './server/middleware/auth';
import { stsService } from './server/services/sts.service';
import { PaymentRepository } from './server/repositories';

// Initialize Database Function
async function initDb() {
  await db.initSchema();

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

  // Centralized index verification
  try {
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assignedTo);
      CREATE INDEX IF NOT EXISTS idx_tokens_meter ON tokens(meterId);
    `);
  } catch (e) {}

  // Migrate records
  try { await db.exec("UPDATE meters SET transformerId = dcuId WHERE transformerId IS NULL"); } catch (e) { }
  try { await db.exec("UPDATE customers SET regionId = 'PLATEAU' WHERE id IN ('C001', 'C002') AND regionId IS NULL"); } catch (e) { }
  try { await db.exec("UPDATE customers SET regionId = 'YANTALA' WHERE id = 'C003' AND regionId IS NULL"); } catch (e) { }
  try { await db.exec("UPDATE customers SET regionId = 'NIAMEY' WHERE id IN ('C004', 'C006') AND regionId IS NULL"); } catch (e) { }
  try { await db.exec("UPDATE customers SET regionId = 'AGADEZ' WHERE id = 'C005' AND regionId IS NULL"); } catch (e) { }
  try { await db.exec("UPDATE meters SET phaseType = 'triphase' WHERE type IN ('industrial', 'haute_tension') AND (phaseType IS NULL OR phaseType = 'monophase')"); } catch (e) { }

  const getSvg = (name: string, symbolPath: string, isPrimary = false) => {
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

  const seedDCUs = [
    { id: 'DCU-Nord-01', name: 'Concentrateur Nord', regionId: 'NIAMEY', status: 'active', ipAddress: '10.0.1.5', macAddress: '00:1A:2B:3C:4D:5E', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 99.8, lat: 13.5350, lng: 2.1020, modemType: '4G', signal: 92, meters: 145 },
    { id: 'DCU-Sud-02', name: 'Concentrateur Sud', regionId: 'PLATEAU', status: 'active', ipAddress: '10.0.1.6', macAddress: '00:1A:2B:3C:4D:5F', firmware: 'v2.0', lastPing: new Date().toISOString(), performance: 98.5, lat: 13.5150, lng: 2.1120, modemType: 'GPRS', signal: 65, meters: 88 },
    { id: 'DCU-West-04', name: 'DCU Tillabéri Ouest', regionId: 'TILLABERI', status: 'active', ipAddress: '10.0.4.1', macAddress: '00:1A:2B:3C:4D:77', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 97.2, lat: 14.2000, lng: 2.0800, modemType: 'PLC-G3', signal: 88, meters: 240 },
    { id: 'DCU-East-05', name: 'DCU Zinder Centre', regionId: 'ZINDER', status: 'active', ipAddress: '10.0.5.1', macAddress: '00:1A:2B:3C:4D:88', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 96.5, lat: 13.8000, lng: 8.9800, modemType: 'LTE', signal: 75, meters: 310 },
    { id: 'DCU-North-06', name: 'DCU Agadez Nord', regionId: 'AGADEZ', status: 'active', ipAddress: '10.0.6.1', macAddress: '00:1A:2B:3C:4D:99', firmware: 'v2.1', lastPing: new Date().toISOString(), performance: 99.1, lat: 16.9700, lng: 7.9800, modemType: 'SATELLITE', signal: 95, meters: 120 }
  ];

  // --- SYSTEM SETTINGS SYNCHRONIZATION ---
  const settingCount = await db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingCount.count === 0) {
    const seedSettings = [
      { key: 'sts_encryption_key', value: '••••••••••••••••' },
      { key: 'low_credit_threshold', value: '10' },
      { key: 'auto_validation', value: 'true' },
      { key: 'sms_verification', value: 'false' },
      { key: 'audit_log', value: 'true' }
    ];
    const insertSetting = db.prepare("INSERT INTO settings(key, value) VALUES(?, ?)");
    for (const s of seedSettings) {
      await insertSetting.run(s.key, s.value);
    }
  }

  // --- DEFAULT ALARM RULES SYNCHRONIZATION ---
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
  }

  // --- DEFAULT OPERATORS / USERS SYNCHRONIZATION ---
  const seedDefaultUsers = [
    { id: 'U001', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrateur', associatedCustomerId: null },
    { id: 'U002', username: 'vendor', password: 'vendor123', role: 'vendor', name: 'Kiosque Vente 1', associatedCustomerId: null },
    { id: 'U003', username: 'tech', password: 'tech123', role: 'tech', name: 'Technicien Réseau', associatedCustomerId: null },
    { id: 'U005', username: 'auditor', password: 'auditor123', role: 'auditor', name: 'Auditeur ARSE', associatedCustomerId: null }
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

  // Always ensure regions and DCUs are synchronized
  console.log('[SYS] Synchronisation des régions et DCUs...');
  const sqlInsertRegion = isEnterpriseMode 
    ? "INSERT INTO regions(id, superiorRegionId, areaName, label, principal, contact, email, status, blazon) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING"
    : "INSERT OR IGNORE INTO regions(id, superiorRegionId, areaName, label, principal, contact, email, status, blazon) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const insertRegion = db.prepare(sqlInsertRegion);
  for (const r of seedRegions) {
    await insertRegion.run(r.id, r.superiorRegionId, r.areaName, r.label, r.principal, r.contact, r.email, r.status, r.blazon);
  }

  const sqlInsertDCU = isEnterpriseMode
    ? "INSERT INTO dcus(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude, modemType, signalStrength, connectedMeters, cpuUsage, memUsage) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING"
    : "INSERT OR IGNORE INTO dcus(id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude, modemType, signalStrength, connectedMeters, cpuUsage, memUsage) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const insertDCU = db.prepare(sqlInsertDCU);
  for (const d of seedDCUs) {
    await insertDCU.run(d.id, d.name, d.regionId, d.status, d.ipAddress, d.macAddress, d.firmware, d.lastPing, d.performance, d.lat, d.lng, d.modemType, d.signal, d.meters, 12.5, 38.4);
  }

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

// --- METER DRIVER MODULE (INTEROPERABILITY LAYER) ---
import { MeterDriverRegistry } from './server/services/drivers.service';

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

// Initialisation au démarrage
initDb().catch(e => console.error("[DB] Erreur lors de l'initialisation:", e));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ─── PROTECTION ANTI-DOS (Rate Limiting) ───
  // Indispensable pour Ngrok et les environnements derrière un proxy
  app.set('trust proxy', 1);

  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 500, 
    message: { error: "Trop de requêtes. Protection DoS active.", code: "API_RATE_LIMIT" },

    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { error: "Tentatives de connexion excessives. IP temporairement bloquée.", code: "AUTH_RATE_LIMIT" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Middleware global pour désactiver la page d'avertissement Ngrok et autoriser CORS
  app.use((_req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
  });

  app.use(express.json());
  
  // Appliquer les limiteurs AVANT les routes
  app.use("/api/login", authLimiter);
  app.use("/api/", generalLimiter);

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

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { identifier, newPassword } = req.body;
      if (!identifier) {
        return res.status(400).json({ success: false, message: 'Identifiant requis' });
      }

      const cleanUsername = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      const user = await db.prepare("SELECT * FROM users WHERE username = ? OR username = ?").get(cleanUsername, identifier) as any;

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      }

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
        return res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
      }

      res.json({ success: true, message: 'Identifiant vérifié avec succès' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Erreur du serveur' });
    }
  });

  // --- PUBLIC ENDPOINTS FOR MOBILE APP ---
  app.get("/api/public/meters/:id", async (req, res) => {
    try {
      const meter = await db.prepare("SELECT * FROM meters WHERE id = ?").get(req.params.id) as any;
      if (!meter) {
        return res.status(404).json({ error: "Compteur non trouvé" });
      }
      res.json(meter);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/public/meters/:id/tokens", async (req, res) => {
    try {
      const tokens = await db.prepare("SELECT * FROM tokens WHERE meterId = ? ORDER BY timestamp DESC").all(req.params.id);
      res.json(tokens);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/public/tokens", async (req, res) => {
    try {
      const { meterId, kwh, type } = req.body;
      const { token, tid, rawToken } = await stsService.generateToken(meterId, kwh, type);
      const tokenData = { ...req.body, token, tid, rawToken };
      const resolvedId = await stsService.persistToken(tokenData);
      
      res.status(201).json({ id: resolvedId, token, tid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/public/payments", async (req, res) => {
    try {
      const { id, amount, operator, reference, meterId, tokenId, status, timestamp } = req.body;
      await PaymentRepository.insert({
        id: id || `PAY-${Date.now()}`,
        amount,
        operator,
        phone: reference || '',
        meterId,
        tokenId,
        status,
        timestamp: timestamp || new Date().toISOString()
      });
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- MODULAR API ROUTES ---
  app.use('/api', requireAuth, apiRouter);










  // MDMS Simulation & VEE Logic — Phase-aware
  const simulateMDMS = async (countValue = 1) => {
    const meters = await db.prepare("SELECT id, type, phaseType, voltage, touEnabled, registeredAt FROM meters").all() as { id: string, type: string, phaseType: string | null, voltage: number, touEnabled: number, registeredAt: string }[];
    const now = Date.now();

    const sqlInsert = isEnterpriseMode 
      ? "INSERT INTO interval_data(id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status, validationNotes, voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3, voltageUnbalance) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT DO NOTHING"
      : "INSERT OR IGNORE INTO interval_data(id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status, validationNotes, voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3, voltageUnbalance) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const stmt = db.prepare(sqlInsert);

    db.transaction(async () => {
      for (const m of meters) {
        // Determine phase type: use DB value, or infer from meter type
        const isTriphase = m.phaseType === 'triphase' || 
                           (!m.phaseType && (m.type === 'industrial' || m.type === 'haute_tension'));

        for (let i = 0; i < countValue; i++) {
          const intervalTime = new Date(now - i * 900000);
          const powerFactor = +(0.85 + Math.random() * 0.14).toFixed(2);

          let voltage: number, current: number, consumption: number;
          let voltageL1: number | null = null, voltageL2: number | null = null, voltageL3: number | null = null;
          let currentL1: number | null = null, currentL2: number | null = null, currentL3: number | null = null;
          let voltageUnbalance: number | null = null;

          if (isTriphase) {
            // === TRIPHASÉ (3φ) ===
            // Each phase: ~220-240V line-to-neutral, total line-to-line ~380-415V
            voltageL1 = +(225 + Math.random() * 15).toFixed(1); // 225-240V
            voltageL2 = +(225 + Math.random() * 15).toFixed(1);
            voltageL3 = +(225 + Math.random() * 15).toFixed(1);

            // Voltage composite (line-to-line) = avg_phase * sqrt(3)
            const avgPhaseV = (voltageL1 + voltageL2 + voltageL3) / 3;
            voltage = +(avgPhaseV * Math.sqrt(3)).toFixed(1); // ~390-415V

            // Voltage unbalance: max deviation from average / average * 100
            const maxDev = Math.max(
              Math.abs(voltageL1 - avgPhaseV),
              Math.abs(voltageL2 - avgPhaseV),
              Math.abs(voltageL3 - avgPhaseV)
            );
            voltageUnbalance = +((maxDev / avgPhaseV) * 100).toFixed(2);

            // Industrial/HT consumption is higher: 5-50 kWh per 15min interval
            const totalPower = m.type === 'haute_tension' 
              ? +(20 + Math.random() * 80).toFixed(3)
              : +(5 + Math.random() * 15).toFixed(3);
            consumption = totalPower;

            // Per-phase current distribution (slightly unbalanced, realistic)
            const totalCurrent = (totalPower * 1000) / (voltage * powerFactor);
            const balance1 = 0.9 + Math.random() * 0.2;
            const balance2 = 0.9 + Math.random() * 0.2;
            const balance3 = 0.9 + Math.random() * 0.2;
            const balanceSum = balance1 + balance2 + balance3;
            currentL1 = +((totalCurrent * balance1 / balanceSum)).toFixed(2);
            currentL2 = +((totalCurrent * balance2 / balanceSum)).toFixed(2);
            currentL3 = +((totalCurrent * balance3 / balanceSum)).toFixed(2);
            current = +(currentL1 + currentL2 + currentL3).toFixed(2);
          } else {
            // === MONOPHASÉ (1φ) ===
            // Single phase: 220-240V line-to-neutral
            voltage = +(220 + Math.random() * 20).toFixed(1);
            consumption = +(Math.random() * 2.4 + 0.1).toFixed(3);
            current = +(consumption * 1000 / voltage).toFixed(2);
            
            // CRITICAL FIX: Populate L1 for monophase, keep L2/L3 null
            voltageL1 = voltage;
            currentL1 = current;
            voltageL2 = null;
            voltageL3 = null;
            currentL2 = null;
            currentL3 = null;
          }

          let status = 'valid';
          let notes = '';

          // Validation rules differ by phase type
          if (isTriphase) {
            // Triphasé: check voltage unbalance > 2% (ANSI C84.1 standard)
            if (voltageUnbalance && voltageUnbalance > 2.0) {
              status = 'invalid';
              notes = `Déséquilibre de tension triphasé: ${voltageUnbalance}% (seuil: 2%)`;
            }
            // Check if any phase voltage is out of range (230V +/- 10% = 207-253V)
            // Check line-to-line (400V +/- 10% = 360-440V)
            if (voltage < 360 || voltage > 440) {
              status = 'invalid';
              notes = `Tension composée hors plage (360-440V L-L)`;
            }
            if ((voltageL1! < 200 || voltageL1! > 253) || (voltageL2! < 200 || voltageL2! > 253) || (voltageL3! < 200 || voltageL3! > 253)) {
              status = 'invalid';
              notes = 'Tension phase hors plage (200-253V par phase)';
            }
          } else {
            // Monophasé: standard voltage range check (230V +/- 10% = 207-253V)
            if (voltage < 207 || voltage > 253) {
              status = 'invalid';
              notes = 'Tension monophasée hors plage (207-253V / ±10%)';
              if (voltage > 260 && Math.random() < 0.1) {
                await triggerAlert('warning', 'Surtension Critique', `Surtension de ${voltage}V détectée sur le compteur ${m.id}. Risque pour les équipements.`, m.id, 'Haute');
              }
            }
          }

          if (Math.random() < 0.08) {
            status = 'estimated';
            notes = 'Gap Filling: Interpolation linéaire appliquée';
            await db.prepare("INSERT INTO audits(id, action, details, user, timestamp) VALUES(?, ?, ?, ?, ?)")
              .run(`VEE_GAP_FILL_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`, 'MDMS_ESTIMATION', `Estimation de donnée pour le compteur ${m.id} (${isTriphase ? '3φ' : '1φ'})`, 'SYSTEM_VEE', new Date().toISOString());
          }

          if (Math.random() < 0.001) {
            await triggerAlert('danger', 'FRAUDE DÉTECTÉE', `Ouverture de capot détectée sur ${m.id}.`, m.id, 'Critique');
            await db.prepare("UPDATE meters SET tamperStatus = 'tampered' WHERE id = ?").run(m.id);
          }

          const intId = `INT-${intervalTime.getTime()}-${m.id}`;
          await stmt.run(intId, m.id, intervalTime.toISOString(), 0, consumption, voltage, current, powerFactor, status, notes, voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3, voltageUnbalance);
        }
      }
    });
    console.log(`[MDMS] Processed ${meters.length * countValue} reading(s) — phase-aware.`);
  };

  if (process.env.ENABLE_SIMULATOR === 'true') {
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
  }

  // Forcer le service du manifest PWA avec en-tête JSON et CORS
  app.get("/manifest.webmanifest", (_req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(path.join(__dirname, "public", "manifest.webmanifest"));
  });

  // Handler universel de Favicon (SVG / ICO) pour éliminer les erreurs 404 navigateur
  app.get(["/favicon.ico", "/favicon.svg"], (_req, res) => {
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.sendFile(path.join(__dirname, "public", "favicon.svg"));
  });

  // Service des fichiers statiques du dossier public (manifest, favicon, sw, etc.)
  app.use(express.static(path.join(__dirname, "public")));

  // Vite middleware — HMR désactivé en mode tunnel/proxy pour empêcher les erreurs WebSocket
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false
      },
      appType: "spa",
      root: process.cwd()
    });

    app.use(vite.middlewares);

    // Serveur SPA en mode Développement (avec transformation Vite)
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      
      try {
        const url = req.originalUrl;
        const template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  setInterval(() => {}, 100000);
}

startServer();
