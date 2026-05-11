// App Version 4.4.2 - Nigelec Edition
import React, { useState, useEffect, useMemo } from 'react';
import {
  Bolt,
  LayoutDashboard,
  Coins,
  Microchip,
  Users,
  Key,
  Tags,
  PieChart,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  ArrowRight,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Printer,
  MessageSquare,
  Mail,
  CheckCircle2,
  Cpu,
  Edit,
  Trash2,
  Info,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Edit2,
  RefreshCw,
  Receipt,
  Headset,
  Smartphone,
  Database,
  Warehouse
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Customer, Meter, Token, Section, Tariff, Alert, Region, TariffTier, Audit, User as AppUser, Invoice, Ticket, Payment, AlertRule, DCU, Shift, EnergyBalance } from './types';
import { INITIAL_CUSTOMERS, INITIAL_METERS, TARIFFS, INITIAL_ALERTS } from './constants';
import { ThermalReceipt } from './components/ThermalReceipt';

import { Modal } from './components/Modal';
import { LoginForm } from './components/LoginForm';
import { ToastContainer } from './components/ToastContainer';

import { UserModal } from './components/modals/UserModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { MeterModal } from './components/modals/MeterModal';
import { TariffModal } from './components/modals/TariffModal';
import { RegionModal } from './components/modals/RegionModal';
import { DcuModal } from './components/modals/DcuModal';
import { TicketModal } from './components/modals/TicketModal';
import { SearchModal } from './components/modals/SearchModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { ViewingMeterModal } from './components/modals/ViewingMeterModal';
import { GeneratedTokenModal } from './components/modals/GeneratedTokenModal';
import { ShiftModal } from './components/modals/ShiftModal';
import { FraudSimulationModal } from './components/modals/FraudSimulationModal';
import { FRAUD_SCENARIOS } from './utils/fraudScenarios';

import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { TariffsSection } from './sections/TariffsSection';
import { DashboardSection } from './sections/DashboardSection';
import { MetersSection } from './sections/MetersSection';
import { CustomersSection } from './sections/CustomersSection';
import { TokensSection } from './sections/TokensSection';
import { MdmsSection } from './sections/MdmsSection';
import { MapSection } from './sections/MapSection';
import { TicketsSection } from './sections/TicketsSection';
import { BillingSection } from './sections/BillingSection';
import { ReportsSection } from './sections/ReportsSection';
import { AlertsSection } from './sections/AlertsSection';
import { UsersSection } from './sections/UsersSection';
import { SettingsSection } from './sections/SettingsSection';
import { StsPrepaidSection } from './sections/StsPrepaidSection';
import { AuditSection } from './sections/AuditSection';
import { PaymentsSection } from './sections/PaymentsSection';
import { RegionsSection } from './sections/RegionsSection';
import { DcusSection } from './sections/DcusSection';
import { CustomerDashboardSection } from './sections/CustomerDashboardSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { AssetsSection } from './sections/AssetsSection';
import { TicketsWrapper } from './sections/TicketsWrapper';
import { ApiDocsSection } from './sections/ApiDocsSection';
import { SecuritySection } from './sections/SecuritySection';
import { RevenueAssuranceSection } from './sections/RevenueAssuranceSection';

