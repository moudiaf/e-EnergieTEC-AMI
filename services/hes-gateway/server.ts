import net from 'net';

const PORT = 4059; // Standard DLMS/COSEM Port
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';

console.log(`[HES-GATEWAY] Démarrage du Head End System DLMS/COSEM sur le port ${PORT}...`);
console.log(`[HES-GATEWAY] Broker Kafka cible : ${KAFKA_BROKER}`);

// Simulation d'un serveur TCP qui accepte les trames des concentrateurs (DCU)
const server = net.createServer((socket) => {
  const dcuAddress = socket.remoteAddress;
  console.log(`[HES-GATEWAY] Nouvelle connexion entrante d'un DCU : ${dcuAddress}`);

  socket.on('data', (data) => {
    // Les données entrantes seraient des trames HDLC / DLMS brutes.
    // En production, nous utiliserions une librairie DLMS (ex. Gurux) pour décoder la trame (APDU).
    const rawFrame = data.toString('hex');
    console.log(`[HES-GATEWAY] Trame DLMS reçue (${rawFrame.length} bytes) de ${dcuAddress}`);

    // Simulation de publication vers Kafka (Topic: 'dcu_readings')
    const payload = {
      source: dcuAddress,
      timestamp: new Date().toISOString(),
      rawLength: data.length,
      status: 'pending_decode'
    };
    
    console.log(`[HES-GATEWAY] -> Publication Kafka [dcu_telemetry] : ${JSON.stringify(payload)}`);
    
    // Accusé de réception basique (Acknowledge)
    socket.write(Buffer.from('ACK'));
  });

  socket.on('end', () => {
    console.log(`[HES-GATEWAY] Déconnexion du DCU : ${dcuAddress}`);
  });

  socket.on('error', (err) => {
    console.error(`[HES-GATEWAY] Erreur socket : ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`[HES-GATEWAY] Prêt et en écoute sur 0.0.0.0:${PORT}`);
});
