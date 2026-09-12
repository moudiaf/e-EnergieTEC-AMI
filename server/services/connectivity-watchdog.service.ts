import { db } from '../db';
import { auditService } from './audit.service';
import { Response } from 'express';

export interface MeterStatusChangeEvent {
  meterId: string;
  status: 'online' | 'offline';
  previousStatus: 'online' | 'offline';
  lastTelemetrySync: string;
  inactivityMinutes: number;
  reason: 'HEARTBEAT_TIMEOUT' | 'HEARTBEAT_RESTORED' | 'MANUAL_PING';
  timestamp: string;
}

export class ConnectivityWatchdogService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  // Fenêtre de tolérance avant de déclarer un compteur hors-ligne (ex: 10 minutes)
  private readonly TIMEOUT_MS = 10 * 60 * 1000;
  // Intervalle de vérification du Watchdog (toutes les 30 secondes)
  private readonly CHECK_INTERVAL_MS = 30 * 1000;

  // Abonnés SSE (Server-Sent Events) pour pousser les changements en direct au frontend
  private sseClients: Set<Response> = new Set();

  /**
   * Démarre le démon de surveillance en arrière-plan
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[WATCHDOG] 🐕 Démon de surveillance automatique de connectivité démarré (Cycle: 30s | Seuil inactivité: 10 min)');

    // Exécution immédiate au démarrage
    this.sweepFleetConnectivity().catch(err => {
      console.error('[WATCHDOG] Erreur premier cycle:', err.message);
    });

    // Planification récurrente
    this.timer = setInterval(() => {
      this.sweepFleetConnectivity().catch(err => {
        console.error('[WATCHDOG] Erreur cycle périodique:', err.message);
      });
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Arrête le démon de surveillance
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[WATCHDOG] 🛑 Démon de surveillance arrêté.');
  }

  /**
   * Cycle d'audit complet de tous les compteurs du parc
   */
  async sweepFleetConnectivity(): Promise<{ checked: number; transitionedOffline: number; transitionedOnline: number }> {
    const now = Date.now();
    const meters = await db.prepare("SELECT id, status, lastTelemetrySync, relayStatus FROM meters").all() as {
      id: string;
      status: 'online' | 'offline';
      lastTelemetrySync: string | null;
      relayStatus?: string | null;
    }[];

    let transitionedOffline = 0;
    let transitionedOnline = 0;

    for (const meter of meters) {
      // Si le disjoncteur a été coupé par télécommande (relais OUVERT), le Watchdog ne doit pas l'écraser
      if (meter.relayStatus === 'OPEN') {
        continue;
      }

      const lastSyncTime = meter.lastTelemetrySync ? new Date(meter.lastTelemetrySync).getTime() : 0;
      const inactivityMs = now - lastSyncTime;
      const inactivityMinutes = Math.round(inactivityMs / 60000);

      // CAS 1 : Compteur noté ONLINE mais aucune trame reçue depuis > 10 minutes ➔ BASCULE EN OFFLINE
      if (meter.status === 'online' && (inactivityMs > this.TIMEOUT_MS || lastSyncTime === 0)) {
        transitionedOffline++;
        await this.applyStatusTransition(meter.id, 'offline', meter.status, inactivityMinutes, 'HEARTBEAT_TIMEOUT');
      }
      // CAS 2 : Compteur noté OFFLINE mais un PING récent existe (ex: < 10 minutes) ➔ BASCULE EN ONLINE
      else if (meter.status === 'offline' && lastSyncTime > 0 && inactivityMs <= this.TIMEOUT_MS) {
        transitionedOnline++;
        await this.applyStatusTransition(meter.id, 'online', meter.status, inactivityMinutes, 'HEARTBEAT_RESTORED');
      }
    }

    return {
      checked: meters.length,
      transitionedOffline,
      transitionedOnline
    };
  }

  /**
   * Applique le changement de statut en base de données, lève/résout l'alerte et notifie le frontend
   */
  private async applyStatusTransition(
    meterId: string, 
    newStatus: 'online' | 'offline', 
    previousStatus: 'online' | 'offline', 
    inactivityMinutes: number,
    reason: MeterStatusChangeEvent['reason']
  ) {
    const nowIso = new Date().toISOString();

    // 1. Mise à jour de la table meters
    await db.prepare("UPDATE meters SET status = ? WHERE id = ?").run(newStatus, meterId);

    // 2. Gestion de l'alerte réseau
    if (newStatus === 'offline') {
      const alertId = `ALT-COMM-LOST-${Date.now()}-${meterId.slice(-4)}`;
      const alertMessage = `[COMMUNICATION PERDUE] Compteur ${meterId} injoignable depuis plus de ${inactivityMinutes} minutes.`;

      await db.prepare(`
        INSERT INTO alerts (id, meterId, type, category, priority, message, timestamp, status)
        VALUES (?, ?, 'COMMUNICATION_LOST', 'network', 'Moyenne', ?, ?, 'ACTIVE')
      `).run(alertId, meterId, alertMessage, nowIso);

      await auditService.log(
        'METER_AUTO_OFFLINE',
        `Compteur ${meterId} déclaré HORS-LIGNE automatiquement par le Watchdog (${inactivityMinutes} min sans réponse).`,
        'CONNECTIVITY_WATCHDOG'
      );
    } else {
      // Clôture des alertes de perte de communication pour ce compteur
      await db.prepare(`
        UPDATE alerts 
        SET status = 'RESOLVED' 
        WHERE meterId = ? AND type = 'COMMUNICATION_LOST' AND status = 'ACTIVE'
      `).run(meterId);

      await auditService.log(
        'METER_AUTO_ONLINE',
        `Compteur ${meterId} reconnecté et déclaré EN LIGNE par le Watchdog (Signal GPRS actif).`,
        'CONNECTIVITY_WATCHDOG'
      );
    }

    // 3. Diffusion en direct vers tous les écrans Frontend connectés (SSE Stream)
    const eventPayload: MeterStatusChangeEvent = {
      meterId,
      status: newStatus,
      previousStatus,
      lastTelemetrySync: nowIso,
      inactivityMinutes,
      reason,
      timestamp: nowIso
    };

    this.broadcastSseEvent('METER_STATUS_CHANGED', eventPayload);
  }

  /**
   * Enregistre un client Web Frontend pour les notifications temps réel (Server-Sent Events)
   */
  registerSseClient(res: Response) {
    this.sseClients.add(res);
    console.log(`[WATCHDOG SSE] Nouveau client connecté. Total clients actifs : ${this.sseClients.size}`);

    res.on('close', () => {
      this.sseClients.delete(res);
      console.log(`[WATCHDOG SSE] Client déconnecté. Total clients actifs : ${this.sseClients.size}`);
    });
  }

  /**
   * Diffuse un événement vers tous les navigateurs connectés
   */
  broadcastSseEvent(eventType: string, data: any) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }
}

export const connectivityWatchdogService = new ConnectivityWatchdogService();
