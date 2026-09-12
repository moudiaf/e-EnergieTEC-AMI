import { db } from '../db';

async function purgeMockData() {
  console.log('=== PURGE COMPLÈTE DES DONNÉES SIMULÉES DE RENTEC AMI ===');
  await db.initSchema();

  // Désactiver temporairement les contraintes FK pour purger proprement en cascade
  await db.exec("PRAGMA foreign_keys = OFF;");

  // 1. Purge des relevés 15-min simulés
  const resInt = await db.prepare("DELETE FROM interval_data").run();
  console.log(`- Relevés 15-min simulés supprimés: ${resInt.changes || 0}`);

  // 2. Purge des alertes fictives
  const resAlr = await db.prepare("DELETE FROM alerts").run();
  console.log(`- Alertes fictives supprimées: ${resAlr.changes || 0}`);

  // 3. Purge des paiements fictifs
  const resPay = await db.prepare("DELETE FROM payments").run();
  console.log(`- Paiements fictifs supprimés: ${resPay.changes || 0}`);

  // 4. Purge des tickets fictifs
  const resTkt = await db.prepare("DELETE FROM tickets").run();
  console.log(`- Tickets fictifs supprimés: ${resTkt.changes || 0}`);

  // 5. Purge des factures fictives
  const resInv = await db.prepare("DELETE FROM invoices").run();
  console.log(`- Factures fictives supprimées: ${resInv.changes || 0}`);

  // 6. Purge des compteurs fictifs / seedés
  const resMet = await db.prepare("DELETE FROM meters").run();
  console.log(`- Compteurs fictifs supprimés: ${resMet.changes || 0}`);

  // 7. Purge des clients fictifs / seedés
  const resCust = await db.prepare("DELETE FROM customers").run();
  console.log(`- Clients fictifs supprimés: ${resCust.changes || 0}`);

  // 8. Purge de l'utilisateur client de test 'jean'
  await db.prepare("DELETE FROM users WHERE username = 'jean' OR role = 'customer'").run();

  // Réactiver les contraintes FK
  await db.exec("PRAGMA foreign_keys = ON;");

  console.log('\n--- ÉTAT DE LA BASE DE DONNÉES APRÈS PURGE COMPLÈTE ---');
  const realMeters = await db.prepare("SELECT COUNT(*) as c FROM meters").get() as any;
  const realCustomers = await db.prepare("SELECT COUNT(*) as c FROM customers").get() as any;
  const realVendingTxs = await db.prepare("SELECT COUNT(*) as c FROM vending2_transactions").get() as any;
  const realTariffs = await db.prepare("SELECT COUNT(*) as c FROM tariffs").get() as any;
  const realUsers = await db.prepare("SELECT COUNT(*) as c FROM users").get() as any;

  console.log(`- Compteurs réels restants    : ${realMeters?.c || 0}`);
  console.log(`- Clients réels restants      : ${realCustomers?.c || 0}`);
  console.log(`- Transactions Vending2 réelles: ${realVendingTxs?.c || 0}`);
  console.log(`- Segments tarifaires NIGELEC  : ${realTariffs?.c || 0}`);
  console.log(`- Utilisateurs système        : ${realUsers?.c || 0}`);

  console.log('\nPURGE DE LA BASE DE DONNÉES EFFECTUÉE À 100% 🟢');
}

purgeMockData().catch(err => {
  console.error("Erreur fatale lors de la purge SQL:", err);
  process.exit(1);
});
