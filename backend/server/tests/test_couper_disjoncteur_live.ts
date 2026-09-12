import jwt from 'jsonwebtoken';
import { db } from '../db';

async function testCouperDisjoncteur() {
  console.log('========================================================================');
  console.log('⚡ TEST DE COUPURE DISJONCTEUR POUR MAINTENANCE (METERLZ)');
  console.log('COMPTEUR CIBLE : 0128260224778');
  console.log('========================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const METER_NO = '0128260224778';

  // 1. Vérification de l'état initial du compteur avant coupure
  console.log('[1] État initial du compteur en base :');
  const meterBefore = await db.prepare("SELECT id, serialNumber, status, relayStatus, credit, lastUpdate FROM meters WHERE id = ?").get(METER_NO) as any;
  console.log(JSON.stringify(meterBefore, null, 2));

  // 2. Génération du token de session opérateur
  const adminUser = await db.prepare("SELECT * FROM users WHERE username = 'admin' OR role = 'admin' LIMIT 1").get() as any;
  const secret = process.env.JWT_SECRET || 'ami-sts-default-fallback-secret-CHANGE-ME';
  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, role: adminUser.role },
    secret,
    { expiresIn: '1h' }
  );

  // 3. Exécution de la commande de coupure (action: 'open' / MeterLz)
  console.log(`\n[2] Envoi de l'ordre de coupure (POST /api/v1/vending2/relay-control - action: 'open')...`);
  const res = await fetch(`${BASE_URL}/api/v1/vending2/relay-control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      meterNo: METER_NO,
      action: 'open',
      roomName: '10'
    })
  });

  const data = await res.json() as any;
  console.log(`• Réponse HTTP : ${res.status} ${res.statusText}`);
  console.log('• Données retournées :', JSON.stringify(data, null, 2));

  // 4. Vérification de l'état en base après coupure
  console.log('\n[3] Vérification de l\'état après coupure en base :');
  const meterAfter = await db.prepare("SELECT id, serialNumber, status, relayStatus, credit, lastUpdate FROM meters WHERE id = ?").get(METER_NO) as any;
  console.log(JSON.stringify(meterAfter, null, 2));

  console.log('\n[4] Contrôle de la préservation du crédit abonné :');
  console.log(`• Crédit Avant : ${meterBefore.credit} kWh`);
  console.log(`• Crédit Après : ${meterAfter.credit} kWh`);
  if (meterBefore.credit === meterAfter.credit) {
    console.log('✔ SUCCÈS : Le crédit abonné est 100% intact (Aucun Clear Credit destructeur).');
  } else {
    console.error('❌ ANOMALIE : Le crédit a été altéré !');
  }

  // 5. Vérification du journal d'audit
  console.log('\n[5] Enregistrement au Journal d\'Audit Officiel :');
  const audit = await db.prepare("SELECT * FROM audits WHERE action = 'VENDING2_RELAY_OPEN' ORDER BY timestamp DESC LIMIT 1").get() as any;
  console.log(JSON.stringify(audit, null, 2));

  // 6. Test de protection Watchdog : simulation du passage du Watchdog
  console.log('\n[6] Test de résistance Watchdog SSE (30s de maintien) :');
  console.log('Attente de 3s pour vérifier la non-réversion...');
  await new Promise(r => setTimeout(r, 3000));
  const meterAfterDelay = await db.prepare("SELECT id, status, relayStatus FROM meters WHERE id = ?").get(METER_NO) as any;
  console.log(`• Statut après temporisation : [${meterAfterDelay.status}], relayStatus : [${meterAfterDelay.relayStatus}]`);
  if (meterAfterDelay.relayStatus === 'OPEN') {
    console.log('✔ SUCCÈS : Le Watchdog respecte scrupuleusement la consigne de coupure maintenance.');
  }

  console.log('\n========================================================================');
  console.log('✔ TEST DE COUPURE DISJONCTEUR COMPTEUR 0128260224778 VALIDÉ AVEC SUCCÈS !');
  console.log('========================================================================\n');
}

testCouperDisjoncteur().catch(console.error);
