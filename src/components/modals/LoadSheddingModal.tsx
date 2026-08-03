import React, { useState } from 'react';
import { Modal } from '../Modal';
import { DCU, Region } from '../../types';
import { Power, AlertTriangle, CheckCircle2, ShieldAlert, Clock, RefreshCw, ZapOff, Zap } from 'lucide-react';

interface LoadSheddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dcus: DCU[];
  regions?: Region[];
  onExecuteLoadShedding: (targetRegion: string, dcuIds: string[], durationHours: number, actionType: 'shed' | 'restore') => Promise<void>;
}

export const LoadSheddingModal: React.FC<LoadSheddingModalProps> = ({
  isOpen,
  onClose,
  dcus,
  regions = [],
  onExecuteLoadShedding
}) => {
  const [targetRegion, setTargetRegion] = useState('NIAMEY');
  const [selectedDcuId, setSelectedDcuId] = useState<string>('ALL');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [actionType, setActionType] = useState<'shed' | 'restore'>('shed');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const filteredDcus = dcus.filter(d => targetRegion === 'ALL' || d.location?.toUpperCase().includes(targetRegion) || d.name?.toUpperCase().includes(targetRegion));

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionProgress(10);

    const targetDcuIds = selectedDcuId === 'ALL' 
      ? filteredDcus.map(d => d.id) 
      : [selectedDcuId];

    // Simulation de progression d'envoi DLMS/COSEM
    const interval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 400);

    try {
      await onExecuteLoadShedding(targetRegion, targetDcuIds, durationHours, actionType);
      setTimeout(() => {
        setExecutionProgress(100);
        setIsExecuting(false);
        setIsFinished(true);
      }, 1600);
    } catch (err) {
      clearInterval(interval);
      setIsExecuting(false);
    }
  };

  const handleClose = () => {
    setIsFinished(false);
    setIsExecuting(false);
    setExecutionProgress(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Planification & Commandes de Délestage">
      <div className="space-y-5">
        {!isFinished ? (
          <form onSubmit={handleExecute} className="space-y-4">
            {/* Bannière d'Avertissement */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-amber-400 uppercase tracking-wider">Commande Haute Priorité (Grid Control)</h5>
                <p className="text-gray-300 leading-relaxed">
                  Cette commande transmet un ordre d'ouverture/fermeture groupé des relais à distance (*DLMS Remote Disconnect*) vers les concentrateurs DCU du secteur sélectionné.
                </p>
              </div>
            </div>

            {/* Type d'Action (Délester vs Rétablir) */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                1. Mode d'Intervention
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionType('shed')}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    actionType === 'shed'
                      ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <ZapOff size={16} />
                  <span>Déclencher Coupure (Délestage)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('restore')}
                  className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                    actionType === 'restore'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Zap size={16} />
                  <span>Rétablir Alimentation (Normal)</span>
                </button>
              </div>
            </div>

            {/* Sélection Région & Poste */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  2. Région / Zone Cible
                </label>
                <select
                  value={targetRegion}
                  onChange={(e) => {
                    setTargetRegion(e.target.value);
                    setSelectedDcuId('ALL');
                  }}
                  className="input-field w-full h-11 text-xs"
                >
                  <option value="NIAMEY">Région Niamey (Capitale)</option>
                  <option value="MARADI">Région Maradi</option>
                  <option value="ZINDER">Région Zinder</option>
                  <option value="AGADEZ">Région Agadez</option>
                  <option value="TAHOUA">Région Tahoua</option>
                  <option value="ALL">Toutes les Régions (National)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  3. Concentrateur DCU Cible
                </label>
                <select
                  value={selectedDcuId}
                  onChange={(e) => setSelectedDcuId(e.target.value)}
                  className="input-field w-full h-11 text-xs"
                >
                  <option value="ALL">Tous les DCUs du secteur ({filteredDcus.length})</option>
                  {filteredDcus.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.connectedMeters || 0} mètres)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Durée programmée */}
            {actionType === 'shed' && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  4. Durée Prévisionnelle du Délestage
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        durationHours === h
                          ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {h} Heure{h > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Barre de Progression pendant Exécution */}
            {isExecuting && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-300">Envoi des trames DLMS/COSEM en cours...</span>
                  <span className="text-brand font-mono">{executionProgress}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand to-amber-500 transition-all duration-300 rounded-full"
                    style={{ width: `${executionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Boutons d'Action */}
            <div className="flex gap-3 pt-3">
              <button 
                type="button" 
                onClick={handleClose} 
                className="btn-secondary flex-1 py-3 text-xs font-bold rounded-xl"
                disabled={isExecuting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isExecuting} 
                className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 ${
                  actionType === 'shed' ? 'btn-primary bg-red-600 hover:bg-red-500' : 'btn-primary bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isExecuting ? (
                  <span>Transmission des ordres...</span>
                ) : (
                  <>
                    <Power size={16} />
                    <span>{actionType === 'shed' ? 'Exécuter le Délestage' : 'Exécuter le Rétablissement'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation et Bilan */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-tight">Ordres DLMS Transmis avec Succès !</h4>
            <p className="text-xs text-gray-300 max-w-sm mx-auto">
              Le plan de {actionType === 'shed' ? 'délestage' : 'rétablissement'} a été exécuté sur le secteur <strong className="text-white">{targetRegion}</strong>.
            </p>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Région Cible :</span>
                <span className="text-white font-bold">{targetRegion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Concentrateurs impactés :</span>
                <span className="text-brand font-mono font-bold">{filteredDcus.length} DCUs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Statut Réseau :</span>
                <span className={`font-bold ${actionType === 'shed' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {actionType === 'shed' ? `Délestage Actif (${durationHours}h)` : 'Alimentation Nominale'}
                </span>
              </div>
            </div>

            <button onClick={handleClose} className="btn-primary w-full py-3 text-xs font-bold rounded-xl mt-4">
              Fermer & Revenir au Dashboard
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
