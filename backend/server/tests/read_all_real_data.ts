import { db } from '../db';

async function readAllRealData() {
  await db.initSchema();
  console.log(`========================================================================`);
  console.log(`=== RELEVÉ ET LECTURE DE TOUTES LES DONNÉES RÉELLES DU SYSTÈME AMI   ===`);
  console.log(`========================================================================\n`);

  // 1. RELEVÉ TERMINAL DU COMPTEUR REEL (DE LA CAPTURE D'ÉCRAN METROLOGIE OBIS)
  console.log(`[SECTION 1] DONNÉES RÉELLES DE MÉTROLOGIE OBIS (RELEVÉ TERMINAL HARDWARE) :`);
  console.log(`   • Code Groupe de Fourniture (SGC) : 600876 (NIGELEC)`);
  console.log(`   • Index Tarifaire (TI)            : 1`);
  console.log(`   • Code Constructeur (MFC)         : 0128 (Futurise Technologies)`);
  console.log(`   • Révision Clé STS (KRN)           : 2`);
  console.log(`   • Type de Clé Vending (KT)        : 2`);
  console.log(`   • Compteur Clé Change (KCT)       : 3`);
  console.log(`   • Expiration Clé (KEN)             : 255 (Clé permanente active)`);
  console.log(`   • Algorithme Chiffrement (EA)     : 7 (EA07 - STS 20-digit)`);
  console.log(`   • Niveau Signal 4G (Module CSG)   : 31 / 31 (Excellente réception 100%)`);
  console.log(`   • Solde Crédit Mesuré (OBIS 0.0.96.60.0.255) : 7.00 kWh (Success)\n`);

  // 2. PARC DES COMPTEURS INTELLIGENTS (BASE DE DONNÉES)
  const meters = await db.prepare("SELECT * FROM meters").all() as any[];
  console.log(`[SECTION 2] FLOTTE RÉELLE DES COMPTEURS ENREGISTRÉS (${meters.length} Compteurs) :`);
  meters.forEach((m, idx) => {
    console.log(`   ${idx + 1}. Compteur N° : ${m.id}`);
    console.log(`      • N° Série         : ${m.serialNumber || m.id}`);
    console.log(`      • Emplacement      : ${m.location}`);
    console.log(`      • Type & Phase     : ${m.type} (${m.phaseType || 'monophase'})`);
    console.log(`      • Solde Crédit     : ${m.credit || 0} kWh`);
    console.log(`      • Statut Réseau    : ${m.status} (Tamper: ${m.tamperStatus || 'clear'})`);
    console.log(`      • Puissance / Volt : ${m.power || 0} kW / ${m.voltage || (m.phaseType === 'triphase' ? 400 : 230)} V`);
    console.log(`      • Lot / Batch      : ${m.batchId || 'N/A'}`);
    console.log(`      • GPS              : ${m.latitude || 'N/A'}, ${m.longitude || 'N/A'}`);
    console.log(``);
  });

  // 3. ABONNÉS RATTACHÉS
  const customers = await db.prepare("SELECT * FROM customers").all() as any[];
  console.log(`[SECTION 3] REPERTOIRE ABONNÉS NIGELEC RATTACHÉS (${customers.length} Abonnés) :`);
  customers.forEach((c, idx) => {
    console.log(`   ${idx + 1}. Client ID : ${c.id}`);
    console.log(`      • Nom              : ${c.name}`);
    console.log(`      • Téléphone        : ${c.phone}`);
    console.log(`      • Email            : ${c.email}`);
    console.log(`      • Adresse          : ${c.address}`);
    console.log(``);
  });

  // 4. CONCENTRATEURS DE DONNÉES DCU
  const dcus = await db.prepare("SELECT * FROM dcus").all() as any[];
  console.log(`[SECTION 4] PARC CONCENTRATEURS DCU SUBSTATIONS (${dcus.length} DCUs) :`);
  dcus.forEach((d, idx) => {
    console.log(`   ${idx + 1}. DCU ID : ${d.id}`);
    console.log(`      • Intitulé         : ${d.name}`);
    console.log(`      • Région           : ${d.regionId}`);
    console.log(`      • Adresse IP       : ${d.ipAddress}`);
    console.log(`      • Type Modem       : ${d.modemType}`);
    console.log(`      • Statut Réseau    : ${d.status} (Performance: ${d.performance}%)`);
    console.log(``);
  });

  // 5. TARIFICATION OFFICIELLE NIGELEC / ARSE
  const tariffs = await db.prepare("SELECT id, name, rate, fixedMonthlyFee FROM tariffs").all() as any[];
  console.log(`[SECTION 5] GRILLE TARIFAIRE OFFICIELLE NIGELEC (${tariffs.length} Segments) :`);
  tariffs.forEach((t, idx) => {
    console.log(`   ${idx + 1}. Code Tarif : ${t.id}`);
    console.log(`      • Intitulé         : ${t.name}`);
    console.log(`      • Prix kWh         : ${t.rate} FCFA / kWh`);
    console.log(`      • Prime Fixe       : ${t.fixedMonthlyFee} FCFA / mois`);
    console.log(``);
  });

  console.log(`========================================================================`);
  console.log(`=== LECTURE DES DONNÉES RÉELLES TERMINÉE AVEC SUCCÈS 🟢 ===`);
  console.log(`========================================================================\n`);
}

readAllRealData().catch(err => {
  console.error("❌ Erreur lecture données :", err);
  process.exit(1);
});
