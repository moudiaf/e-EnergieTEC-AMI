import { db } from '../db';

export const auditService = {
  async log(action: string, details: string, user: string = 'SYSTEM', actionId?: string) {
    const id = actionId || `AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audits(id, action, details, "user", timestamp)
      VALUES(?, ?, ?, ?, ?)
    `);
    
    try {
      await stmt.run(id, action, details, user, timestamp);
      console.log(`[AUDIT] ${action}: ${details} (${user})`);
    } catch (err) {
      console.error("[AUDIT] Failed to log action:", err);
    }
  }
};
