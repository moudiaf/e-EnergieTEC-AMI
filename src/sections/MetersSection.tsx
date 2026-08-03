import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Search, Zap, Wifi, WifiOff, AlertTriangle, ShieldAlert, Activity, Info, X, Hash, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import { Meter } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  domestic:        'bg-brand/10 text-brand',
  social:          'bg-green-500/10 text-green-400',
  commercial:      'bg-blue-400/10 text-blue-300',
  industrial:      'bg-purple-400/10 text-purple-300',
  haute_tension:   'bg-yellow-400/10 text-yellow-300',
  eclairage_public:'bg-cyan-400/10 text-cyan-300',
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
  const [filter, setFilter]   = React.useState<'all' | 'online' | 'warning' | 'offline' | 'anomalies'>('all');
  const [localSearch, setLocalSearch] = React.useState('');
  const searchVal = search !== undefined ? search : localSearch;
  const setSearchVal = setSearch !== undefined ? setSearch : setLocalSearch;
  const [detailMeter, setDetailMeter] = React.useState<Meter | null>(null);

  // ─── KPIs ──────────────────────────────────────────────────────
  const onlineCount  = meters.filter(m => m.status === 'online').length;
  const warningCount = meters.filter(m => m.status === 'warning').length;
  const offlineCount = meters.filter(m => m.status === 'offline').length;
  const tamperCount  = meters.filter(m => m.tamperStatus === 'tampered' || m.tamperStatus === 'detected').length;
  const lowCredit    = meters.filter(m => (m.credit || 0) < 5).length;

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
  }, [meters, filter, searchVal]);

  const FILTERS = [
    { key: 'all',       label: 'Tous',        count: meters.length,  color: 'text-white' },
    { key: 'online',    label: 'En ligne',     count: onlineCount,    color: 'text-green-400' },
    { key: 'warning',   label: 'Alerte',       count: warningCount,   color: 'text-orange-400' },
    { key: 'offline',   label: 'Hors ligne',   count: offlineCount,   color: 'text-red-400' },
    { key: 'anomalies', label: 'Anomalies',    count: tamperCount + lowCredit, color: 'text-red-400' },
  ] as const;

  return (
    <motion.div key="meters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

      {/* ── Modal Détails Compteur ──────────────────────────────── */}
      <AnimatePresence>
        {detailMeter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setDetailMeter(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel rounded-[2.5rem] p-10 border border-white/10 w-full max-w-2xl shadow-[0_0_80px_rgba(255,107,53,0.15)] relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", TYPE_COLORS[detailMeter.type] || 'bg-white/10 text-gray-400')}>
                      {TYPE_LABELS[detailMeter.type] || detailMeter.type}
                    </span>
                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                      detailMeter.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      detailMeter.status === 'warning' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}>
                      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-2", 
                        detailMeter.status === 'online' ? "bg-green-500 animate-pulse" : 
                        detailMeter.status === 'warning' ? "bg-orange-500" : "bg-red-500"
                      )} />
                      {detailMeter.status}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{detailMeter.id}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase text-[11px] tracking-widest">
                      <MapPin size={12} className="text-brand" /> {detailMeter.location}
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                      detailMeter.phaseType === 'triphase' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    )}>
                      {detailMeter.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailMeter(null)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 relative z-10">
                {[
                  { label: 'Solde Crédit', value: `${(detailMeter.credit || 0).toFixed(2)} kWh`, accent: (detailMeter.credit || 0) < 5, icon: Zap },
                  { label: 'Charge Actuelle', value: `${detailMeter.power || 0} kW`, icon: Activity },
                  { label: 'Tension Réseau', value: detailMeter.phaseType === 'triphase' ? `${detailMeter.voltage || 400} V` : `${detailMeter.voltage || 230} V`, icon: ShieldAlert },
                  { label: 'Lot de Production', value: detailMeter.batchId || 'BATCH-2026-NIG', icon: Hash, isNew: true },
                  { label: 'Enregistré le', value: formatDateSafe(detailMeter.registeredAt, 'dd MMMM yyyy'), icon: Clock, isNew: true },
                  { label: 'Version Firmware', value: detailMeter.firmware || 'v2.4.1', icon: Info },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all group/item",
                    item.accent ? "bg-brand/10 border-brand/20 shadow-[0_0_15px_rgba(255,107,53,0.1)]" : "bg-white/5 border-white/10 hover:bg-white/[0.08]",
                    (item as any).isNew && "border-brand/30 bg-brand/5"
                  )}>
                    <div className="flex items-center gap-2 mb-2 opacity-50 group-hover/item:opacity-100 transition-opacity">
                      {item.icon && <item.icon size={12} className={item.accent ? "text-brand" : "text-brand"} />}
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                      {(item as any).isNew && <span className="ml-auto w-1 h-1 rounded-full bg-brand animate-pulse" />}
                    </div>
                    <p className={cn("text-sm font-black tracking-tight", item.accent ? 'text-brand' : 'text-white')}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <button
                  onClick={() => { setViewingMeter(detailMeter); setCurrentSection('map'); setDetailMeter(null); }}
                  className="flex-1 py-4 rounded-2xl bg-brand text-white text-xs font-black uppercase hover:shadow-2xl hover:shadow-brand/20 transition-all flex items-center justify-center gap-3"
                >
                  <MapPin size={18} /> LOCALISER SUR CARTE
                </button>
                <button
                  onClick={() => { setEditingMeter(detailMeter); setIsMeterModalOpen(true); setDetailMeter(null); }}
                  className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <Edit size={18} /> MODIFIER
                </button>
                <button
                  onClick={() => { handleDeleteMeter(detailMeter.id); setDetailMeter(null); }}
                  className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Nigelec AMI Inventory v5.0</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 uppercase tracking-widest">
              <Activity size={10} /> Flotte Opérationnelle
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Parc des <span className="text-brand">Compteurs</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Gestion du Cycle de Vie & Déploiement Terrain</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setEditingMeter(null); setIsMeterModalOpen(true); }}
            className="btn-primary px-10 py-4 rounded-3xl text-sm font-black shadow-2xl shadow-brand/30 flex items-center gap-3 hover:translate-y-[-2px] active:scale-95 transition-all"
          >
            <Plus size={20} /> ENREGISTRER UN COMPTEUR
          </button>
        </div>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Flotte', value: meters.length, icon: Activity, color: 'text-white', bg: 'from-white/5', trend: 'Global' },
          { label: 'Connectés', value: onlineCount, icon: Wifi, color: 'text-green-400', bg: 'from-green-500/10', trend: '98%' },
          { label: 'Alertes/Warning', value: warningCount, icon: AlertTriangle, color: 'text-orange-400', bg: 'from-orange-500/10', trend: 'Actif' },
          { label: 'Hors Ligne', value: offlineCount, icon: WifiOff, color: 'text-red-400', bg: 'from-red-500/10', trend: 'Urgent' },
          { label: 'Sabotage/Tamper', value: tamperCount, icon: ShieldAlert, color: 'text-red-500', bg: 'from-red-500/15', trend: 'Police' },
        ].map((k, i) => (
          <div key={i} className={cn("glass-panel p-5 rounded-3xl border border-white/5 bg-gradient-to-br to-transparent relative overflow-hidden group", k.bg)}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-gray-400 group-hover:text-white transition-colors">
                <k.icon size={16} />
              </div>
              <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-white/5 rounded text-gray-500">{k.trend}</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{k.label}</p>
              <p className={cn("text-3xl font-black", k.color)}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôle ──────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 relative",
                filter === f.key
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {f.label}
              <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-black",
                filter === f.key ? "bg-white/20 text-white" : cn("bg-white/5", f.color)
              )}>
                {f.count}
              </span>
              {f.key === 'anomalies' && f.count > 0 && filter !== 'anomalies' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Recherche + Nouveau */}
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="ID, lieu, client..."
              className="input-field pl-8 py-2 text-sm w-full sm:w-52"
            />
          </div>
          {setIsReplacementModalOpen && (
            <button 
              onClick={() => setIsReplacementModalOpen(true)}
              className="btn-secondary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold whitespace-nowrap text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
            >
              <RefreshCw size={14} /> Remplacer Compteur
            </button>
          )}
          <button onClick={() => { setEditingMeter(null); setIsMeterModalOpen(true); }}
            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold whitespace-nowrap">
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </div>

      {/* ── Résultats ────────────────────────────────────────────── */}
      {filteredMeters.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 flex flex-col items-center gap-4 text-gray-500">
          <Search size={40} className="opacity-30" />
          <p className="text-sm font-bold">Aucun compteur ne correspond à votre recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMeters.map(meter => {
            const isLowCredit = (meter.credit || 0) < 5;
            const isTamper = meter.tamperStatus === 'tampered' || meter.tamperStatus === 'detected';
            const statusColor =
              meter.status === 'online'  ? 'bg-green-500' :
              meter.status === 'warning' ? 'bg-orange-500' : 'bg-red-500';

            return (
              <motion.div
                key={meter.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "glass-panel p-6 rounded-3xl group hover:border-brand/30 transition-all duration-500 relative overflow-hidden border",
                  isTamper ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-white/5"
                )}
              >
                {/* Glow d'arrière-plan */}
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl opacity-10 transition-all group-hover:opacity-20", statusColor)} />

                {/* En-tête */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-lg font-black text-white leading-tight">{meter.id}</h4>
                    <span className={cn("self-start px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", TYPE_COLORS[meter.type] || 'bg-white/10 text-gray-400')}>
                      {TYPE_LABELS[meter.type] || meter.type}
                    </span>
                    <span className={cn("self-start px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                      meter.phaseType === 'triphase' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    )}>
                      {meter.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Mono'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase",
                      meter.status === 'online' ? "bg-green-500/10 text-green-400" :
                      meter.status === 'warning' ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusColor, meter.status === 'online' ? "animate-pulse" : "")} />
                      {meter.status}
                    </div>
                    {isTamper && (
                      <div className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[9px] font-black uppercase animate-pulse border border-red-400/30 flex items-center gap-1">
                        <ShieldAlert size={8} /> TAMPER
                      </div>
                    )}
                  </div>
                </div>

                {/* Infos principales */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Localisation</span>
                    <span className="font-bold text-white text-right max-w-[60%] truncate">{meter.location}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Client</span>
                    <span className="font-bold text-gray-300">{meter.customerId || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Crédit</span>
                    <span className={cn("font-black", isLowCredit ? "text-brand" : "text-green-400")}>
                      {(meter.credit || 0).toFixed(2)} kWh
                      {isLowCredit && <span className="ml-1 text-[9px] text-brand/70">(bas)</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-white/5 mt-1">
                    <div className="flex items-center gap-1 text-gray-500 font-black uppercase tracking-widest">
                      <Hash size={10} className="text-brand/50" />
                      {meter.batchId || 'LOT-2026'}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 font-bold">
                      <Clock size={10} />
                      {formatDateSafe(meter.registeredAt, 'dd/MM/yy')}
                    </div>
                  </div>
                </div>

                {/* Métriques techniques */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Puissance</p>
                    <p className="text-xs font-black text-white flex items-center justify-center gap-0.5">
                      <Zap size={9} className="text-brand" />{meter.power || 0} kW
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Tension</p>
                    <p className="text-xs font-black text-white">
                      {meter.phaseType === 'triphase' 
                        ? `${meter.voltage || 400} V`
                        : `${meter.voltage || 230} V`
                      }
                    </p>
                    <p className="text-[7px] text-gray-600 font-bold mt-0.5">
                      {meter.phaseType === 'triphase' ? 'L-L (3φ)' : 'L-N (1φ)'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-600 uppercase font-bold mb-0.5">Synchro</p>
                    <p className="text-xs font-black text-white truncate">{meter.lastUpdate || 'N/A'}</p>
                  </div>
                </div>

                {/* Barre crédit */}
                <div className="mb-4">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((meter.credit || 0) * 2, 100)}%` }}
                      transition={{ duration: 1 }}
                      className={cn("h-full rounded-full", isLowCredit ? "bg-brand" : "bg-green-500")}
                    />
                  </div>
                </div>

                {/* Actions Unified */}
                <div className="flex gap-2 relative group/action">
                  <button
                    onClick={() => setDetailMeter(meter)}
                    className="flex-1 bg-brand/10 hover:bg-brand text-brand hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border border-brand/20 flex items-center justify-center gap-2 shadow-lg hover:shadow-brand/20"
                  >
                    Action <ChevronDown size={12} />
                  </button>

                  {/* Dropdown Content */}
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-bg-dark border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/action:opacity-100 group-hover/action:visible translate-y-2 group-hover/action:translate-y-0 transition-all z-50 overflow-hidden">
                    <button onClick={() => setDetailMeter(meter)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5">
                      <Info size={14} className="text-brand" /> Voir Détails
                    </button>
                    <button onClick={() => { setViewingMeter(meter); setCurrentSection('map'); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5">
                      <MapPin size={14} className="text-blue-400" /> Localiser
                    </button>
                    <button onClick={() => { setEditingMeter(meter); setIsMeterModalOpen(true); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5">
                      <Edit size={14} className="text-green-400" /> Modifier
                    </button>
                    <button onClick={() => handleDeleteMeter(meter.id)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pied de page résultats */}
      {filteredMeters.length > 0 && (
        <p className="text-center text-xs text-gray-600 font-bold pt-2">
          {filteredMeters.length} compteur{filteredMeters.length > 1 ? 's' : ''} affiché{filteredMeters.length > 1 ? 's' : ''} sur {meters.length}
        </p>
      )}
    </motion.div>
  );
};
