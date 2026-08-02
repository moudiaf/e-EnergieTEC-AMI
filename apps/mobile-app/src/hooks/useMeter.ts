import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ApiService } from '../services/api';

export const useMeter = (meterId: string) => {
  const [credit, setCredit] = useState(0);
  const [lastToken, setLastToken] = useState('N/A');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const state = await ApiService.getMeterState(meterId);
      setCredit(state.credit);
      setLastToken(state.lastToken);
    } catch (err: any) {
      console.error("[useMeter] Erreur de récupération des données:", err);
      setError("Impossible de charger les données du compteur.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [meterId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const simulatePurchase = async () => {
    setPurchasing(true);
    try {
      // Simulate buying 5000 FCFA worth of electricity (yields 50 kWh)
      const purchaseAmount = 5000;
      const result = await ApiService.purchaseEnergy(meterId, purchaseAmount);
      
      if (result.success) {
        // Re-read fresh state from backend to sync credits
        await loadState(true);
        setLastToken(result.token);
        
        Alert.alert(
          'Recharge Réussie',
          `Votre paiement de ${purchaseAmount} FCFA a été traité. Jeton STS généré: ${result.token}`
        );
      }
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'achat de crédit. Veuillez réessayer.");
    } finally {
      setPurchasing(false);
    }
  };

  return {
    credit,
    lastToken,
    loading,
    purchasing,
    error,
    refresh: () => loadState(false),
    simulatePurchase
  };
};
