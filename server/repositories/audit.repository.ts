import { db } from '../db';
import { Audit } from './types';

export const AuditRepository = {
  async getAll(): Promise<Audit[]> {
    return await db.prepare("SELECT * FROM audits ORDER BY timestamp DESC").all() as Audit[];
  },
  async getRecent(limit = 100): Promise<Audit[]> {
    return await db.prepare("SELECT * FROM audits ORDER BY timestamp DESC LIMIT ?").all(limit) as Audit[];
  },
  async getNotifications(limit = 20): Promise<Audit[]> {
    return await db.prepare("SELECT * FROM audits WHERE action = 'NOTIFICATION' ORDER BY timestamp DESC LIMIT ?").all(limit) as Audit[];
  },
  async insert(a: Audit): Promise<void> {
    await db.prepare(`
      INSERT INTO audits (id, action, details, "user", timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(a.id, a.action, a.details, a.user, a.timestamp);
  }
};
