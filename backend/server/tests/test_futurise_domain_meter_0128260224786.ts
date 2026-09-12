import { db } from '../db';
import { futuriseApiClient } from '../services/futurise-api.client';

async function runDomainTest() {
  const meterId = '0128260224786';
  console.log(`========================================================================`);
  console.log(`=== BANC DE TEST RÉEL : SERVEUR FUTURISE FABRICANT (DOMAIN OFFICIAL) ===`);
  console.log(`=== URL : https://dlms.futurise-tech.com:4680/api/v1                 ===`);
  console.log(`=== COMPTEUR CIBLE : ${meterId}                                  ===`);
  console.log(`========================================================================\n`);

  await db.initSchema();

  // 1. CAPTCHA & LOGIN
  console.log(`[TEST 1/5] Authentification auprès de https://dlms.futurise-tech.com:4680...`);
  const loginRes = await futuriseApiClient.login();
  console.log(`✅ Réponse Login Futurise :`);
  console.log(`   • Statut Code   : ${loginRes.code || 200}`);
  console.log(`   • Success       : ${loginRes.success}`);
  console.log(`   • Expiration    : ${loginRes.expire}`);
  console.log(`   • Token Bearer  : ${loginRes.token ? 'OBTENU AVEC SUCCÈS (JWT 256 bits)' : 'ÉCHEC'}\n`);

  // 2. LECTURE TÉLÉMESURE EN TEMPS RÉEL SUR LE COMPTEUR 0128260224786
  console.log(`[TEST 2/5] Demande de Télémesure Temps-Réel (Meter: ${meterId})...`);
  try {
    const telemetryRes = await futuriseApiClient.readMeterValue(meterId);
    console.log(`✅ Réponse Télémesure Serveur Futurise :`);
    console.log(`   • Code HTTP/Métier : ${telemetryRes.code}`);
    console.log(`   • Message          : "${telemetryRes.msg || 'N/A'}"`);
    console.log(`   • Contenu Réponse  :`, JSON.stringify(telemetryRes, null, 2), `\n`);
  } catch (err: any) {
    console.error(`❌ Erreur Télémesure :`, err.message);
  }

  // 3. DEMANDE DE GENERATION JETON DE RECHARGE
  console.log(`[TEST 3/5] Demande de Génération Token de Recharge (Meter: ${meterId}, Amount: 5000 FCFA)...`);
  try {
    const rechargeRes = await futuriseApiClient.rechargeToken(meterId, 5000);
    console.log(`✅ Réponse Recharge Serveur Futurise :`);
    console.log(`   • Code HTTP/Métier : ${rechargeRes.code}`);
    console.log(`   • Request ID       : ${rechargeRes.requestId || 'N/A'}`);
    console.log(`   • Message          : "${rechargeRes.msg || 'N/A'}"`);
    console.log(`   • Contenu Réponse  :`, JSON.stringify(rechargeRes, null, 2), `\n`);
  } catch (err: any) {
    console.error(`❌ Erreur Recharge :`, err.message);
  }

  // 4. DEMANDE TOKEN MANAGE (GESTION EFFACEMENT / MAINTENANCE)
  console.log(`[TEST 4/5] Demande TokenManage (SubClass 1 - Meter: ${meterId})...`);
  try {
    const tokenManageRes = await futuriseApiClient.meterToken(meterId, 1, 0);
    console.log(`✅ Réponse TokenManage Serveur Futurise :`);
    console.log(`   • Code HTTP/Métier : ${tokenManageRes.code}`);
    console.log(`   • Request ID       : ${tokenManageRes.requestId || 'N/A'}`);
    console.log(`   • Flow No          : ${tokenManageRes.data?.flowNo || 'N/A'}`);
    console.log(`   • Jeton STS Généré : ${tokenManageRes.data?.form || 'N/A'}`);
    console.log(`   • Message          : "${tokenManageRes.msg || 'N/A'}"\n`);
  } catch (err: any) {
    console.error(`❌ Erreur TokenManage :`, err.message);
  }

  // 5. SYNCHRONISATION HORLOGE DLMS RTC
  console.log(`[TEST 5/5] Synchronisation Horloge RTC DLMS (Meter: ${meterId})...`);
  try {
    const clockRes = await futuriseApiClient.syncClock(meterId);
    console.log(`✅ Réponse Synchronisation Horloge :`);
    console.log(`   • Code HTTP/Métier : ${clockRes.code}`);
    console.log(`   • Message          : "${clockRes.msg || 'N/A'}"\n`);
  } catch (err: any) {
    console.error(`❌ Erreur Clock Sync :`, err.message);
  }

  console.log(`========================================================================`);
  console.log(`=== DIAGNOSTIC EN DIRECT TERMINÉ POUR LE COMPTEUR ${meterId} ===`);
  console.log(`========================================================================\n`);
}

runDomainTest().catch(err => {
  console.error("❌ Erreur fatale lors du test du serveur Futurise :", err);
  process.exit(1);
});