import { calculateRechargeDetails, calculateMonthlyInvoice } from './utils/billing';
import {
  generateInvoicePDF,
  generateRegulatoryReport,
  generateMdmsReportFile,
  generateAlertsReportFile,
  generateReceiptPDF,
  generateShiftReportPDF,
  generateEnergyLossReport,
  generateFraudRiskReport,
  generateMobileMoneyReport,
  generateSystemIntegrityReport
} from './utils/reports';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [tokenFilterDate, setTokenFilterDate] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [mdmsSearch, setMdmsSearch] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>('all');
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [mdmsStats, setMdmsStats] = useState<any>(null);
  const [selectedMeterIntervals, setSelectedMeterIntervals] = useState<any[]>([]);
  const [analyticsTrends, setAnalyticsTrends] = useState<any[]>([]);
  const [analyticsDist, setAnalyticsDist] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [energyBalance, setEnergyBalance] = useState<EnergyBalance[]>([]);
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY'>('CASH');

  const handleSimulateAnomaly = () => setIsFraudModalOpen(true);

  const handleTriggerFraud = async (scenario: (typeof FRAUD_SCENARIOS)[number], meterId: string) => {
    try {
      const res = await authFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          type: 'danger',
          category: 'fraud',
          title: `DÉTECTION: ${scenario.name}`,
          message: `${scenario.message} sur le compteur ${meterId}. Relais ouvert par précaution.`,
          meterId: meterId,
          priority: scenario.priority
        })
      });

      if (res.ok) {
        addToast(`ALERTE DÉCLENCHÉE : ${scenario.name} sur ${meterId}`, 'error');
        setIsFraudModalOpen(false);
        fetchData();
        logAudit('FRAUD_SIMULATION', `Simulation de fraude ${scenario.id} sur le compteur ${meterId}`);
      }
    } catch (err) {
      addToast('Erreur lors de la simulation', 'error');
    }
  };
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>(Object.entries(TARIFFS).map(([id, t]) => ({ ...t, id })));
  const [dcus, setDcus] = useState<DCU[]>([]);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isDcuModalOpen, setIsDcuModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<Shift | null>({
    id: `SHIFT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    userId: 'admin',
    startTime: new Date().toISOString(),
    initialCash: 50000,
    expectedCash: 50000,
    totalDigital: 0,
    status: 'open'
  });
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportTitle, setSelectedReportTitle] = useState('');

  const [generatedToken, setGeneratedToken] = useState<Token | null>(null);
  const [viewingMeter, setViewingMeter] = useState<Meter | null>(null);

  // Auth state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [alertsTab, setAlertsTab] = useState<'alerts' | 'rules'>('alerts');

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // ============================================================
  // AUTH HELPER — attaches JWT Bearer token to every API request
  // ============================================================
  const getToken = () => localStorage.getItem('ami_jwt_token');

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { ...options, headers });

    // Auto-logout if token is expired or invalid
    if (res.status === 403 || res.status === 401) {
      if (url !== '/api/login') {
        localStorage.removeItem('ami_jwt_token');
        setIsLoggedIn(false);
        setCurrentUser(null);
        addToast('Session expirée — Veuillez vous reconnecter.', 'error');
      }
    }
    return res;
  };

  // Session timeout: auto-logout after 8h
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setTimeout(() => {
      localStorage.removeItem('ami_jwt_token');
      setIsLoggedIn(false);
      setCurrentUser(null);
      addToast('Session expirée après 8 heures — Reconnectez-vous.', 'info');
    }, 8 * 60 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  // Generate Captcha
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const fetchData = async () => {
    try {
      const [
        meterData, customerData, regionData, tariffRes, alertData, auditData,
        invoiceData, ticketData, paymentData, ruleData, mdmsData, intervalData, dcuData, tokenData, settingData, userData, trendData, distData, notifData, ebData
      ] = await Promise.all([
        authFetch('/api/meters').then(r => r.json()),
        authFetch('/api/customers').then(r => r.json()),
        authFetch('/api/regions').then(r => r.json()),
        authFetch('/api/tariffs'),
        authFetch('/api/alerts').then(r => r.json()),
        authFetch('/api/audits').then(r => r.json()),
        authFetch('/api/invoices').then(r => r.json()),
        authFetch('/api/tickets').then(r => r.json()),
        authFetch('/api/payments').then(r => r.json()),
        authFetch('/api/alert_rules').then(r => r.json()),
        authFetch('/api/mdms/stats').then(r => r.json()),
        authFetch('/api/interval_data').then(r => r.json()),
        authFetch('/api/dcus').then(r => r.json()),
        authFetch('/api/tokens').then(r => r.json()),
        authFetch('/api/settings').then(r => r.json()),
        authFetch('/api/users').then(r => r.json()),
        authFetch('/api/analytics/trends').then(r => r.json()),
        authFetch('/api/analytics/distribution').then(r => r.json()),
        authFetch('/api/notifications').then(r => r.json()),
        authFetch('/api/analytics/energy-balance').then(r => r.json())
      ]);

      setMeters(meterData);
      setCustomers(customerData);
      setRegions(regionData);
      setAlerts(alertData);
      setAudits(auditData);
      setInvoices(invoiceData);
      setTickets(ticketData);
      setPayments(paymentData);
      setAlertRules(ruleData);
      setMdmsStats(mdmsData);
      setSelectedMeterIntervals(intervalData);
      if (dcuData && !dcuData.error) setDcus(dcuData);
      setUsers(userData);
      setAnalyticsTrends(trendData);
      setAnalyticsDist(distData);
      setNotifications(notifData);
      setEnergyBalance(ebData);

      const tariffData = await tariffRes.json();
      setTariffs(tariffData.map((t: any) => ({
        ...t,
        tiers: typeof t.tiers === 'string' ? JSON.parse(t.tiers) : t.tiers
      })));

      setTokens(tokenData.map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp),
        expiry: new Date(t.expiry)
      })));
      setAlerts(alertData.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      })));

      // Convert settings array to object
      const settingsObj = settingData.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      setSettings(settingsObj);

    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.toUpperCase() !== captcha) {
      addToast('Code de vérification incorrect !', 'error');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('ami_jwt_token', data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        if (data.user.role === 'customer') {
          setCurrentSection('customer-dashboard');
        } else {
          setCurrentSection('dashboard');
        }
        addToast(`Bienvenue, ${data.user.name} — Session active 8h`, 'success');
        if (data.user.role === 'vendor') setCurrentSection('sts-prepaid');
        if (data.user.role === 'tech') setCurrentSection('tickets');
      } else {
        addToast(data.message || 'Identifiants invalides', 'error');
        generateCaptcha();
        setCaptchaInput('');
      }
    } catch (err) {
      addToast('Erreur de connexion au serveur', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ami_jwt_token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentSection('dashboard');
    addToast('Déconnexion réussie', 'success');
  };

  const logAudit = async (action: string, details: string, referenceId?: string) => {
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
  };

  const sendSmsNotification = (phone: string, message: string, priority: 'urgent' | 'info' = 'info') => {
    // Simulation d'envoi via Gateway Orange/Airtel Niger
    console.log(`[SMS GATEWAY] To: ${phone} | Msg: ${message}`);
    addToast(`📲 SMS Envoyé au +227 ${phone}: ${message.substring(0, 40)}...`, priority === 'urgent' ? 'error' : 'success');

    // Ajout à l'historique d'audit pour traçabilité réglementaire
    logAudit(`SMS OUTGOING (${priority.toUpperCase()})`, `To: +227 ${phone} | Content: ${message}`);
  };

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
        // Safe ID generation: random suffix to avoid collisions
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

    // Correctly parse numeric fields for Section 4.3 compliance
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
    try {
      const res = await authFetch('/api/billing/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, 'success');
        fetchData();
        logAudit('BILLING_RUN', `Lancement du cycle de facturation global`);
      }
    } catch (err) {
      addToast('Erreur lors du cycle de facturation', 'error');
    } finally {
      setIsBillingLoading(false);
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
      const res = await authFetch(`/api/tickets/${id}`, {
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
        body: JSON.stringify({ count: 96 }) // 24h of 15min data
      });
      const data = await res.json();
      if (data.success) {
        addToast(`${data.message} (${data.durationMs}ms)`, 'success');
        fetchData();
        logAudit('MDMS_MASS_SIMULATION', `Simulation VEE massive effectuée : ${96} intervalles par compteur`);
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
    generateRegulatoryReport(meters, alerts, payments, analyticsTrends, analyticsDist);
    addToast('Rapport Réglementaire généré avec succès', 'success');
  };

  const handleSimulateTamper = async () => {
    // 1. Pick a random online meter
    const onlineMeters = meters.filter(m => m.status === 'online');
    if (onlineMeters.length === 0) {
      addToast('Aucun compteur en ligne disponible pour la simulation', 'error');
      return;
    }
    const victim = onlineMeters[Math.floor(Math.random() * onlineMeters.length)];

    try {
      // 2. Call backend to trigger real-time alert + notifications + ticket
      const res = await authFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          type: 'danger',
          title: 'DÉTECTION TAMPER (FRAUDE)',
          message: `Ouverture de capot détectée sur le compteur ${victim.id}. Circuit ouvert automatiquement par relais de sécurité.`,
          meterId: victim.id,
          priority: 'Critique'
        })
      });

      if (res.ok) {
        addToast(`ALERTE CRITIQUE : Fraude simulée sur ${victim.id}`, 'error');
        fetchData();
      }
    } catch (err) {
      addToast('Erreur lors de la simulation de fraude', 'error');
    }
  };

  const handleResetTamper = async (meterId: string, alertId: string) => {
    // Elegant Technician Verification (Simulated with Prompt for now, but logged as Tech Audit)
    const techCode = window.prompt("🔐 SÉCURITÉ NIGELEC - LEVÉE DE DOUTE\n\nSaisissez le Code Technicien pour réinitialiser le compteur :\n(Indice: 2026)");

    if (techCode === '2026') {
      setMeters(prev => prev.map(m => m.id === meterId ? { ...m, status: 'online', tamperStatus: 'clear' } : m));
      setAlerts(prev => prev.filter(a => a.id !== alertId));

      await logAudit('RESET SÉCURITÉ', `Levée de doute confirmée sur le compteur ${meterId}. Réseau rétabli.`);

      // Notify Tech via SMS
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

    // Calculate totals for current shift (mock logic for demo)
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
    setIsShiftModalOpen(true); // To show summary

    // Impression automatique du rapport pour traçabilité physique
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

  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number>(0);

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

    try {
      const res = await authFetch('/api/tokens', {
        method: 'POST',
        body: JSON.stringify(newToken)
      });
      if (res.ok) {
        setTokens([newToken, ...tokens]);
        setGeneratedToken(newToken);
        addToast(`Token ${type} généré !`, 'success');

        // Création automatique du paiement pour le journal du marchand si c'est une recharge
        if (type === 'recharge') {
          const paymentData: Payment = {
            id: `PAY-STS-${Date.now()}`,
            amount: rechargeAmount,
            operator: selectedChannel,
            phone: 'DIRECT',
            meterId: selectedMeterId,
            tokenId: newToken.id,
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
      }
    } catch (err) {
      addToast('Erreur génération token', 'error');
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
      // Simulate bulk update
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
    // Session Rollover simulation
    await new Promise(resolve => setTimeout(resolve, 2000));
    logAudit('KMC_KEY_ROLLOVER', 'Rotation forcée des clés Maîtresses (SGC 600451). Nouveaux KCC générés.');
    addToast('Rotation des clés terminée. Historique mis à jour.', 'success');
    fetchData();
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white font-outfit overflow-hidden flex">
      <Sidebar
        currentUser={currentUser}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        alerts={alerts}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-bg-main relative">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2dd4bf]/5 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-bg-dark/50 backdrop-blur-xl border-b border-brand/10 z-30">
          <div className="flex items-center gap-8">
            <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden text-gray-400 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{currentSection.replace('-', ' ')}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                <span>e-EnergieTEC</span>
                <ChevronRight size={10} />
                <span className="text-brand">Portail {currentUser?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-brand/50 transition-all w-64 group">
              <Search size={18} className="text-gray-500 group-focus-within:text-brand transition-colors" />
              <input type="text" placeholder="Rechercher..." className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-white placeholder:text-gray-600" />
            </div>

            <div className="flex items-center gap-3">
              {/* Bouton Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={cn(
                    "relative p-3 rounded-2xl border transition-all duration-300",
                    isNotificationsOpen ? "bg-brand/20 border-brand/50 text-brand" : "bg-white/5 border-white/10 text-gray-400 hover:bg-brand/10 hover:border-brand/30 hover:text-brand"
                  )}
                >
                  <Bell size={20} />
                  {alerts.filter(a => a.status === 'unread').length > 0 && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full ring-4 ring-bg-dark animate-pulse"></span>
                  )}
                </button>

                {/* Menu Déroulant Notifications */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 glass-panel rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                    >
                      <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Alertes Récentes</span>
                        <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black rounded uppercase">{alerts.filter(a => a.status === 'unread').length} Nouvelles</span>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {alerts.length === 0 ? (
                          <div className="p-8 text-center text-gray-600 text-[10px] font-bold uppercase">Aucune notification</div>
                        ) : (
                          alerts.slice(0, 5).map((alert) => (
                            <div 
                              key={alert.id} 
                              onClick={() => { setCurrentSection('alerts'); setIsNotificationsOpen(false); }}
                              className="p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                            >
                              <div className="flex gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                  alert.type === 'danger' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : alert.type === 'warning' ? "bg-orange-500" : "bg-green-500"
                                )} />
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-white group-hover:text-brand transition-colors line-clamp-1">{alert.title}</p>
                                  <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{alert.message}</p>
                                  <p className="text-[8px] text-gray-700 font-black uppercase mt-2">{format(new Date(alert.timestamp), 'HH:mm', { locale: fr })}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        onClick={() => { setCurrentSection('alerts'); setIsNotificationsOpen(false); }}
                        className="w-full py-3 bg-white/5 text-[9px] font-black text-brand uppercase tracking-widest hover:bg-brand hover:text-white transition-all border-t border-white/5"
                      >
                        Voir tout le centre de contrôle
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bouton Paramètres */}
              <button 
                onClick={() => setCurrentSection('settings')}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-brand/10 hover:border-brand/30 text-gray-400 hover:text-brand transition-all duration-300"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 p-8 pb-32 lg:pb-8 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            {currentSection === 'dashboard' && (
              <DashboardSection
                tokens={tokens}
                payments={payments}
                meters={meters}
                alerts={alerts}
                currentUser={currentUser}
                handleSimulateTamper={handleSimulateTamper}
                handleResetTamper={handleResetTamper}
                setViewingMeter={setViewingMeter}
                setCurrentSection={setCurrentSection}
              />
            )}

            {currentSection === 'meters' && (
              <MetersSection
                meters={meters}
                setViewingMeter={setViewingMeter}
                setEditingMeter={setEditingMeter}
                setIsMeterModalOpen={setIsMeterModalOpen}
                handleDeleteMeter={handleDeleteMeter}
                setCurrentSection={setCurrentSection}
              />
            )}

            {currentSection === 'customers' && (
              <CustomersSection
                customers={customers}
                customerStatusFilter={customerStatusFilter}
                setCustomerStatusFilter={setCustomerStatusFilter}
                setEditingCustomer={setEditingCustomer}
                setIsCustomerModalOpen={setIsCustomerModalOpen}
                handleDeleteCustomer={handleDeleteCustomer}
                setViewingMeter={setViewingMeter}
                meters={meters}
                setCurrentSection={setCurrentSection}
              />
            )}

            {currentSection === 'sts-prepaid' && (
              <StsPrepaidSection
                selectedMeterId={selectedMeterId}
                setSelectedMeterId={setSelectedMeterId}
                rechargeAmount={rechargeAmount}
                setRechargeAmount={setRechargeAmount}
                selectedChannel={selectedChannel}
                setSelectedChannel={setSelectedChannel}
                meters={meters}
                handleGenerateToken={handleGenerateToken}
                calculateRechargeDetails={handleCalculateRecharge}
              />
            )}

            {currentSection === 'tokens' && (
              <TokensSection
                tokens={tokens}
                handlePrintReceipt={handlePrintReceipt}
                addToast={addToast}
              />
            )}

            {currentSection === 'map' && (
              <MapSection
                meters={meters}
                dcus={dcus}
                setViewingMeter={setViewingMeter}
                targetMeter={viewingMeter}
              />
            )}


            {currentSection === 'alerts' && (
              <AlertsSection
                alerts={alerts}
                alertRules={alertRules}
                alertsTab={alertsTab}
                setAlertsTab={setAlertsTab}
                generateAlertsReportFile={handleGenerateAlertsReport}
                addToast={addToast}
                setAlerts={setAlerts}
                handleResetTamper={handleResetTamper}
                onUpdateRule={handleUpdateAlertRule}
                onSimulate={handleSimulateAnomaly}
                setViewingMeter={setViewingMeter}
                meters={meters}
                setCurrentSection={setCurrentSection}
              />
            )}

            {currentSection === 'audit' && (
              <AuditSection
                audits={audits}
                pastShifts={pastShifts}
                onRePrintShift={generateShiftReportPDF}
                onGenerateReport={() => generateRegulatoryReport(meters, alerts, payments, analyticsTrends, [])}
              />
            )}

            {currentSection === 'users' && (
              <UsersSection
                users={users}
                setEditingUser={setEditingUser}
                setIsUserModalOpen={setIsUserModalOpen}
                handleDeleteUser={handleDeleteUser}
              />
            )}

            {currentSection === 'mdms' && (
              <MdmsSection
                mdmsStats={mdmsStats}
                selectedMeterIntervals={selectedMeterIntervals}
                generateMdmsReportFile={handleGenerateMdmsReport}
                onSimulateMassReading={handleSimulateMassReading}
                fetchData={fetchData}
                setViewingMeter={setViewingMeter}
                meters={meters}
                setCurrentSection={setCurrentSection}
                mdmsSearch={mdmsSearch}
                setMdmsSearch={setMdmsSearch}
              />
            )}

            {currentSection === 'billing' && (
              <BillingSection
                invoices={invoices}
                customers={customers}
                currentUser={currentUser}
                isBillingLoading={isBillingLoading}
                handleRunBilling={handleRunBilling}
                setSelectedInvoice={setSelectedInvoice}
                setIsPaymentModalOpen={setIsPaymentModalOpen}
                handleGenerateInvoicePDF={handleGenerateInvoicePDF}
                handleMassPayment={handleMassPayment}
              />
            )}

            {currentSection === 'payments' && (
              <PaymentsSection
                payments={payments}
                currentShift={currentShift}
                onInitiatePayment={() => setCurrentSection('sts-prepaid')}
                onManageShift={() => setIsShiftModalOpen(true)}
              />
            )}


            {currentSection === 'regions' && (
              <RegionsSection
                regions={regions}
                meters={meters}
                dcus={dcus}
                setEditingRegion={setEditingRegion}
                setIsRegionModalOpen={setIsRegionModalOpen}
                handleDeleteRegion={handleDeleteRegion}
                setCurrentSection={setCurrentSection}
                setCustomerSearch={setCustomerSearch}
                setMdmsSearch={setMdmsSearch}
                setTicketSearch={setTicketSearch}
                onGenerateRegionalReport={handleGenerateRegionalReport}
                tickets={tickets}
              />
            )}

            {currentSection === 'dcus' && (
              <DcusSection
                dcus={dcus}
                setEditingDcu={setEditingDcu}
                setIsDcuModalOpen={setIsDcuModalOpen}
                handleDeleteDcu={handleDeleteDcu}
              />
            )}

            {currentSection === 'reports' && (
              <ReportsSection
                generateRegulatoryReport={() => generateRegulatoryReport(meters, alerts, payments, analyticsTrends, [])}
                onGenerateEnergyLoss={() => generateEnergyLossReport([
                  { areaName: 'Niamey - Plateau', injectedKwh: 450000, meteredKwh: 412000, lossPercentage: 8.4 },
                  { areaName: 'Niamey - Yantala', injectedKwh: 320000, meteredKwh: 265000, lossPercentage: 17.2 },
                  { areaName: 'Maradi - Centre', injectedKwh: 180000, meteredKwh: 168000, lossPercentage: 6.7 }
                ])}
                onGenerateFraudAudit={() => generateFraudRiskReport(alerts, meters)}
                onGenerateMobileMoney={() => generateMobileMoneyReport(payments)}
                onGenerateSystemIntegrity={() => generateSystemIntegrityReport(meters)}
              />
            )}

            {currentSection === 'assets' && (
              <AssetsSection
                meters={meters}
                onInstallMeter={(id) => {
                  setEditingMeter(meters.find(m => m.id === id) || null);
                  setIsMeterModalOpen(true);
                  addToast("Veuillez assigner un client et une localisation pour installer ce compteur.", "info");
                }}
                onUpdateStatus={handleUpdateMeterLifecycle}
                onAddBatch={() => addToast("Fonction de réception de lot en cours de développement", "info")}
              />
            )}

            {currentSection === 'settings' && (
              <SettingsSection
                settings={settings}
                onSave={handleSaveSettings}
              />
            )}
            {currentSection === 'security' && <SecuritySection audits={audits} onRotateKeys={handleRotateKeys} />}
            {currentSection === 'revenue-assurance' && <RevenueAssuranceSection meters={meters} tokens={tokens} onSimulateAnomaly={handleSimulateAnomaly} />}
            {currentSection === 'customer-dashboard' && currentUser?.role === 'customer' && (
              <CustomerDashboardSection
                currentUser={currentUser}
                meters={meters}
                invoices={invoices}
                fetchData={fetchData}
                setCurrentSection={setCurrentSection}
                setSelectedInvoice={setSelectedInvoice}
                setIsPaymentModalOpen={setIsPaymentModalOpen}
                handleGenerateInvoicePDF={handleGenerateInvoicePDF}
              />
            )}

            {currentSection === 'tariffs' && (
              <TariffsSection
                tariffs={tariffs}
                setEditingTariff={setEditingTariff}
                setEditingTiers={setEditingTiers}
                setIsTariffModalOpen={setIsTariffModalOpen}
                handleDeleteTariff={handleDeleteTariff}
              />
            )}

            {currentSection === 'analytics' && (
              <AnalyticsSection
                meters={meters}
                alerts={alerts}
                tokens={tokens}
                payments={payments}
                onSimulateAnomaly={handleSimulateAnomaly}
                setViewingMeter={setViewingMeter}
                setCurrentSection={setCurrentSection}
              />
            )}

            {currentSection === 'tickets' && (
              <TicketsWrapper
                tickets={tickets}
                notifications={notifications}
                currentUser={currentUser}
                setEditingTicket={setEditingTicket}
                setIsTicketModalOpen={setIsTicketModalOpen}
                updateTicketStatus={updateTicketStatus}
                ticketSearch={ticketSearch}
                setTicketSearch={setTicketSearch}
              />
            )}

            {currentSection === 'api-docs' && (
              <ApiDocsSection />
            )}

            {currentSection === 'security' && (
              <SecuritySection
                audits={audits}
                onRotateKeys={handleRotateKeys}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation */}
        {isLoggedIn && (
          <nav className="bottom-nav">
            <button
              onClick={() => setCurrentSection('dashboard')}
              className={cn("flex flex-col items-center gap-1", currentSection === 'dashboard' ? "text-brand" : "text-gray-500")}
            >
              <LayoutDashboard size={20} />
              <span className="text-[9px] font-bold uppercase">Accueil</span>
            </button>
            <button
              onClick={() => setCurrentSection('tickets')}
              className={cn("flex flex-col items-center gap-1", currentSection === 'tickets' ? "text-brand" : "text-gray-500")}
            >
              <Smartphone size={20} />
              <span className="text-[9px] font-bold uppercase">Missions</span>
            </button>
            <button
              onClick={() => setCurrentSection('alerts')}
              className={cn("flex flex-col items-center gap-1", currentSection === 'alerts' ? "text-brand" : "text-gray-500")}
            >
              <div className="relative">
                <AlertTriangle size={20} />
                {alerts.filter(a => a.status === 'unread').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-bg-dark text-[8px] flex items-center justify-center font-black">
                    {alerts.filter(a => a.status === 'unread').length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase">Alertes</span>
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-500 text-gray-500"
            >
              <Menu size={20} />
              <span className="text-[9px] font-bold uppercase">Menu</span>
            </button>
          </nav>
        )}
      </main>

      <LoginForm
        isLoggedIn={isLoggedIn}
        handleLogin={handleLogin}
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        captcha={captcha}
        captchaInput={captchaInput}
        setCaptchaInput={setCaptchaInput}
      />

      <ToastContainer toasts={toasts} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedInvoice={selectedInvoice}
        handlePayInvoice={handlePayInvoice}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        editingTicket={editingTicket}
        currentUser={currentUser}
        users={users}
        handleSaveTicket={handleSaveTicket}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => { setIsSearchModalOpen(false); setGlobalSearchQuery(''); }}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
        customers={customers}
        meters={meters}
        tokens={tokens}
        setCurrentSection={setCurrentSection}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
        editingCustomer={editingCustomer}
        tariffs={tariffs}
        handleSaveCustomer={handleSaveCustomer}
      />

      <MeterModal
        isOpen={isMeterModalOpen}
        onClose={() => { setIsMeterModalOpen(false); setEditingMeter(null); }}
        editingMeter={editingMeter}
        customers={customers}
        tariffs={tariffs}
        handleSaveMeter={handleSaveMeter}
      />

      <TariffModal
        isOpen={isTariffModalOpen}
        onClose={() => { setIsTariffModalOpen(false); setEditingTariff(null); setEditingTiers([]); }}
        editingTariff={editingTariff}
        editingTiers={editingTiers}
        setEditingTiers={setEditingTiers}
        handleSaveTariff={handleSaveTariff}
      />

      <RegionModal
        isOpen={isRegionModalOpen}
        onClose={() => { setIsRegionModalOpen(false); setEditingRegion(null); }}
        editingRegion={editingRegion}
        regions={regions}
        handleSaveRegion={handleSaveRegion}
      />

      <DcuModal
        isOpen={isDcuModalOpen}
        onClose={() => { setIsDcuModalOpen(false); setEditingDcu(null); }}
        editingDcu={editingDcu}
        regions={regions}
        handleSaveDcu={handleSaveDcu}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }}
        editingUser={editingUser}
        handleSaveUser={handleSaveUser}
      />

      <ViewingMeterModal
        viewingMeter={viewingMeter}
        onClose={() => setViewingMeter(null)}
        customers={customers}
        setCurrentSection={setCurrentSection}
        addToast={addToast}
      />

      <GeneratedTokenModal
        generatedToken={generatedToken}
        onClose={() => setGeneratedToken(null)}
        addToast={addToast}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shift={currentShift}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
      />

      <FraudSimulationModal
        isOpen={isFraudModalOpen}
        onClose={() => setIsFraudModalOpen(false)}
        meters={meters}
        onTriggerSim={handleTriggerFraud}
      />
      {generatedToken && <ThermalReceipt token={generatedToken} />}
    </div>
  );
}










