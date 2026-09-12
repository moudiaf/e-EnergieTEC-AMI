import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { StsEngine } from './sts-engine';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware CORS complet pour autoriser les requêtes cross-origin du navigateur
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', kms: 'ONLINE', port: PORT, standard: 'IEC 62055-41' });
});

app.get('/api/kms/health', (req, res) => {
  res.json({ status: 'HEALTHY', kms: 'ONLINE', port: PORT, standard: 'IEC 62055-41' });
});

console.log(`[KMS-HSM] Démarrage du Moteur Cryptographique STS CEI 62055-41...`);

// Clés Maîtresses (SGC / Vending Keys) scellées
const MASTER_SGC_KEY = process.env.MASTER_SGC_KEY || StsEngine.DEFAULT_VK_HEX;

const handleTokenGeneration = (req: express.Request, res: express.Response) => {
  const { meterId, amount, type = '0', krn = '2', ti = '1', sgc = '600876' } = req.body;

  if (!meterId) {
    return res.status(400).json({ error: 'Paramètre meterId requis.' });
  }

  // Calcul du volume en kWh à partir du montant (ou valeur directe)
  // Tarif mono 95 FCFA/kWh, Tarif tri 120 FCFA/kWh
  const isTri = meterId.endsWith('86') || meterId.includes('400');
  const rate = isTri ? 120.0 : 95.0;
  const kwh = typeof amount === 'number' && amount > 500 ? +(amount / rate).toFixed(2) : Number(amount || 10.0);

  // Moteur binaire STS 66-bits
  const result = StsEngine.generateCreditToken({
    meterId,
    amountKwh: kwh,
    sgc: sgc.toString(),
    krn: Number(krn),
    masterKey: MASTER_SGC_KEY
  });

  console.log(`[KMS-HSM] 🔐 STS Jeton Généré | Meter: ${meterId} | TID: ${result.tid} | CRC: 0x${result.crc.toString(16).toUpperCase()} | Token: ${result.token}`);

  res.json({
    success: true,
    token: result.token,
    rawToken: result.rawToken,
    tid: result.tid,
    crc: result.crc,
    kwh: result.kwh,
    meterId: meterId,
    class: type === '0' ? 'Credit' : 'Management',
    algorithm: 'STS-V2-DES-OFB (DKGA02 / CEI 62055-41)',
    sgc: sgc,
    krn: krn,
    issuedAt: new Date().toISOString()
  });
};

app.post('/api/kms/generate-token', handleTokenGeneration);
app.post('/generate-token', handleTokenGeneration);

app.listen(PORT, () => {
  console.log(`[KMS-HSM] Opérationnel et en écoute sur 0.0.0.0:${PORT}`);
});

