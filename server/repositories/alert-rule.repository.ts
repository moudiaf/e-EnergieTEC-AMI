import { db } from '../db';

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  notifySms: boolean;
  notifyEmail: boolean;
  active: boolean;
}

export const AlertRuleRepository = {
  async getAll(): Promise<AlertRule[]> {
    return await db.prepare("SELECT * FROM alert_rules").all() as AlertRule[];
  },
  async updateStatus(id: string, active: boolean): Promise<void> {
    await db.prepare("UPDATE alert_rules SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  },
  async update(id: string, r: { active?: boolean; notifySms?: boolean; notifyEmail?: boolean }): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (r.active !== undefined) {
      fields.push("active = ?");
      values.push(r.active ? 1 : 0);
    }
    if (r.notifySms !== undefined) {
      fields.push("notifySms = ?");
      values.push(r.notifySms ? 1 : 0);
    }
    if (r.notifyEmail !== undefined) {
      fields.push("notifyEmail = ?");
      values.push(r.notifyEmail ? 1 : 0);
    }
    if (fields.length === 0) return;
    values.push(id);
    await db.prepare(`UPDATE alert_rules SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};
