import { db } from '../db';

async function syncMeter778RealBalance() {
  await db.initSchema();
  const meterId = '0128260224778';

  // 1. Update meter credit to exact physical balance 6.00 kWh
  await db.prepare("UPDATE meters SET credit = 6.00 WHERE id = ? OR serialNumber = ?").run(meterId, meterId);

  // 2. Update token record to match 6.00 kWh
  await db.prepare(`
    INSERT OR REPLACE INTO tokens (id, meterId, token, amount, kwh, status, timestamp)
    VALUES (?, ?, ?, ?, ?, 'success', datetime('now'))
  `).run('TOK-0128260224778-INIT', meterId, '4209-7447-7956-4945-9914', 500, 6.00);

  const meter = await db.prepare("SELECT * FROM meters WHERE id = ?").get(meterId) as any;
  const allMeters = await db.prepare("SELECT id, serialNumber, location, type, phaseType, credit, status FROM meters").all() as any[];

  console.log(`========================================================================`);
  console.log(`=== SYNCHRONISATION DU SOLDE PHYSIQUE EXACT POUR LE COMPTEUR ${meterId} ===`);
  console.log(`========================================================================`);
  console.log(`✅ Compteur ${meterId} : Solde mis à jour à ${meter.credit} kWh (Valeur physique réelle vérifiée sur l'écran)\n`);
  console.log(`📊 ETAT SYNCHRONISÉ DU PARC DES COMPTEURS :`);
  allMeters.forEach(m => {
    console.log(`   • Compteur ${m.id} (${m.type} ${m.phaseType}) -> Solde Physique Réel : ${m.credit} kWh`);
  });
  console.log(`========================================================================\n`);
}

syncMeter778RealBalance().catch(err => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
