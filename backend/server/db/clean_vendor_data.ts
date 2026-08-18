import { db } from '../db';

async function cleanVendorData() {
  console.log("[VENDOR-CLEAN] Assainissement des données pour les sections VENDOR...");

  // 1. Purge des jetons de test (montants à 0 FCFA ou tokens de simulation)
  const tokenRes = db.prepare(`
    DELETE FROM tokens 
    WHERE amount <= 0 
       OR kwh <= 0 
       OR token LIKE '%0000 0000%'
       OR id LIKE '%test%'
  `).run();
  console.log(`[VENDOR-CLEAN] ${(tokenRes as any).changes} jetons techniques à 0 FCFA purgés.`);

  // 2. Purge des paiements de test insignifiants (ex: 12, 23, 38 FCFA)
  const paymentRes = db.prepare(`
    DELETE FROM payments 
    WHERE amount < 500 
       OR id LIKE '%test%'
  `).run();
  console.log(`[VENDOR-CLEAN] ${(paymentRes as any).changes} paiements de test purgés.`);

  // 3. Insérer des jetons et paiements de référence si la table est trop vide
  const currentTokensCount = (db.prepare("SELECT COUNT(*) as c FROM tokens").get() as any).c;
  if (currentTokensCount < 5) {
    const seedTokens = [
      {
        id: 'TOK-NIG-2026-01',
        token: '5412 8901 2345 6789 1011',
        rawToken: '54128901234567891011',
        amount: 10000,
        kwh: 124.5,
        meterId: '541-234-567',
        customerId: 'C001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
        status: 'Actif',
        type: 'recharge',
        tva: 1900,
        taxeHabitat: 500,
        redevance: 250,
        primeFixe: 1000,
        taxeORNT: 150,
        taxeMunicipale: 100
      },
      {
        id: 'TOK-NIG-2026-02',
        token: '9876 5432 1098 7654 3210',
        rawToken: '98765432109876543210',
        amount: 25000,
        kwh: 312.0,
        meterId: '541-234-568',
        customerId: 'C002',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        expiry: new Date(Date.now() + 365 * 86400000).toISOString(),
        status: 'Actif',
        type: 'recharge',
        tva: 4750,
        taxeHabitat: 500,
        redevance: 250,
        primeFixe: 1000,
        taxeORNT: 150,
        taxeMunicipale: 100
      }
    ];

    const insertToken = db.prepare(`
      INSERT OR REPLACE INTO tokens (id, token, rawToken, amount, kwh, meterId, customerId, timestamp, expiry, status, type, tva, taxeHabitat, redevance, primeFixe, taxeORNT, taxeMunicipale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of seedTokens) {
      insertToken.run(t.id, t.token, t.rawToken, t.amount, t.kwh, t.meterId, t.customerId, t.timestamp, t.expiry, t.status, t.type, t.tva, t.taxeHabitat, t.redevance, t.primeFixe, t.taxeORNT, t.taxeMunicipale);
    }
  }

  console.log("[VENDOR-CLEAN] Assainissement terminé avec succès ! 🟢");
}

cleanVendorData().catch(console.error);
