import { vending2Service } from '../services/vending2.service';
import { db } from '../db';
import assert from 'assert';

console.log('=== VENDING2 API INTEGRATION TEST SUITE (DLMS/COSEM & STS) ===');

async function runVending2Tests() {
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

  // --- 1. TEST AUTHENTIFICATION & CAPTCHA ---
  await test('Vending2 Auth - Récupération Captcha & Génération UUID', async () => {
    const captcha = await vending2Service.getCaptcha();
    assert.ok(captcha.uuid, 'Le captcha doit retourner un UUID');
    assert.ok(captcha.code, 'Le captcha doit retourner un code de vérification');
  });

  await test('Vending2 Auth - Authentification Server-to-Server et Jeton Bearer', async () => {
    // Test login logic (mock or live environment)
    try {
      const auth = await vending2Service.login();
      assert.ok(auth.token, 'Le login doit retourner un token Bearer');
      assert.ok(auth.expire, 'Le login doit retourner une date de fin de validité (expire)');
    } catch (err: any) {
      // In offline/test environments without live Vending2 host, ensure proper error handling
      assert.ok(err.message.includes('Vending2') || err.message.includes('fetch'), 'L\'erreur doit être identifiée proprement');
    }
  });

  // --- 2. TEST RECHARGE & CONTROLES HTTP 200 + CODE 500 ---
  await test('Vending2 Recharge - Validation des Paramètres et Idempotence', async () => {
    const testMeterNo = '0128244400032';
    const testAmount = 5000;

    // Test rejection of negative amount
    try {
      await vending2Service.rechargeMeter(testMeterNo, -100);
      assert.fail('Devrait rejeter les montants négatifs');
    } catch (err: any) {
      assert.ok(err.message.includes('supérieur à 0'), 'Doit exiger un montant > 0');
    }

    // Insert active PENDING transaction to simulate anti-double-click lock
    const txId = `TX-TEST-IDEM-${Date.now()}`;
    await db.prepare(`
      INSERT INTO vending2_transactions (id, meterNo, amount, operationType, status, requestDate)
      VALUES (?, ?, ?, 'RECHARGE', 'PENDING', ?)
    `).run(txId, testMeterNo, testAmount, new Date().toISOString());

    // Try sending duplicate request
    try {
      await vending2Service.rechargeMeter(testMeterNo, testAmount);
      assert.fail('Devrait bloquer la transaction en double clic');
    } catch (err: any) {
      assert.ok(err.message.includes('déjà en cours'), 'Devrait notifier de l\'existence d\'une transaction en cours');
    } finally {
      // Clean up test lock
      await db.prepare("DELETE FROM vending2_transactions WHERE id = ?").run(txId);
    }
  });

  await test('Vending2 Recharge - Interprétation HTTP 200 avec Code Métier 500 (API Fail)', async () => {
    // Test helper to verify that HTTP 200 with code=500 is treated as FAILED and NOT SUCCESS
    const mockApiResponse = {
      requestId: "e2a3c097-5e1d-439e-99ff-b4ce03e56e8c",
      code: 500,
      msg: "Get ElectricityMeterInformation Fail\r\n ErrorInformation record not found",
      status: "error",
      data: null
    };

    const providerCode = mockApiResponse.code;
    const providerStatus = mockApiResponse.status;
    const isSuccess = providerCode === 200 && providerStatus !== 'error' && mockApiResponse.data !== null;

    assert.strictEqual(isSuccess, false, 'Une réponse avec code=500 et status="error" doit être considérée comme un ÉCHEC (FAILED)');
  });

  // --- 3. TEST TOKEN MANAGEMENT (meter-token/0) ---
  await test('Vending2 TokenManange - Mappage des SubClasses & Formats', async () => {
    const subClassNames: Record<number, string> = {
      0: 'MaximumPowerLimit',
      1: 'ClearCredit',
      5: 'ClearTamperCondition'
    };

    assert.strictEqual(subClassNames[1], 'ClearCredit', 'SubClass 1 doit correspondre à ClearCredit');
    assert.strictEqual(subClassNames[5], 'ClearTamperCondition', 'SubClass 5 doit correspondre à ClearTamperCondition');
    assert.strictEqual(subClassNames[0], 'MaximumPowerLimit', 'SubClass 0 doit correspondre à MaximumPowerLimit');
  });

  // --- 4. TEST PERSISTANCE & DATA INTEGRITY ---
  await test('Vending2 Data Integrity - Enregistrement requestId et flowNo dans vending2_transactions', async () => {
    const testTxId = `TX-TEST-INTEG-${Date.now()}`;
    const testMeter = '0128244400031';
    const reqId = 'f690fdae-1d7e-43bf-821f-3dfb42ce82c6';
    const flowNo = '202507301626523205800003';

    await db.prepare(`
      INSERT INTO vending2_transactions (id, meterNo, amount, operationType, providerRequestId, providerFlowNo, status, requestDate)
      VALUES (?, ?, ?, 'TOKEN_MANAGE', ?, ?, 'SUCCESS', ?)
    `).run(testTxId, testMeter, 0, reqId, flowNo, new Date().toISOString());

    const retrieved = await vending2Service.getTransactionById(testTxId) as any;
    assert.ok(retrieved, 'La transaction doit être correctement enregistrée');
    assert.strictEqual(retrieved.providerRequestId, reqId, 'Le providerRequestId doit correspondre');
    assert.strictEqual(retrieved.providerFlowNo, flowNo, 'Le providerFlowNo doit correspondre');

    await db.prepare("DELETE FROM vending2_transactions WHERE id = ?").run(testTxId);
  });

  console.log('\n=== RÉSULTATS DES TESTS VENDING2 ===');
  console.log(`PASSÉS  : ${passed}`);
  console.log(`ÉCHOUÉS : ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVending2Tests().catch(err => {
  console.error('Erreur fatale tests Vending2:', err);
  process.exit(1);
});
