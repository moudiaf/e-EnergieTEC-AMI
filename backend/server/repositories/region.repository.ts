import { db } from '../db';
import { Region } from './types';

export const RegionRepository = {
  async getAll(): Promise<Region[]> {
    return await db.prepare("SELECT * FROM regions").all() as Region[];
  },
  async insert(r: Region): Promise<void> {
    await db.prepare(`
      INSERT INTO regions (id, superiorRegionId, areaName, label, principal, contact, email, status, blazon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.id, r.superiorRegionId, r.areaName, r.label, r.principal, r.contact, r.email, r.status, r.blazon);
  },
  async update(id: string, r: Region): Promise<void> {
    await db.prepare(`
      UPDATE regions 
      SET superiorRegionId = ?, areaName = ?, label = ?, principal = ?, contact = ?, email = ?, status = ?, blazon = ?
      WHERE id = ?
    `).run(r.superiorRegionId, r.areaName, r.label, r.principal, r.contact, r.email, r.status, r.blazon, id);
  },
  async delete(id: string): Promise<void> {
    await db.prepare("DELETE FROM regions WHERE id = ?").run(id);
  }
};
