import express from 'express';

const app = express();
const PORT = 7000;

app.use(express.json());

console.log(`[ERP-CIM-GATEWAY] Démarrage de la passerelle d'Intégration d'Entreprise (IEC 61968)`);

// 1. Simulation API CIM (Common Information Model - IEC 61968)
// Permet la synchronisation avec un ERP lourd (Ex: SAP IS-U)
app.post('/api/cim/CustomerAgreement', (req, res) => {
  const { customerId, action, details } = req.body;
  
  console.log(`[ERP-CIM-GATEWAY] 📥 Réception profil client depuis SAP (CIM Format)`);
  console.log(`-> Synchronisation Client ID: ${customerId} | Action: ${action}`);
  
  // Dans un cas réel, cette passerelle traduirait le XML CIM IEC en JSON compréhensible
  // par le MDMS e-EnergieTEC et l'enverrait sur KafKa (Topic: 'erp_customers_sync')
  res.json({
    success: true,
    message: "Profil MDMS synchronisé avec succès",
    cimConfirmation: "OK",
    timestamp: new Date().toISOString()
  });
});

// 2. Passerelle Bancaire ISO 8583 (Mobile Money / Agences)
// Traduction des trames ISO 8583 en requêtes REST Vending
app.post('/api/banking/iso8583/vend', (req, res) => {
  const { mti, pan, amount, meter_number } = req.body;

  // MTI = Message Type Indicator (ex: 0200 = Financial Transaction Request)
  if (mti === '0200') {
    console.log(`[ERP-CIM-GATEWAY] 💰 Transaction bancaire reçue (Orange Money / NITA) - ISO8583`);
    console.log(`-> Demande Jetons STS pour le compteur ${meter_number} de ${amount} FCFA`);
    
    // Routage vers le KMS interne pour la génération Token STS (simulé ici en réponse)
    res.json({
      mti: '0210', // Response to Financial Request
      responseCode: '00', // Approval
      stsToken: 'Simulated-1234-5678-9012-3456-7890',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({ error: "Code MTI non supporté" });
  }
});

// 3. Auto-Discovery Plug & Play (Gateway Provisioning)
app.post('/api/provisioning/auto-discovery', (req, res) => {
  const { deviceId, macAddress, deviceType, capabilities } = req.body;
  console.log(`[ERP-CIM-GATEWAY] 🔌 Auto-Découverte du réseau : Nouvel équipement technique ${deviceId} (${deviceType})`);
  res.json({ status: "Enregistré avec succès dans l'ERP technique." });
});

app.listen(PORT, () => {
  console.log(`[ERP-CIM-GATEWAY] Opérationnel et en écoute sur 0.0.0.0:${PORT}`);
});
