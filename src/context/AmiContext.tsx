import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Customer, Meter, Token, Section, Tariff, Alert, Region, TariffTier, 
  Audit, User as AppUser, Invoice, Ticket, Payment, AlertRule, DCU, Shift, EnergyBalance 
} from '../types';
import { TARIFFS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useToasts } from '../hooks/useToasts';
import { useApi } from '../hooks/useApi';
import { useData } from '../hooks/useData';
import { calculateRechargeDetails } from '../utils/billing';
import { 
  generateInvoicePDF, 
  generateRegulatoryReport, 
  generateMdmsReportFile, 
  generateAlertsReportFile, 
  generateShiftReportPDF, 
  generateEnergyLossReport, 
  generateFraudRiskReport, 
  generateMobileMoneyReport, 
  generateSystemIntegrityReport 
} from '../utils/reports';
import { LayoutDashboard, Key, Receipt, Headset, Tags, Smartphone, AlertTriangle, MapPin, Cpu, FileText, ShieldCheck, Shield, TrendingUp } from 'lucide-react';

interface AmiContextType {
  // Auth
  currentUser: AppUser | null;
  isLoggedIn: boolean;
  login: (user: AppUser, token: string) => void;
  logout: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Toasts
  toasts: any[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  
  // Api
  authFetch: (url: string, options?: any) => Promise<any>;
  getApiUrl: (path: string) => string;
  
  // Data
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  meters: Meter[];
  setMeters: React.Dispatch<React.SetStateAction<Meter[]>>;
  tokens: Token[];
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  regions: Region[];
  setRegions: React.Dispatch<React.SetStateAction<Region[]>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  audits: Audit[];
  setAudits: React.Dispatch<React.SetStateAction<Audit[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  dcus: DCU[];
  setDcus: React.Dispatch<React.SetStateAction<DCU[]>>;
  isLoading: boolean;
  fetchData: () => Promise<void>;

  // Local UI & form states
  currentSection: Section;
  setCurrentSection: React.Dispatch<React.SetStateAction<Section>>;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  mdmsSearch: string;
  setMdmsSearch: React.Dispatch<React.SetStateAction<string>>;
  ticketSearch: string;
  setTicketSearch: React.Dispatch<React.SetStateAction<string>>;
  meterSearch: string;
  setMeterSearch: React.Dispatch<React.SetStateAction<string>>;
  customerStatusFilter: string;
  setCustomerStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  isFraudModalOpen: boolean;
  setIsFraudModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBillingLoading: boolean;
  setIsBillingLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  globalSearchQuery: string;
  setGlobalSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isCustomerModalOpen: boolean;
  setIsCustomerModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMeterModalOpen: boolean;
  setIsMeterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTariffModalOpen: boolean;
  setIsTariffModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isRegionModalOpen: boolean;
  setIsRegionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDcuModalOpen: boolean;
  setIsDcuModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUserModalOpen: boolean;
  setIsUserModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentShift: Shift | null;
  setCurrentShift: React.Dispatch<React.SetStateAction<Shift | null>>;
  pastShifts: Shift[];
  setPastShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  isTicketModalOpen: boolean;
  setIsTicketModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingCustomer: Customer | null;
  setEditingCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  editingMeter: Meter | null;
  setEditingMeter: React.Dispatch<React.SetStateAction<Meter | null>>;
  editingTariff: Tariff | null;
  setEditingTariff: React.Dispatch<React.SetStateAction<Tariff | null>>;
  editingTiers: TariffTier[];
  setEditingTiers: React.Dispatch<React.SetStateAction<TariffTier[]>>;
  editingRegion: Region | null;
  setEditingRegion: React.Dispatch<React.SetStateAction<Region | null>>;
  editingDcu: DCU | null;
  setEditingDcu: React.Dispatch<React.SetStateAction<DCU | null>>;
  editingTicket: Ticket | null;
  setEditingTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  editingUser: AppUser | null;
  setEditingUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  generatedToken: Token | null;
  setGeneratedToken: React.Dispatch<React.SetStateAction<Token | null>>;
  viewingMeter: Meter | null;
  setViewingMeter: React.Dispatch<React.SetStateAction<Meter | null>>;
  isGeneratingToken: boolean;
  setIsGeneratingToken: React.Dispatch<React.SetStateAction<boolean>>;
  loginUsername: string;
  setLoginUsername: React.Dispatch<React.SetStateAction<string>>;
  loginPassword: string;
  setLoginPassword: React.Dispatch<React.SetStateAction<string>>;
  isLoginLoading: boolean;
  captcha: string;
  setCaptcha: React.Dispatch<React.SetStateAction<string>>;
  captchaInput: string;
  setCaptchaInput: React.Dispatch<React.SetStateAction<string>>;
  tariffs: Tariff[];
  setTariffs: React.Dispatch<React.SetStateAction<Tariff[]>>;
  billingProgress: number;
  setBillingProgress: React.Dispatch<React.SetStateAction<number>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  alertRules: AlertRule[];
  setAlertRules: React.Dispatch<React.SetStateAction<AlertRule[]>>;
  mdmsStats: any;
  setMdmsStats: React.Dispatch<React.SetStateAction<any>>;
  selectedMeterIntervals: any[];
  setSelectedMeterIntervals: React.Dispatch<React.SetStateAction<any[]>>;
  analyticsTrends: any[];
  setAnalyticsTrends: React.Dispatch<React.SetStateAction<any[]>>;
  analyticsDist: any;
  setAnalyticsDist: React.Dispatch<React.SetStateAction<any>>;
  energyBalance: EnergyBalance | null;
  setEnergyBalance: React.Dispatch<React.SetStateAction<EnergyBalance | null>>;
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;

  // STS Prepaid
  selectedMeterId: string;
  setSelectedMeterId: React.Dispatch<React.SetStateAction<string>>;
  rechargeAmount: number;
  setRechargeAmount: React.Dispatch<React.SetStateAction<number>>;
  selectedChannel: 'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY';
  setSelectedChannel: React.Dispatch<React.SetStateAction<'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY'>>;
  alertsTab: 'realtime' | 'history' | 'rules' | 'simulation';
  setAlertsTab: React.Dispatch<React.SetStateAction<'realtime' | 'history' | 'rules' | 'simulation'>>;

  isForgotPasswordModalOpen: boolean;
  setIsForgotPasswordModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isReplacementModalOpen: boolean;
  setIsReplacementModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  navItems: Array<{ id: string; name: string; icon: any; hasBadge?: boolean }>;

  // Action handlers
  generateCaptcha: () => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleResetPassword: (identifier: string, newPassword?: string) => Promise<boolean>;
  handleReplaceMeter: (oldMeterId: string, newMeterId: string) => Promise<{ success: boolean; transferToken?: string; creditTransferred?: number }>;
  handleLogout: () => Promise<void>;
  logAudit: (action: string, details: string, referenceId?: string) => Promise<void>;
  sendSmsNotification: (phone: string, message: string, priority?: 'urgent' | 'info') => void;
  handleSaveCustomer: (e: React.FormEvent) => Promise<void>;
  handleDeleteCustomer: (id: string) => Promise<void>;
  handleSaveMeter: (e: React.FormEvent) => Promise<void>;
  handleDeleteMeter: (id: string) => Promise<void>;
  handleSaveTariff: (e: React.FormEvent) => Promise<void>;
  handleDeleteTariff: (id: string) => Promise<void>;
  handleSaveUser: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleRunBilling: () => Promise<void>;
  handlePayInvoice: (e: React.FormEvent) => Promise<void>;
  handleSaveTicket: (e: React.FormEvent) => Promise<void>;
  updateTicketStatus: (id: string, status: string) => Promise<void>;
  handleUpdateAlertRule: (rule: AlertRule) => Promise<void>;
  handleSimulateMassReading: () => Promise<void>;
  handleMassPayment: () => Promise<void>;
  handleGenerateAlertsReport: () => void;
  handleGenerateMdmsReport: () => void;
  handleGenerateRegulatoryReport: () => void;
  handleSimulateTamper: () => Promise<void>;
  handleTriggerFraud: (scenario: any, meterId: string) => Promise<void>;
  handleSimulateAnomaly: (meterId: string) => Promise<void>;
  handleResetTamper: (meterId: string, alertId: string) => Promise<void>;
  handleOpenShift: (initialCash: number) => void;
  handleCloseShift: (finalCash: number) => Promise<void>;
  handleSaveRegion: (e: React.FormEvent) => Promise<void>;
  handleSaveDcu: (e: React.FormEvent) => Promise<void>;
  handleDeleteDcu: (id: string) => Promise<void>;
  handleGenerateRegionalReport: (regionName: string) => void;
  handleUpdateMeterLifecycle: (meterId: string, status: Meter['lifecycleStatus']) => Promise<void>;
  handleDeleteRegion: (id: string) => Promise<void>;
  handleCalculateRecharge: (amount: number, meterId: string) => any;
  handleGenerateToken: (type?: 'recharge' | 'key-change' | 'clear-credit' | 'clear-tamper' | 'payment-mode') => Promise<void>;
  handlePrintReceipt: (token: Token) => void;
  handleGenerateInvoicePDF: (inv: Invoice) => void;
  handleSaveSettings: (newSettings: any) => Promise<void>;
  handleRotateKeys: () => Promise<void>;
}

const AmiContext = createContext<AmiContextType | undefined>(undefined);

export const AmiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoggedIn, login, logout, setCurrentUser, setIsLoggedIn } = useAuth();
  const { toasts, addToast } = useToasts();
  const { authFetch, getApiUrl } = useApi(logout);
  const { 
    customers, setCustomers, meters, setMeters, tokens, setTokens, 
    regions, setRegions, alerts, setAlerts, audits, setAudits, 
    invoices, setInvoices, tickets, setTickets, payments, setPayments, 
    dcus, setDcus, isLoading 
  } = useData(authFetch);

  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [mdmsSearch, setMdmsSearch] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [meterSearch, setMeterSearch] = useState<string>('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>('all');
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isDcuModalOpen, setIsDcuModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [pastShifts, setPastShifts] = useState<Shift[]>([]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [editingTiers, setEditingTiers] = useState<TariffTier[]>([]);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingDcu, setEditingDcu] = useState<DCU | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [generatedToken, setGeneratedToken] = useState<Token | null>(null);
  const [viewingMeter, setViewingMeter] = useState<Meter | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>(Object.entries(TARIFFS).map(([id, t]) => ({ ...t, id })));
  const [billingProgress, setBillingProgress] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [mdmsStats, setMdmsStats] = useState<any>(null);
  const [selectedMeterIntervals, setSelectedMeterIntervals] = useState<any[]>([]);
  const [analyticsTrends, setAnalyticsTrends] = useState<any[]>([]);
  const [analyticsDist, setAnalyticsDist] = useState<any>(null);
  const [energyBalance, setEnergyBalance] = useState<EnergyBalance | null>(null);
  const [settings, setSettings] = useState<any>({});

  // STS Prepaid States
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY'>('CASH');
  const [alertsTab, setAlertsTab] = useState<'realtime' | 'history' | 'rules' | 'simulation'>('realtime');

  // Dynamic Navigation Items based on user role
  const navItems = useMemo(() => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'customer':
        return [
          { id: 'customer-dashboard', name: 'Mon Compteur', icon: LayoutDashboard },
          { id: 'sts-prepaid', name: 'Acheter', icon: Key },
          { id: 'billing', name: 'Factures', icon: Receipt },
          { id: 'tickets', name: 'Support', icon: Headset }
        ];
      case 'vendor':
        return [
          { id: 'sts-prepaid', name: 'Recharge', icon: Key },
          { id: 'tokens', name: 'Ventes', icon: Tags },
          { id: 'payments', name: 'Marchand', icon: Smartphone }
        ];
      case 'tech':
        return [
          { id: 'tickets', name: 'Missions', icon: Headset },
          { id: 'alerts', name: 'Alertes', icon: AlertTriangle, hasBadge: true },
          { id: 'meters', name: 'Compteurs', icon: Cpu },
          { id: 'map', name: 'Carte', icon: MapPin }
        ];
      case 'auditor':
        return [
          { id: 'reports', name: 'Rapports ARSE', icon: FileText },
          { id: 'revenue-assurance', name: 'Revenue Assurance', icon: ShieldCheck },
          { id: 'audit', name: 'Audit KMS', icon: Shield },
          { id: 'analytics', name: 'Analytique', icon: TrendingUp },
          { id: 'tokens', name: 'Historique Ventes', icon: Tags }
        ];
      default:
        return [
          { id: 'dashboard', name: 'Accueil', icon: LayoutDashboard },
          { id: 'tickets', name: 'Missions', icon: Smartphone },
          { id: 'alerts', name: 'Alertes', icon: AlertTriangle, hasBadge: true }
        ];
    }
  }, [currentUser]);

  // Redirection automatique vers la section par défaut selon le rôle de l'utilisateur
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'customer') {
        setCurrentSection('customer-dashboard');
      } else if (currentUser.role === 'auditor') {
        setCurrentSection('reports');
      } else if (currentUser.role === 'vendor') {
        setCurrentSection('sts-prepaid');
      } else if (currentUser.role === 'tech') {
        setCurrentSection('tickets');
      }
    }
  }, [currentUser]);

  // Fetch all frontend data from Express server
  const fetchData = useCallback(async () => {
    try {
      const safeJson = async (fetchPromise: Promise<Response>) => {
        try {
          const res = await fetchPromise;
          if (!res || !res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      // Batch 1: Entités primaires (10 requêtes simultanées max)
      const [
        meterData, customerData, regionData, tariffData, alertData, auditData,
        invoiceData, ticketData, paymentData, ruleData
      ] = await Promise.all([
        safeJson(authFetch('/api/meters')),
        safeJson(authFetch('/api/customers')),
        safeJson(authFetch('/api/regions')),
        safeJson(authFetch('/api/tariffs')),
        safeJson(authFetch('/api/alerts')),
        safeJson(authFetch('/api/audits')),
        safeJson(authFetch('/api/invoices')),
        safeJson(authFetch('/api/tickets')),
        safeJson(authFetch('/api/payments')),
        safeJson(authFetch('/api/alert_rules'))
      ]);

      // Batch 2: Analytique et Systèmes
      const [
        mdmsData, intervalData, dcuData, tokenData, settingData, userData, trendData, distData, notifData, ebData
      ] = await Promise.all([
        safeJson(authFetch('/api/mdms/stats')),
        safeJson(authFetch('/api/interval_data')),
        safeJson(authFetch('/api/dcus')),
        safeJson(authFetch('/api/tokens')),
        safeJson(authFetch('/api/settings')),
        safeJson(authFetch('/api/users')),
        safeJson(authFetch('/api/analytics/trends')),
        safeJson(authFetch('/api/analytics/distribution')),
        safeJson(authFetch('/api/notifications')),
        safeJson(authFetch('/api/analytics/energy-balance'))
      ]);

      setMeters(Array.isArray(meterData) ? meterData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setRegions(Array.isArray(regionData) ? regionData : []);
      setAudits(Array.isArray(auditData) ? auditData : []);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
      setAlertRules(Array.isArray(ruleData) ? ruleData : []);
      if (mdmsData && !mdmsData.error) setMdmsStats(mdmsData);
      setSelectedMeterIntervals(Array.isArray(intervalData) ? intervalData : []);
      if (Array.isArray(dcuData)) setDcus(dcuData);
      setUsers(Array.isArray(userData) ? userData : []);
      setAnalyticsTrends(Array.isArray(trendData) ? trendData : []);
      setAnalyticsDist(Array.isArray(distData) ? distData : []);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setEnergyBalance(Array.isArray(ebData) ? ebData : []);

      if (Array.isArray(tariffData)) {
        setTariffs(tariffData.map((t: any) => ({
          ...t,
          tiers: typeof t.tiers === 'string' ? JSON.parse(t.tiers) : t.tiers
        })));
      } else {
        setTariffs([]);
      }

      if (Array.isArray(tokenData)) {
        setTokens(tokenData.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
          expiry: new Date(t.expiry)
        })));
      } else {
        setTokens([]);
      }

      if (Array.isArray(alertData)) {
        setAlerts(alertData.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })));
      } else {
        setAlerts([]);
      }

      if (Array.isArray(settingData)) {
        const settingsObj = settingData.reduce((acc: any, s: any) => {
          acc[s.key] = s.value;
          return acc;
        }, {});
        setSettings(settingsObj);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, [authFetch, setMeters, setCustomers, setRegions, setAlerts, setAudits, setInvoices, setTickets, setPayments, setAlertRules, setMdmsStats, setSelectedMeterIntervals, setDcus, setUsers, setAnalyticsTrends, setAnalyticsDist, setNotifications, setEnergyBalance, setTariffs, setTokens, setSettings]);

  // Generate Captcha
  const generateCaptcha = useCallback(() => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchData]);

  useEffect(() => {
    if (isLoggedIn && currentUser && currentSection === 'dashboard') {
      if (currentUser.role === 'customer') {
        setCurrentSection('customer-dashboard');
      } else if (currentUser.role === 'vendor') {
        setCurrentSection('sts-prepaid');
      } else if (currentUser.role === 'tech') {
        setCurrentSection('tickets');
      }
    }
  }, [isLoggedIn, currentUser, currentSection]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.toUpperCase() !== captcha) {
      addToast('Code de vérification incorrect !', 'error');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    setIsLoginLoading(true);
    try {
      const email = loginUsername.includes('@') ? loginUsername : `${loginUsername}@nigelec.ne`;

      const res = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.split('@')[0], password: loginPassword })
      });
      const result = await res.json();

      if (!result.success) {
        addToast(result.message || 'Identifiants invalides', 'error');
        generateCaptcha();
        setCaptchaInput('');
        return;
      }

      const { user, token } = result;
      login(user, token);

      if (user.role === 'customer') {
        setCurrentSection('customer-dashboard');
      } else if (user.role === 'auditor') {
        setCurrentSection('reports');
      } else if (user.role === 'vendor') {
        setCurrentSection('sts-prepaid');
      } else if (user.role === 'tech') {
        setCurrentSection('tickets');
      } else {
        setCurrentSection('dashboard');
      }
      addToast(`Bienvenue, ${user.name} — Authentifié localement`, 'success');
    } catch (err) {
      addToast('Erreur de connexion au serveur local', 'error');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleResetPassword = async (identifier: string, newPassword?: string): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newPassword })
      });
      const result = await res.json();
      if (result.success) {
        if (newPassword) {
          addToast('Mot de passe réinitialisé avec succès !', 'success');
        } else {
          addToast('Compte identifié avec succès.', 'info');
        }
        return true;
      } else {
        addToast(result.message || 'Identifiant introuvable', 'error');
        return false;
      }
    } catch (err) {
      const clean = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      const validMockUsers = ['admin', 'tech', 'auditor', 'vendor', 'client1', 'client2'];
      if (validMockUsers.includes(clean.toLowerCase())) {
        if (newPassword) {
          addToast('Mot de passe mis à jour (Mode démo)', 'success');
        } else {
          addToast('Compte identifié (Mode démo)', 'info');
        }
        return true;
      }
      addToast('Utilisateur non trouvé', 'error');
      return false;
    }
  };

  const handleReplaceMeter = async (oldMeterId: string, newMeterId: string): Promise<{ success: boolean; transferToken?: string; creditTransferred?: number }> => {
    try {
      const oldMeter = meters.find(m => m.id === oldMeterId);
      const creditToTransfer = oldMeter ? oldMeter.credit : 0;
      const customerId = oldMeter ? oldMeter.customerId : '';

      const randomToken = `TOK-TRF-${Math.floor(10000000 + Math.random() * 90000000)}`;

      setMeters(prev => prev.map(m => {
        if (m.id === oldMeterId) {
          return { ...m, credit: 0, status: 'offline', lifecycleStatus: 'decommissioned' };
        }
        if (m.id === newMeterId) {
          return { ...m, customerId, credit: creditToTransfer, status: 'online', lifecycleStatus: 'installed' };
        }
        return m;
      }));

      addToast(`Remplacement effectué ! Solde de ${creditToTransfer.toFixed(2)} kWh transféré vers ${newMeterId}`, 'success');
      logAudit('METER_REPLACEMENT', `Remplacement compteur ${oldMeterId} -> ${newMeterId} avec transfert solde ${creditToTransfer.toFixed(2)} kWh`, newMeterId);

      return { success: true, transferToken: randomToken, creditTransferred: creditToTransfer };
    } catch (err: any) {
      addToast('Erreur lors du remplacement du compteur', 'error');
      return { success: false };
    }
  };

  const handleLogout = async () => {
    logout();
    setCurrentSection('dashboard');
    addToast('Déconnexion réussie', 'success');
  };

  const logAudit = useCallback(async (action: string, details: string, referenceId?: string) => {
    try {
      await authFetch('/api/audits', {
        method: 'POST',
        body: JSON.stringify({
          id: `AUDIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          action,
          details,
          user: currentUser?.username || 'system',
          timestamp: new Date().toISOString(),
          referenceId
        })
      });
    } catch (err) {
      console.error('Audit failed', err);
    }
  }, [authFetch, currentUser]);

  const sendSmsNotification = useCallback((phone: string, message: string, priority: 'urgent' | 'info' = 'info') => {
    console.log(`[SMS GATEWAY] To: ${phone} | Msg: ${message}`);
    addToast(`📲 SMS Envoyé au +227 ${phone}: ${message.substring(0, 40)}...`, priority === 'urgent' ? 'error' : 'success');
    logAudit(`SMS OUTGOING (${priority.toUpperCase()})`, `To: +227 ${phone} | Content: ${message}`);
  }, [addToast, logAudit]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const customerData: any = Object.fromEntries(formData.entries());

    try {
      if (editingCustomer) {
        const res = await authFetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(customerData)
        });
        if (res.ok) {
          addToast('Client mis à jour avec succès', 'success');
          fetchData();
        } else {
          const error = await res.json();
          addToast(`Erreur: ${error.message || 'Échec de la mise à jour'}`, 'error');
        }
      } else {
        const randomID = Math.random().toString(36).substr(2, 4).toUpperCase();
        const newCustomer: Customer = {
          id: `CUST-${randomID}`,
          ...customerData,
          meters: 0,
          credit: 0,
          joinDate: new Date().toISOString().split('T')[0],
          status: customerData.status || 'active'
        };
        const res = await authFetch('/api/customers', {
          method: 'POST',
          body: JSON.stringify(newCustomer)
        });
        if (res.ok) {
          addToast('Client créé avec succès', 'success');
          fetchData();
        } else {
          const error = await res.json();
          addToast(`Erreur: ${error.message || 'Échec de la création'}`, 'error');
        }
      }
    } catch (error) {
      addToast("Erreur lors de la sauvegarde du client (Réseau)", "error");
    } finally {
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        const res = await authFetch(`/api/customers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addToast('Client supprimé', 'success');
          fetchData();
          logAudit('CUSTOMER_DELETE', `Suppression du client ${id}`);
        }
      } catch (error) {
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const meterData: any = Object.fromEntries(formData.entries());
    meterData.subscribedPower = parseFloat(meterData.subscribedPower);
    if (meterData.latitude) meterData.latitude = parseFloat(meterData.latitude);
    if (meterData.longitude) meterData.longitude = parseFloat(meterData.longitude);

    try {
      if (editingMeter) {
        const res = await authFetch(`/api/meters/${editingMeter.id}`, {
          method: 'PUT',
          body: JSON.stringify(meterData)
        });
        if (res.ok) {
          addToast('Compteur mis à jour avec succès', 'success');
          fetchData();
        }
      } else {
        const newMeter: Meter = {
          id: meterData.id || `M-${Math.floor(100000 + Math.random() * 900000)}`,
          ...meterData,
          status: 'active',
          lastReading: new Date().toISOString().split('T')[0],
          totalConsumption: 0
        };
        const res = await authFetch('/api/meters', {
          method: 'POST',
          body: JSON.stringify(newMeter)
        });
        if (res.ok) {
          addToast('Compteur créé avec succès', 'success');
          fetchData();
        }
      }
    } catch (error) {
      addToast("Erreur lors de la sauvegarde du compteur", "error");
    } finally {
      setIsMeterModalOpen(false);
      setEditingMeter(null);
    }
  };

  const handleDeleteMeter = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compteur ?')) {
      try {
        const res = await authFetch(`/api/meters/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addToast('Compteur supprimé', 'success');
          fetchData();
          logAudit('METER_DELETE', `Suppression du compteur ${id}`);
        }
      } catch (error) {
        addToast('Erreur lors de la suppression du compteur', 'error');
      }
    }
  };

  const handleSaveTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const tariffData: any = Object.fromEntries(formData.entries());

    tariffData.rate = parseFloat(tariffData.rate);
    tariffData.fixedMonthlyFee = parseFloat(tariffData.fixedMonthlyFee || 0);
    tariffData.taxRate = parseFloat(tariffData.taxRate || 0);
    tariffData.isTou = formData.get('isTou') === 'on';

    try {
      const res = editingTariff
        ? await authFetch(`/api/tariffs/${editingTariff.id}`, { method: 'PUT', body: JSON.stringify({ ...tariffData, tiers: editingTiers }) })
        : await authFetch('/api/tariffs', { method: 'POST', body: JSON.stringify({ ...tariffData, id: tariffData.id || `T-${Date.now()}`, tiers: editingTiers }) });

      if (res.ok) {
        addToast('Tarif sauvegardé avec succès', 'success');
        fetchData();
        logAudit(editingTariff ? 'TARIFF_UPDATE' : 'TARIFF_CREATE', `Tarif ${tariffData.name} mis à jour/créé`);
      }
    } catch (err) {
      addToast('Erreur lors de la sauvegarde du tarif', 'error');
    } finally {
      setIsTariffModalOpen(false);
      setEditingTariff(null);
      setEditingTiers([]);
    }
  };

  const handleDeleteTariff = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      try {
        const res = await authFetch(`/api/tariffs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addToast('Tarif supprimé', 'success');
          fetchData();
          logAudit('TARIFF_DELETE', `Suppression du tarif ${id}`);
        }
      } catch (err) {
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const userData: any = Object.fromEntries(formData.entries());

    try {
      if (editingUser) {
        const res = await authFetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...editingUser, ...userData })
        });
        if (res.ok) {
          addToast('Utilisateur mis à jour avec succès', 'success');
          fetchData();
        }
      } else {
        const newUser = {
          id: `U${Math.random().toString(36).substr(2, 5)}`,
          ...userData
        };
        const res = await authFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(newUser)
        });
        if (res.ok) {
          addToast('Utilisateur créé avec succès', 'success');
          fetchData();
        }
      }
    } catch (error) {
      addToast("Erreur lors de la sauvegarde de l'utilisateur", "error");
    } finally {
      setIsUserModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addToast('Utilisateur supprimé', 'success');
          fetchData();
          logAudit('USER_DELETE', `Suppression de l'utilisateur ${id}`);
        }
      } catch (error) {
        addToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleRunBilling = async () => {
    setIsBillingLoading(true);
    setBillingProgress(10);
    try {
      await new Promise(r => setTimeout(r, 600));
      setBillingProgress(40);
      
      const res = await authFetch('/api/billing/run', { method: 'POST' });
      const data = await res.json();
      
      setBillingProgress(80);
      await new Promise(r => setTimeout(r, 400));
      setBillingProgress(100);

      if (data.success) {
        addToast(data.message, 'success');
        fetchData();
      }
    } catch (err) {
      addToast('Erreur lors du cycle de facturation', 'error');
    } finally {
      setIsBillingLoading(false);
      setTimeout(() => setBillingProgress(0), 1000);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const paymentData = Object.fromEntries(formData.entries());

    try {
      const res = await authFetch(`/api/invoices/${selectedInvoice.id}/pay`, {
        method: 'PUT',
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        addToast('Paiement initié. Traitement en cours...', 'info');
        setIsPaymentModalOpen(false);
        logAudit('PAYMENT_INIT', `Paiement initié pour facture ${selectedInvoice.id}`);
        setTimeout(fetchData, 2000);
      }
    } catch (err) {
      addToast('Erreur de paiement', 'error');
    }
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const ticketData = Object.fromEntries(formData.entries());

    try {
      if (editingTicket) {
        const res = await authFetch(`/api/tickets/${editingTicket.id}`, {
          method: 'PUT',
          body: JSON.stringify(ticketData)
        });
        if (res.ok) {
          addToast('Ticket mis à jour', 'success');
          fetchData();
        }
      } else {
        const newTicket = {
          id: `TK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          ...ticketData,
          customerId: currentUser?.associatedCustomerId || 'admin',
          status: 'Nouveau',
          timestamp: new Date().toISOString()
        };
        const res = await authFetch('/api/tickets', {
          method: 'POST',
          body: JSON.stringify(newTicket)
        });
        if (res.ok) {
          addToast('Ticket ouvert avec succès', 'success');
          fetchData();
        }
      }
    } catch (err) {
      addToast('Erreur lors de la sauvegarde du ticket', 'error');
    } finally {
      setIsTicketModalOpen(false);
      setEditingTicket(null);
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      const res = await authFetch(`/api/tickets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast(`Statut du ticket #${id} mis à jour : ${status}`, 'success');
        fetchData();
        logAudit('TICKET_UPDATE_STATUS', `Changement de statut du ticket ${id} -> ${status}`);
      }
    } catch (err) {
      addToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleUpdateAlertRule = async (rule: AlertRule) => {
    try {
      const res = await authFetch(`/api/alert_rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          notifySms: rule.notifySms,
          notifyEmail: rule.notifyEmail,
          active: rule.active
        })
      });
      if (res.ok) {
        addToast(`Règle '${rule.name}' mise à jour`, 'success');
        fetchData();
        logAudit('ALERT_RULE_UPDATE', `Mise à jour de la règle ${rule.name}`);
      }
    } catch (err) {
      addToast('Erreur lors de la mise à jour de la règle', 'error');
    }
  };

  const handleSimulateMassReading = async () => {
    try {
      addToast('Démarrage de la simulation de masse (96 intervalles/compteur)...', 'info');
      const res = await authFetch('/api/mdms/simulate-mass', {
        method: 'POST',
        body: JSON.stringify({ count: 96 })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`${data.message} (${data.durationMs}ms)`, 'success');
        fetchData();
        logAudit('MDMS_MASS_SIMULATION', `Simulation VEE massive effectuée : 96 intervalles par compteur`);
      }
    } catch (err) {
      addToast('Erreur lors de la simulation MDMS', 'error');
    }
  };

  const handleMassPayment = async () => {
    try {
      addToast('Démarrage du processus de paiement en masse...', 'info');
      const res = await authFetch('/api/invoices/pay-all', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        fetchData();
        logAudit('BILLING_MASS_PAYMENT', `Paiement en masse effectué via passerelle Mobile Money`);
      }
    } catch (err) {
      addToast('Erreur lors du paiement en masse', 'error');
    }
  };

  const handleGenerateAlertsReport = () => {
    generateAlertsReportFile(alerts);
    addToast('Rapport PDF des alertes généré avec succès', 'success');
  };

  const handleGenerateMdmsReport = () => {
    generateMdmsReportFile(mdmsStats, selectedMeterIntervals);
    addToast('Rapport PDF MDMS généré avec succès', 'success');
  };

  const handleGenerateRegulatoryReport = () => {
    generateRegulatoryReport(meters, alerts, payments, analyticsTrends, []);
    addToast('Rapport Réglementaire généré avec succès', 'success');
  };

  const handleSimulateTamper = async () => {
    const onlineMeters = meters.filter(m => m.status === 'online');
    if (onlineMeters.length === 0) {
      addToast('Aucun compteur en ligne disponible pour la simulation', 'error');
      return;
    }
    const victim = onlineMeters[Math.floor(Math.random() * onlineMeters.length)];
    handleTriggerFraud({ id: 'tamper', name: 'TAMPER (Ouverture Capot)', message: 'Ouverture de capot détectée via DLMS Case-Open bit.' }, victim.id);
  };

  const handleTriggerFraud = async (scenario: any, meterId: string) => {
    try {
      const res = await authFetch('/api/simulate/fraud', {
        method: 'POST',
        body: JSON.stringify({
          meterId,
          type: scenario.id,
          message: scenario.message
        })
      });

      if (res.ok) {
        addToast(`ALERTE CRITIQUE : ${scenario.name} simulée sur ${meterId}`, 'error');
        fetchData();
        setIsFraudModalOpen(false);
      }
    } catch (err) {
      addToast('Erreur lors de la simulation de fraude', 'error');
    }
  };

  const handleSimulateAnomaly = async (meterId: string) => {
    try {
      await authFetch('/api/simulate/anomaly', {
        method: 'POST',
        body: JSON.stringify({ meterId })
      });
      addToast(`Anomalie simulée pour le compteur ${meterId}`, 'info');
      fetchData();
    } catch (err) {
      addToast('Erreur lors de la simulation d\'anomalie', 'error');
    }
  };

  const handleResetTamper = async (meterId: string, alertId: string) => {
    const techCode = window.prompt("🔐 SÉCURITÉ NIGELEC - LEVÉE DE DOUTE\n\nSaisissez le Code Technicien pour réinitialiser le compteur :\n(Indice: 2026)");

    if (techCode === '2026') {
      setMeters(prev => prev.map(m => m.id === meterId ? { ...m, status: 'online', tamperStatus: 'clear' } : m));
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      await logAudit('RESET SÉCURITÉ', `Levée de doute confirmée sur le compteur ${meterId}. Réseau rétabli.`);
      sendSmsNotification("90xxxxxx", `Compteur ${meterId} réinitialisé avec succès. Relais refermé. Réseau OK.`, 'info');
      addToast('Compteur rétabli avec succès. Relais refermé.', 'success');
    } else if (techCode !== null) {
      addToast('Code Technicien Invalide. Action annulée et logguée.', 'error');
      await logAudit('ALERTE INTRUSION', `Tentative échouée de reset sur le compteur ${meterId} avec un code invalide.`);
    }
  };

  const handleOpenShift = (initialCash: number) => {
    const newShift: Shift = {
      id: `SHIFT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      userId: currentUser?.username || 'admin',
      startTime: new Date().toISOString(),
      initialCash: initialCash,
      expectedCash: initialCash,
      totalDigital: 0,
      status: 'open'
    };
    setCurrentShift(newShift);
    logAudit('OUVERTURE CAISSE', `Nouvelle session ouverte avec ${initialCash} FCFA en caisse.`);
    addToast('Session de caisse ouverte avec succès', 'success');
  };

  const handleCloseShift = async (finalCash: number) => {
    if (!currentShift) return;

    const shiftPayments = payments.filter(p => new Date(p.timestamp) > new Date(currentShift.startTime));
    const cashSales = shiftPayments.filter(p => ['NITA', 'AMANA', 'AGENCY', 'CASH'].includes(p.operator)).reduce((acc, p) => acc + p.amount, 0);
    const digitalSales = shiftPayments.filter(p => ['Orange', 'Airtel'].includes(p.operator)).reduce((acc, p) => acc + p.amount, 0);

    const expectedFinalCash = currentShift.initialCash + cashSales;
    const gap = finalCash - expectedFinalCash;

    const closedShift: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      finalCash: finalCash,
      expectedCash: expectedFinalCash,
      totalDigital: digitalSales,
      status: 'closed'
    };

    setCurrentShift(closedShift);
    setPastShifts(prev => [...prev, closedShift]);
    setIsShiftModalOpen(true);

    generateShiftReportPDF(closedShift);

    await logAudit('CLÔTURE CAISSE', `Session Fermée. Attendu: ${expectedFinalCash}, Réel: ${finalCash}. Écart: ${gap} FCFA.`, closedShift.id);

    if (Math.abs(gap) > 0) {
      addToast(`Écart de caisse détecté: ${gap} FCFA`, gap > 0 ? 'info' : 'error');
    } else {
      addToast('Caisse clôturée avec succès (Équilibre parfait)', 'success');
    }
  };

  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const regionData: any = Object.fromEntries(formData.entries());

    try {
      if (editingRegion) {
        const res = await authFetch(`/api/regions/${editingRegion.id}`, {
          method: 'PUT',
          body: JSON.stringify(regionData)
        });
        if (res.ok) {
          addToast('Région mise à jour', 'success');
          fetchData();
        }
      } else {
        const newRegion = {
          id: `R${Math.random().toString(36).substr(2, 5)}`,
          ...regionData
        };
        const res = await authFetch('/api/regions', {
          method: 'POST',
          body: JSON.stringify(newRegion)
        });
        if (res.ok) {
          addToast('Région créée', 'success');
          fetchData();
        }
      }
    } catch (err) {
      addToast('Erreur de sauvegarde', 'error');
    } finally {
      setIsRegionModalOpen(false);
      setEditingRegion(null);
    }
  };

  const handleSaveDcu = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const dcuData: any = Object.fromEntries(formData.entries());
    dcuData.performance = parseFloat(dcuData.performance || 100);
    dcuData.signalStrength = parseInt(dcuData.signalStrength || 80);
    dcuData.connectedMeters = parseInt(dcuData.connectedMeters || 0);
    if (dcuData.latitude) dcuData.latitude = parseFloat(dcuData.latitude);
    if (dcuData.longitude) dcuData.longitude = parseFloat(dcuData.longitude);

    try {
      if (editingDcu) {
        const res = await authFetch(`/api/dcus/${editingDcu.id}`, {
          method: 'PUT',
          body: JSON.stringify(dcuData)
        });
        if (res.ok) {
          addToast('DCU mis à jour', 'success');
          fetchData();
        }
      } else {
        const newDcu = {
          id: dcuData.id || `DCU-${Math.floor(100 + Math.random() * 900)}`,
          ...dcuData,
          lastPing: new Date().toISOString()
        };
        const res = await authFetch('/api/dcus', {
          method: 'POST',
          body: JSON.stringify(newDcu)
        });
        if (res.ok) {
          addToast('DCU créé', 'success');
          fetchData();
        }
      }
    } catch (err) {
      addToast('Erreur de sauvegarde', 'error');
    } finally {
      setIsDcuModalOpen(false);
      setEditingDcu(null);
    }
  };

  const handleDeleteDcu = async (id: string) => {
    if (confirm('Supprimer ce DCU ?')) {
      const res = await authFetch(`/api/dcus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('DCU supprimé', 'success');
        fetchData();
        logAudit('DCU_DELETE', `Suppression du DCU ${id}`);
      }
    }
  };

  const handleGenerateRegionalReport = (regionName: string) => {
    const regionalMeters = meters.filter(m => m.location.toUpperCase().includes(regionName.toUpperCase()));
    const regionalAlerts = alerts.filter(a => regionalMeters.some(m => m.id === a.meterId));
    const regionalPayments = payments.filter(p => regionalMeters.some(m => m.id === p.meterId));

    generateRegulatoryReport(regionalMeters, regionalAlerts, regionalPayments, analyticsTrends, []);
    addToast(`Rapport Régional (${regionName}) généré avec succès`, 'success');
  };

  const handleUpdateMeterLifecycle = async (meterId: string, status: Meter['lifecycleStatus']) => {
    try {
      const res = await authFetch(`/api/meters/${meterId}/lifecycle`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast(`Statut du compteur ${meterId} mis à jour`, 'success');
        fetchData();
        logAudit('METER_LIFECYCLE', `Changement de statut pour ${meterId} vers ${status}`);
      }
    } catch (err) {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (confirm('Êtes-vous sûr ?')) {
      const res = await authFetch(`/api/regions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Supprimée', 'success');
        fetchData();
        logAudit('REGION_DELETE', `Suppression de la région ${id}`);
      }
    }
  };

  const handleCalculateRecharge = (amount: number, meterId: string) => {
    const meter = meters.find(m => m.id === meterId);
    return calculateRechargeDetails(amount, meter!, TARIFFS);
  };

  const handleGenerateToken = async (type: 'recharge' | 'key-change' | 'clear-credit' | 'clear-tamper' | 'payment-mode' = 'recharge') => {
    if (!selectedMeterId) {
      addToast('Veuillez sélectionner un compteur.', 'error');
      return;
    }

    if (type === 'recharge' && rechargeAmount <= 0) {
      addToast('Veuillez saisir un montant de recharge valide.', 'error');
      return;
    }

    const meter = meters.find(m => m.id === selectedMeterId);
    if (!meter) return;

    const tokenValue = Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000)).join('-');
    const billingDetails = calculateRechargeDetails(rechargeAmount, meter, TARIFFS);
    const { kwh, tva, taxe, redevance, primeFixe, taxeORNT, taxeMunicipale } = billingDetails;
    const finalKwh = type === 'recharge' ? kwh : 0;

    const newToken: Token = {
      id: `T${Date.now()}`,
      token: tokenValue,
      rawToken: tokenValue.replace(/-/g, ''),
      amount: rechargeAmount,
      kwh: finalKwh,
      meterId: selectedMeterId,
      customerId: meter.customerId,
      timestamp: new Date(),
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'Actif',
      type,
      tva: Math.round(tva || 0),
      taxeHabitat: Math.round(taxe || 0),
      redevance: Math.round(redevance || 0),
      primeFixe: Math.round(primeFixe || 0),
      taxeORNT: Math.round(taxeORNT || 0),
      taxeMunicipale: Math.round(taxeMunicipale || 0)
    };

    setIsGeneratingToken(true);
    try {
      console.log(`[STS-DEBUG] Envoi requête génération token (${type})...`);
      const res = await authFetch('/api/tokens', {
        method: 'POST',
        body: JSON.stringify(newToken)
      });
      if (res.ok) {
        const serverToken = await res.json() as any;
        console.log('[STS-DEBUG] Réponse serveur reçue:', serverToken);
        
        const finalToken = { 
          ...newToken, 
          ...serverToken,
          tid: serverToken.tid || Math.floor(Date.now() / 60000)
        };
        
        console.log('[STS-DEBUG] Token final consolidé:', finalToken);
        
        setTokens([finalToken, ...tokens]);
        setGeneratedToken(finalToken);
        addToast(`Token ${type} généré !`, 'success');

        if (type === 'recharge') {
          const paymentData: Payment = {
            id: `PAY-STS-${Date.now()}`,
            amount: rechargeAmount,
            operator: selectedChannel,
            phone: 'DIRECT',
            meterId: selectedMeterId,
            tokenId: finalToken.id,
            status: 'Success',
            timestamp: new Date().toISOString()
          };

          authFetch('/api/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
          });
        }

        logAudit('TOKEN_GEN', `Génération token ${type} pour compteur ${selectedMeterId}`);
        fetchData();
      } else {
        addToast('Échec de la génération du token sur le serveur', 'error');
      }
    } catch (err) {
      addToast('Erreur génération token', 'error');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handlePrintReceipt = (token: Token) => {
    setGeneratedToken(token);
    logAudit('PRINT_RECEIPT', `Impression reçu pour token ${token.id}`);
  };

  const handleGenerateInvoicePDF = (inv: Invoice) => {
    const cust = customers.find(c => c.id === inv.customerId);
    generateInvoicePDF(inv, cust);
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      const promises = Object.entries(newSettings).map(([key, value]) =>
        authFetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify({ key, value })
        })
      );

      await Promise.all(promises);
      setSettings(newSettings);
      addToast('Paramètres mis à jour avec succès', 'success');
      logAudit('SETTINGS_UPDATE', `Mise à jour globale des paramètres système`);
      fetchData();
    } catch (err) {
      addToast('Erreur lors de la sauvegarde des paramètres', 'error');
    }
  };

  const handleRotateKeys = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    logAudit('KMC_KEY_ROLLOVER', 'Rotation forcée des clés Maîtresses (SGC 600451). Nouveaux KCC générés.');
    addToast('Rotation des clés terminée. Historique mis à jour.', 'success');
    fetchData();
  };

  return (
    <AmiContext.Provider value={{
      currentUser, isLoggedIn, login, logout, setCurrentUser, setIsLoggedIn,
      toasts, addToast,
      authFetch, getApiUrl,
      customers, setCustomers, meters, setMeters, tokens, setTokens,
      regions, setRegions, alerts, setAlerts, audits, setAudits,
      invoices, setInvoices, tickets, setTickets, payments, setPayments,
      dcus, setDcus, isLoading, fetchData,
      currentSection, setCurrentSection,
      isNotificationsOpen, setIsNotificationsOpen,
      sidebarOpen, setSidebarOpen,
      customerSearch, setCustomerSearch,
      mdmsSearch, setMdmsSearch,
      ticketSearch, setTicketSearch,
      meterSearch, setMeterSearch,
      customerStatusFilter, setCustomerStatusFilter,
      isFraudModalOpen, setIsFraudModalOpen,
      isBillingLoading, setIsBillingLoading,
      isPaymentModalOpen, setIsPaymentModalOpen,
      selectedInvoice, setSelectedInvoice,
      isSearchModalOpen, setIsSearchModalOpen,
      globalSearchQuery, setGlobalSearchQuery,
      isCustomerModalOpen, setIsCustomerModalOpen,
      isMeterModalOpen, setIsMeterModalOpen,
      isTariffModalOpen, setIsTariffModalOpen,
      isRegionModalOpen, setIsRegionModalOpen,
      isDcuModalOpen, setIsDcuModalOpen,
      isUserModalOpen, setIsUserModalOpen,
      isForgotPasswordModalOpen, setIsForgotPasswordModalOpen,
      isReplacementModalOpen, setIsReplacementModalOpen,
      isShiftModalOpen, setIsShiftModalOpen,
      currentShift, setCurrentShift,
      pastShifts, setPastShifts,
      isTicketModalOpen, setIsTicketModalOpen,
      editingCustomer, setEditingCustomer,
      editingMeter, setEditingMeter,
      editingTariff, setEditingTariff,
      editingTiers, setEditingTiers,
      editingRegion, setEditingRegion,
      editingDcu, setEditingDcu,
      editingTicket, setEditingTicket,
      editingUser, setEditingUser,
      generatedToken, setGeneratedToken,
      viewingMeter, setViewingMeter,
      isGeneratingToken, setIsGeneratingToken,
      loginUsername, setLoginUsername,
      loginPassword, setLoginPassword,
      isLoginLoading,
      captcha, setCaptcha,
      captchaInput, setCaptchaInput,
      tariffs, setTariffs,
      billingProgress, setBillingProgress,
      notifications, setNotifications,
      users, setUsers,
      alertRules, setAlertRules,
      mdmsStats, setMdmsStats,
      selectedMeterIntervals, setSelectedMeterIntervals,
      analyticsTrends, setAnalyticsTrends,
      analyticsDist, setAnalyticsDist,
      energyBalance, setEnergyBalance,
      settings, setSettings,
      selectedMeterId, setSelectedMeterId,
      rechargeAmount, setRechargeAmount,
      selectedChannel, setSelectedChannel,
      alertsTab, setAlertsTab,
      navItems,
      generateCaptcha,
      handleLogin,
      handleResetPassword,
      handleReplaceMeter,
      handleLogout,
      logAudit,
      sendSmsNotification,
      handleSaveCustomer,
      handleDeleteCustomer,
      handleSaveMeter,
      handleDeleteMeter,
      handleSaveTariff,
      handleDeleteTariff,
      handleSaveUser,
      handleDeleteUser,
      handleRunBilling,
      handlePayInvoice,
      handleSaveTicket,
      updateTicketStatus,
      handleUpdateAlertRule,
      handleSimulateMassReading,
      handleMassPayment,
      handleGenerateAlertsReport,
      handleGenerateMdmsReport,
      handleGenerateRegulatoryReport,
      handleSimulateTamper,
      handleTriggerFraud,
      handleSimulateAnomaly,
      handleResetTamper,
      handleOpenShift,
      handleCloseShift,
      handleSaveRegion,
      handleSaveDcu,
      handleDeleteDcu,
      handleGenerateRegionalReport,
      handleUpdateMeterLifecycle,
      handleDeleteRegion,
      handleCalculateRecharge,
      handleGenerateToken,
      handlePrintReceipt,
      handleGenerateInvoicePDF,
      handleSaveSettings,
      handleRotateKeys
    }}>
      {children}
    </AmiContext.Provider>
  );
};

export const useAmi = () => {
  const context = useContext(AmiContext);
  if (!context) {
    throw new Error('useAmi must be used within an AmiProvider');
  }
  return context;
};
