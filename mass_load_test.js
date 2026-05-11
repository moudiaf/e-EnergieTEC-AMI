import Database from 'better-sqlite3';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const isPG = process.env.DB_TYPE === 'postgres';
const dbSqlite = !isPG ? new Database('ami_smart_meter.db') : null;
const pgPool = isPG ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

console.log(`--- SIMULATION MASSIVE : MODE ${isPG ? 'POSTGRESQL (ENTERPRISE)' : 'SQLITE (LOCAL)'} ---`);

const METER_COUNT = 1000;
const READINGS_PER_METER = 1000; // Total 1,000,000 relevés

async function runSimulation() {
  const start = Date.now();

  if (isPG) {
    console.log(`[PG] Injection de ${METER_COUNT * READINGS_PER_METER} relevés via Batch Inserts...`);
    // Pour Postgres, on utilise des insertions groupées pour la performance
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      for (let m = 0; m < METER_COUNT; m++) {
        const meterId = `MTR-ENT-${2000 + m}`;
        // Simulation simplifiée pour la performance : On insère par blocs
        const values = [];
        for (let r = 0; r < READINGS_PER_METER; r++) {
          values.push(`('INT-PG-${meterId}-${r}', '${meterId}', NOW(), 0, ${Math.random() * 2}, 230, 1.2, 0.98, 'valid')`);
        }
        await client.query(`INSERT INTO interval_data (id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status) VALUES ${values.join(',')}`);
        if ((m + 1) % 100 === 0) console.log(`[PG] ${ (m + 1) * READINGS_PER_METER } relevés injectés...`);
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  } else {
    // Mode SQLite (déjà optimisé via transactions)
    const insertReading = dbSqlite.prepare(`INSERT OR IGNORE INTO interval_data (id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    for (let m = 0; m < METER_COUNT; m++) {
      const meterId = `MTR-TEST-${1000 + m}`;
      dbSqlite.transaction(() => {
        for (let r = 0; r < READINGS_PER_METER; r++) {
          insertReading.run(`INT-PERF-${meterId}-${r}`, meterId, new Date().toISOString(), 0, Math.random(), 230, 1, 0.95, 'valid');
        }
      })();
      if ((m + 1) % 100 === 0) console.log(`[SQLite] ${ (m + 1) * READINGS_PER_METER } relevés injectés...`);
    }
  }

  const duration = (Date.now() - start) / 1000;
  console.log(`\n--- TERMINÉ EN ${duration.toFixed(2)}s ---`);
  console.log(`Total : ${METER_COUNT * READINGS_PER_METER} relevés.`);
  process.exit(0);
}

runSimulation().catch(console.error);
