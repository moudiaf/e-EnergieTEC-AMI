import React, { useState } from 'react';
import { Modal } from '../Modal';
import { FRAUD_SCENARIOS } from '../../utils/fraudScenarios';
import { ShieldAlert, Zap, AlertTriangle, Info, Search } from 'lucide-react';
import { Meter } from '../../types';

interface FraudSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meters: Meter[];
  onTriggerSim: (scenario: typeof FRAUD_SCENARIOS[number], meterId: string) => void;
}

export const FraudSimulationModal = ({ isOpen, onClose, meters, onTriggerSim }: FraudSimulationModalProps) => {
  const [selectedScenario, setSelectedScenario] = useState<typeof FRAUD_SCENARIOS[number] | null>(null);
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredMeters = meters.filter(m => 
    m.id.toLowerCase().includes(searchFilter.toLowerCase()) || 
    m.location.toLowerCase().includes(searchFilter.toLowerCase())
  ).slice(0, 10); // Limit to avoid long lists

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulateur DLMS/COSEM - Événements de Fraude">
      <div className="space-y-6">
        <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4 mb-6">
          <ShieldAlert className="text-red-500 mt-1 shrink-0" size={24} />
          <div>
            <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">Avertissement de Simulation</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
              Cette interface simule l'arrivée de trames d'événements physiques (DLMS Blue Book) au Head End System. 
              Le déclenchement d'une fraude critique coupera automatiquement le relais de charge et générera un ticket d'intervention.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">1. Choisir le Scénario (Section 4.4)</label>
            <div className="max-h-[350px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {FRAUD_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${
                    selectedScenario?.id === s.id ? 'bg-brand border-brand shadow-lg shadow-brand/20' : 'bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-tight ${selectedScenario?.id === s.id ? 'text-white' : 'text-gray-300'}`}>{s.name}</p>
                    <p className={`text-[8px] font-medium leading-tight mt-1 ${selectedScenario?.id === s.id ? 'text-white/80' : 'text-gray-500'}`}>{s.message}</p>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    s.priority === 'Critique' ? 'bg-red-500/20 text-red-500' : 
                    s.priority === 'Haute' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {s.priority}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 text-left">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">2. Compteur Cible</label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="Chercher ID ou Lieu..." 
                className="input-field w-full pl-10 text-xs"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2 overflow-y-auto pr-2 max-h-[280px] custom-scrollbar">
              {filteredMeters.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMeterId(m.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedMeterId === m.id ? 'bg-brand/10 border-brand' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-white">{m.id}</p>
                    <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <p className="text-[9px] text-gray-500 truncate">{m.location}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!selectedScenario || !selectedMeterId}
          onClick={() => selectedScenario && onTriggerSim(selectedScenario, selectedMeterId)}
          className="btn-primary w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all mt-4"
        >
          <Zap size={20} /> DÉCLENCHER FRAUDE AMI
        </button>
      </div>
    </Modal>
  );
};
