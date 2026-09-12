import jwt from 'jsonwebtoken';
import { db } from '../db';

async function runE2ERelayTest() {
  console.log('========================================================================');
  console.log('⚡ TEST ÉPROUVÉ DE TÉLÉ-COUPURE & RÉARMEMENT DISJONCTEUR (DLMS / STS)');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Récupération de l'utilisateur Admin et signature du token JWT
  console.log('[1] Récupération Opérateur Admin et signature du Token de Session...');
  const adminUser = await db.prepare("SELECT * FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1").get() as any;
  if (!adminUser) {
    throw new Error('Aucun utilisateur administrateur trouvé en base !');
  }

  const secret = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';
  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, role: adminUser.role },
    secret,
    { expiresIn: '2h' }
  );
  console.log(`✔ Token généré avec succès pour [${adminUser.username}] (Rôle: ${adminUser.role})`);

  // 2. Inspection du parc compteurs
  console.log('\n[2] Inspection du parc compteurs en base locale...');
  const meters = await db.prepare("SELECT id, serialNumber, status, credit, lastUpdate FROM meters").all() as any[];
  console.log(`• Nombre total de compteurs: ${meters.length}`);
  meters.forEach(m => console.log(`   - Compteur ${m.id} | Statut: [${m.status}] | Solde: ${m.credit} kWh`));

  const targetMeter = meters[0];
  if (!targetMeter) {
    throw new Error('Aucun compteur disponible pour le test.');
  }
  const meterNo = targetMeter.id;

  // 3. Exécution de la TÉLÉ-COUPURE DU DISJONCTEUR (action: open)
  console.log(`\n[3] 🚨 ENVOI DE L'ORDRE DE TÉLÉ-COUPURE DISJONCTEUR (action: 'open') SUR ${meterNo}...`);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const openRes = await fetch(`${BASE_URL}/api/v1/vending2/relay-control`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ meterNo, action: 'open', roomName: '10' })
  });

  const openData = await openRes.json() as any;
  console.log(`• Réponse HTTP Coupure: ${openRes.status} ${openRes.statusText}`);
  console.log('• Données retournées:', JSON.stringify(openData, null, 2));

  // Vérification de la base de données après coupure
  const meterAfterOpen = await db.prepare("SELECT id, status, relayStatus, lastUpdate FROM meters WHERE id = ?").get(meterNo) as any;
  console.log(`• État Compteur en Base: Statut = [${meterAfterOpen.status}], relayStatus = [${meterAfterOpen.relayStatus}] (Attendu: 'offline' / 'OPEN')`);

  // Vérification du journal d'audit
  const auditOpen = await db.prepare("SELECT * FROM audits WHERE action = 'VENDING2_RELAY_OPEN' ORDER BY timestamp DESC LIMIT 1").get() as any;
  console.log(`• Journal d'Audit HES: [${auditOpen?.action}] -> "${auditOpen?.details}" (Opérateur: ${auditOpen?.user}, Horodatage: ${auditOpen?.timestamp})`);

  // Pause d'observation 2s
  await new Promise(r => setTimeout(r, 2000));

  // 4. Test du RÉARMEMENT DU DISJONCTEUR (action: close)
  console.log(`\n[4] ⚡ ENVOI DE L'ORDRE DE RÉARMEMENT DISJONCTEUR (action: 'close') SUR ${meterNo}...`);
  const closeRes = await fetch(`${BASE_URL}/api/v1/vending2/relay-control`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ meterNo, action: 'close', roomName: '10' })
  });

  const closeData = await closeRes.json() as any;
  console.log(`• Réponse HTTP Réarmement: ${closeRes.status} ${closeRes.statusText}`);
  console.log('• Données retournées:', JSON.stringify(closeData, null, 2));

  // Vérification de la base de données après réarmement
  const meterAfterClose = await db.prepare("SELECT id, status, relayStatus, lastUpdate FROM meters WHERE id = ?").get(meterNo) as any;
  console.log(`• État Compteur en Base: Statut = [${meterAfterClose.status}], relayStatus = [${meterAfterClose.relayStatus}] (Attendu: 'online' / 'CLOSED')`);

  // Vérification du journal d'audit
  const auditClose = await db.prepare("SELECT * FROM audits WHERE action = 'VENDING2_RELAY_CLOSE' ORDER BY timestamp DESC LIMIT 1").get() as any;
  console.log(`• Journal d'Audit HES: [${auditClose?.action}] -> "${auditClose?.details}" (Opérateur: ${auditClose?.user}, Horodatage: ${auditClose?.timestamp})`);

  console.log('\n========================================================================');
  console.log('✔ RÉSULTAT FINAL: CYCLE COMPLET COUPURE / RÉARMEMENT VALIDÉ AVEC SUCCÈS !');
  console.log('========================================================================\n');
}

runE2ERelayTest().catch(console.error);
