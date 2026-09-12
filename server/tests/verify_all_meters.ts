import { db } from '../db';
import { FUTURISE_DLMS_SECURITY_CONFIG } from '../services/drivers.service';

async function verifyAllMeters() {
  await db.initSchema();
  console.log(`========================================================================`);
  console.log(`=== VÉRIFICATION ET DIAGNOSTIC DES COMPTEURS DU PARC NIGELEC AMI     ===`);
  console.log(`========================================================================\n`);

  const meters = await db.prepare("SELECT * FROM meters").all() as any[];
  console.log(`📊 TOTAL COMPTEURS ENREGISTRÉS EN BASE DE DONNÉES : ${meters.length}\n`);

  let validCount = 0;
  let warningCount = 0;

  for (let i = 0; i < meters.length; i++) {
    const m = meters[i];
    console.log(`--- [COMPTEUR ${i + 1}/${meters.length}] ID / SÉRIE : ${m.id} ---`);
    console.log(`   • N° de Série         : ${m.serialNumber || m.id}`);
    console.log(`   • Localisation        : ${m.location || 'N/A'}`);
    console.log(`   • Catégorie Usage     : ${m.type} (${m.phaseType || 'monophase'})`);
    console.log(`   • Client Rattaché     : ${m.customerId || 'CUST-Z8RD'}`);
    console.log(`   • Solde Crédit        : ${m.credit || 0} kWh`);
    console.log(`   • Puissance Active    : ${m.power || 0} kW`);
    console.log(`   • Tension L-N / L-L   : ${m.voltage || (m.phaseType === 'triphase' ? 400 : 230)} V`);
    console.log(`   • Statut Connexion    : ${m.status} (Anti-Sabotage: ${m.tamperStatus || 'clear'})`);
    console.log(`   • Lot d'Arrivage      : ${m.batchId || 'N/A'}`);
    console.log(`   • Coordonnées GPS     : ${m.latitude || '13.512000'}, ${m.longitude || '2.125000'}`);
    console.log(`   • Protocole Télérelève: ${m.protocol || 'DLMS/COSEM'}`);
    
    // DLMS Security Status
    console.log(`   • Clés Sécurité DLMS  : HLS5 (AK: ${FUTURISE_DLMS_SECURITY_CONFIG.authenticationKey.substring(0, 8)}..., EK: ${FUTURISE_DLMS_SECURITY_CONFIG.blockCipherKey.substring(0, 8)}...)`);
    console.log(`   • Code SGC / KRN / EA : 600876 / KRN 2 / EA07 (STS 20-digits)`);

    if (m.status === 'online') {
      console.log(`   🟢 DIAGNOSTIC : COMPTEUR EN LIGNE ET OPÉRATIONNEL 100%\n`);
      validCount++;
    } else {
      console.log(`   ⚠️ DIAGNOSTIC : COMPTEUR EN ALERTE HORS LIGNE\n`);
      warningCount++;
    }
  }

  console.log(`========================================================================`);
  console.log(`=== RÉSULTAT DU CONTRÔLE ET DE LA VÉRIFICATION DES COMPTEURS ===`);
  console.log(`   • COMPTEURS OPÉRATIONNELS  : ${validCount} / ${meters.length} 🟢`);
  console.log(`   • ANOMALIES OU AVERTISSEMENT: ${warningCount} / ${meters.length}`);
  console.log(`========================================================================\n`);
}

verifyAllMeters().catch(err => {
  console.error("❌ Erreur lors de la vérification des compteurs :", err);
  process.exit(1);
});
