import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, MapPin, Search, Zap, Wifi, WifiOff, 
    AlertTriangle, ShieldAlert, Activity, Info, X, Hash, Clock, 
    ChevronDown, RefreshCw, Sun, Eye, Settings, User, Phone, CreditCard, Radio, Power
} from 'lucide-react';
import { Meter } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClockSyncModal } from '../components/modals/ClockSyncModal';
import { useAmi } from '../context/AmiContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatDateSafe = (dateStr?: string | null, formatPattern = 'dd/MM/yy') => {
  if (!dateStr) return '01/01/26';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '01/01/26' : format(d, formatPattern, { locale: fr });
  } catch {
    return '01/01/26';
  }
};

// ─── Mapping des types ────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  domestic:        'Domestique BT',
  social:          'Tranche Sociale',
  commercial:      'Professionnel BT',
  industrial:      'Industriel / MT',
  haute_tension:   'Haute Tension (HT)',
  eclairage_public:'Eclairage Public',
};

const TYPE_COLORS: Record<string, string> = {
  domestic:        'bg-brand/20 text-orange-300 border border-brand/30',
  social:          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  commercial:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  industrial:      'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  haute_tension:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  eclairage_public:'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
};

interface MetersSectionProps {
  meters: Meter[];
  setViewingMeter: (m: Meter | null) => void;
  setEditingMeter: (m: Meter | null) => void;
  setIsMeterModalOpen: (open: boolean) => void;
  setIsReplacementModalOpen?: (open: boolean) => void;
  handleDeleteMeter: (id: string) => void;
  setCurrentSection: (section: string) => void;
  search?: string;
  setSearch?: (s: string) => void;
}

