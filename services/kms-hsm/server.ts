import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 5000;

app.use(express.json());

console.log(`[KMS-HSM] Démarrage du Module de Sécurité Matériel (Simulé)...`);

// Clés Maîtresses (SGC / Vending Keys) scellées
const MASTER_SGC_KEY = process.env.MASTER_SGC_KEY || 'NIGELEC-STS-MASTER-KEY-2026';
const STS_BASE_DATE = new Date('1993-01-01T00:00:00Z');

/**
 * Calcul du TID (Token Identifier) conforme STS
 * Nombre de minutes depuis le 01/01/1993
 */
const calculateTID = () => {
  const now = new Date();
  const diffMs = now.getTime() - STS_BASE_DATE.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Génération STS Conforme (Spécification IEC 62055-41)
 */
app.post('/api/kms/generate-token', (req, res) => {
  const { meterId, amount, type = '0', krn = '1', ti = '1' } = req.body;

  if (!meterId) {
    return res.status(400).json({ error: 'Paramètre meterId requis.' });
  }

  const tid = calculateTID();
  
  // Simulation de la structure de donnée STS (20 digits)
  // [Class:1][Subclass:1][TID:20bits][Amount/Data:..][CRC:..]
  
  // Utilisation d'une dérivation cryptographique réelle pour simuler le Vending Key
  const derivationInput = `${meterId}:${MASTER_SGC_KEY}`;
  const vkey = crypto.createHmac('sha256', MASTER_SGC_KEY).update(derivationInput).digest('hex');
  
  // Signature du jeton (Simulation AES-128 STS)
  const tokenPayload = `${tid}:${amount}:${type}:${meterId}`;
  const signature = crypto.createHmac('sha256', vkey).update(tokenPayload).digest('hex');
  
  // Extraction de 20 chiffres à partir de la signature pour le jeton utilisateur
  let digits = BigInt('0x' + signature.substring(0, 16)).toString().substring(0, 20);
  digits = digits.padEnd(20, '0');
  
  const formattedToken = digits.match(/.{1,4}/g)?.join('-') || digits;

  console.log(`[KMS-HSM] 🔐 STS-V2 Jeton Généré | Meter: ${meterId} | TID: ${tid} | Type: ${type}`);

  res.json({
    success: true,
    token: formattedToken,
    tid: tid,
    meterId: meterId,
    class: type === '0' ? 'Credit' : 'Management',
    algorithm: 'STS-V2-AES-128',
    issuedAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[KMS-HSM] Opérationnel et en écoute sur 0.0.0.0:${PORT}`);
});
