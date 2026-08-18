import { db, isEnterpriseMode } from '../db';
import { Setting } from './types';

export const SettingRepository = {
  async getAll(): Promise<Setting[]> {
    return await db.prepare("SELECT * FROM settings").all() as Setting[];
  },
  async getByKey(key: string): Promise<Setting | undefined> {
    return await db.prepare("SELECT * FROM settings WHERE key = ?").get(key) as Setting | undefined;
  },
  async upsert(key: string, value: string): Promise<void> {
    const sql = isEnterpriseMode 
      ? "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
      : "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
    await db.prepare(sql).run(key, value);
  }
};
