import Database from "better-sqlite3";
import pg from "pg";
const { Pool } = pg;
import dotenv from 'dotenv';
import { SQLITE_SCHEMA, POSTGRES_SCHEMA } from './db/schema';

dotenv.config();

export const isEnterpriseMode = process.env.DB_TYPE === 'postgres';

const pgPool = isEnterpriseMode ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}) : null;

const sqliteDb = !isEnterpriseMode ? new Database("ami_smart_meter.db") : null;
if (sqliteDb) {
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('synchronous = NORMAL');
  sqliteDb.pragma('busy_timeout = 5000');
}

/**
 * Traduit de façon sécurisée les placeholders "?" en "$1, $2..." pour PostgreSQL
 * en ignorant les points d'interrogation dans les chaînes de caractères littérales.
 */
function translatePlaceholders(sql: string): string {
  let count = 1;
  let inString = false;
  let stringChar = '';
  let result = '';
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if ((char === "'" || char === '"' || char === '`') && sql[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    if (char === '?' && !inString) {
      result += `$${count++}`;
    } else {
      result += char;
    }
  }
  return result;
}

export const db = {
  /**
   * Initialise les tables et le schéma de la base de données selon le dialecte
   */
  async initSchema() {
    console.log(`[DB] Initialisation du schéma en mode : ${isEnterpriseMode ? 'PostgreSQL' : 'SQLite'}`);
    if (isEnterpriseMode) {
      // Pour PostgreSQL, on exécute le schéma complet par blocs ou en une seule transaction
      await pgPool!.query(POSTGRES_SCHEMA);
    } else {
      sqliteDb!.exec(SQLITE_SCHEMA);
      // Migration dynamique des colonnes manquantes
      try {
        const cols = (sqliteDb!.prepare("PRAGMA table_info(meters)").all() as any[]).map(c => c.name);
        const migrations: [string, string][] = [
          ['totalConsumption', 'REAL DEFAULT 0'],
          ['current', 'REAL DEFAULT 0'],
          ['frequency', 'REAL DEFAULT 50.0'],
          ['powerFactor', 'REAL DEFAULT 0.98'],
          ['voltageL2', 'REAL DEFAULT 0'],
          ['voltageL3', 'REAL DEFAULT 0'],
          ['currentL2', 'REAL DEFAULT 0'],
          ['currentL3', 'REAL DEFAULT 0'],
          ['powerL2', 'REAL DEFAULT 0'],
          ['powerL3', 'REAL DEFAULT 0'],
          ['lastTelemetrySync', 'TEXT'],
          ['relayStatus', "TEXT DEFAULT 'CLOSED'"],
        ];
        for (const [col, def] of migrations) {
          if (!cols.includes(col)) {
            sqliteDb!.exec(`ALTER TABLE meters ADD COLUMN ${col} ${def};`);
            console.log(`[DB] Colonne '${col}' ajoutée à la table meters.`);
          }
        }
      } catch (e: any) {
        console.error("[DB] Erreur migration meters:", e.message);
      }
    }
  },

  async exec(sql: string) {
    if (isEnterpriseMode) {
      return pgPool!.query(sql);
    }
    return sqliteDb!.exec(sql);
  },
  
  prepare(sql: string) {
    const pgSql = isEnterpriseMode ? translatePlaceholders(sql) : sql;

    return {
      async all(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return res.rows;
        }
        return sqliteDb!.prepare(sql).all(...params);
      },
      async get(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return res.rows[0];
        }
        return sqliteDb!.prepare(sql).get(...params);
      },
      async run(...params: any[]) {
        if (isEnterpriseMode) {
          const res = await pgPool!.query(pgSql, params);
          return { changes: res.rowCount, lastInsertRowid: null };
        }
        return sqliteDb!.prepare(sql).run(...params);
      }
    };
  },

  transaction(fn: () => void) {
    if (isEnterpriseMode) {
      // Simulé pour PostgreSQL dans ce wrapper léger
      return fn();
    }
    return sqliteDb!.transaction(fn)();
  }
};
