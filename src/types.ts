export interface Region {
  id: string;
  superiorRegionId: string | null;
  areaName: string;
  label: number;
  principal: string;
  contact: string;
  email: string;
  status: 'enabled' | 'disabled';
  blazon?: string; // Base64 or image URL
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'domestic' | 'commercial' | 'industrial' | 'social';
  meters: number;
  credit: number;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Meter {
  id: string;
  customerId: string;
  location: string;
  type: 'domestic' | 'commercial' | 'industrial' | 'social';
  credit: number;
  status: 'online' | 'warning' | 'offline' | 'danger';

  lastUpdate: string;
  power: number;
  voltage: number;
  firmware: string;
  installationDate: string;
  subscribedPower?: number;
  paymentMode?: 'prepaid' | 'postpaid';
  tamperStatus?: 'clear' | 'tampered';
  protocol?: 'Modbus RTU' | 'Modbus TCP' | 'DLMS/COSEM';
  ipAddress?: string;
  macAddress?: string;
  dcuId?: string;
  lifecycleStatus: 'in_stock' | 'installed' | 'faulty' | 'decommissioned';
  serialNumber?: string;
  batchId?: string;
  supplier?: string;
  purchaseDate?: string;
  warehouseLocation?: string;
  touEnabled?: boolean;
  solarInjection?: number; // kWh injected into grid
  mlFraudScore?: number; // 0-1 score from ML model
  latitude?: number;
  longitude?: number;
  assignedInstallerId?: string; // NEW: For lifecycle management
}

export interface DCU {
  id: string;
  name: string;
  regionId: string;
  status: 'active' | 'error' | 'offline';
  ipAddress: string;
  macAddress: string;
  firmware: string;
  lastPing: string;
  performance: number;
  latitude?: number;
  longitude?: number;

  // Metadata infrastructure
  modemType: 'GPRS' | '3G' | '4G' | 'LTE-M' | 'Ethernet' | 'PLC-G3';
  signalStrength: number; // RSSI 0-100
  connectedMeters: number;
  cpuUsage?: number;
  memUsage?: number;
}

export interface Token {
  id: string;
  token: string;
  rawToken: string;
  amount: number;
  kwh: number;
  meterId: string;
  customerId: string;
  timestamp: Date;
  expiry: Date;
  status: 'Actif' | 'Utilisé';
  type: 'recharge' | 'key-change' | 'clear-credit' | 'clear-tamper' | 'payment-mode';
  tva?: number;
  taxeHabitat?: number;
  redevance?: number;
  primeFixe?: number;
  taxeORNT?: number;
  taxeMunicipale?: number;
}

export interface TariffTier {
  id: string;
  minKwh: number;
  maxKwh: number | null;
  rate: number;
  primeFixe: number;
  taxeHabitat: number;
  redevance: number;
  vatRate?: number; // NEW: Added for Section 4.3 compliance
}

export interface Tariff {
  id?: string;
  rate: number;
  name: string;
  description: string;
  minConsumption: number;
  maxConsumption: number;
  tiers?: TariffTier[];
  isTou?: boolean;
  touRates?: { slot: string; rate: number }[];
  fixedMonthlyFee?: number; // NEW: Added for Section 4.3 compliance
  taxRate?: number; // NEW: Added for Section 4.3 compliance
  currency?: string;
}

export type Section =
  | 'dashboard'
  | 'sts-prepaid'
  | 'meters'
  | 'customers'
  | 'tokens'
  | 'tariffs'
  | 'analytics'
  | 'consumption'
  | 'alerts'
  | 'reports'
  | 'settings'
  | 'regions'
  | 'map'
  | 'audit'
  | 'billing'
  | 'tickets'
  | 'payments'
  | 'customer-dashboard'
  | 'users'
  | 'dcus'
  | 'mdms'
  | 'assets'
  | 'api-docs'
  | 'security'
  | 'revenue-assurance';

export interface IntervalData {
  id: string;
  meterId: string;
  timestamp: string;
  reading: number;
  consumption: number;
  voltage: number;
  current: number;
  powerFactor: number;
  status: 'valid' | 'estimated' | 'invalid';
  validationNotes: string;
}

export interface MDMSStats {
  totalReadings: number;
  validationStats: { status: string, count: number }[];
  peakConsumption: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  category: 'fraud' | 'maintenance' | 'battery' | 'communication' | 'standard' | 'billing';
  priority: 'Basse' | 'Moyenne' | 'Haute' | 'Critique';
  title: string;
  message: string;
  timestamp: Date | string;
  status: 'read' | 'unread';
  meterId?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: 'tamper' | 'low_credit' | 'offline' | 'overvoltage';
  notifySms: boolean;
  notifyEmail: boolean;
  active: boolean;
}

export interface Audit {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
  referenceId?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'vendor' | 'tech' | 'customer' | 'billing';
  name: string;
  associatedCustomerId?: string; // For customer role
}

export interface Invoice {
  id: string;
  customerId: string;
  meterId: string;
  month: string;
  kwhConsumed: number;
  amountHT: number;
  tva: number;
  totalTTC: number;
  status: 'unpaid' | 'paid' | 'overdue';
  type: 'prepaid' | 'postpaid';
  dueDate: string;
  timestamp: string;
  rate?: number;
  taxe?: number;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerId: string;
  meterId: string;
  status: 'Nouveau' | 'Ouvert' | 'En attente' | 'Résolu' | 'Fermé';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Critique';
  assignedTo: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  amount: number;
  operator: 'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY';
  phone: string;
  meterId: string;
  tokenId?: string;
  status: 'Pending' | 'Success' | 'Failed';
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  finalCash?: number;
  expectedCash: number;
  totalDigital: number;
  status: 'open' | 'closed';
}

export interface EnergyBalance {
  id: string;
  regionId: string;
  areaName: string;
  injectedKwh: number;
  meteredKwh: number;
  lossesKwh: number;
  lossPercentage: number;
  timestamp: string;
}
