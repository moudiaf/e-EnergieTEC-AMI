import { Request, Response } from 'express';
import { connectivityWatchdogService } from '../services/connectivity-watchdog.service';

export const StreamController = {
  subscribe(req: Request, res: Response) {
    // Configuration des en-têtes HTTP pour Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactive le buffering Nginx si déployé
    res.flushHeaders();

    // Envoi de la trame initiale de connexion
    res.write(`event: INIT_HANDSHAKE\ndata: ${JSON.stringify({ status: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    // Enregistrement du client auprès du service de diffusion
    connectivityWatchdogService.registerSseClient(res);

    // Keep-alive heartbeat toutes les 25 secondes pour éviter la fermeture par timeout navigateur
    const heartbeatTimer = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
    });
  }
};
