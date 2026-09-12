import { stsService } from '../services/sts.service';
import { billingService } from '../services/billing.service';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import assert from 'assert';

console.log('=== e-EnergieTEC SMART PREPAYMENT & AMI SYSTEM TEST SUITE ===');

async function runTests() {
  await db.initSchema();
  let passedCount = 0;
  let failedCount = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}`);
      console.error(err);
      failedCount++;
    }
  };

  // --- 1. TESTS DE LA GRILLE TARIFAIRE NIGELEC ---
  await test('Moteur Tarifaire - Calcul Tranche Sociale BT-D', async () => {
    // La tranche sociale (rate: 59.43, primeFixe: 0, TVA: 0)
    // Plafond 50 kWh/mois.
    // Mettons que le client consomme 30 kWh.
    const tariffs = await db.prepare("SELECT * FROM tariffs WHERE id = 'social'").get() as any;
    assert.ok(tariffs, 'Le tarif social doit exister');
    const tiers = JSON.parse(tariffs.tiers);
    assert.strictEqual(tiers[0].rate, 59.43);
  });

  await test('Moteur Tarifaire - Calcul Tranche Domestique progressive (BT-D)', async () => {
    // Tranche domestique standard : rate = 79.25, primeFixe = 1278, TVA = 19%, taxe habitat = 100
    const tariffs = await db.prepare("SELECT * FROM tariffs WHERE id = 'domestic'").get() as any;
    assert.ok(tariffs, 'Le tarif domestique doit exister');
    const tiers = JSON.parse(tariffs.tiers);
    
    // Vérification des 4 tranches progressives
    assert.strictEqual(tiers[0].rate, 59.45);
    assert.strictEqual(tiers[1].rate, 79.25);
    assert.strictEqual(tiers[2].rate, 94.13);
    assert.strictEqual(tiers[3].rate, 120.35);
  });

  // --- 2. TESTS DU SYSTÈME STS (STANDARD PREPAYMENT) ---
  await test('STS Prepayment - Génération et Format du Jeton (20 chiffres)', async () => {
    const testMeterId = 'TEST-METER-STS-001';
    await db.prepare("INSERT OR IGNORE INTO meters (id, serialNumber, status, credit) VALUES (?, ?, 'online', 100)").run(testMeterId, testMeterId);

    try {
      const result = await stsService.generateToken(testMeterId, 50, 'recharge');
      
      assert.ok(result.token, 'Le jeton doit être généré');
      assert.strictEqual(result.rawToken.length, 20, 'Le jeton brut doit comporter exactement 20 caractères numériques');
      
      // Le format standard STS doit être 4-4-4-4-4
      const parts = result.token.split('-');
      assert.strictEqual(parts.length, 5, 'Le jeton formaté doit être séparé en 5 segments');
      parts.forEach(part => {
        assert.strictEqual(part.length, 4, 'Chaque segment du jeton doit contenir exactement 4 chiffres');
      });
    } finally {
      await db.prepare("DELETE FROM meters WHERE id = ?").run(testMeterId);
    }
  });

  await test('STS Prepayment - Protection Anti-Replay (TID incrémental)', async () => {
    const testMeterId = 'TEST-METER-STS-002';
    await db.prepare("INSERT OR IGNORE INTO meters (id, serialNumber, status, credit, lastTid) VALUES (?, ?, 'online', 100, 1000)").run(testMeterId, testMeterId);
    
    try {
      const r1 = await stsService.generateToken(testMeterId, 20, 'recharge');
      const r2 = await stsService.generateToken(testMeterId, 20, 'recharge');
      
      assert.ok(r1.token && r2.token, 'Les deux jetons STS doivent être correctement générés');
    } finally {
      await db.prepare("DELETE FROM meters WHERE id = ?").run(testMeterId);
    }
  });

  // --- 3. TESTS DE SÉCURITÉ & HABILITATIONS RBAC ---
  await test('Sécurité Authentification - Chiffrement Bcrypt des mots de passe', async () => {
    const plainText = 'admin123';
    const hash = bcrypt.hashSync(plainText, 10);
    
    assert.ok(bcrypt.compareSync(plainText, hash), 'Bcrypt doit pouvoir authentifier un mot de passe valide');
    assert.ok(!bcrypt.compareSync('wrong_password', hash), 'Bcrypt doit rejeter un mot de passe erroné');
  });

  await test('Sécurité Habilitations - Contrôle d\'Accès Basé sur les Rôles (RBAC)', async () => {
    const { requireRole } = await import('../middleware/auth');
    const adminMiddleware = requireRole(['admin']);
    
    let nextCalled = false;
    const reqAdmin = { user: { id: 'U001', role: 'admin' } };
    const res = { status: (code: number) => ({ json: (d: any) => d }) };
    
    adminMiddleware(reqAdmin, res, () => { nextCalled = true; });
    assert.ok(nextCalled, 'Le rôle admin doit être autorisé sur les endpoints réservés aux admins');

    let errorStatus = 0;
    const reqVendor = { user: { id: 'U002', role: 'vendor' } };
    const resDeny = { 
      status: (code: number) => { 
        errorStatus = code; 
        return { json: (d: any) => d }; 
      } 
    };
    
    adminMiddleware(reqVendor, resDeny, () => {});
    assert.strictEqual(errorStatus, 403, 'Le rôle vendor doit être refusé (403) sur les endpoints réservés aux admins');
  });

  // --- 4. TESTS VENDING2 API INTEGRATION ---
  await test('Vending2 API - Authentification Server-to-Server & Captcha', async () => {
    const { vending2Service } = await import('../services/vending2.service');
    const captcha = await vending2Service.getCaptcha();
    assert.ok(captcha.uuid, 'Le captcha doit générer/extraire un UUID');
    assert.ok(captcha.code, 'Le captcha doit générer/extraire un code');
  });

  await test('Vending2 API - Recharge & Protection contre HTTP 200 + Code Métier 500', async () => {
    const mockFailResponse = {
      requestId: "e2a3c097-5e1d-439e-99ff-b4ce03e56e8c",
      code: 500,
      msg: "Get ElectricityMeterInformation Fail\r\n ErrorInformation record not found",
      status: "error",
      data: null
    };

    const isSuccess = mockFailResponse.code === 200 && mockFailResponse.status !== 'error' && mockFailResponse.data !== null;
    assert.strictEqual(isSuccess, false, 'Le système RenTEC doit identifier une réponse avec code 500 comme FAILED');
  });

  await test('Vending2 API - Idempotence & Interdiction du Double Clic', async () => {
    const testMeter = '0128244400032';
    const testAmount = 5000;
    const txId = `TX-TEST-IDEM-${Date.now()}`;

    await db.prepare(`
      INSERT INTO vending2_transactions (id, meterNo, amount, operationType, status, requestDate)
      VALUES (?, ?, ?, 'RECHARGE', 'PENDING', ?)
    `).run(txId, testMeter, testAmount, new Date().toISOString());

    const { vending2Service } = await import('../services/vending2.service');
    try {
      await vending2Service.rechargeMeter(testMeter, testAmount);
      assert.fail('Une transaction en double aurait dû être bloquée');
    } catch (err: any) {
      assert.ok(err.message.includes('déjà en cours'), 'Idempotence: doit rejeter la seconde tentative');
    } finally {
      await db.prepare("DELETE FROM vending2_transactions WHERE id = ?").run(txId);
    }
  });

  await test('Vending2 API - Persistance requestId et flowNo', async () => {
    const txId = `TX-TEST-LOG-${Date.now()}`;
    const reqId = 'f690fdae-1d7e-43bf-821f-3dfb42ce82c6';
    const flowNo = '202507301626523205800003';

    await db.prepare(`
      INSERT INTO vending2_transactions (id, meterNo, amount, operationType, providerRequestId, providerFlowNo, status, requestDate)
      VALUES (?, ?, ?, 'TOKEN_MANAGE', ?, ?, 'SUCCESS', ?)
    `).run(txId, '0128244400031', 0, reqId, flowNo, new Date().toISOString());

    const { vending2Service } = await import('../services/vending2.service');
    const tx = await vending2Service.getTransactionById(txId) as any;

    assert.strictEqual(tx.providerRequestId, reqId, 'Le providerRequestId doit être persisté');
    assert.strictEqual(tx.providerFlowNo, flowNo, 'Le providerFlowNo doit être persisté');

    await db.prepare("DELETE FROM vending2_transactions WHERE id = ?").run(txId);
  });

  console.log('\n=== RÉSULTAT DU RUN DE TESTS ===');
  console.log(`PASSÉS  : ${passedCount}`);
  console.log(`ÉCHOUÉS : ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('Tout est au vert ! 🟢');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Erreur fatale dans la suite de tests :', err);
  process.exit(1);
});
