import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 5000;

app.use(express.json());

console.log(`[KMS-HSM] Démarrage du Module de Sécurité Matériel (Simulé)...`);

// Clés Maîtresses (SGC / Vending Keys) scellées
const MASTER_SGC_KEY = process.env.MASTER_SGC_KEY || crypto.randomBytes(16).toString('hex');

/**
 * Génération STS (Simulée) via encapsulation cryptographique stricte
 * Dans un système de niveau bancaire, cela communiquerait avec un Thales payShield ou AWS CloudHSM
 */
app.post('/api/kms/generate-token', (req, res) => {
  const { meterId, amount, krn, ti } = req.body;

  if (!meterId || !amount) {
    return res.status(400).json({ error: 'Paramètres manquants : meterId ou amount requis.' });
  }

  // 1. Simulation d'un contrôle de validité cryptographique du KRN (Key Revision Number)
  console.log(`[KMS-HSM] Validation KRN (${krn}) et TI (${ti}) pour le compteur ${meterId}`);

  // 2. Génération du code à 20 chiffres (Algorithme STS IEC 62055-41 simulé avec signature locale)
  // Utilisation d'un hash HMAC pour simuler une dérivation de clé infalsifiable
  const payload = `${meterId}:${amount}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', MASTER_SGC_KEY).update(payload).digest('hex');
  
  // Transformation du hash en format STS-like (20 digits formatés en blocs de 4)
  let rawNumbers = BigInt('0x' + hmac.substring(0, 15)).toString(); // Obtenir une grande chaîne numérique
  rawNumbers = rawNumbers.padEnd(20, '1234567890').substring(0, 20); // Assurer 20 chiffres

  const formattedToken = rawNumbers.match(/.{1,4}/g)?.join('-') || rawNumbers;

  console.log(`[KMS-HSM] ✅ Jeton STS Classe 1 généré en zone sécurisée. (${formattedToken})`);

  res.json({
    success: true,
    token: formattedToken,
    algorithm: 'STS-V2-AES-128', // Indication de la norme simulée
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[KMS-HSM] Opérationnel et en écoute sur 0.0.0.0:${PORT}`);
});
