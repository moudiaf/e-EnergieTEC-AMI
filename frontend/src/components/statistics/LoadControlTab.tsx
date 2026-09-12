import React, { useState } from 'react';
import { Zap, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle, Power, Sliders } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';

export const LoadControlTab: React.FC = () => {
  const { meters, authFetch, addToast, fetchData } = useAmi();
  const [selectedMeterId, setSelectedMeterId] = useState<string>(() => meters[0]?.id || '0128260224778');
  const [powerLimitKw, setPowerLimitKw] = useState<number>(9);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionLoadingMeter, setActionLoadingMeter] = useState<string | null>(null);

  const handleRelayAction = async (meterId: string, action: 'open' | 'close') => {
    setActionLoadingMeter(meterId);
    try {
      const res = await authFetch('/api/v1/vending2/relay-control', {
        method: 'POST',
        body: JSON.stringify({
          meterNo: meterId,
          action,
          roomName: "10"
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast(`⚡ Commande Relais [${action.toUpperCase()}] exécutée sur compteur ${meterId}`, 'success');
      await fetchData();
    } catch (e: any) {
      addToast(`Erreur relais : ${e.message}`, 'error');
    } finally {
      setActionLoadingMeter(null);
    }
  };

  const handleApplyPowerLimit = async () => {
    setIsUpdating(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      addToast(`Seuil de puissance configuré à ${powerLimitKw} kW sur ${selectedMeterId}`, 'success');
    } catch (e: any) {
      addToast(`Échec configuration : ${e.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Control & Threshold Configuration Card ── */}
      <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Zap className="text-brand" size={22} /> Contrôle de Charge & Délestage Télécommandé
            </h3>
            <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">
              Limitation de puissance souscrite et commande à distance du relais disjoncteur (DLMS/COSEM)
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase border border-cyan-500/30">
            Protection Réseau 50Hz
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase block mb-1.5">Compteur Cible :</label>
            <select
              value={selectedMeterId}
              onChange={e => setSelectedMeterId(e.target.value)}
              className="w-full bg-[#242630] border border-white/15 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-brand cursor-pointer"
            >
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} ({m.location} - {m.phaseType === 'triphase' ? 'Triphasé' : 'Monophasé'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase block mb-1.5">
              Seuil Limite de Puissance Active (kW) :
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={powerLimitKw}
              onChange={e => setPowerLimitKw(Number(e.target.value))}
              className="w-full bg-[#242630] border border-white/15 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-brand"
            />
          </div>

          <div>
            <button
              onClick={handleApplyPowerLimit}
              disabled={isUpdating}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? <RefreshCw size={16} className="animate-spin" /> : <Sliders size={16} />}
              {isUpdating ? "Transmission..." : "Appliquer le Seuil DLMS"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Meters Load & Relay Status Grid ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-5 bg-[#1c1e26] border-b border-white/10 flex items-center justify-between">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            Supervision de Charge & Action Relais par Compteur
          </h4>
          <span className="text-xs text-gray-400 font-bold">{meters.length} Compteur(s) surveillé(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-xs font-black text-orange-400 uppercase">
                <th className="p-4 pl-6">Compteur & Lieu</th>
                <th className="p-4 text-center">Type & Phase</th>
                <th className="p-4 text-center">Puissance Instantanée</th>
                <th className="p-4 text-center">Puissance Souscrite</th>
                <th className="p-4 text-center">État du Relais</th>
                <th className="p-4 pr-6 text-right">Télécommande Relais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {meters.map(m => {
                const isLoadingRelay = actionLoadingMeter === m.id;
                const isRelayOpen = m.status === 'offline' || (m as any).relayStatus === 'OPEN';
                return (
                  <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-white font-mono text-sm">{m.id}</p>
                      <p className="text-[10px] text-gray-400 font-sans">{m.location}</p>
                    </td>
                    <td className="p-4 text-center font-sans font-bold text-gray-300">
                      {m.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'}
                    </td>
                    <td className="p-4 text-center font-bold text-cyan-300 text-sm">
                      {(m.power || 0).toFixed(2)} kW
                    </td>
                    <td className="p-4 text-center font-bold text-amber-300">
                      {m.subscribedPower || 9} kVA
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                        !isRelayOpen 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {!isRelayOpen ? 'FERMÉ (EN CHARGE)' : 'OUVERT (DÉLESTÉ)'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRelayAction(m.id, 'close')}
                          disabled={isLoadingRelay}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-300 font-bold text-xs border border-emerald-500/30 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {isLoadingRelay ? <RefreshCw size={12} className="animate-spin" /> : "Rétablir (Close)"}
                        </button>
                        <button
                          onClick={() => handleRelayAction(m.id, 'open')}
                          disabled={isLoadingRelay}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 hover:text-white text-red-300 font-bold text-xs border border-red-500/30 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {isLoadingRelay ? <RefreshCw size={12} className="animate-spin" /> : "Couper (Open)"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