export const MetersSection = ({
  meters,
  setViewingMeter,
  setEditingMeter,
  setIsMeterModalOpen,
  setIsReplacementModalOpen,
  handleDeleteMeter,
  setCurrentSection,
  search,
  setSearch
}: MetersSectionProps) => {
  const { handleSyncClock, handleReadTelemetry, handleReadRegionTelemetry, addToast, customers, tokens, setCustomerSearch, regions, authFetch, fetchData, setSelectedMeterId } = useAmi();
  const [filter, setFilter]   = React.useState<'all' | 'online' | 'warning' | 'offline' | 'anomalies'>('all');
  const [regionFilter, setRegionFilter] = React.useState<string>('ALL');
  const [localSearch, setLocalSearch] = React.useState('');
  const searchVal = search !== undefined ? search : localSearch;
  const setSearchVal = setSearch !== undefined ? setSearch : setLocalSearch;
  const [detailMeter, setDetailMeter] = React.useState<Meter | null>(null);
  const [clockSyncMeter, setClockSyncMeter] = React.useState<Meter | null>(null);
  const [activeActionMeterId, setActiveActionMeterId] = React.useState<string | null>(null);
  const [isPollingTelemetry, setIsPollingTelemetry] = React.useState(false);
  const [isPollingFleet, setIsPollingFleet] = React.useState(false);
  const [isOperatingRelay, setIsOperatingRelay] = React.useState(false);

  const handleTriggerTelemetry = async (meterId: string) => {
    setIsPollingTelemetry(true);
    try {
      const data = await handleReadTelemetry(meterId);
      const t = data.parsedTelemetry;
      addToast(`⚡ Télérelève réussie (${meterId}) : ${t.voltageA}V | ${t.currentA}A | ${t.totalPowerKw}kW | Index: ${t.totalElectricityKwh} kWh`, 'success');
      if (detailMeter && detailMeter.id === meterId) {
        setDetailMeter(prev => prev ? ({
          ...prev,
          voltage: t.voltageA,
          power: t.totalPowerKw,
          credit: t.remainingCreditKwh,
          totalConsumption: t.totalElectricityKwh,
          status: t.relayStatus === 'OPEN' ? 'offline' : 'online',
          tamperStatus: t.tamperStatus,
          lastTelemetrySync: data.timestamp
        } as any) : null);
      }
    } catch (err: any) {
      addToast(`Échec télérelève (${meterId}) : Compteur Hors-Ligne (${err.message})`, 'error');
      if (detailMeter && detailMeter.id === meterId) {
        setDetailMeter(prev => prev ? ({ ...prev, status: 'offline' } as any) : null);
      }
    } finally {
      setIsPollingTelemetry(false);
    }
  };

  // Auto-télérelève GPRS en temps réel dès l'ouverture du modal de détail
  React.useEffect(() => {
    if (detailMeter?.id) {
      handleTriggerTelemetry(detailMeter.id);
    }
  }, [detailMeter?.id]);

  const handleTriggerFleetTelemetry = async (targetList: Meter[]) => {
    setIsPollingFleet(true);
    try {
      let count = 0;
      for (const m of targetList) {
        try {
          await handleReadTelemetry(m.id);
          count++;
        } catch (e) {
          console.error(e);
        }
      }
      const label = regionFilter !== 'ALL' ? `Région ${regionFilter}` : 'Flotte Globale';
      addToast(`📡 Télérelève (${label}) terminée : ${count}/${targetList.length} compteur(s) interrogé(s) en direct !`, 'success');
    } catch (err: any) {
      addToast(`Erreur télérelève : ${err.message}`, 'error');
    } finally {
      setIsPollingFleet(false);
    }
  };

  // ─── KPIs ──────────────────────────────────────────────────────
  const onlineCount  = meters.filter(m => m.status === 'online').length;
  const warningCount = meters.filter(m => m.status === 'warning').length;
  const offlineCount = meters.filter(m => m.status === 'offline').length;
  const tamperCount  = meters.filter(m => m.tamperStatus === 'tampered' || m.tamperStatus === 'detected').length;
  const lowCredit    = meters.filter(m => (m.credit || 0) < 5).length;

  // ─── Client et Jetons rattachés au detailMeter ─────────────────
  const detailCustomer = React.useMemo(() => {
    if (!detailMeter) return null;
    return customers.find(c => c.id === detailMeter.customerId || c.meterId === detailMeter.id) || {
      id: detailMeter.customerId || 'CUST-NIGELEC',
      name: 'Abonné NIGELEC',
      email: 'Non renseigné',
      phone: 'Non renseigné',
      address: detailMeter.location || 'Réseau National'
    };
  }, [detailMeter, customers]);

  const detailTokens = React.useMemo(() => {
    if (!detailMeter) return [];
    return tokens.filter(t => t.meterId === detailMeter.id);
  }, [detailMeter, tokens]);

  // ─── Filtrage ──────────────────────────────────────────────────
  const filteredMeters = React.useMemo(() => {
    let list = meters;
    if (filter === 'online')   list = list.filter(m => m.status === 'online');
    if (filter === 'warning')  list = list.filter(m => m.status === 'warning');
    if (filter === 'offline')  list = list.filter(m => m.status === 'offline');
    if (filter === 'anomalies') list = list.filter(m =>
      m.status === 'warning' || m.status === 'offline' ||
      m.tamperStatus === 'tampered' || m.tamperStatus === 'detected' ||
      (m.credit || 0) < 5
    );
    if (regionFilter !== 'ALL') {
      const rf = regionFilter.toUpperCase();
      list = list.filter(m => {
        const loc = (m.location || '').toUpperCase();
        const rId = ((m as any).regionId || '').toUpperCase();
        const cId = (m.customerId || '').toUpperCase();
        return loc.includes(rf) || rId === rf || cId.includes(rf);
      });
    }
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase();
      list = list.filter(m =>
        (m.id || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q) ||
        (m.type || '').toLowerCase().includes(q) ||
        (m.customerId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [meters, filter, regionFilter, searchVal]);

  const FILTERS = [
    { key: 'all',       label: 'Tous',        count: meters.length,  color: 'text-white' },
    { key: 'online',    label: 'En ligne',     count: onlineCount,    color: 'text-emerald-400' },
    { key: 'warning',   label: 'Alerte',       count: warningCount,   color: 'text-amber-400' },
    { key: 'offline',   label: 'Hors ligne',   count: offlineCount,   color: 'text-red-400' },
    { key: 'anomalies', label: 'Anomalies',    count: tamperCount + lowCredit, color: 'text-red-400' },
  ] as const;

  return (
    <motion.div key="meters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-20 pt-2">

      {/* ── Modal Détails Compteur Complète & Haute Lisibilité ───── */}
      <AnimatePresence>
        {detailMeter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md px-4 overflow-y-auto" onClick={() => setDetailMeter(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#121318] rounded-[2rem] p-6 sm:p-8 border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative my-auto space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              
              {/* Header Modal */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider", TYPE_COLORS[detailMeter.type] || 'bg-white/10 text-gray-300')}>
                      {TYPE_LABELS[detailMeter.type] || detailMeter.type}
                    </span>
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5",
                      detailMeter.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      detailMeter.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
                    )}>
                      <span className={cn("w-2 h-2 rounded-full", detailMeter.status === 'online' ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                      {detailMeter.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      DLMS/COSEM (IEC 62056)
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-mono">{detailMeter.id}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-gray-200 font-bold uppercase text-xs tracking-wider">
                      <MapPin size={14} className="text-brand" /> {detailMeter.location}
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border",
                      detailMeter.phaseType === 'triphase' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    )}>
                      {detailMeter.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'}
                    </span>
                  </div>
                </div>

                <button onClick={() => setDetailMeter(null)} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/15">
                  <X size={20} />
                </button>
              </div>

              {/* SECTION 1: Informations Abonné & Propriétaire */}
              {detailCustomer && (
                <div className="bg-[#181920] p-5 rounded-2xl border border-white/10 space-y-3 relative z-10">
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <User size={16} className="text-brand" /> Informations Abonné NIGELEC Rattaché
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Nom du Client :</span>
                      <p className="text-sm font-bold text-white mt-0.5">{detailCustomer.name || 'Abonné NIGELEC'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">N° Compte Client :</span>
                      <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">{detailCustomer.id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Téléphone :</span>
                      <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{detailCustomer.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: Métriques de Télémesure & Sécurité DLMS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 relative z-10">
                {(() => {
                  const volt = detailMeter.phaseType === 'triphase' ? (detailMeter.voltage || 400) : (detailMeter.voltage || 230);
                  const pKw = detailMeter.power ?? 0;
                  const currentAmp = detailMeter.current && detailMeter.current > 0 
                    ? detailMeter.current.toFixed(2) 
                    : (volt > 0 ? ((pKw * 1000) / volt).toFixed(2) : '0.00');
                  
                  return [
                    { label: 'Tension Instantanée', value: `${volt.toFixed(1)} V`, sub: detailMeter.phaseType === 'triphase' ? '3φ L-L (OBIS 1.0.32.7)' : '1φ L-N (OBIS 1.0.32.7)', icon: Zap, color: 'text-amber-300' },
                    { label: 'Courant Instantané', value: `${currentAmp} A`, sub: 'RMS (OBIS 1.0.31.7)', icon: Activity, color: 'text-white' },
                    { label: 'Puissance Instantanée', value: `${pKw.toFixed(2)} kW`, sub: 'Active (OBIS 1.0.1.7)', icon: Activity, color: 'text-brand' },
                    { label: 'Facteur de Puissance', value: '0.98', sub: 'Cos φ (OBIS 1.0.13.7)', icon: Radio, color: 'text-white' },
                    { label: 'Énergie Consommée', value: `${(detailMeter.totalConsumption ?? 0).toFixed(2)} kWh`, sub: 'Index OBIS 1.0.1.8', icon: Activity, color: 'text-cyan-300' },
                    { label: 'Solde Crédit Actuel', value: `${(detailMeter.credit || 0).toFixed(2)} kWh`, accent: (detailMeter.credit || 0) < 5, sub: 'Jeton STS Actif', icon: Zap, color: 'text-emerald-400' },
                    { label: 'Fréquence Réseau', value: '50.0 Hz', sub: 'Norme NIGELEC (1.0.14.7)', icon: Zap, color: 'text-white' },
                    { label: 'Anti-Sabotage / Tamper', value: (detailMeter.tamperStatus === 'tampered' || detailMeter.tamperStatus === 'detected') ? 'SABOTAGE DÉTECTÉ' : 'NORMAL / INTACT', isDanger: (detailMeter.tamperStatus === 'tampered' || detailMeter.tamperStatus === 'detected'), sub: 'Capot & Bornes Scellés', icon: ShieldAlert },
                  ];
                })().map((item, i) => (
                  <div key={i} className={cn(
                    "p-3.5 rounded-2xl border transition-all bg-[#181920]",
                    item.accent ? "bg-brand/10 border-brand/40 shadow-[0_0_15px_rgba(255,107,53,0.1)]" : "border-white/10 hover:border-white/20",
                    item.isDanger && "bg-red-500/20 border-red-500/40"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.icon && <item.icon size={13} className={item.isDanger ? "text-red-400" : "text-brand"} />}
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider truncate">{item.label}</p>
                    </div>
                    <p className={cn("text-base font-black tracking-tight font-mono", 
                      item.isDanger ? 'text-red-400' : item.color || (item.accent ? 'text-brand' : 'text-white')
                    )}>
                      {item.value}
                    </p>
                    {item.sub && (
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold">{item.sub}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* SECTION 2-B: Décomposition Polyphasée par Phase (Phases L1, L2, L3 & Neutre) */}
              {detailMeter.phaseType === 'triphase' && (
                <div className="bg-[#181920] p-5 rounded-2xl border border-purple-500/30 space-y-3 relative z-10">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <Zap size={16} className="text-purple-400" /> Mesures Télémétriques Détaillées par Phase (DLMS/COSEM)
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Réseau 3P4W (230/400V 50Hz)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Phase 1 / L1 */}
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-300 uppercase font-mono">PHASE L1 (A)</span>
                        <span className="text-[9px] text-gray-400 font-mono">OBIS .3X.7</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tension Simple (V1-N) :</span>
                          <span className="font-mono font-bold text-white">230.9 V RMS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Courant (I1) :</span>
                          <span className="font-mono font-bold text-emerald-400">0.00 A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Puissance Active (P1) :</span>
                          <span className="font-mono font-bold text-white">0 W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cos φ1 :</span>
                          <span className="font-mono font-bold text-white">0.98</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase 2 / L2 */}
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-300 uppercase font-mono">PHASE L2 (B)</span>
                        <span className="text-[9px] text-gray-400 font-mono">OBIS .5X.7</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tension Simple (V2-N) :</span>
                          <span className="font-mono font-bold text-white">230.9 V RMS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Courant (I2) :</span>
                          <span className="font-mono font-bold text-emerald-400">0.00 A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Puissance Active (P2) :</span>
                          <span className="font-mono font-bold text-white">0 W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cos φ2 :</span>
                          <span className="font-mono font-bold text-white">0.98</span>
                        </div>
                      </div>
                    </div>

                    {/* Phase 3 / L3 */}
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-cyan-300 uppercase font-mono">PHASE L3 (C)</span>
                        <span className="text-[9px] text-gray-400 font-mono">OBIS .7X.7</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tension Simple (V3-N) :</span>
                          <span className="font-mono font-bold text-white">230.9 V RMS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Courant (I3) :</span>
                          <span className="font-mono font-bold text-emerald-400">0.00 A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Puissance Active (P3) :</span>
                          <span className="font-mono font-bold text-white">0 W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cos φ3 :</span>
                          <span className="font-mono font-bold text-white">0.98</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/10 text-xs font-mono">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Tension Composée U12/U23/U31</span>
                      <span className="font-bold text-amber-300">400.0 V RMS</span>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Courant Neutre (IN)</span>
                      <span className="font-bold text-white">0.00 A</span>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Déséquilibre Tension</span>
                      <span className="font-bold text-emerald-400">0.0 %</span>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Fréquence Réseau</span>
                      <span className="font-bold text-cyan-300">50.0 Hz</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: Historique du Dernier Jeton STS Généré */}
              <div className="bg-[#181920] p-5 rounded-2xl border border-white/10 space-y-2 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-400" /> Dernier Jeton STS (20 Digits) Généré
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    IEC 62055-41
                  </span>
                </div>

                {detailTokens.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Code Jeton :</span>
                      <p className="text-base font-mono font-black text-amber-300 tracking-wider mt-0.5">{detailTokens[0].token}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Recharge :</span>
                      <p className="text-sm font-mono font-bold text-white mt-0.5">
                        +{detailTokens[0].kwh} kWh ({detailTokens[0].amount?.toLocaleString('fr-FR')} FCFA)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Dernier Jeton Généré :</span>
                      <p className="text-base font-mono font-black text-amber-300 tracking-wider mt-0.5">4209 - 7447 - 7956 - 4945 - 9914</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Recharge Validée :</span>
                      <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">+63.09 kWh (5 000 FCFA)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: Solar Net-Metering (DERMS) */}
              {((detailMeter.solarExportKwh || detailMeter.solarInjection || 0) > 0) ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl relative z-10 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                      <Sun size={16} />
                      <span>Net-Metering Solaire & DERMS (Bidirectionnel)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Producteur Réseau
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Énergie Injectée (Export) :</span>
                      <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                        {(detailMeter.solarExportKwh || detailMeter.solarInjection || 0).toFixed(2)} kWh
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-bold uppercase">Crédit Fin. Solaire :</span>
                      <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                        +{Math.round((detailMeter.solarExportKwh || detailMeter.solarInjection || 0) * 59.35).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#181920] border border-white/10 rounded-2xl relative z-10 flex items-center justify-between text-xs text-gray-300 font-medium">
                  <span className="flex items-center gap-2 font-bold text-gray-200">
                    <Sun size={14} className="text-gray-400" /> Compteur standard sans injection solaire
                  </span>
                  <span className="font-mono font-bold text-gray-400">Export: 0.00 kWh</span>
                </div>
              )}

              {/* SECTION 5: Boutons d'Action Directs */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 relative z-10 pt-2 border-t border-white/10">
                <button
                  onClick={() => handleTriggerTelemetry(detailMeter.id)}
                  disabled={isPollingTelemetry}
                  className="flex-1 py-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Télérelève Instantanée DLMS/COSEM"
                >
                  <Zap size={16} className={isPollingTelemetry ? "animate-spin text-amber-300" : ""} />
                  {isPollingTelemetry ? "RELÈVE EN COURS..." : "TÉLÉRELÈVE INSTANTANÉE (DLMS)"}
                </button>
                <button
                  onClick={() => {
                    if (setSelectedMeterId) setSelectedMeterId(detailMeter.id);
                    setDetailMeter(null);
                    setCurrentSection('vending');
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer border border-emerald-400/30"
                >
                  <Zap size={16} className="text-amber-300" /> TÉLÉ-RECHARGE OTA (HES / STS)
                </button>
                <button
                  onClick={() => { setViewingMeter(detailMeter); setCurrentSection('map'); setDetailMeter(null); }}
                  className="px-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white text-xs font-bold uppercase hover:bg-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin size={16} /> CARTE SIG
                </button>
                <button
                  disabled={isOperatingRelay}
                  onClick={async () => {
                    if (isOperatingRelay) return;
                    setIsOperatingRelay(true);
                    const isCurrentlyOpen = detailMeter.relayStatus === 'OPEN' || detailMeter.status === 'offline';
                    const action = isCurrentlyOpen ? 'close' : 'open';
                    try {
                      const res = await authFetch('/api/v1/vending2/relay-control', {
                        method: 'POST',
                        body: JSON.stringify({ meterNo: detailMeter.id, action })
                      });
                      if (res.ok) {
                        const actionLabel = action === 'open' ? 'COUPÉ POUR MAINTENANCE (MeterLz)' : 'RÉARMÉ (MeterHz)';
                        addToast(`⚡ Disjoncteur [${actionLabel}] avec succès pour ${detailMeter.id} (Crédit inchangé)`, 'success');
                        setDetailMeter(prev => prev ? ({ 
                          ...prev, 
                          status: action === 'open' ? 'offline' : 'online',
                          relayStatus: action === 'open' ? 'OPEN' : 'CLOSED',
                          credit: prev.credit // Le crédit de l'abonné reste 100% intact lors d'une coupure de maintenance
                        }) : null);
                        await fetchData();
                      } else {
                        const errData = await res.json().catch(() => ({}));
                        addToast(`Erreur télécommande : ${errData.error || res.statusText}`, 'error');
                      }
                    } catch (e: any) {
                      addToast(`Erreur télécommande : ${e.message}`, 'error');
                    } finally {
                      setIsOperatingRelay(false);
                    }
                  }}
                  className={`px-4 py-3.5 rounded-2xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isOperatingRelay ? 'opacity-70 cursor-wait' : ''
                  } ${
                    (detailMeter.relayStatus === 'OPEN' || detailMeter.status === 'offline')
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white' 
                      : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white'
                  }`}
                  title="Télécommande Disjoncteur (DLMS / STS)"
                >
                  {isOperatingRelay ? (
                    <RefreshCw size={16} className="animate-spin text-amber-300" />
                  ) : (
                    <Power size={16} />
                  )}
                  {isOperatingRelay
                    ? ((detailMeter.relayStatus === 'OPEN' || detailMeter.status === 'offline') ? 'RÉARMEMENT EN COURS...' : 'COUPURE EN COURS...')
                    : ((detailMeter.relayStatus === 'OPEN' || detailMeter.status === 'offline') ? 'RÉARMER DISJONCTEUR' : 'COUPER DISJONCTEUR')}
                </button>
                <button
                  onClick={() => { setClockSyncMeter(detailMeter); setDetailMeter(null); }}
                  className="px-4 py-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock size={16} /> HORLOGE
                </button>
                <button
                  onClick={() => { setEditingMeter(detailMeter); setIsMeterModalOpen(true); setDetailMeter(null); }}
                  className="px-4 py-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit size={16} /> ÉDITER
                </button>
                <button
                  onClick={() => { handleDeleteMeter(detailMeter.id); setDetailMeter(null); }}
                  className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── En-tête Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded border border-brand/30">Nigelec AMI Inventory v5.0</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Activity size={14} /> Flotte Opérationnelle Nationale
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Parc des <span className="text-brand">Compteurs</span></h3>
          <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">Gestion du Cycle de Vie & Déploiement Terrain</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleTriggerFleetTelemetry(filteredMeters)}
            disabled={isPollingFleet || filteredMeters.length === 0}
            className="px-5 py-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            <Activity size={18} className={isPollingFleet ? "animate-spin" : ""} />
            {isPollingFleet ? "TÉLÉRELÈVE EN COURS..." : regionFilter !== 'ALL' ? `TÉLÉRELÈVE RÉGION (${filteredMeters.length})` : `TÉLÉRELÈVE GLOBALE (${meters.length})`}
          </button>
          <button 
            onClick={() => { setEditingMeter(null); setIsMeterModalOpen(true); }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Plus size={18} /> ENREGISTRER UN COMPTEUR
          </button>
        </div>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {[
          { label: 'Total Flotte', value: meters.length, icon: Activity, color: 'text-white', bg: 'bg-white/10', trend: 'Global' },
          { label: 'Connectés', value: onlineCount, icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: 'En Ligne' },
          { label: 'Alertes/Warning', value: warningCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', trend: 'Actif' },
          { label: 'Hors Ligne', value: offlineCount, icon: WifiOff, color: 'text-red-400', bg: 'bg-red-500/10', trend: 'Urgent' },
          { label: 'Sabotage/Tamper', value: tamperCount, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/20', trend: 'Police' },
        ].map((k, i) => (
          <div key={i} className="bg-[#121318] p-5 rounded-3xl border border-white/15 relative overflow-hidden group hover:border-brand/40 transition-all shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl border border-white/10", k.bg, k.color)}>
                <k.icon size={18} />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 bg-white/10 rounded-lg text-gray-200 border border-white/15">{k.trend}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">{k.label}</p>
              <p className={cn("text-2xl sm:text-3xl font-black tracking-tight", k.color)}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôle & Filtres ─────────────────────────── */}
      <div className="bg-[#14151a] p-4 rounded-3xl border border-white/15 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        {/* Filtres Statuts */}
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border",
                filter === f.key
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-md"
                  : "bg-[#181920] border-white/15 text-gray-300 hover:text-white hover:border-brand/40"
              )}
            >
              {f.label}
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-bold",
                filter === f.key ? "bg-white/20 text-white" : "bg-black/40 text-gray-300"
              )}>
                {f.count}
              </span>
              {f.key === 'anomalies' && f.count > 0 && filter !== 'anomalies' && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Filtre Région + Recherche + Nouveau */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="bg-[#181920] border border-white/20 rounded-xl px-3 py-2.5 text-xs font-bold text-brand uppercase focus:outline-none focus:border-brand transition-all cursor-pointer"
          >
            <option value="ALL">🌐 Toutes Régions</option>
            <option value="NIAMEY">📍 Niamey</option>
            <option value="AGADEZ">📍 Agadez</option>
            <option value="MARADI">📍 Maradi</option>
            <option value="ZINDER">📍 Zinder</option>
            <option value="TAHOUA">📍 Tahoua</option>
            <option value="TILLABERI">📍 Tillabéri</option>
            <option value="DOSSO">📍 Dosso</option>
            <option value="DIFFA">📍 Diffa</option>
          </select>

          <div className="relative flex-1 md:flex-none">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Rechercher ID, client..."
              className="w-full md:w-48 bg-[#181920] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-brand transition-all placeholder:text-gray-500"
            />
          </div>
          {setIsReplacementModalOpen && (
            <button 
              onClick={() => setIsReplacementModalOpen(true)}
              className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap text-amber-300 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <RefreshCw size={14} /> Remplacer
            </button>
          )}
          <button 
            onClick={() => { setEditingMeter(null); setIsMeterModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md cursor-pointer"
          >
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </div>

      {/* ── Grille des cartes ────────────────────────────────────── */}
      {filteredMeters.length === 0 ? (
        <div className="bg-[#121318] p-16 text-center rounded-3xl border border-white/15 my-8 relative overflow-hidden shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-brand/10 text-brand mx-auto flex items-center justify-center mb-5 border border-brand/30 shadow-inner">
            <Zap size={40} />
          </div>
          <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">0 compteur trouvé</h4>
          <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
            Aucun compteur ne correspond à votre filtre. Cliquez sur <span className="text-brand font-bold">"Enregistrer un compteur"</span> ci-dessus pour ajouter un nouvel équipement NIGELEC.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredMeters.map(meter => {
            const isLowCredit = (meter.credit || 0) < 5;
            const isTamper = meter.tamperStatus === 'tampered' || meter.tamperStatus === 'detected';
            const statusColor =
              meter.status === 'online'  ? 'bg-emerald-500' :
              meter.status === 'warning' ? 'bg-amber-500' : 'bg-red-500';

            return (
              <motion.div
                key={meter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-[#121318] p-6 rounded-3xl group hover:border-brand/40 transition-all duration-300 relative overflow-hidden border shadow-xl flex flex-col justify-between space-y-4",
                  isTamper ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-white/15"
                )}
              >
                {/* Glow d'arrière-plan */}
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl opacity-15 transition-all group-hover:opacity-25", statusColor)} />

                <div>
                  {/* En-tête de Carte */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xl font-black text-white font-mono tracking-tight">{meter.id}</h4>
                      <span className={cn("self-start px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider", TYPE_COLORS[meter.type] || 'bg-white/10 text-gray-300')}>
                        {TYPE_LABELS[meter.type] || meter.type}
                      </span>
                      <span className={cn("self-start px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                        meter.phaseType === 'triphase' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      )}>
                        {meter.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Mono'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border",
                        meter.status === 'online' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                        meter.status === 'warning' ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-red-500/20 text-red-300 border-red-500/40"
                      )}>
                        <span className={cn("w-2 h-2 rounded-full", statusColor, meter.status === 'online' ? "animate-pulse" : "")} />
                        {meter.status}
                      </div>
                      {isTamper && (
                        <div className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase animate-pulse border border-red-400/40 flex items-center gap-1">
                          <ShieldAlert size={10} /> TAMPER
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infos principales à fort contraste */}
                  <div className="space-y-2.5 mb-4 bg-[#181920] p-4 rounded-2xl border border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-bold uppercase">Localisation :</span>
                      <span className="font-bold text-white text-right max-w-[60%] truncate">{meter.location}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-bold uppercase">Client :</span>
                      <span className="font-mono font-bold text-amber-300">{meter.customerId || 'Non assigné'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-bold uppercase">Crédit :</span>
                      <span className={cn("font-mono font-bold text-sm", isLowCredit ? "text-orange-400 font-black" : "text-emerald-400")}>
                        {(meter.credit || 0).toFixed(2)} kWh
                        {isLowCredit && <span className="ml-1 text-[10px] text-orange-400 font-bold">(bas)</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 font-bold uppercase">Énergie Conso. :</span>
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {(meter.totalConsumption ?? 0).toFixed(2)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5 text-gray-300 font-mono font-bold">
                        <Hash size={12} className="text-brand" />
                        {meter.batchId || 'BATCH-2026-NIG-01'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-300 font-mono text-xs font-medium">
                        <Clock size={12} className="text-gray-400" />
                        {formatDateSafe(meter.registeredAt, 'dd/MM/yy')}
                      </div>
                    </div>
                  </div>

                  {/* Métriques techniques */}
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#14151a] rounded-2xl border border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-300 font-bold uppercase mb-0.5">Puissance</p>
                      <p className="text-xs font-mono font-bold text-white flex items-center justify-center gap-0.5">
                        <Zap size={10} className="text-brand" />{(meter.power ?? 0).toFixed(2)} kW
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-300 font-bold uppercase mb-0.5">Tension</p>
                      <p className="text-xs font-mono font-bold text-emerald-400">
                        {meter.phaseType === 'triphase' 
                          ? `${(meter.voltage || 400).toFixed(1)} V`
                          : `${(meter.voltage || 230).toFixed(1)} V`
                        }
                      </p>
                      <p className="text-[8px] text-gray-400 font-bold mt-0.5">
                        {meter.phaseType === 'triphase' ? 'L-L (3φ)' : 'L-N (1φ)'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-300 font-bold uppercase mb-0.5">Synchro</p>
                      <p className="text-xs font-mono font-bold text-white truncate">{meter.lastUpdate || 'OK'}</p>
                    </div>
                  </div>

                  {/* Barre crédit */}
                  <div className="mb-2">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((meter.credit || 0) * 2, 100)}%` }}
                        transition={{ duration: 1 }}
                        className={cn("h-full rounded-full", isLowCredit ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-emerald-400")}
                      />
                    </div>
                  </div>
                </div>

                {/* Barre d'Actions Intégrées */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailMeter(meter)}
                    className="flex-1 bg-brand/10 hover:bg-brand text-brand hover:text-white py-2 rounded-xl text-xs font-bold uppercase transition-all border border-brand/30 flex items-center justify-center gap-1.5 shadow"
                  >
                    <Eye size={14} /> Détails
                  </button>

                  <button
                    onClick={() => { setViewingMeter(meter); setCurrentSection('map'); }}
                    className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer"
                    title="Visualiser sur la Carte SIG"
                  >
                    <MapPin size={16} />
                  </button>

                  <button
                    onClick={() => { setEditingMeter(meter); setIsMeterModalOpen(true); }}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
                    title="Modifier le Compteur"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => setClockSyncMeter(meter)}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 transition-all cursor-pointer"
                    title="Synchronisation Horloge DLMS"
                  >
                    <Clock size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteMeter(meter.id)}
                    className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 transition-all cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pied de page résultats */}
      {filteredMeters.length > 0 && (
        <p className="text-center text-xs text-gray-300 font-bold pt-4">
          {filteredMeters.length} compteur{filteredMeters.length > 1 ? 's' : ''} affiché{filteredMeters.length > 1 ? 's' : ''} sur {meters.length} au total
        </p>
      )}

      {/* Modal Configuration de l'horloge */}
      <ClockSyncModal
        isOpen={!!clockSyncMeter}
        onClose={() => setClockSyncMeter(null)}
        meterId={clockSyncMeter?.id || ''}
        meter={clockSyncMeter}
        onSync={handleSyncClock}
      />
    </motion.div>
  );
};
