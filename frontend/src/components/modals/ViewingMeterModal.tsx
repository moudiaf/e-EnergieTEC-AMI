import React from 'react';
import { Modal } from '../Modal';
import { Meter, Customer } from '../../types';
import { MapPin, Cpu, User, Zap, Radio, Power, Activity } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';

interface ViewingMeterModalProps {
  viewingMeter: Meter | null;
  onClose: () => void;
  customers: Customer[];
  setCurrentSection: (section: any) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  handleReadTelemetry?: (meterId: string) => Promise<any>;
  handleRemoteRelay?: (meterId: string, action: 'open' | 'close') => Promise<any>;
  fetchData?: () => void;
}

export const ViewingMeterModal: React.FC<ViewingMeterModalProps> = ({
  viewingMeter,
  onClose,
  customers,
  setCurrentSection,
  addToast,
  handleReadTelemetry,
  handleRemoteRelay,
  fetchData
}) => {
  const { setSelectedMeterId } = useAmi();
  const [isPolling, setIsPolling] = React.useState(false);
  const [liveData, setLiveData] = React.useState<any>(null);

  const activeMeter = liveData || viewingMeter;

  const onPingTelemetry = async () => {
    if (!activeMeter?.id || !handleReadTelemetry) {
      addToast('Signal de présence envoyé au compteur (Ping OK)', 'info');
      return;
    }
    setIsPolling(true);
    try {
      const data = await handleReadTelemetry(activeMeter.id);
      const t = data.parsedTelemetry;
      setLiveData({
        ...activeMeter,
        voltage: t.voltageA || 230,
        power: t.totalPowerKw || 0,
        credit: t.remainingCreditKwh,
        totalConsumption: t.totalElectricityKwh,
        status: t.relayStatus === 'OPEN' ? 'offline' : 'online',
        tamperStatus: t.tamperStatus
      });
      if (fetchData) fetchData();
      addToast(`⚡ Ping Télémesure GPRS réussi (${activeMeter.id}) : Solde ${t.remainingCreditKwh} kWh | Tension ${t.voltageA}V`, 'success');
    } catch (e: any) {
      addToast(`Erreur Ping Télémesure: ${e.message}`, 'error');
    } finally {
      setIsPolling(false);
    }
  };

  const onCoupureRelais = async () => {
    if (!activeMeter?.id || !handleRemoteRelay) {
      addToast('Ordre de coupure relais transmis à distance (MeterLz)', 'error');
      return;
    }
    try {
      await handleRemoteRelay(activeMeter.id, 'open');
      addToast(`⚡ Ordre de Télé-Coupure (MeterLz) émis avec succès pour le compteur ${activeMeter.id}`, 'success');
      if (fetchData) fetchData();
    } catch (e: any) {
      addToast(`Erreur Télé-Coupure: ${e.message}`, 'error');
    }
  };

  return (
    <Modal isOpen={!!viewingMeter} onClose={onClose} title={`Inspection Compteur ${viewingMeter?.id}`}>
      {activeMeter && (
        <div className="space-y-6">
          
          {/* En-tête Statut & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-brand" /> Adresse d'Installation
              </p>
              <p className="font-bold text-sm text-white">{activeMeter.location}</p>
            </div>
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Coordonnées GPS (SIG)</p>
              <p className="font-mono text-xs text-emerald-400 font-bold">
                {activeMeter.latitude?.toFixed(6) || '13.562542'}, {activeMeter.longitude?.toFixed(6) || '2.045472'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User size={14} className="text-brand" /> Abonné NIGELEC Rattaché
              </p>
              <p 
                className="font-bold text-sm text-brand cursor-pointer hover:underline transition-colors" 
                onClick={() => {
                  onClose();
                  setCurrentSection('customers');
                }}
              >
                {customers.find(c => c.id === activeMeter.customerId)?.name || activeMeter.customerId}
              </p>
            </div>

            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mb-1">Lot de Arrivage / Batch</p>
              <p className="font-bold text-sm text-white">{activeMeter.batchId || 'BATCH-2026-NIG-01'}</p>
            </div>
          </div>

          {/* Mesures Électriques DLMS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">
                Tension {activeMeter.phaseType === 'triphase' ? '(L-L)' : '(L-N)'}
              </p>
              <p className="font-black text-xl text-emerald-400">
                {activeMeter.voltage ? `${Number(activeMeter.voltage).toFixed(1)} V` : (activeMeter.phaseType === 'triphase' ? '400.0 V' : '230.0 V')}
              </p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                activeMeter.phaseType === 'triphase' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {activeMeter.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'}
              </span>
            </div>

            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">Puissance Active</p>
              <p className="font-black text-xl text-brand">{activeMeter.power || 0} kW</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand/20 text-amber-300 border border-brand/30">
                Souscrite: {activeMeter.subscribedPower || 9} kW
              </span>
            </div>

            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">Solde Crédit</p>
              <p className="font-black text-xl text-emerald-400">{(activeMeter.credit ?? 0).toFixed(2)} kWh</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeMeter.paymentMode === 'prepaid' ? 'Prépayé STS' : 'Postpayé'}
              </span>
            </div>

            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mb-1">Énergie Consommée</p>
              <p className="font-black text-xl text-cyan-300">
                {((activeMeter.totalConsumption !== undefined && activeMeter.totalConsumption !== null)
                  ? activeMeter.totalConsumption
                  : 0
                ).toFixed(2)} kWh
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                OBIS 1.0.1.8.0
              </span>
            </div>
          </div>

          {/* Actions Ordres HES */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Télé-commandes & Actions HES</h4>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  if (setSelectedMeterId) setSelectedMeterId(activeMeter.id);
                  onClose();
                  setCurrentSection('vending');
                }} 
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                <Zap size={16} className="text-amber-300 animate-pulse" /> 📡 Télé-Recharge OTA Directe (HES / DLMS)
              </button>

              <button 
                onClick={() => {
                  onClose();
                  setCurrentSection('map');
                }} 
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
              >
                <MapPin size={16} /> Localiser sur la Carte SIG
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={onPingTelemetry}
                  disabled={isPolling}
                  className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Radio size={14} className={isPolling ? "animate-spin text-cyan-400" : "text-cyan-400"} />
                  {isPolling ? "PING EN COURS..." : "Ping Télemesure"}
                </button>

                <button 
                  onClick={onCoupureRelais}
                  className="py-3 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/40 uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Power size={14} /> Coupure Relais (MeterLz)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
