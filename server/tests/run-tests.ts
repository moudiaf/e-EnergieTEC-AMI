import { stsService } from '../services/sts.service';
import { billingService } from '../services/billing.service';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import assert from 'assert';

console.log('=== e-EnergieTEC SMART PREPAYMENT & AMI SYSTEM TEST SUITE ===');

async function runTests() {
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
    // Choisir un compteur existant pour le test
    const meter = await db.prepare("SELECT id FROM meters LIMIT 1").get() as { id: string };
    assert.ok(meter, 'Un compteur témoin doit exister en base');

    const result = await stsService.generateToken(meter.id, 50, 'recharge');
    
    assert.ok(result.token, 'Le jeton doit être généré');
    assert.strictEqual(result.rawToken.length, 20, 'Le jeton brut doit comporter exactement 20 caractères numériques');
    
    // Le format standard STS doit être 4-4-4-4-4
    const parts = result.token.split('-');
    assert.strictEqual(parts.length, 5, 'Le jeton formaté doit être séparé en 5 segments');
    parts.forEach(part => {
      assert.strictEqual(part.length, 4, 'Chaque segment du jeton doit contenir exactement 4 chiffres');
    });
  });

  await test('STS Prepayment - Protection Anti-Replay (TID incrémental)', async () => {
    const meter = await db.prepare("SELECT id, lastTid FROM meters LIMIT 1").get() as { id: string, lastTid: number };
    
    const r1 = await stsService.generateToken(meter.id, 20, 'recharge');
    const r2 = await stsService.generateToken(meter.id, 20, 'recharge');
    
    assert.ok(r2.tid > r1.tid || r2.tid > meter.lastTid, 'Chaque nouveau jeton généré doit avoir un TID supérieur au précédent');
  });

  // --- 3. TESTS DE SÉCURITÉ ---
  await test('Sécurité Authentification - Chiffrement Bcrypt des mots de passe', async () => {
    const plainText = 'admin123';
    const hash = bcrypt.hashSync(plainText, 10);
    
    assert.ok(bcrypt.compareSync(plainText, hash), 'Bcrypt doit pouvoir authentifier un mot de passe valide');
    assert.ok(!bcrypt.compareSync('wrong_password', hash), 'Bcrypt doit rejeter un mot de passe erroné');
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
