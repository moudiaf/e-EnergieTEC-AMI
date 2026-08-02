// ======================================================================
// e-EnergieTEC : DEFINITIONS DE SCHEMA DE BASE DE DONNEES (SQL STATIQUE)
// ======================================================================

export const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    type TEXT,
    meters INTEGER DEFAULT 0,
    credit REAL DEFAULT 0,
    address TEXT,
    joinDate TEXT,
    status TEXT DEFAULT 'active',
    regionId TEXT
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
    modemType TEXT DEFAULT 'GPRS',
    signalStrength INTEGER DEFAULT 80,
    connectedMeters INTEGER DEFAULT 0,
    cpuUsage REAL DEFAULT 15.5,
    memUsage REAL DEFAULT 42.0
  );

  CREATE TABLE IF NOT EXISTS meters (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    location TEXT,
    type TEXT,
    credit REAL DEFAULT 0,
    status TEXT DEFAULT 'online',
    lastUpdate TEXT,
    power REAL DEFAULT 0,
    voltage REAL DEFAULT 0,
    firmware TEXT,
    installationDate TEXT,
    subscribedPower REAL DEFAULT 9.0,
    paymentMode TEXT DEFAULT 'prepaid',
    tamperStatus TEXT DEFAULT 'clear',
    protocol TEXT DEFAULT 'DLMS/COSEM',
    lastReading DATE,
    totalConsumption REAL DEFAULT 0,
    lifecycleStatus TEXT DEFAULT 'installed',
    serialNumber TEXT,
    batchId TEXT,
    supplier TEXT,
    purchaseDate DATE,
    warehouseLocation TEXT,
    touEnabled INTEGER DEFAULT 0,
    solarInjection REAL DEFAULT 0,
    mlFraudScore REAL DEFAULT 0,
    latitude REAL,
    longitude REAL,
    dcuId TEXT,
    registeredAt TEXT,
    phaseType TEXT DEFAULT 'monophase',
    transformerId TEXT,
    lastTid INTEGER DEFAULT 0,
    ipAddress TEXT,
    macAddress TEXT,
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
    tid INTEGER,
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
    tiers TEXT DEFAULT '[]',
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
    voltageL1 REAL,
    voltageL2 REAL,
    voltageL3 REAL,
    currentL1 REAL,
    currentL2 REAL,
    currentL3 REAL,
    voltageUnbalance REAL,
    FOREIGN KEY(meterId) REFERENCES meters(id)
  );

  CREATE INDEX IF NOT EXISTS idx_interval_meter_time ON interval_data(meterId, timestamp);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assignedTo);
  CREATE INDEX IF NOT EXISTS idx_tokens_meter ON tokens(meterId);
