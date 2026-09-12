import { CONFIG } from '../constants/config';

export interface MeterState {
  meterId: string;
  credit: number;
  lastToken: string;
  status: string;
}

export const ApiService = {
  /**
   * Fetch meter state from backend with offline/simulated fallback.
   */
  async getMeterState(meterId: string): Promise<MeterState> {
    try {
      console.log(`[API] Récupération de l'état du compteur ${meterId} depuis ${CONFIG.API_URL}/api/public/meters/${meterId}`);
      const response = await fetch(`${CONFIG.API_URL}/api/public/meters/${meterId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const meter = await response.json() as any;

      // Find last token for this meter from backend if possible
      let lastToken = '1423-5643-9087-1123-5432';
      try {
        const tokenRes = await fetch(`${CONFIG.API_URL}/api/public/meters/${meterId}/tokens`);
        if (tokenRes.ok) {
          const tokens = await tokenRes.json() as any[];
          const meterTokens = tokens
            .filter(t => t.type === 'recharge')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          if (meterTokens.length > 0) {
            lastToken = meterTokens[0].token;
          }
        }
      } catch (tokenErr) {
        console.warn("[API] Impossible de récupérer les jetons du backend, utilisation du jeton par défaut.", tokenErr);
      }

      return {
        meterId: meter.id,
        credit: meter.credit,
        lastToken: lastToken,
        status: meter.status || 'online'
      };
    } catch (error) {
      console.warn("[API] Connexion backend impossible. Utilisation du fallback simulé local.", error);
      // Fallback local
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            meterId,
            credit: 142.5,
            lastToken: '1423-5643-9087-1123-5432',
            status: 'online'
          });
        }, 500);
      });
    }
  },

  /**
   * Register a payment and generate a real STS token via Express Core API.
   */
  async purchaseEnergy(meterId: string, amount: number): Promise<{ success: boolean; token: string; newCredit: number }> {
    try {
      console.log(`[API] Achat de crédit pour le compteur ${meterId} (Montant: ${amount})`);
      
      // Calculate kWh based on tariff (e.g. 100 FCFA per kWh)
      const kwh = amount / 100;

      // 1. Call tokens endpoint to generate the STS token
      const tokenResponse = await fetch(`${CONFIG.API_URL}/api/public/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId,
          kwh,
          type: 'recharge'
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json() as any;
        throw new Error(errorData.error || `Erreur génération token HTTP ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json() as any;
      const generatedToken = tokenData.token;
      const tokenId = tokenData.id;

      // 2. Register payment transaction
      try {
        await fetch(`${CONFIG.API_URL}/api/public/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            operator: 'AirtelMoney',
            phone: '+227 90 12 34 56',
            reference: `MOB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            meterId,
            tokenId,
            status: 'Success'
          })
        });
      } catch (payErr) {
        console.warn("[API] Impossible d'enregistrer la transaction de paiement sur le backend.", payErr);
      }

      return {
        success: true,
        token: generatedToken,
        newCredit: kwh
      };

    } catch (error: any) {
      console.error("[API] Échec d'émission du jeton STS :", error);
      return {
        success: false,
        error: error.message || "Serveur central NIGELEC / KMS-HSM injoignable. Transaction refusée pour des raisons de sécurité.",
        token: "",
        newCredit: 0
      };
    }
  }
};
