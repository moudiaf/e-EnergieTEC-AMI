-- ======================================================================
-- NIGELEC AMI-MDMS : SCHEMA INITIALISATION POUR POSTGRESQL + TIMESCALEDB
-- Ce script prépare la base de données de production Tier-1.
-- ======================================================================

-- 1. Activer l'extension TimescaleDB pour la gestion Massive des Séries Temporelles (Load Profiles)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Création des tables Core (Relationnel classique)
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

-- 3. Création de la table Time-Series (Hypertable TimescaleDB) pour les Index/VEE
CREATE TABLE IF NOT EXISTS meter_readings (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    meter_id VARCHAR(50) NOT NULL REFERENCES meters(id),
    active_energy DECIMAL(15, 3),    -- En kWh
    reactive_energy DECIMAL(15, 3),  -- En kVARh
    voltage_l1 DECIMAL(6, 2),        -- Tension
    voltage_l2 DECIMAL(6, 2),
    voltage_l3 DECIMAL(6, 2),
    current_l1 DECIMAL(6, 2),
    current_l2 DECIMAL(6, 2),
    current_l3 DECIMAL(6, 2),
    quality_flag INTEGER DEFAULT 0   -- Drapeau VEE (Validation, Estimation, Editing)
);

-- 4. Conversion de la table classique en Hypertable optimisée (Partitionnement automatique)
-- Partitionnement temporel sur un intervalle de 7 jours (idéal pour la conservation analytique)
SELECT create_hypertable('meter_readings', 'time', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);

-- 5. Indexation pour des temps de réponse sous la milliseconde
CREATE INDEX ix_meter_readings_meter_id_time ON meter_readings (meter_id, time DESC);

-- 6. Table pour les Transactions Financières Sécurisées
CREATE TABLE IF NOT EXISTS sts_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id VARCHAR(50) REFERENCES meters(id),
    amount DECIMAL(10, 2) NOT NULL,
    kwh DECIMAL(10, 3),
    token VARCHAR(25) UNIQUE NOT NULL, -- 20-digit STS
    operator VARCHAR(50), -- NITA, AMANA, Orange, Airtel
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: Ce schéma permet la scalabilité horizontale pour 1,000,000+ de compteurs relevant toutes les 15 minutes.
