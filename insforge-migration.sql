-- 1. Create Core Tables
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meters (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(id),
    dcu_id VARCHAR(50),
    type VARCHAR(50),
    firmware VARCHAR(50),
    protocol VARCHAR(50) DEFAULT 'DLMS/COSEM',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'online',
    tou_enabled BOOLEAN DEFAULT FALSE,
    installed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS dcus (
    id VARCHAR(50) PRIMARY KEY,
    region_id VARCHAR(50),
    ip_address VARCHAR(50),
    mac_address VARCHAR(50) UNIQUE,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS meter_readings (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    meter_id VARCHAR(50) NOT NULL REFERENCES meters(id),
    active_energy DECIMAL(15, 3),
    reactive_energy DECIMAL(15, 3),
    voltage_l1 DECIMAL(6, 2),
    voltage_l2 DECIMAL(6, 2),
    voltage_l3 DECIMAL(6, 2),
    current_l1 DECIMAL(6, 2),
    current_l2 DECIMAL(6, 2),
    current_l3 DECIMAL(6, 2),
    quality_flag INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_meter_readings_meter_id_time ON meter_readings (meter_id, time DESC);

CREATE TABLE IF NOT EXISTS sts_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id VARCHAR(50) REFERENCES meters(id),
    amount DECIMAL(10, 2) NOT NULL,
    kwh DECIMAL(10, 3),
    token VARCHAR(25) UNIQUE NOT NULL,
    operator VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
