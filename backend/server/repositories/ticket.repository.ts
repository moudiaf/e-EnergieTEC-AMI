import { db } from '../db';
import { Ticket } from './types';

export const TicketRepository = {
  async getAll(): Promise<Ticket[]> {
    return await db.prepare("SELECT * FROM tickets ORDER BY timestamp DESC").all() as Ticket[];
  },
  async insert(t: Ticket): Promise<void> {
    await db.prepare(`
      INSERT INTO tickets (id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.id, t.subject, t.description, t.customerId, t.meterId, t.status, t.priority, t.assignedTo, t.timestamp);
  },
  async update(id: string, t: Ticket): Promise<void> {
    await db.prepare(`
      UPDATE tickets 
      SET subject = ?, description = ?, customerId = ?, meterId = ?, status = ?, priority = ?, assignedTo = ?
      WHERE id = ?
    `).run(t.subject, t.description, t.customerId, t.meterId, t.status, t.priority, t.assignedTo, id);
  },
  async updateStatus(id: string, status: string): Promise<void> {
    const now = new Date().toISOString();
    await db.prepare("UPDATE tickets SET status = ?, timestamp = ? WHERE id = ?").run(status, now, id);
  }
};
