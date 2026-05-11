import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Search, Zap, Wifi, WifiOff, AlertTriangle, ShieldAlert, Activity, Info, X } from 'lucide-react';
import { Meter } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  handleDeleteMeter: (id: string) => void;
  setCurrentSection: (section: string) => void;
}

export const MetersSection = ({
  meters,
  setViewingMeter,
  setEditingMeter,
  setIsMeterModalOpen,
  handleDeleteMeter,
  setCurrentSection
}: MetersSectionProps) => {
  const [filter, setFilter]   = React.useState<'all' | 'online' | 'warning' | 'offline' | 'anomalies'>('all');
  const [search, setSearch]   = React.useState('');
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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.id.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q) ||
        m.type?.toLowerCase().includes(q) ||
        m.customerId?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [meters, filter, search]);

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
      {detailMeter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setDetailMeter(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 border border-brand/30 w-full max-w-lg shadow-[0_0_60px_rgba(255,107,53,0.15)] mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase", TYPE_COLORS[detailMeter.type] || 'bg-white/10 text-gray-400')}>
                    {TYPE_LABELS[detailMeter.type] || detailMeter.type}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase",
                    detailMeter.status === 'online' ? 'bg-green-500/20 text-green-400' :
                    detailMeter.status === 'warning' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                  )}>{detailMeter.status}</span>
                  {(detailMeter.tamperStatus === 'tampered' || detailMeter.tamperStatus === 'detected') && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">TAMPER</span>
                  )}
                </div>
                <h3 className="text-xl font-black text-white">{detailMeter.id}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{detailMeter.location}</p>
              </div>
              <button onClick={() => setDetailMeter(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Crédit', value: `${(detailMeter.credit || 0).toFixed(2)} kWh`, accent: (detailMeter.credit || 0) < 5 },
                { label: 'Puissance', value: `${detailMeter.power || 0} kW` },
                { label: 'Tension', value: `${detailMeter.voltage || 230} V` },
                { label: 'Firmware', value: detailMeter.firmware || 'N/A' },
                { label: 'Protocole', value: detailMeter.protocol || 'DLMS/COSEM' },
                { label: 'Dernière synchro', value: detailMeter.lastUpdate || 'N/A' },
                { label: 'Client', value: detailMeter.customerId || 'N/A' },
                { label: 'Installation', value: detailMeter.installationDate || 'N/A' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={cn("text-sm font-bold", item.accent ? 'text-brand' : 'text-white')}>{item.value}</p>
                </div>
              ))}
            </div>

            {detailMeter.solarInjection !== undefined && (
              <div className="p-3 mb-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20 flex items-center justify-between">
                <span className="text-xs text-yellow-400 font-bold">Injection Solaire</span>
                <span className="text-sm font-black text-yellow-300">{detailMeter.solarInjection} kWh</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setViewingMeter(detailMeter); setCurrentSection('map'); setDetailMeter(null); }}
                className="flex-1 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <MapPin size={14} /> Voir Carte
              </button>
              <button
                onClick={() => { setEditingMeter(detailMeter); setIsMeterModalOpen(true); setDetailMeter(null); }}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit size={14} /> Modifier
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── KPI Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',      value: meters.length,  icon: Activity,      color: 'text-white',       bg: 'from-white/5' },
          { label: 'En Ligne',   value: onlineCount,    icon: Wifi,          color: 'text-green-400',   bg: 'from-green-500/10' },
          { label: 'Alerte',     value: warningCount,   icon: AlertTriangle, color: 'text-orange-400',  bg: 'from-orange-500/10' },
          { label: 'Hors Ligne', value: offlineCount,   icon: WifiOff,       color: 'text-red-400',     bg: 'from-red-500/10' },
          { label: 'Tamper',     value: tamperCount,    icon: ShieldAlert,   color: 'text-red-400',     bg: 'from-red-500/10' },
        ].map((k, i) => (
          <div key={i} className={cn("glass-panel p-4 rounded-2xl border border-white/5 bg-gradient-to-br to-transparent", k.bg)}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{k.label}</p>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={cn("text-2xl font-black", k.color)}>{k.value}</p>
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
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ID, lieu, client..."
              className="input-field pl-8 py-2 text-sm w-full sm:w-52"
            />
          </div>
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
                    <p className="text-xs font-black text-white">{meter.voltage || 230} V</p>
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

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailMeter(meter)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold transition-all border border-white/5 flex items-center justify-center gap-1.5"
                  >
                    <Info size={12} /> Détails
                  </button>
                  <button
                    onClick={() => { setViewingMeter(meter); setCurrentSection('map'); }}
                    className="p-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl transition-all border border-brand/20"
                    title="Visualiser sur la carte"
                  >
                    <MapPin size={15} />
                  </button>
                  <button
                    onClick={() => { setEditingMeter(meter); setIsMeterModalOpen(true); }}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"
                    title="Modifier"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteMeter(meter.id)}
                    className="p-2 bg-red-500/5 hover:bg-red-500 text-red-500/50 hover:text-white rounded-xl transition-all border border-white/5"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
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
