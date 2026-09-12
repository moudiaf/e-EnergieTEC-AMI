import { futuriseApiClient } from '../services/futurise-api.client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: 'c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/.env' });

const BASE_URL = process.env.FUTURISE_API_URL || 'http://47.90.150.122:4670/api';
const METER_NO = '0128260224786';

async function main() {
  const token = await futuriseApiClient.getValidToken();
  console.log(`=== AUDIT CODES OBIS COMPTEUR TRIPHASÉ ${METER_NO} ===\n`);

  // 1. Tester d'abord si l'API possède un catalogue d'OBIS pour ce compteur
  try {
    const listRes = await fetch(`${BASE_URL}/obis-list?meterNo=${METER_NO}&page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (listRes.ok) {
      const listJson = await listRes.json();
      console.log('Catalogue /obis-list disponible. Entrées:', listJson?.data?.list?.length || listJson?.data?.length || 0);
    }
  } catch (e: any) {
    console.log('Catalogue non accessible directement:', e.message);
  }

  // 2. Registres OBIS clés triphasés
  const registersToTest = [
    // --- TENSIONS TRIPHASÉES ---
    { obis: '1.0.32.7.0.255', name: 'Tension Simple Phase L1 (V1)', unit: 'V' },
    { obis: '1.0.52.7.0.255', name: 'Tension Simple Phase L2 (V2)', unit: 'V' },
    { obis: '1.0.72.7.0.255', name: 'Tension Simple Phase L3 (V3)', unit: 'V' },
    // --- COURANTS TRIPHASÉS ---
    { obis: '1.0.31.7.0.255', name: 'Courant Phase L1 (I1)', unit: 'A' },
    { obis: '1.0.51.7.0.255', name: 'Courant Phase L2 (I2)', unit: 'A' },
    { obis: '1.0.71.7.0.255', name: 'Courant Phase L3 (I3)', unit: 'A' },
    // --- PUISSANCES ACTIVES TRIPHASÉES ---
    { obis: '1.0.15.7.0.255', name: 'Puissance Active Totale (|P|)', unit: 'kW' },
    { obis: '1.0.1.7.0.255',  name: 'Puissance Active Import (P+)', unit: 'kW' },
    { obis: '1.0.35.7.0.255', name: 'Puissance Active L1 (P1)', unit: 'kW' },
    { obis: '1.0.55.7.0.255', name: 'Puissance Active L2 (P2)', unit: 'kW' },
    { obis: '1.0.75.7.0.255', name: 'Puissance Active L3 (P3)', unit: 'kW' },
    // --- FACTEURS DE PUISSANCE TRIPHASÉS ---
    { obis: '1.0.13.7.0.255', name: 'Facteur de Puissance Total (Cos φ)', unit: '' },
    { obis: '1.0.33.7.0.255', name: 'Facteur de Puissance L1', unit: '' },
    { obis: '1.0.53.7.0.255', name: 'Facteur de Puissance L2', unit: '' },
    { obis: '1.0.73.7.0.255', name: 'Facteur de Puissance L3', unit: '' },
    // --- FRÉQUENCE RÉSEAU ---
    { obis: '1.0.14.7.0.255', name: 'Fréquence Réseau', unit: 'Hz' },
    // --- ÉNERGIES ACTIVES CUMULÉES ---
    { obis: '1.0.1.8.0.255',  name: 'Énergie Active Import Totale (A+)', unit: 'kWh' },
    { obis: '1.0.2.8.0.255',  name: 'Énergie Active Export Totale (A-)', unit: 'kWh' },
    { obis: '1.0.15.8.0.255', name: 'Énergie Active Totale (|A|)', unit: 'kWh' },
    // --- TARIFS ÉNERGIE (TOU) ---
    { obis: '1.0.1.8.1.255',  name: 'Énergie Active Import Tarif T1', unit: 'kWh' },
    { obis: '1.0.1.8.2.255',  name: 'Énergie Active Import Tarif T2', unit: 'kWh' },
    // --- PUISSANCE MAXIMALE APPELÉE ---
    { obis: '1.0.1.6.0.255',  name: 'Puissance Max Appelée (Max Demand)', unit: 'kW' },
    // --- PRÉPAIEMENT STS & STATUT DISJONCTEUR ---
    { obis: '0.0.96.60.0.255',name: 'Solde Crédit STS', unit: 'kWh' },
    { obis: '0.0.96.3.10.255',name: 'Statut Contacteur / Relais', unit: 'STATE' },
    // --- ANTI-FRAUDE & SÉCURITÉ ---
    { obis: '0.0.96.11.0.255',name: 'Capot Principal (Meter Cover)', unit: 'FLAG' },
    { obis: '0.0.96.11.1.255',name: 'Cache-Bornes (Terminal Cover)', unit: 'FLAG' },
    { obis: '0.0.96.11.2.255',name: 'Détection Champ Magnétique', unit: 'FLAG' },
    { obis: '0.0.96.9.0.255', name: 'Température Ambiante Compteur', unit: '°C' },
    // --- IDENTIFICATION MATÉRIELLE & STS ---
    { obis: '0.0.96.1.0.255', name: 'Numéro de Série Compteur', unit: '' },
    { obis: '1.0.129.129.10.255', name: 'Code Constructeur (MFC)', unit: '' }
  ];

  console.log(`Lancement de l'audit séquentiel des ${registersToTest.length} registres OBIS sur ${METER_NO}...\n`);
  
  const results: any[] = [];
  for (const reg of registersToTest) {
    try {
      const res = await futuriseApiClient.readObis(METER_NO, reg.obis, reg.name);
      if (res) {
        console.log(`✅ ${reg.obis.padEnd(16)} | ${reg.name.padEnd(35)} | ${res.result}`);
        results.push({ ...reg, status: 'SUCCESS', response: res.result, value: res.numericValue });
      } else {
        console.log(`⚠️ ${reg.obis.padEnd(16)} | ${reg.name.padEnd(35)} | NON_REPONDU`);
        results.push({ ...reg, status: 'EMPTY_OR_UNSUPPORTED', response: null, value: null });
      }
    } catch (err: any) {
      console.log(`❌ ${reg.obis.padEnd(16)} | ${reg.name.padEnd(35)} | ERREUR: ${err.message}`);
      results.push({ ...reg, status: 'ERROR', error: err.message });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n================== RÉSUMÉ DE L\'AUDIT ==================');
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  console.log(`Total testés: ${results.length} | Succès: ${successCount} | Non gérés: ${results.length - successCount}`);

  const outPath = 'c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server/tests/audit_triphase_obis_results.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Résultats enregistrés dans ${outPath}`);
}

main().catch(console.error);
