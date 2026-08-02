import { db } from '../db';
import { Tariff } from './types';

export const TariffRepository = {
  async getAll(): Promise<Tariff[]> {
    return await db.prepare("SELECT * FROM tariffs").all() as Tariff[];
  },
  async getById(id: string): Promise<Tariff | undefined> {
    return await db.prepare("SELECT * FROM tariffs WHERE id = ?").get(id) as Tariff | undefined;
  },
  async insert(t: Tariff): Promise<void> {
    await db.prepare(`
      INSERT INTO tariffs (id, name, rate, description, tiers, isTou, touRates, fixedMonthlyFee, taxRate, currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.id, t.name, t.rate, t.description, t.tiers, t.isTou, t.touRates, t.fixedMonthlyFee, t.taxRate, t.currency);
  },
  async update(id: string, t: Tariff): Promise<void> {
    await db.prepare(`
      UPDATE tariffs 
      SET name = ?, rate = ?, description = ?, tiers = ?, isTou = ?, touRates = ?, fixedMonthlyFee = ?, taxRate = ?, currency = ?
      WHERE id = ?
    `).run(t.name, t.rate, t.description, t.tiers, t.isTou, t.touRates, t.fixedMonthlyFee, t.taxRate, t.currency, id);
  }
};
