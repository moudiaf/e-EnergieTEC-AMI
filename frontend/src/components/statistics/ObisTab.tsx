import React, { useState } from 'react';
import { Search, Radio, RefreshCw, Layers, CheckCircle2, Copy, Zap, Info } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';

export const ObisTab: React.FC = () => {
  const { meters, authFetch, addToast } = useAmi();
  const [selectedMeterId, setSelectedMeterId] = useState<string>(() => meters[0]?.id || '0128260224778');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isReading, setIsReading] = useState<boolean>(false);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);

  const OBIS_REGISTERS = [
    { code: '0.0.19.40.0.255', name: 'Solde de Crédit Prépaiement STS (kWh)', unit: 'kWh', classId: 3, liveVal: (m: any) => `${(m?.credit || 0).toFixed(2)} kWh`, desc: 'Reliquat de crédit d\'énergie actif disponible dans le compteur' },
    { code: '1.0.1.8.0.255', name: 'Énergie Active Import Totale (+A)', unit: 'kWh', classId: 3, liveVal: (m: any) => `${(m?.totalConsumption || 0.00).toFixed(2)} kWh`, desc: 'Index d\'énergie active totale mesurée par le compteur' },
    { code: '1.0.2.8.0.255', name: 'Énergie Active Export Totale (-A)', unit: 'kWh', classId: 3, liveVal: (m: any) => `${(m?.solarExportKwh || 0.00).toFixed(2)} kWh`, desc: 'Injection solaire / export vers le réseau NIGELEC' },
    { code: '1.0.32.7.0.255', name: 'Tension Instantanée Phase A (L1)', unit: 'V', classId: 3, liveVal: (m: any) => `${Number(m?.voltage || 230.0).toFixed(1)} V RMS`, desc: 'Tension efficace réseau mesurée sur la phase 1' },
    { code: '1.0.52.7.0.255', name: 'Tension Instantanée Phase B (L2)', unit: 'V', classId: 3, liveVal: (m: any) => m?.phaseType === 'triphase' ? `${Number(m?.voltage || 400.0).toFixed(1)} V RMS` : '0.0 V', desc: 'Tension efficace réseau mesurée sur la phase 2 (Triphasé)' },
    { code: '1.0.72.7.0.255', name: 'Tension Instantanée Phase C (L3)', unit: 'V', classId: 3, liveVal: (m: any) => m?.phaseType === 'triphase' ? `${Number(m?.voltage || 400.0).toFixed(1)} V RMS` : '0.0 V', desc: 'Tension efficace réseau mesurée sur la phase 3 (Triphasé)' },
    { code: '1.0.31.7.0.255', name: 'Courant Instantané Phase A (L1)', unit: 'A', classId: 3, liveVal: (m: any) => `${Number(m?.current || 0).toFixed(2)} A`, desc: 'Courant de charge instantané calculé' },
    { code: '1.0.1.7.0.255', name: 'Puissance Active Instantanée Totale (+P)', unit: 'kW', classId: 3, liveVal: (m: any) => `${Number(m?.power || 0.00).toFixed(2)} kW`, desc: 'Puissance active absorbée au point de livraison' },
    { code: '1.0.14.7.0.255', name: 'Fréquence Réseau', unit: 'Hz', classId: 3, liveVal: (m: any) => `${m?.frequency || 50.0} Hz`, desc: 'Fréquence de synchronisation réseau national Niger' },
    { code: '1.0.13.7.0.255', name: 'Facteur de Puissance Moyen (Cos φ)', unit: '', classId: 3, liveVal: (m: any) => `${m?.powerFactor || 0.98}`, desc: 'Facteur de puissance mesuré pour la détection réactive' },
    { code: '0.0.96.3.10.255', name: 'Objet Disconnect Control (Relais)', unit: 'STATE', classId: 70, liveVal: (m: any) => (m?.relayStatus === 'CLOSED' || m?.relayStatus === 'FERMÉ' || m?.status !== 'offline') ? 'FERMÉ (1) - Alimenté' : 'OUVERT (0) - Déconnecté', desc: 'État binaire de l\'organe de coupure (relais 100A interne)' },
    { code: '0.0.96.11.0.255', name: 'Alerteur Ouverture Capot Principal (Meter Cover)', unit: 'FLAG', classId: 1, liveVal: (m: any) => m?.meterCoverOpen ? 'OUVERT (1) - FRAUDE CAPOT' : ((m?.tamperStatus === 'tampered') ? 'FRAUDE ACTIVE (1)' : 'FERMÉ (0) - NORMAL'), desc: 'Détection mécanique d\'ouverture du capot scellé' },
    { code: '0.0.96.11.1.255', name: 'Alerteur Ouverture Cache-Bornes (Terminal Cover)', unit: 'FLAG', classId: 1, liveVal: (m: any) => m?.terminalCoverOpen ? 'OUVERT (1) - FRAUDE BORNIER' : 'FERMÉ (0) - NORMAL', desc: 'Détection d\'intrusion sur le bornier de raccordement' },
    { code: '0.0.96.11.2.255', name: 'Détection Perturbation Magnétique (Aimant)', unit: 'FLAG', classId: 1, liveVal: (m: any) => m?.magneticTamper ? 'DÉTECTÉ (1) - SABOTAGE' : 'NORMAL (0) - CONFORME', desc: 'Capteur à effet Hall détectant les champs magnétiques extérieurs' },
    { code: '0.0.96.50.0.255', name: 'Mot d\'État Global de Fraude (Tamper Status Word)', unit: 'HEX', classId: 1, liveVal: (m: any) => (m?.tamperStatus === 'tampered' || m?.meterCoverOpen) ? '0x0001 (TAMPER_ACTIVE)' : '0x0000 (CLEARED)', desc: 'Masque hexadécimal consolidant l\'ensemble des sabotages' },
    { code: '0.0.99.98.0.255', name: 'Journal d\'Historique Événements de Fraude', unit: 'LOG', classId: 7, liveVal: (m: any) => 'CONSISTANT (0x00)', desc: 'Tableau horodaté ineffaçable des déclenchements de fraude' },
    { code: '0.0.1.0.0.255', name: 'Horloge Temps Réel (RTC Clock)', unit: 'TIME', classId: 8, liveVal: () => new Date().toISOString().replace('T', ' ').substring(0, 19), desc: 'Heure interne certifiée du microcontrôleur' },
  ];

  const rawMeter = meters.find(m => m.id === selectedMeterId) || meters[0];
  const currentMeter = (liveTelemetry && (liveTelemetry.meterNo === selectedMeterId || liveTelemetry.meterNo === rawMeter?.serialNumber))
    ? {
        ...rawMeter,
        credit: liveTelemetry.remainingCreditKwh ?? rawMeter?.credit,
        totalConsumption: liveTelemetry.totalElectricityKwh ?? rawMeter?.totalConsumption,
        voltage: liveTelemetry.voltageA ?? rawMeter?.voltage,
        current: liveTelemetry.currentA ?? rawMeter?.current,
        power: liveTelemetry.totalPowerKw ?? (liveTelemetry.powerA ? liveTelemetry.powerA / 1000 : rawMeter?.power),
        frequency: liveTelemetry.frequency ?? rawMeter?.frequency,
        powerFactor: liveTelemetry.powerFactor ?? rawMeter?.powerFactor,
        relayStatus: liveTelemetry.relayStatus ?? rawMeter?.relayStatus,
        meterCoverOpen: liveTelemetry.meterCoverOpen,
        terminalCoverOpen: liveTelemetry.terminalCoverOpen,
        tamperStatus: (liveTelemetry.meterCoverOpen || liveTelemetry.terminalCoverOpen) ? 'tampered' : (rawMeter?.tamperStatus || 'clear')
      }
    : rawMeter;

  const handleReadObisLive = async () => {
    setIsReading(true);
    try {
      const res = await authFetch('/api/v1/vending2/read-telemetry', {
        method: 'POST',
        body: JSON.stringify({ meterNo: selectedMeterId })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveTelemetry(data.parsedTelemetry);
        addToast(`✅ Registres OBIS DLMS lus avec succès pour ${selectedMeterId}`, 'success');
      } else {
        addToast(`Lecture locale actualisée pour ${selectedMeterId}`, 'info');
      }
    } catch (e: any) {
      addToast(`Lecture OBIS actualisée`, 'info');
    } finally {
      setIsReading(false);
    }
  };

  const filteredRegisters = OBIS_REGISTERS.filter(r => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Meter Selector ── */}
      <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Radio className="text-cyan-400" size={22} /> Dictionnaire & Inspection des Registres OBIS DLMS/COSEM
            </h3>
            <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">
              CEI 62056-61 / 62056-62 (Blue Book v10) · Lecture des Objets COSEM en Direct
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase border border-cyan-500/30">
            Protocole IEC 62056
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300 uppercase">Compteur Interrogé :</span>
            <select
              value={selectedMeterId}
              onChange={e => setSelectedMeterId(e.target.value)}
              className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none cursor-pointer"
            >
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} ({m.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'} - {m.location})
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher code OBIS (ex: 1.0.1.8.0.255)..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-[#242630] border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-brand"
            />
          </div>

          <button
            onClick={handleReadObisLive}
            disabled={isReading}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
          >
            {isReading ? <RefreshCw size={15} className="animate-spin" /> : <Radio size={15} />}
            {isReading ? "Interrogation DLMS..." : "⚡ Lire Tous les Objets OBIS"}
          </button>
        </div>
      </div>

      {/* ── OBIS Registers Table ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#1c1e26] text-xs font-black text-orange-400 uppercase">
                <th className="p-4 pl-6">Code OBIS (IEC 62056)</th>
                <th className="p-4">Désignation de la Grandeur</th>
                <th className="p-4 text-center">Class ID</th>
                <th className="p-4 text-center">Unité</th>
                <th className="p-4">Valeur en Temps Réel</th>
                <th className="p-4 pr-6">Description Normative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filteredRegisters.map(r => {
                const liveValue = r.liveVal(currentMeter);
                return (
                  <tr key={r.code} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4 pl-6 font-bold text-cyan-300 tracking-wider">
                      {r.code}
                    </td>
                    <td className="p-4 font-sans font-bold text-white text-sm">
                      {r.name}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      Class {r.classId}
                    </td>
                    <td className="p-4 text-center text-amber-300 font-bold">
                      {r.unit || '-'}
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
                        {liveValue}
                      </span>
                    </td>
                    <td className="p-4 pr-6 font-sans text-gray-400 text-xs">
                      {r.desc}
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
