import { db } from '../db';
import { Meter } from './types';

export const MeterRepository = {
  async getAll(): Promise<Meter[]> {
    return await db.prepare("SELECT * FROM meters").all() as Meter[];
  },
  async getById(id: string): Promise<Meter | undefined> {
    return await db.prepare("SELECT * FROM meters WHERE id = ?").get(id) as Meter | undefined;
  },
  async updateTamperStatus(id: string, tamperStatus: string): Promise<void> {
    await db.prepare("UPDATE meters SET tamperStatus = ? WHERE id = ?").run(tamperStatus, id);
  },
  async updateLifecycleStatus(id: string, status: string): Promise<void> {
    await db.prepare("UPDATE meters SET lifecycleStatus = ? WHERE id = ?").run(status, id);
  },
  async updateCreditAndTid(id: string, credit: number, tid: number): Promise<void> {
    await db.prepare("UPDATE meters SET credit = ?, lastTid = ? WHERE id = ?").run(credit, tid, id);
  },
  async updateTid(id: string, tid: number): Promise<void> {
    await db.prepare("UPDATE meters SET lastTid = ? WHERE id = ?").run(tid, id);
  },
  async clearCredit(id: string): Promise<void> {
    await db.prepare("UPDATE meters SET credit = 0 WHERE id = ?").run(id);
  },
  async getOnlineIds(): Promise<string[]> {
    const rows = await db.prepare("SELECT id FROM meters WHERE status = 'online'").all() as { id: string }[];
    return rows.map(r => r.id);
  },
  async insert(m: any): Promise<void> {
    await db.prepare(`
      INSERT INTO meters (id, customerId, location, type, credit, status, lastUpdate, power, voltage, firmware, installationDate, lifecycleStatus, serialNumber, batchId, supplier, purchaseDate, warehouseLocation, latitude, longitude, dcuId, registeredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      m.id, m.customerId, m.location, m.type, m.credit, m.status, m.lastUpdate, m.power, m.voltage, 
      m.firmware, m.installationDate, m.lifecycleStatus || 'installed', m.serialNumber, m.batchId, 
      m.supplier, m.purchaseDate, m.warehouseLocation, m.latitude, m.longitude, m.dcuId, m.registeredAt
    );
  },
  async delete(id: string): Promise<void> {
    await db.prepare("DELETE FROM meters WHERE id = ?").run(id);
  }
};
