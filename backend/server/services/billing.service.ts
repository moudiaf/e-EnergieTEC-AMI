import { db } from '../db';

export const billingService = {
  async runBillingCycle() {
    const isEnterpriseMode = process.env.DB_TYPE === 'postgres';
    const meters = await db.prepare("SELECT * FROM meters WHERE paymentMode = 'postpaid'").all() as any[];
    const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    let createdCount = 0;

    const tariffs = await db.prepare("SELECT * FROM tariffs").all() as any[];
    const tariffMap = tariffs.reduce((acc, t) => {
      acc[t.id] = { ...t, tiers: JSON.parse(t.tiers) };
      return acc;
    }, {} as any);

    for (const m of meters) {
      const consumption = await db.prepare("SELECT SUM(consumption) as total FROM interval_data WHERE meterId = ?").get(m.id) as any;
      const totalKwh = consumption?.total || 0;

      if (totalKwh > 0) {
        const tariff = tariffMap[m.type] || Object.values(tariffMap)[0];
        const tiers = tariff ? tariff.tiers : [];

        let totalHT = 0;
        let remainingKwh = totalKwh;

        if (tiers && tiers.length > 0) {
          for (const tier of tiers) {
            const tierMax = tier.maxKwh || Infinity;
            const tierMin = tier.minKwh || 0;
            const tierCapacity = (tierMax === Infinity) ? Infinity : (tierMax - tierMin);

            if (remainingKwh <= tierCapacity) {
              totalHT += remainingKwh * tier.rate;
              remainingKwh = 0;
              break;
            } else {
              totalHT += tierCapacity * tier.rate;
              remainingKwh -= tierCapacity;
            }
          }
        } else {
          totalHT = totalKwh * (tariff ? tariff.rate : 50);
        }

        const baseRedevance = tiers && tiers[0] ? Number(tiers[0].redevance || 0) : 0;
        const basePrime = tiers && tiers[0] ? Number(tiers[0].primeFixe || 0) : 0;
        const taxeHabitat = tiers && tiers[0] ? Number(tiers[0].taxeHabitat || 0) : 0;

        const subtotal = totalHT + baseRedevance + basePrime;
        const tva = +(subtotal * 0.19).toFixed(2);
        const totalTTC = +(subtotal + tva + taxeHabitat).toFixed(2);

        const invoiceId = `FAC-${currentMonth.substring(0, 3).toUpperCase()}-${m.id.substring(0, 4)}-${Math.random().toString(36).substr(2, 4)}`;

        const sql = isEnterpriseMode 
          ? "INSERT INTO invoices(id, customerId, meterId, month, kwhConsumed, amountHT, tva, totalTTC, status, dueDate, timestamp) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING"
          : "INSERT OR IGNORE INTO invoices(id, customerId, meterId, month, kwhConsumed, amountHT, tva, totalTTC, status, dueDate, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        const stmt = db.prepare(sql);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        await stmt.run(invoiceId, m.customerId, m.id, currentMonth, totalKwh, subtotal, tva, totalTTC, 'unpaid', dueDate.toISOString(), new Date().toISOString());
        createdCount++;
      }
    }
    return createdCount;
  }
};
