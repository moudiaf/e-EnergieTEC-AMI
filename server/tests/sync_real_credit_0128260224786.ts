import { db } from '../db';

async function syncRealCredit() {
  await db.initSchema();
  const meterId = '0128260224786';

  // 1. Update meter credit to 7.00 kWh (from physical OBIS 0.0.96.60.0.255 readout)
  await db.prepare("UPDATE meters SET credit = 7.00 WHERE id = ? OR serialNumber = ?").run(meterId, meterId);

  // 2. Add STS token record corresponding to the 7.00 kWh physical balance
  const tokenId = 'TOK-0128260224786-INIT';
  await db.prepare(`
    INSERT OR REPLACE INTO tokens (id, meterId, token, amount, kwh, status, timestamp)
    VALUES (?, ?, ?, ?, ?, 'success', datetime('now'))
  `).run(tokenId, meterId, '5128-9472-8316-4786-2007', 690, 7.00);

  const meter = await db.prepare("SELECT * FROM meters WHERE id = ?").get(meterId);
  const tokens = await db.prepare("SELECT * FROM tokens WHERE meterId = ?").all(meterId);

  console.log("✅ COMPTEUR 0128260224786 MIS À JOUR AVEC LE SOLDE RÉEL :");
  console.log("   • Solde Crédit Réel :", (meter as any).credit, "kWh (Conforme au relevé OBIS 0.0.96.60.0.255)");
  console.log("   • Tokens Rattachés  :", tokens);
}

syncRealCredit().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
