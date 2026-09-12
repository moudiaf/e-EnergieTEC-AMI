import { db } from '../db';
import { Token } from './types';

export const TokenRepository = {
  async getAll(): Promise<Token[]> {
    return await db.prepare("SELECT * FROM tokens ORDER BY timestamp DESC").all() as Token[];
  },
  async insert(t: Token): Promise<void> {
    await db.prepare(`
      INSERT INTO tokens (id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type, tid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.id, t.token, t.rawToken, t.amount, t.kwh, t.meterId, t.customerId, t.timestamp, t.expiry, t.status, t.type, t.tid);
  }
};
