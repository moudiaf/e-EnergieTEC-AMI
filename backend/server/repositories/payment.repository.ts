import { db } from '../db';
import { Payment } from './types';

export const PaymentRepository = {
  async getAll(): Promise<Payment[]> {
    return await db.prepare("SELECT * FROM payments ORDER BY timestamp DESC").all() as Payment[];
  },
  async insert(p: Payment): Promise<void> {
    await db.prepare(`
      INSERT INTO payments (id, amount, operator, phone, meterId, tokenId, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.amount, p.operator, p.phone, p.meterId, p.tokenId, p.status, p.timestamp);
  }
};
