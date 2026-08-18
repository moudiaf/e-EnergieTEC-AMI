import { db } from '../db';
import { DCU } from './types';

export const DCURepository = {
  async getAll(): Promise<DCU[]> {
    return await db.prepare("SELECT * FROM dcus").all() as DCU[];
  },
  async insert(d: any): Promise<void> {
    await db.prepare(`
      INSERT INTO dcus (id, name, regionId, status, ipAddress, macAddress, firmware, lastPing, performance, latitude, longitude, modemType, signalStrength, connectedMeters, cpuUsage, memUsage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      d.id, d.name, d.regionId, d.status || 'active', d.ipAddress, d.macAddress, d.firmware, 
      d.lastPing || new Date().toISOString(), d.performance || 100, d.latitude, d.longitude, 
      d.modemType, d.signalStrength, d.connectedMeters, d.cpuUsage || 10, d.memUsage || 30
    );
  },
  async getById(id: string): Promise<DCU | undefined> {
    return await db.prepare("SELECT * FROM dcus WHERE id = ?").get(id) as DCU | undefined;
  },
  async update(id: string, d: any): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    const allowed = ['name', 'regionId', 'status', 'ipAddress', 'macAddress', 'firmware', 'lastPing', 'performance', 'latitude', 'longitude', 'modemType', 'signalStrength', 'connectedMeters', 'cpuUsage', 'memUsage'];
    for (const key of allowed) {
      if (d[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(d[key]);
      }
    }
    if (fields.length === 0) return;
    values.push(id);
    await db.prepare(`UPDATE dcus SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },
  async delete(id: string): Promise<void> {
    await db.prepare("DELETE FROM dcus WHERE id = ?").run(id);
  }
};