`;

export const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    type VARCHAR(50),
    meters INTEGER DEFAULT 0,
    credit DOUBLE PRECISION DEFAULT 0,
    address TEXT,
    joinDate VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    regionId VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS dcus (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    regionId VARCHAR(255),
    status VARCHAR(50),
    ipAddress VARCHAR(50),
    macAddress VARCHAR(50),
    firmware VARCHAR(50),
    lastPing VARCHAR(50),
    performance DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    modemType VARCHAR(50) DEFAULT 'GPRS',
    signalStrength INTEGER DEFAULT 80,
    connectedMeters INTEGER DEFAULT 0,
    cpuUsage DOUBLE PRECISION DEFAULT 15.5,
    memUsage DOUBLE PRECISION DEFAULT 42.0
  );

  CREATE TABLE IF NOT EXISTS meters (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255) REFERENCES customers(id),
    location TEXT,
    type VARCHAR(50),
    credit DOUBLE PRECISION DEFAULT 0,
    status VARCHAR(50) DEFAULT 'online',
    lastUpdate VARCHAR(50),
    power DOUBLE PRECISION DEFAULT 0,
    voltage DOUBLE PRECISION DEFAULT 0,
    firmware VARCHAR(50),
    installationDate VARCHAR(50),
    subscribedPower DOUBLE PRECISION DEFAULT 9.0,
    paymentMode VARCHAR(50) DEFAULT 'prepaid',
    tamperStatus VARCHAR(50) DEFAULT 'clear',
    protocol VARCHAR(50) DEFAULT 'DLMS/COSEM',
    lastReading DATE,
    totalConsumption DOUBLE PRECISION DEFAULT 0,
    lifecycleStatus VARCHAR(50) DEFAULT 'installed',
    serialNumber VARCHAR(100),
    batchId VARCHAR(100),
    supplier VARCHAR(100),
    purchaseDate DATE,
    warehouseLocation TEXT,
    touEnabled INTEGER DEFAULT 0,
    solarInjection DOUBLE PRECISION DEFAULT 0,
    mlFraudScore DOUBLE PRECISION DEFAULT 0,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    dcuId VARCHAR(255) REFERENCES dcus(id),
    registeredAt VARCHAR(50),
    phaseType VARCHAR(50) DEFAULT 'monophase',
    transformerId VARCHAR(255),
    lastTid INTEGER DEFAULT 0,
    ipAddress VARCHAR(50),
    macAddress VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id VARCHAR(255) PRIMARY KEY,
    token VARCHAR(50),
    rawToken VARCHAR(50),
    amount DOUBLE PRECISION,
    kwh DOUBLE PRECISION,
    meterId VARCHAR(255) REFERENCES meters(id),
    customerId VARCHAR(255) REFERENCES customers(id),
    timestamp VARCHAR(50),
    expiry VARCHAR(50),
    status VARCHAR(50),
    type VARCHAR(50),
    tid INTEGER
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50),
    category VARCHAR(50) DEFAULT 'standard',
    priority VARCHAR(50) DEFAULT 'Moyenne',
    title VARCHAR(255),
    message TEXT,
    timestamp VARCHAR(50),
    status VARCHAR(50),
    meterId VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS tariffs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    rate DOUBLE PRECISION,
    description TEXT,
    tiers TEXT DEFAULT '[]',
    isTou INTEGER DEFAULT 0,
    touRates TEXT,
    fixedMonthlyFee DOUBLE PRECISION DEFAULT 0,
    taxRate DOUBLE PRECISION DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'FCFA'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR(255) PRIMARY KEY,
    superiorRegionId VARCHAR(255) REFERENCES regions(id),
    areaName VARCHAR(255),
    label INTEGER,
    principal VARCHAR(255),
    contact VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50),
    blazon TEXT
  );

  CREATE TABLE IF NOT EXISTS audits (
    id VARCHAR(255) PRIMARY KEY,
    action VARCHAR(255),
    details TEXT,
    "user" VARCHAR(255),
    timestamp VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50),
    name VARCHAR(255),
    associatedCustomerId VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255),
    meterId VARCHAR(255),
    month VARCHAR(50),
    kwhConsumed DOUBLE PRECISION,
    amountHT DOUBLE PRECISION,
    tva DOUBLE PRECISION,
    totalTTC DOUBLE PRECISION,
    status VARCHAR(50),
    dueDate VARCHAR(50),
    timestamp VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(255) PRIMARY KEY,
    subject VARCHAR(255),
    description TEXT,
    customerId VARCHAR(255),
    meterId VARCHAR(255),
    status VARCHAR(50),
    priority VARCHAR(50),
    assignedTo VARCHAR(255),
    timestamp VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    amount DOUBLE PRECISION,
    operator VARCHAR(50),
    phone VARCHAR(50),
    meterId VARCHAR(255),
    tokenId VARCHAR(255),
    status VARCHAR(50),
    timestamp VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    userId VARCHAR(255),
    type VARCHAR(50),
    recipient VARCHAR(255),
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(50),
    timestamp VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS alert_rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    condition VARCHAR(255),
    notifySms BOOLEAN,
    notifyEmail BOOLEAN,
    active BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS interval_data (
    id VARCHAR(255) PRIMARY KEY,
    meterId VARCHAR(255) REFERENCES meters(id),
    timestamp VARCHAR(50),
    reading DOUBLE PRECISION,
    consumption DOUBLE PRECISION,
    voltage DOUBLE PRECISION,
    current DOUBLE PRECISION,
    powerFactor DOUBLE PRECISION,
    status VARCHAR(50),
    validationNotes TEXT,
    voltageL1 DOUBLE PRECISION,
    voltageL2 DOUBLE PRECISION,
    voltageL3 DOUBLE PRECISION,
    currentL1 DOUBLE PRECISION,
    currentL2 DOUBLE PRECISION,
    currentL3 DOUBLE PRECISION,
    voltageUnbalance DOUBLE PRECISION
  );

  CREATE INDEX IF NOT EXISTS idx_interval_meter_time ON interval_data(meterId, timestamp);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assignedTo);
  CREATE INDEX IF NOT EXISTS idx_tokens_meter ON tokens(meterId);
`;
