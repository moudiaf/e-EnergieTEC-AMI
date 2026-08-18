import { db } from '../db';
import { IntervalData } from './types';

export const IntervalDataRepository = {
  async getAll(): Promise<IntervalData[]> {
    return await db.prepare("SELECT * FROM interval_data ORDER BY timestamp DESC").all() as IntervalData[];
  },
  async getRecent(limit = 100): Promise<IntervalData[]> {
    return await db.prepare("SELECT * FROM interval_data ORDER BY timestamp DESC LIMIT ?").all(limit) as IntervalData[];
  },
  async count(): Promise<number> {
    const row = await db.prepare("SELECT COUNT(*) as count FROM interval_data").get() as { count: number };
    return row ? row.count : 0;
  },
  async getStats(): Promise<{ status: string, count: number }[]> {
    return await db.prepare("SELECT status, COUNT(*) as count FROM interval_data GROUP BY status").all() as { status: string, count: number }[];
  },
  async insert(i: IntervalData): Promise<void> {
    await db.prepare(`
      INSERT INTO interval_data (id, meterId, timestamp, reading, consumption, voltage, current, powerFactor, status, validationNotes, voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3, voltageUnbalance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      i.id, i.meterId, i.timestamp, i.reading, i.consumption, i.voltage, i.current, i.powerFactor, 
      i.status, i.validationNotes, i.voltageL1 || null, i.voltageL2 || null, i.voltageL3 || null, 
      i.currentL1 || null, i.currentL2 || null, i.currentL3 || null, i.voltageUnbalance || null
    );
  }
};
