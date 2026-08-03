import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Meter, Customer } from '../../types';
import { RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MeterReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  meters: Meter[];
  customers: Customer[];
  onConfirmReplacement: (oldMeterId: string, newMeterId: string) => Promise<{ success: boolean; transferToken?: string; creditTransferred?: number }>;
}

export const MeterReplacementModal: React.FC<MeterReplacementModalProps> = ({
  isOpen,
  onClose,
  meters,
  customers,
  onConfirmReplacement
}) => {
  const [oldMeterId, setOldMeterId] = useState('');
  const [newMeterId, setNewMeterId] = useState('');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<{ transferToken?: string; creditTransferred?: number }>({});

  const installedMeters = meters.filter(m => m.lifecycleStatus === 'installed' || !m.lifecycleStatus);
  const warehouseMeters = meters.filter(m => m.lifecycleStatus === 'in_stock');

  const selectedOldMeter = meters.find(m => m.id === oldMeterId);
  const selectedNewMeter = meters.find(m => m.id === newMeterId);
  const customer = selectedOldMeter ? customers.find(c => c.id === selectedOldMeter.customerId) : null;

  const resetForm = () => {
    setOldMeterId('');
    setNewMeterId('');
    setStep('select');
    setIsLoading(false);
    setResultData({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldMeterId || !newMeterId) return;

    if (step === 'select') {
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      setIsLoading(true);
      try {
        const res = await onConfirmReplacement(oldMeterId, newMeterId);
        if (res.success) {
          setResultData({ transferToken: res.transferToken, creditTransferred: res.creditTransferred });
          setStep('success');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Remplacement & Transfert de Compteur">
      <div className="space-y-5">
        {step === 'select' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-400">
              Sélectionnez le compteur à remplacer ainsi que le nouveau compteur vierge disponible en stock magasin.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                1. Compteur Défectueux / À Déposer (Ancien)
              </label>
              <select
                value={oldMeterId}
                onChange={(e) => setOldMeterId(e.target.value)}
                className="input-field w-full h-12 text-sm"
                required
              >
                <option value="">-- Choisir le compteur installé --</option>
                {installedMeters.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - Solde: {m.credit.toFixed(2)} kWh - ({m.location})
                  </option>
                ))}
              </select>
            </div>

            {selectedOldMeter && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Client associé :</span>
                  <strong className="text-white">{customer?.name || 'Inconnu'}</strong>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Crédit Restant à Transférer :</span>
                  <strong className="text-brand font-mono text-sm">{selectedOldMeter.credit.toFixed(2)} kWh</strong>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                2. Nouveau Compteur à Poser (En Stock Magasin)
              </label>
              <select
                value={newMeterId}
                onChange={(e) => setNewMeterId(e.target.value)}
                className="input-field w-full h-12 text-sm"
                required
              >
                <option value="">-- Choisir un nouveau compteur en stock --</option>
                {warehouseMeters.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - S/N: {m.serialNumber || m.id} - ({m.warehouseLocation || 'Stock'})
                  </option>
                ))}
                {warehouseMeters.length === 0 && (
                  <option value="542-999-NEW">542-999-NEW (Compteur de Réserve d'Urgence)</option>
                )}
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button type="button" onClick={handleClose} className="btn-secondary flex-1 py-3 text-sm font-bold rounded-xl">
                Annuler
              </button>
              <button type="submit" disabled={!oldMeterId || !newMeterId} className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                <span>Vérifier & Continuer</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle size={18} />
                <span>Confirmation du Remplacement</span>
              </div>
              <p className="text-xs text-gray-300">
                Vous êtes sur le point de déposer le compteur <strong className="font-mono text-white">{oldMeterId}</strong> et de transférer <strong className="text-brand font-bold">{selectedOldMeter?.credit.toFixed(2)} kWh</strong> vers le compteur <strong className="font-mono text-white">{newMeterId}</strong>.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Ancien Compteur :</span>
                <span className="font-mono text-red-400 line-through">{oldMeterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nouveau Compteur :</span>
                <span className="font-mono text-emerald-400 font-bold">{newMeterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Titulaire du Compte :</span>
                <span className="text-white font-bold">{customer?.name}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-gray-400">Solde Transféré :</span>
                <span className="text-brand font-mono font-bold text-sm">{selectedOldMeter?.credit.toFixed(2)} kWh</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('select')} className="btn-secondary flex-1 py-3 text-sm font-bold rounded-xl" disabled={isLoading}>
                Retour
              </button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                {isLoading ? (
                  <span>Traitement en cours...</span>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Confirmer le Transfert</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <ShieldCheck size={36} />
            </div>
            <h4 className="text-lg font-bold text-white">Remplacement Effectué avec Succès !</h4>
            <p className="text-xs text-gray-300">
              Le compteur <strong className="font-mono text-white">{newMeterId}</strong> a été associé à {customer?.name}.
            </p>

            {resultData.transferToken && (
              <div className="p-4 bg-brand/10 border border-brand/30 rounded-xl space-y-1">
                <div className="text-xs text-brand font-bold uppercase tracking-wider">Token STS de Transfert de Crédit (20 Digits)</div>
                <div className="font-mono font-black text-xl text-white tracking-widest">{resultData.transferToken}</div>
                <div className="text-[10px] text-gray-400">Montant transféré : {resultData.creditTransferred?.toFixed(2)} kWh</div>
              </div>
            )}

            <button onClick={handleClose} className="btn-primary w-full py-3 font-bold rounded-xl mt-4">
              Fermer & Terminer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
