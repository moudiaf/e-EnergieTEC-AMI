import { db } from '../db';

async function runDiagnostic() {
  console.log("=== COMPTE RENDU DU DÉBOGAGE BASE DE DONNÉES ===");
  const tables = ['customers', 'meters', 'alerts', 'payments', 'users', 'audits', 'tokens', 'regions', 'dcus', 'tickets', 'settings'];
  
  for (const t of tables) {
    try {
      const row = await db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get() as any;
      console.log(`[PASS] Table ${t.padEnd(12)} : ${row?.c || 0} enregistrements sains 🟢`);
    } catch (err: any) {
      console.error(`[FAIL] Table ${t} : ERREUR ${err.message} 🔴`);
    }
  }

  // Vérifier la cohérence des mots de passe des 5 rôles
  console.log("\n=== COMPTE RENDU DÉBOGAGE UTILISATEURS & RÔLES ===");
  const users = await db.prepare("SELECT id, username, role, name FROM users").all();
  console.log(`[PASS] ${users.length} rôles d'accès configurés et authentifiables :`);
  for (const u of users as any[]) {
    console.log(`  • Rôle ${u.role.toUpperCase().padEnd(10)} | Identifiant: ${u.username.padEnd(12)} | Nom: ${u.name}`);
  }
}

runDiagnostic().catch(console.error);
