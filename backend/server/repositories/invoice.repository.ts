import { db } from '../db';
import { Invoice } from './types';

export const InvoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    return await db.prepare("SELECT * FROM invoices ORDER BY timestamp DESC").all() as Invoice[];
  },
  async updateStatus(id: string, status: string): Promise<void> {
    await db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, id);
  },
  async payAllPending(): Promise<number> {
    const pending = await db.prepare("SELECT id FROM invoices WHERE status = 'unpaid' OR status = 'overdue'").all() as { id: string }[];
    for (const inv of pending) {
      await db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(inv.id);
    }
    return pending.length;
  },
  async insert(i: Invoice): Promise<void> {
    await db.prepare(`
      INSERT INTO invoices (id, customerId, meterId, month, kwhConsumed, amountHT, tva, totalTTC, status, dueDate, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(i.id, i.customerId, i.meterId, i.month, i.kwhConsumed, i.amountHT, i.tva, i.totalTTC, i.status, i.dueDate, i.timestamp);
  }
};
