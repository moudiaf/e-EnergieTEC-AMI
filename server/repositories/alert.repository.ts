import { db } from '../db';
import { Alert } from './types';

export const AlertRepository = {
  async getAll(): Promise<Alert[]> {
    return await db.prepare("SELECT * FROM alerts ORDER BY timestamp DESC").all() as Alert[];
  },
  async insert(a: Alert): Promise<void> {
    await db.prepare(`
      INSERT INTO alerts (id, type, title, message, meterId, timestamp, status, priority, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.type, a.title, a.message, a.meterId, a.timestamp, a.status, a.priority, a.category);
  },
  async updateStatus(id: string, status: string): Promise<void> {
    await db.prepare("UPDATE alerts SET status = ? WHERE id = ?").run(status, id);
  }
};
