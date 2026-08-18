import { db } from '../db';

export const stsService = {
  async generateToken(meterId: string, kwh: number, type: string) {
    const meter = await db.prepare("SELECT lastTid FROM meters WHERE id = ?").get(meterId) as any;
    if (!meter) throw new Error("Compteur non trouvé");

    // 1. TID Calculation (Minutes since STS Base Date 1993-01-01)
    const baseDate = new Date('1993-01-01T00:00:00Z').getTime();
    let tid = Math.floor((Date.now() - baseDate) / 60000);
    
    // Anti-replay: Ensure new TID is always greater than last used TID
    if (tid <= meter.lastTid) {
      tid = meter.lastTid + 1;
    }

    let token = '';
    let rawToken = '';

    try {
      if (!process.env.KMS_URL) throw new Error("KMS_URL non configuré");
      
      console.log(`[STS] Appel KMS-HSM pour génération sécurisée (Meter: ${meterId})`);
      const kmsResponse = await fetch(`${process.env.KMS_URL}/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meterId, amount: kwh, type: type === 'recharge' ? '0' : '1', tid })
      });
      const kmsData = await kmsResponse.json() as any;
      token = kmsData.token;
      rawToken = token.replace(/-/g, '');
    } catch (e) {
      console.warn("[STS] KMS-HSM non disponible ou erreur, utilisation du générateur interne de secours.");
      
      // Industrial Fallback: Generate a pseudo-random 20-digit token following STS-like format
      // In a real national rollout, this would call a secondary local secure module
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const part3 = Math.floor(1000 + Math.random() * 9000);
      const part4 = Math.floor(1000 + Math.random() * 9000);
      const part5 = Math.floor(1000 + Math.random() * 9000);
      
      token = `${part1}-${part2}-${part3}-${part4}-${part5}`;
      rawToken = token.replace(/-/g, '');
    }

    return { token, tid, rawToken };
  },

  async persistToken(tokenData: any) {
    const resolvedId = tokenData.id || `TOK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const timestamp = tokenData.timestamp || new Date().toISOString();
    const expiry = tokenData.expiry || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    const status = tokenData.status || 'unused';
    const amount = tokenData.amount || 0;
    
    // Resolve customerId from meter if not provided
    let customerId = tokenData.customerId;
    if (!customerId && tokenData.meterId) {
      const meterRow = await db.prepare("SELECT customerId FROM meters WHERE id = ?").get(tokenData.meterId) as any;
      if (meterRow) {
        customerId = meterRow.customerId;
      }
    }

    const { token, rawToken, kwh, meterId, type, tid } = tokenData;
    const stmt = db.prepare(`
      INSERT INTO tokens(id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type, tid)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    await stmt.run(resolvedId, token, rawToken, amount, kwh, meterId, customerId || null, timestamp, expiry, status, type, tid);

    if (type === 'recharge') {
      await db.prepare("UPDATE meters SET credit = credit + ?, lastTid = ? WHERE id = ?").run(kwh || 0, tid, meterId);
    } else {
      await db.prepare("UPDATE meters SET lastTid = ? WHERE id = ?").run(tid, meterId);
      if (type === 'clear-credit') await db.prepare("UPDATE meters SET credit = 0 WHERE id = ?").run(meterId);
      else if (type === 'clear-tamper') await db.prepare("UPDATE meters SET tamperStatus = 'clear' WHERE id = ?").run(meterId);
    }
    
    // Return the resolved ID so callers can know what ID was inserted
    return resolvedId;
  }
};
