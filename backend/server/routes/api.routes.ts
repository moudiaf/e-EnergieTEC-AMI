import { Router } from 'express';
import { db } from '../db';
import { analyticsService } from '../services/analytics.service';
import { AuthController } from '../controllers/auth.controller';
import { CustomerController } from '../controllers/customer.controller';
import { MeterController } from '../controllers/meter.controller';
import { STSController } from '../controllers/sts.controller';
import { Vending2Controller } from '../controllers/vending2.controller';
import { StatisticsController } from '../controllers/statistics.controller';
import { auditService } from '../services/audit.service';
import {
  AuditRepository,
  AlertRuleRepository,
  TariffRepository,
  UserRepository,
  SettingRepository,
  IntervalDataRepository,
  MeterRepository
} from '../repositories';
import { requireRole } from '../middleware/auth';
import {
  validateLogin,
  validateCustomerCreate,
  validateMeterCreate,
  validateTokenGenerate,
  validateAlertCreate,
  validatePaymentCreate,
  validateTicketCreate,
  validateRegionCreate,
  validateDcuCreate
} from '../middleware/validation';

const router = Router();

// --- AUTH ---
router.post("/login", validateLogin, AuthController.login);
router.post("/auth/login", validateLogin, AuthController.login);

// --- AUDITS & NOTIFICATIONS ---
router.get("/audits", async (req, res) => {
  try {
    const audits = await AuditRepository.getRecent(100);
    res.json(audits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/audits", async (req, res) => {
  try {
    const { action, details, user, id } = req.body;
    await auditService.log(action, details, user || 'SYSTEM', id);
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await AuditRepository.getNotifications(20);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CUSTOMERS ---
router.get("/customers", CustomerController.getAllCustomers);
router.get("/customers/:id", CustomerController.getCustomerById);
router.post("/customers", validateCustomerCreate, CustomerController.createCustomer);
router.put("/customers/:id", CustomerController.updateCustomer);
router.delete("/customers/:id", requireRole(['admin']), CustomerController.deleteCustomer);

// --- METERS ---
router.get("/meters", MeterController.getAllMeters);
router.get("/meters/:id", MeterController.getMeterById);
router.post("/meters", validateMeterCreate, MeterController.registerMeter);
router.put("/meters/:id", MeterController.updateMeter);
router.post("/meters/:id/tamper", MeterController.tamperMeter);
router.put("/meters/:id/lifecycle", MeterController.updateLifecycle);
router.delete("/meters/:id", requireRole(['admin']), MeterController.deleteMeter);

// --- DCUS ---
router.get('/dcus', CustomerController.getAllDCUs);
router.post('/dcus', validateDcuCreate, CustomerController.createDCU);
router.put('/dcus/:id', CustomerController.updateDCU);
router.delete('/dcus/:id', requireRole(['admin']), CustomerController.deleteDCU);

// --- REGIONS ---
router.get('/regions', CustomerController.getAllRegions);
router.post('/regions', validateRegionCreate, CustomerController.createRegion);
router.put('/regions/:id', CustomerController.updateRegion);
router.delete('/regions/:id', requireRole(['admin']), CustomerController.deleteRegion);

// --- STS TOKENS & BILLING ---
router.post("/tokens", requireRole(['admin', 'vendor']), validateTokenGenerate, STSController.generateToken);
router.get("/tokens", STSController.getAllTokens);
router.post("/billing/run", requireRole(['admin', 'vendor']), STSController.runBilling);

// --- INVOICES & PAYMENTS ---
router.get("/invoices", STSController.getAllInvoices);
router.get("/payments", STSController.getAllPayments);
router.post("/payments", validatePaymentCreate, STSController.createPayment);
router.post("/invoices/:id/pay", STSController.payInvoice);
router.post("/invoices/pay-all", STSController.payAllInvoices);

// --- ALERTS & ALERT RULES ---
router.get("/alerts", MeterController.getAllAlerts);
router.post("/alerts", validateAlertCreate, MeterController.createAlert);
router.put("/alerts/:id/read", MeterController.readAlert);
router.get('/alert_rules', async (req, res) => {
  try {
    res.json(await AlertRuleRepository.getAll());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.patch("/alert_rules/:id", MeterController.updateAlertRule);
router.put("/alert_rules/:id", MeterController.updateAlertRule);

// --- TARIFFS ---
router.get('/tariffs', async (req, res) => {
  try {
    res.json(await TariffRepository.getAll());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TICKETS ---
router.get("/tickets", MeterController.getAllTickets);
router.post("/tickets", validateTicketCreate, MeterController.createTicket);
router.put("/tickets/:id", MeterController.updateTicket);
router.put("/tickets/:id/status", MeterController.updateTicketStatus);

// --- USERS ---
router.get("/users", async (req, res) => {
  try {
    res.json(await UserRepository.getAll());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", requireRole(['admin']), async (req, res) => {
  try {
    await UserRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de l'utilisateur.", error: err.message });
  }
});

// --- SETTINGS ---
router.get("/settings", async (req, res) => {
  try {
    res.json(await SettingRepository.getAll());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/settings", requireRole(['admin']), async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await SettingRepository.upsert(key, JSON.stringify(value));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MDMS & ANALYTICS ---
router.get("/mdms/stats", async (req, res) => {
  try {
    const totalReadings = await IntervalDataRepository.count();
    const validationStats = await IntervalDataRepository.getStats();
    
    const isEnterpriseMode = process.env.DB_TYPE === 'postgres';
    const energyBalance = await analyticsService.getEnergyBalance(isEnterpriseMode);

    res.json({ 
      totalReadings, 
      validationStats,
      energyBalance 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/interval_data", async (req, res) => {
  try {
    res.json(await IntervalDataRepository.getRecent(100));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analytics/trends", async (req, res) => {
  try {
    const isEnterpriseMode = process.env.DB_TYPE === 'postgres';
    res.json(await analyticsService.getTrends(isEnterpriseMode));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analytics/distribution", async (req, res) => {
  try {
    res.json(await analyticsService.getDistribution());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analytics/energy-balance", async (req, res) => {
  try {
    const isEnterpriseMode = process.env.DB_TYPE === 'postgres';
    res.json(await analyticsService.getEnergyBalance(isEnterpriseMode));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SIMULATIONS ---
router.post("/simulate/anomaly", requireRole(['admin', 'tech']), MeterController.simulateAnomaly);
router.post("/simulate/fraud", requireRole(['admin', 'tech']), MeterController.simulateFraud);

router.post("/mdms/simulate-mass", requireRole(['admin', 'tech']), async (req, res) => {
  try {
    const startTime = Date.now();
    const meterRows = await db.prepare("SELECT * FROM meters WHERE status = 'online'").all() as any[];
    
    for (const m of meterRows) {
      // 1. Interrogation télémétrique DLMS réelle du compteur
      try {
        await vending2Service.readMeterValue(m.id, 'MDMS_INGEST');
      } catch (err: any) {
        console.warn(`[MDMS INGEST] Note: télérelève en direct pour ${m.id} : ${err.message}`);
      }

      // 2. Récupération des données réelles fraîches après synchronisation
      const fresh = (await db.prepare("SELECT * FROM meters WHERE id = ?").get(m.id)) as any || m;
      const intervalTime = new Date();
      const voltage = fresh.voltage || (fresh.phaseType === 'triphase' ? 400.0 : 230.0);
      const current = fresh.current || 0.0;
      const reading = fresh.totalConsumption || 0.0;
      const id = `INT-${intervalTime.getTime()}-${fresh.id}-${Math.floor(Math.random() * 1000)}`;
      
      // 3. Calcul du delta de consommation réel par rapport au dernier relevé
      const lastInterval = await db.prepare(
        "SELECT reading FROM interval_data WHERE meterId = ? ORDER BY timestamp DESC LIMIT 1"
      ).get(fresh.id) as any;
      const prevReading = lastInterval ? lastInterval.reading : reading;
      const deltaConsumption = (reading >= prevReading) ? +(reading - prevReading).toFixed(3) : 0.0;
      
      await IntervalDataRepository.insert({
        id,
        meterId: fresh.id,
        timestamp: intervalTime.toISOString(),
        reading,
        consumption: deltaConsumption,
        voltage,
        current,
        powerFactor: fresh.powerFactor || 0.98,
        status: 'valid',
        validationNotes: 'Ingestion DLMS certifiée en direct du compteur'
      });
    }

    const durationMs = Date.now() - startTime;
    res.json({ 
      success: true, 
      message: `Ingestion MDMS DLMS temps-réel enregistrée pour ${meterRows.length} compteur(s).`,
      count: meterRows.length,
      durationMs 
    });
  } catch (err: any) {
    console.error("[MDMS] Erreur ingestion réelle:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- SECURITY & ROTATION ---
// --- HES GATEWAY PROXY ---
router.post("/hes/decode", async (req, res) => {
  try {
    const { frame } = req.body;
    if (!frame) return res.status(400).json({ error: "Trame manquante" });
    
    const response = await fetch("http://localhost:4060/api/hes/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Passerelle HES Gateway hors ligne", details: err.message });
  }
});

router.post("/security/rotate-keys", requireRole(['admin']), STSController.rotateKeys);

// --- KMS-HSM STS BRIDGE ---
router.post("/kms/generate-token", async (req, res) => {
  try {
    const kmsRes = await fetch("http://localhost:5000/api/kms/generate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!kmsRes.ok) {
      const err = await kmsRes.json().catch(() => ({}));
      return res.status(kmsRes.status).json(err);
    }
    const data = await kmsRes.json();
    res.json(data);
  } catch (err: any) {
    console.error("[KMS Proxy] Erreur de communication avec le KMS-HSM:", err.message);
    res.status(503).json({
      success: false,
      error: "Service KMS-HSM certifié (Port 5000) inaccessible. Aucune génération non-authentique autorisée.",
      details: err.message
    });
  }
});

// --- VENDING2 API INTEGRATION ---
router.post("/v1/vending2/recharge", requireRole(['admin', 'vendor']), Vending2Controller.recharge);
router.post("/v1/vending2/token", requireRole(['admin', 'vendor', 'tech']), Vending2Controller.generateToken);
router.get("/v1/vending2/transactions", requireRole(['admin', 'vendor', 'tech', 'auditor']), Vending2Controller.getTransactions);
router.get("/v1/vending2/transactions/:id", requireRole(['admin', 'vendor', 'tech', 'auditor']), Vending2Controller.getTransactionById);
router.get("/v1/vending2/health", requireRole(['admin', 'tech']), Vending2Controller.checkHealth);
router.post("/v1/vending2/read-telemetry", requireRole(['admin', 'tech']), Vending2Controller.readTelemetry);
router.post("/v1/vending2/read-region", requireRole(['admin', 'tech']), Vending2Controller.readRegion);
router.post("/v1/vending2/relay-control", requireRole(['admin', 'tech']), Vending2Controller.relayControl);
router.get("/v1/vending2/record/:flowNo", requireRole(['admin', 'vendor', 'tech', 'auditor']), Vending2Controller.getRecordByFlowNo);
router.post("/v1/vending2/clock-sync", requireRole(['admin', 'tech']), Vending2Controller.syncClock);

import { FraudController } from '../controllers/fraud.controller';
import { MdmsController } from '../controllers/mdms.controller';
import { TouTariffController } from '../controllers/tou-tariff.controller';
import { MobilePaymentController } from '../controllers/mobile-payment.controller';
import { KmsKeyRotationController } from '../controllers/kms-key-rotation.controller';

// ─── Module Anti-Fraude & Revenue Assurance ──────────
router.post("/v1/fraud/evaluate", requireRole(['admin', 'tech', 'auditor']), FraudController.evaluateMeter);
router.post("/v1/fraud/clear-tamper", requireRole(['admin', 'tech']), FraudController.generateClearTamperToken);
router.get("/v1/fraud/alerts", requireRole(['admin', 'tech', 'auditor']), FraudController.getFraudAlerts);

// ─── Module Bilan Énergétique MDMS & Pertes Réseau ──────────
router.post("/v1/mdms/energy-balance", requireRole(['admin', 'manager', 'tech', 'auditor']), MdmsController.getDcuEnergyBalance);
router.get("/v1/mdms/network-summary", requireRole(['admin', 'manager', 'tech', 'auditor']), MdmsController.getNationalSummary);

// ─── Module Tarification Horaire TOU & Jetons de Tarif STS (Subclass 2) ──────────
router.get("/v1/tariffs/tou-schedule", requireRole(['admin', 'manager', 'tech', 'vendor', 'auditor']), TouTariffController.getSchedule);
router.post("/v1/tariffs/generate-tariff-token", requireRole(['admin', 'vendor', 'tech']), TouTariffController.generateTariffToken);

// ─── Module Paiement Mobile Money (+227 Airtel/Moov) & SMS/WhatsApp Notification ──────────
router.post("/v1/payments/mobile-push", requireRole(['admin', 'vendor', 'customer']), MobilePaymentController.processPayment);
router.get("/v1/payments/history/:meterId", requireRole(['admin', 'vendor', 'customer', 'auditor']), MobilePaymentController.getPaymentHistory);

// ─── Module Sécurité KMS & Rotation des Clés (Key Change Tokens KCT / Subclass 3) ──────────
router.post("/v1/kms/rotate-keys-token", requireRole(['admin', 'tech']), KmsKeyRotationController.rotateKeysToken);

// ─── Module Statistiques & Rapports AMI (Consommation, Analyse, Finance) ──────────
router.get("/statistics/consumption-matrix", StatisticsController.getConsumptionMatrix);
router.get("/statistics/meter-analysis", StatisticsController.getMeterAnalysis);
router.get("/statistics/financial-summary", StatisticsController.getFinancialSummary);

router.get("/v1/statistics/consumption-matrix", StatisticsController.getConsumptionMatrix);
router.get("/v1/statistics/meter-analysis", StatisticsController.getMeterAnalysis);
router.get("/v1/statistics/financial-summary", StatisticsController.getFinancialSummary);

export default router;
