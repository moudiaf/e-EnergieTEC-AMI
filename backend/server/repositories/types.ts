export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  meters: number;
  credit: number;
  address: string;
  joinDate: string;
  status: string;
  regionId: string;
}

export interface Meter {
  id: string;
  customerId: string | null;
  location: string;
  type: string;
  credit: number;
  status: string;
  lastUpdate: string;
  power: number;
  voltage: number;
  firmware: string;
  installationDate: string | null;
  subscribedPower: number;
  paymentMode: string;
  tamperStatus: string;
  protocol: string;
  lastReading: string | null;
  totalConsumption: number;
  lifecycleStatus: string;
  serialNumber: string;
  batchId: string;
  supplier: string;
  purchaseDate: string | null;
  warehouseLocation: string;
  touEnabled: number;
  solarInjection: number;
  mlFraudScore: number;
  latitude: number | null;
  longitude: number | null;
  dcuId: string | null;
  registeredAt: string;
  phaseType: string;
  transformerId: string | null;
  lastTid: number;
}

export interface Token {
  id: string;
  token: string;
  rawToken: string;
  amount: number;
  kwh: number;
  meterId: string;
  customerId: string;
  timestamp: string;
  expiry: string;
  status: string;
  type: string;
  tid: number;
}

export interface Alert {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  meterId: string | null;
}

export interface Tariff {
  id: string;
  name: string;
  rate: number;
  description: string;
  tiers: string;
  isTou: number;
  touRates: string | null;
  fixedMonthlyFee: number;
  taxRate: number;
  currency: string;
}

export interface DCU {
  id: string;
  name: string;
  regionId: string;
  status: string;
  ipAddress: string;
  macAddress: string;
  firmware: string;
  lastPing: string;
  performance: number;
  latitude: number;
  longitude: number;
  modemType: string;
  signalStrength: number;
  connectedMeters: number;
  cpuUsage: number;
  memUsage: number;
}

export interface Region {
  id: string;
  superiorRegionId: string | null;
  areaName: string;
  label: number;
  principal: string;
  contact: string;
  email: string;
  status: string;
  blazon: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerId: string | null;
  meterId: string | null;
  status: string;
  priority: string;
  assignedTo: string;
  timestamp: string;
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
  status: string;
  dueDate: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  amount: number;
  operator: string;
  phone: string;
  meterId: string;
  tokenId: string | null;
  status: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: string;
  name: string;
  associatedCustomerId: string | null;
}

export interface Audit {
  id: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface IntervalData {
  id: string;
  meterId: string;
  timestamp: string;
  reading: number;
  consumption: number;
  voltage: number;
  current: number;
  powerFactor: number;
  status: string;
  validationNotes: string;
  voltageL1?: number | null;
  voltageL2?: number | null;
  voltageL3?: number | null;
  currentL1?: number | null;
  currentL2?: number | null;
  currentL3?: number | null;
  voltageUnbalance?: number | null;
}
