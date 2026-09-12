import { futuriseApiClient } from '../services/futurise-api.client';

async function readFuturiseMeter() {
  const meterId = '0128260224786';
  console.log(`========================================================================`);
  console.log(`=== INTERROGATION EN DIRECT DU SERVEUR FUTURISE FABRICANT             ===`);
  console.log(`=== URL : https://dlms.futurise-tech.com:4680/api/v1                 ===`);
  console.log(`=== COMPTEUR CIBLE : ${meterId}                                  ===`);
  console.log(`========================================================================\n`);

  // 1. LOGIN & TOKEN
  console.log(`[ETAPE 1/3] Authentification auprès de Futurise (https://dlms.futurise-tech.com:4680)...`);
  const loginRes = await futuriseApiClient.login();
  console.log(`✅ Session Authentifiée avec Succès (Code: ${loginRes.code || 200}, Token: OBTENU)\n`);

  // 2. LECTURE TÉLÉMESURE COMPTEUR 0128260224786
  console.log(`[ETAPE 2/3] Envoi de l'Ordre de Lecture Télémesure (POST /metervalue/read)...`);
  const readRes = await futuriseApiClient.readMeterValue(meterId);
  console.log(`📡 Réponse Brut du Serveur Futurise pour le Compteur ${meterId} :`);
  console.log(JSON.stringify(readRes, null, 2), `\n`);

  // 3. CONSULTATION HISTORIQUE RECHARGE SUR FUTURISE
  console.log(`[ETAPE 3/3] Demande Historique de Vente / Token (POST /meter-recharge/recharge-token/0)...`);
  const rechargeRes = await futuriseApiClient.rechargeToken(meterId, 0);
  console.log(`📡 Réponse Historique/Recharge du Serveur Futurise :`);
  console.log(JSON.stringify(rechargeRes, null, 2), `\n`);

  console.log(`========================================================================`);
  console.log(`=== INTERROGATION SERVEUR FUTURISE COMPLÉTÉE ===`);
  console.log(`========================================================================\n`);
}

readFuturiseMeter().catch(err => {
  console.error("❌ Erreur lors de l'interrogation Futurise :", err);
  process.exit(1);
});
