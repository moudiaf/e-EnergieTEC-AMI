import { db } from '../db';

async function updateDB() {
  console.log('=== 1. INITIALISATION & MIGRATION DU SCHÉMA DB ===');
  await db.initSchema();

  console.log('=== 2. VÉRIFICATION & VERROUILLAGE DES COMPTEURS RÉELS ===');
  const now = new Date().toISOString();
  await db.prepare("UPDATE meters SET credit = 277.7, status = 'online', lastUpdate = ?, lastTelemetrySync = ? WHERE id = '0128260224778'").run(now, now);
  await db.prepare("UPDATE meters SET credit = 7.0, status = 'online', lastUpdate = ?, lastTelemetrySync = ? WHERE id = '0128260224786'").run(now, now);

  console.log('=== 3. ÉTAT FINAL DES COMPTEURS EN BASE ===');
  const meters = await db.prepare('SELECT id, location, phaseType, credit, voltage, current, frequency, status, lastTelemetrySync FROM meters').all();
  console.table(meters);

  console.log('=== 4. BILAN DE TOUTES LES TABLES ===');
  const tables = ['meters', 'customers', 'dcus', 'tokens', 'payments', 'users', 'regions', 'tariffs', 'interval_data', 'audits'];
  for (const t of tables) {
    const row = await db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as any;
    console.log(`- Table ${t.padEnd(15)} : ${row.c} enregistrement(s)`);
  }
}

updateDB().then(() => {
  console.log('✅ BASE DE DONNÉES ENTIÈREMENT INITIALISÉE ET À JOUR !');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
