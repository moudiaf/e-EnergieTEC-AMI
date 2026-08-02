import { Router } from 'express';
import { db } from '../db';
import { analyticsService } from '../services/analytics.service';
import { AuthController } from '../controllers/auth.controller';
import { CustomerController } from '../controllers/customer.controller';
import { MeterController } from '../controllers/meter.controller';
import { STSController } from '../controllers/sts.controller';
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
router.delete("/customers/:id", CustomerController.deleteCustomer);

// --- METERS ---
router.get("/meters", MeterController.getAllMeters);
router.post("/meters", validateMeterCreate, MeterController.registerMeter);
router.post("/meters/:id/tamper", MeterController.tamperMeter);
router.put("/meters/:id/lifecycle", MeterController.updateLifecycle);
router.delete("/meters/:id", MeterController.deleteMeter);

// --- DCUS ---
router.get('/dcus', CustomerController.getAllDCUs);
router.post('/dcus', validateDcuCreate, CustomerController.createDCU);
router.put('/dcus/:id', CustomerController.updateDCU);
router.delete('/dcus/:id', CustomerController.deleteDCU);

// --- REGIONS ---
router.get('/regions', CustomerController.getAllRegions);
router.post('/regions', validateRegionCreate, CustomerController.createRegion);
router.put('/regions/:id', CustomerController.updateRegion);
router.delete('/regions/:id', CustomerController.deleteRegion);

// --- STS TOKENS & BILLING ---
router.post("/tokens", validateTokenGenerate, STSController.generateToken);
router.get("/tokens", STSController.getAllTokens);
router.post("/billing/run", STSController.runBilling);

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

router.delete("/users/:id", async (req, res) => {
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

router.post("/settings", async (req, res) => {
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
router.post("/simulate/anomaly", MeterController.simulateAnomaly);
router.post("/simulate/fraud", MeterController.simulateFraud);

router.post("/mdms/simulate-mass", async (req, res) => {
  try {
    const { count } = req.body;
    const countValue = count || 96;
    const startTime = Date.now();

    const meters = await MeterRepository.getOnlineIds();
    
    await db.transaction(async () => {
      for (const meterId of meters) {
        for (let i = 0; i < countValue; i++) {
          const intervalTime = new Date(Date.now() - (i * 15 * 60000));
          const consumption = (Math.random() * 0.5) + 0.1;
          const voltage = 220 + (Math.random() * 20 - 10);
          const current = (consumption * 1000) / voltage;
          
          const id = `INT-${intervalTime.getTime()}-${meterId}`;
          await IntervalDataRepository.insert({
            id,
            meterId,
            timestamp: intervalTime.toISOString(),
            reading: 0,
            consumption,
            voltage,
            current,
            powerFactor: 0.95,
            status: 'valid',
            validationNotes: ''
          });
        }
      }
    });

    const durationMs = Date.now() - startTime;
    res.json({ 
      success: true, 
      message: `Simulation terminée: ${meters.length * countValue} lectures générées pour ${meters.length} compteurs.`,
      durationMs 
    });
  } catch (err: any) {
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

router.post("/security/rotate-keys", STSController.rotateKeys);

export default router;
