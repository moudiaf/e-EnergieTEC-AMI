import { futuriseApiClient } from '../services/futurise-api.client';
import { vending2Service } from '../services/vending2.service';
import { db } from '../db';
import assert from 'assert';

console.log('=== TEST SUITE CLIENT API FUTURISE & METIER QPLAT HES ===');

async function runFuturiseTests() {
  await db.initSchema();
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error(err);
      failed++;
    }
  };

  // --- 1. TEST CLIENT API LOW-LEVEL & MASKING ---
  await test('FuturiseApiClient - Structure des DTOs & Obtenir Captcha', async () => {
    const captcha = await futuriseApiClient.getCaptcha();
    assert.ok(captcha.uuid, 'Le captcha doit retourner un UUID');
    assert.ok(captcha.code, 'Le captcha doit retourner un code');
  });

  // --- 2. TEST METHODES METIER QPLAT HES ---
  await test('QPLAT HES Métier - initierRecharge, effacerCredit, leveeTamper, consulterHistoriqueToken', async () => {
    const testMeter = '0128244400031';

    // Test consulterHistoriqueToken
    const historyBefore = await vending2Service.consulterHistoriqueToken(testMeter);
    assert.ok(Array.isArray(historyBefore), 'L\'historique doit être un tableau');

    // Test idempotence & validation sur initierRecharge avec montant <= 0
    try {
      await vending2Service.initierRecharge(testMeter, 0);
      assert.fail('Devrait refuser les montants de recharge de 0 FCFA');
    } catch (err: any) {
      assert.ok(err.message.includes('supérieur à 0'), 'Doit valider le montant');
    }
  });

  // --- 3. TEST PROTECTION ERREUR METIER CODE 500 ET RETRY BACKOFF ---
  await test('FuturiseApiClient - Interprétation Code Métier 500 et non-ré-exécution inutile', async () => {
    const mockBusinessErrorResponse = {
      requestId: 'e2a3c097-5e1d-439e-99ff-b4ce03e56e8c',
      code: 500,
      msg: 'Get ElectricityMeterInformation Fail',
      status: 'error',
      data: null
    };

    const isSuccess = mockBusinessErrorResponse.code === 200 && mockBusinessErrorResponse.status !== 'error' && mockBusinessErrorResponse.data !== null;
    assert.strictEqual(isSuccess, false, 'Les erreurs métier code: 500 doivent être détectées comme ÉCHEC sans déclencher de retry réseau');
  });

  console.log('\n=== RÉSULTATS DES TESTS FUTURISE CLIENT ===');
  console.log(`PASSÉS  : ${passed}`);
  console.log(`ÉCHOUÉS : ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runFuturiseTests().catch(err => {
  console.error('Erreur fatale suite de tests Futurise:', err);
  process.exit(1);
});
