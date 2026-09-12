import { db } from '../db';
import { futuriseApiClient } from './futurise-api.client';

export const stsService = {
  async generateToken(meterId: string, kwh: number, type: string, rechargeAmount?: number, subClass?: number, customValue?: number) {
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

    // 2. Appel prioritaire de l'API Fabricant Futurise (Jeton certifié usine — ZÉRO CrErreur)
    try {
      if (type === 'recharge') {
        console.log(`[STS] Appel API Fabricant Futurise Vending 2.0 (Recharge) pour compteur ${meterId}...`);
        const amountFcfa = (rechargeAmount && rechargeAmount > 0) ? rechargeAmount : (typeof kwh === 'number' && kwh > 100 ? kwh : Math.round(kwh * 59.45));
        const futuriseRes = await futuriseApiClient.rechargeToken(meterId, amountFcfa > 0 ? amountFcfa : 2000);
        if (futuriseRes.code === 200 && futuriseRes.data?.form) {
          const raw = futuriseRes.data.form.replace(/\D/g, '');
          token = raw.match(/.{1,4}/g)?.join('-') || raw;
          rawToken = raw;
          console.log(`[STS] ✅ Jeton Recharge Certifié Usine généré avec succès: ${token}`);
          return { token, tid, rawToken };
        }
      } else if (type === 'clear-credit' || type === 'clear-tamper' || type === 'maintenance' || typeof subClass === 'number') {
        const targetSubClass = subClass !== undefined ? subClass : (type === 'clear-tamper' ? 5 : 1);
        const targetVal = customValue || 0;
        console.log(`[STS] Appel API Fabricant Futurise TokenManage (Doc PDF Page 7) pour ${meterId} (SubClass: ${targetSubClass})...`);
        
        const futuriseRes = await futuriseApiClient.meterToken(meterId, targetSubClass, targetVal);
        if (futuriseRes.code === 200 && futuriseRes.data?.form) {
          const raw = futuriseRes.data.form.replace(/\D/g, '');
          token = raw.match(/.{1,4}/g)?.join('-') || raw;
          rawToken = raw;
          console.log(`[STS] ✅ Jeton Maintenance SubClass ${targetSubClass} Certifié Usine généré: ${token}`);
          return { token, tid, rawToken };
        }
      }
    } catch (err: any) {
      console.warn(`[STS WARN] API Futurise non joignable (${err.message}), bascule sur KMS local...`);
    }

    try {
      const rawKms = process.env.KMS_URL || 'http://127.0.0.1:5000';
      const kmsBase = rawKms.replace(/\/api\/kms\/?$/, '').replace(/\/+$/, '');
      const endpoint = `${kmsBase}/api/kms/generate-token`;
      console.log(`[STS] Appel KMS-HSM sur ${endpoint} pour génération binaire CEI 62055-41 (Meter: ${meterId}, kWh: ${kwh})`);
      
      const kmsResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meterId, 
          amount: kwh, 
          type: type === 'recharge' ? '0' : '1', 
          tid,
          sgc: '600876',
          krn: 2
        })
      });
      
      if (kmsResponse.ok) {
        const kmsData = await kmsResponse.json() as any;
        token = kmsData.token;
        rawToken = kmsData.rawToken || token.replace(/-/g, '');
        tid = kmsData.tid || tid;
      } else {
        throw new Error(`KMS a répondu avec le statut ${kmsResponse.status}`);
      }
    } catch (e: any) {
      console.error(`[STS ERROR] Échec communication KMS-HSM (${e.message})`);
      throw new Error(`Échec génération STS cryptographique : KMS-HSM inaccessible (${e.message})`);
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

    db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO tokens(id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type, tid)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(resolvedId, token, rawToken, amount, kwh, meterId, customerId || null, timestamp, expiry, status, type, tid);

      if (type === 'recharge') {
        db.prepare("UPDATE meters SET credit = credit + ?, lastTid = ? WHERE id = ?").run(kwh || 0, tid, meterId);
      } else {
        db.prepare("UPDATE meters SET lastTid = ? WHERE id = ?").run(tid, meterId);
        if (type === 'clear-credit') db.prepare("UPDATE meters SET credit = 0 WHERE id = ?").run(meterId);
        else if (type === 'clear-tamper') db.prepare("UPDATE meters SET tamperStatus = 'clear' WHERE id = ?").run(meterId);
      }
    });
    
    // Return the resolved ID so callers can know what ID was inserted
    return resolvedId;
  }
};
