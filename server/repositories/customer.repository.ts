import { db } from '../db';
import { Customer } from './types';

export const CustomerRepository = {
  async getAll(): Promise<Customer[]> {
    return await db.prepare("SELECT * FROM customers").all() as Customer[];
  },
  async getById(id: string): Promise<Customer | undefined> {
    return await db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as Customer | undefined;
  },
  async insert(c: Customer): Promise<void> {
    await db.prepare(`
      INSERT INTO customers (id, name, email, phone, type, meters, credit, address, joinDate, status, regionId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.email, c.phone, c.type, c.meters, c.credit, c.address, c.joinDate, c.status, c.regionId);
  },
  async delete(id: string): Promise<void> {
    await db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  },
  async update(id: string, c: Partial<Customer>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) return;
    const name = c.name ?? existing.name;
    const email = c.email ?? existing.email;
    const phone = c.phone ?? existing.phone;
    const type = c.type ?? existing.type;
    const meters = c.meters ?? existing.meters;
    const credit = c.credit ?? existing.credit;
    const address = c.address ?? existing.address;
    const joinDate = c.joinDate ?? existing.joinDate;
    const status = c.status ?? existing.status;
    const regionId = c.regionId ?? existing.regionId;

    await db.prepare(`
      UPDATE customers SET name = ?, email = ?, phone = ?, type = ?, meters = ?, credit = ?, address = ?, joinDate = ?, status = ?, regionId = ?
      WHERE id = ?
    `).run(name, email, phone, type, meters, credit, address, joinDate, status, regionId, id);
  }
};
