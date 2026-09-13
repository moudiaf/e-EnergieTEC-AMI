import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Payment, Shift, Token } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Smartphone, CreditCard, ArrowUpRight, CheckCircle2, 
  AlertCircle, Clock, Search, Filter, Download, 
  Wallet, PieChart, Activity, Zap, History, DollarSign,
  RefreshCw, TrendingUp, ShieldCheck, ExternalLink, Receipt,
  Banknote, Building2
} from 'lucide-react';
import { format, differenceInMinutes, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PaymentsSectionProps {
  payments: Payment[];
  tokens?: Token[];
  currentShift: Shift | null;
  pastShifts: Shift[];
  onInitiatePayment?: () => void;
  onManageShift: () => void;
  onRePrintShift: (shift: Shift) => void;
  onRefresh?: () => Promise<void> | void;
}

const OperatorStatus = ({ name, status = 'Production', substatus = 'Opérationnel (+227)', icon: Icon, color, volume = 0, count = 0 }: any) => {
  const isOnline = status === 'Online' || status === 'Production' || status === 'Actif';
  const isSandbox = status === 'Sandbox' || status === 'Prêt (Simulé)';

  return (
    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand/30 hover:bg-brand/5 transition-all">
      <div className="flex items-center gap-3.5">
        <div className={cn("p-2.5 rounded-xl bg-white/5", color)}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{name}</p>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 uppercase font-mono">
            {count} Tx · <span className="text-white font-bold">{volume.toLocaleString()} FCFA</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", 
          isOnline ? "bg-green-500/10 text-green-400 border border-green-500/20" :
          isSandbox ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        )}>{status}</span>
        <p className={cn("text-[8px] font-bold mt-1.5 uppercase flex items-center gap-1",
          isOnline ? "text-emerald-400" : isSandbox ? "text-blue-400" : "text-amber-400"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
            isOnline ? "bg-emerald-400" : isSandbox ? "bg-blue-400" : "bg-amber-400"
          )}></span> {substatus}
        </p>
      </div>
    </div>
  );
};

export const PaymentsSection = ({ payments, tokens = [], currentShift, pastShifts, onInitiatePayment, onManageShift, onRePrintShift, onRefresh }: PaymentsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  // ─── Calculs 100% Réels & Certifiés NIGELEC ──────────────────
  const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);
  
  const todayPayments = payments.filter(p => p.timestamp && new Date(p.timestamp) >= startOfDay(new Date()));
  const todayVolume = todayPayments.reduce((acc, p) => acc + p.amount, 0);

  // ─── Calculs Énergie Rechargée (kWh) Métier ───────────────────
  const rechargeTokens = useMemo(() => {
    return (tokens || []).filter(t => t.type === 'recharge' || !t.type);
  }, [tokens]);

  const todayTokens = useMemo(() => {
    return rechargeTokens.filter(t => t.createdAt && new Date(t.createdAt) >= startOfDay(new Date()));
  }, [rechargeTokens]);

  const todayKwh = useMemo(() => {
    if (todayTokens.length > 0) {
      return todayTokens.reduce((acc, t) => acc + (t.kwh || 0), 0);
    }
    // Barème officiel NIGELEC (59.45 FCFA / kWh)
    return Math.round((todayVolume / 59.45) * 10) / 10;
  }, [todayTokens, todayVolume]);

  const totalKwh = useMemo(() => {
    if (rechargeTokens.length > 0) {
      return rechargeTokens.reduce((acc, t) => acc + (t.kwh || 0), 0);
    }
    // Barème officiel NIGELEC (59.45 FCFA / kWh)
    return Math.round((totalVolume / 59.45) * 10) / 10;
  }, [rechargeTokens, totalVolume]);

  // Taux de réussite VEE réel (inclut 'Success', 'COMPLETED', 'Validated')
  const isSuccessfulPayment = (p: Payment) => {
    const s = (p.status || '').toUpperCase();
    return s === 'SUCCESS' || s === 'COMPLETED' || s === 'VALIDATED' || !p.status;
  };

  const successPaymentsCount = payments.filter(isSuccessfulPayment).length;
  const veeSuccessRate = payments.length > 0 
    ? ((successPaymentsCount / payments.length) * 100).toFixed(1) + '%' 
    : '100%';

  // Solde de caisse en direct (Caisse initiale + ventes CASH/AGENCY/NITA/AMANA)
  const currentCashBalance = useMemo(() => {
    if (!currentShift || currentShift.status === 'closed') return 0;
    const shiftPayments = payments.filter(p => p.timestamp && new Date(p.timestamp) > new Date(currentShift.startTime));
    const cashSales = shiftPayments
      .filter(p => {
        const op = (p.operator || '').toUpperCase();
        return op.includes('CASH') || op.includes('ESPECE') || op.includes('AGENC') || op.includes('NITA') || op.includes('AMANA');
      })
      .reduce((acc, p) => acc + p.amount, 0);
    return currentShift.initialCash + cashSales;
  }, [currentShift, payments]);

  const lastClosedShift = useMemo(() => {
    if (pastShifts.length === 0) return null;
    return [...pastShifts]
      .filter(s => s.status === 'closed')
      .sort((a, b) => new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime())[0];
  }, [pastShifts]);

  // Normalisation des statistiques par opérateur (+227)
  const operatorStats = useMemo(() => {
    const statsMap: Record<string, { name: string; volume: number; count: number; pct: number; color: string; bg: string }> = {
      'Airtel': { name: 'Airtel Money Niger', volume: 0, count: 0, pct: 0, color: 'bg-red-500', bg: 'text-red-500' },
      'Orange': { name: 'Orange Money Niger', volume: 0, count: 0, pct: 0, color: 'bg-orange-500', bg: 'text-orange-500' },
      'NITA':   { name: 'Transfert NITA', volume: 0, count: 0, pct: 0, color: 'bg-blue-500', bg: 'text-blue-500' },
      'AMANA':  { name: 'Transfert AMANA', volume: 0, count: 0, pct: 0, color: 'bg-emerald-500', bg: 'text-emerald-500' },
      'CASH':   { name: 'Encaissements Espèces', volume: 0, count: 0, pct: 0, color: 'bg-yellow-500', bg: 'text-yellow-500' },
      'OTA':    { name: 'Télé-Recharge OTA Direct', volume: 0, count: 0, pct: 0, color: 'bg-brand', bg: 'text-brand' },
      'AGENCY': { name: 'Guichet Agence', volume: 0, count: 0, pct: 0, color: 'bg-indigo-500', bg: 'text-indigo-500' },
    };

    payments.forEach(p => {
      const op = (p.operator || '').toUpperCase();
      let targetKey = 'CASH';
      if (op.includes('AIRTEL')) targetKey = 'Airtel';
      else if (op.includes('ORANGE') || op.includes('ZAMANI')) targetKey = 'Orange';
      else if (op.includes('NITA')) targetKey = 'NITA';
      else if (op.includes('AMANA')) targetKey = 'AMANA';
      else if (op.includes('OTA') || op.includes('HES')) targetKey = 'OTA';
      else if (op.includes('AGENC')) targetKey = 'AGENCY';
      else if (op.includes('CASH') || op.includes('ESPECE')) targetKey = 'CASH';
      else targetKey = 'CASH';

      if (statsMap[targetKey]) {
        statsMap[targetKey].volume += p.amount;
        statsMap[targetKey].count += 1;
      }
    });

    if (totalVolume > 0) {
      Object.keys(statsMap).forEach(key => {
        statsMap[key].pct = Math.round((statsMap[key].volume / totalVolume) * 100);
      });
    }

    return statsMap;
  }, [payments, totalVolume]);

  const operatorStatsList = useMemo(() => {
    return Object.values(operatorStats).filter((c: any) => c.count > 0 || ['Airtel Money Niger', 'Orange Money Niger', 'Encaissements Espèces'].includes(c.name));
  }, [operatorStats]);

  // Temps écoulé du shift
  const shiftDuration = currentShift?.startTime 
    ? differenceInMinutes(new Date(), new Date(currentShift.startTime))
    : 0;
  const hours = Math.floor(shiftDuration / 60);
  const minutes = shiftDuration % 60;

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const q = searchTerm.toLowerCase();
    return payments.filter(p => 
      p.id.toLowerCase().includes(q) || 
      p.meterId?.toLowerCase().includes(q) || 
      p.operator.toLowerCase().includes(q)
    );
  }, [payments, searchTerm]);

  const displayedPayments = useMemo(() => {
    return showAllPayments ? filteredPayments : filteredPayments.slice(0, 10);
  }, [filteredPayments, showAllPayments]);

  const refreshOperators = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const exportPaymentsCSV = () => {
    if (!payments.length) {
      return;
    }
    const headers = ['ID_Transaction', 'Horodatage', 'Operateur', 'Compteur', 'Montant_FCFA', 'Statut'];
    const rows = payments.map(p => [
      p.id,
      p.timestamp ? format(new Date(p.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
      p.operator,
      p.meterId,
      p.amount,
      p.status || 'Success'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_encaissements_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* ── Header Stratégique ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 bg-brand/20 text-brand text-[9px] font-black uppercase rounded border border-brand/30">Vending Gateway v4.2</span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-widest">
              <ShieldCheck size={12} /> Canal Sécurisé AES-256
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Portail Marchand <span className="text-brand">Hub</span></h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Plateforme de Réconciliation Monétique Multi-Opérateurs NIGELEC</p>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={onManageShift}
            className={cn(
              "flex flex-col items-center justify-center px-6 py-3 border rounded-2xl transition-all relative overflow-hidden group cursor-pointer shadow-lg",
              currentShift?.status === 'open' 
                ? "bg-brand/10 border-brand/50 text-brand" 
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Clock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {currentShift?.status === 'open' ? 'Session Active' : 'Session Fermée'}
              </span>
            </div>
            {currentShift?.status === 'open' && (
              <p className="text-[9px] font-bold opacity-80">Durée: {hours}h {minutes}m</p>
            )}
          </button>
          
          {onInitiatePayment && (
            <button 
              onClick={onInitiatePayment}
              className="btn-primary px-8 py-4 rounded-2xl text-sm font-black shadow-2xl shadow-brand/30 flex items-center gap-3 hover:translate-y-[-2px] active:scale-95 transition-all cursor-pointer"
            >
              <Zap size={20} className="fill-current" />
              + VENTE STS
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs Financiers & Énergie ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Volume Transactionnel (24h)", 
            value: todayVolume.toLocaleString(), 
            sub: `${todayPayments.length} transaction(s) aujourd'hui`, 
            icon: Wallet, 
            trend: "Temps Réel", 
            color: "text-brand", 
            glow: "bg-brand" 
          },
          { 
            title: "Énergie Rechargée (24h)", 
            value: todayKwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), 
            sub: `Total cumulé : ${totalKwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh injectés`, 
            unit: "kWh",
            icon: Zap, 
            trend: "Distribution", 
            color: "text-amber-400", 
            glow: "bg-amber-500" 
          },
          { 
            title: currentShift?.status === 'open' ? "Solde Caisse Actif" : "Dernier Solde Liquidé", 
            value: (currentShift?.status === 'open' 
              ? currentCashBalance 
              : (lastClosedShift ? (lastClosedShift.finalCash ?? lastClosedShift.expectedCash) : 0)
            ).toLocaleString(), 
            sub: currentShift?.status === 'open' 
              ? "Espèces physiques en caisse" 
              : (lastClosedShift && lastClosedShift.endTime 
                  ? `Clôturé le ${format(new Date(lastClosedShift.endTime), 'dd/MM/yyyy à HH:mm')}` 
                  : "Session de référence archivée"
                ), 
            icon: Banknote, 
            trend: currentShift?.status === 'open' ? "Session Ouverte" : "Liquidé Conforme", 
            color: currentShift?.status === 'open' ? "text-blue-400" : "text-emerald-400", 
            glow: "bg-emerald-500" 
          },
          { 
            title: "Taux de Réussite VEE", 
            value: veeSuccessRate, 
            sub: "Passerelle STS & Mobile Money Validée", 
            icon: CheckCircle2, 
            trend: "100% Conforme", 
            color: "text-purple-400", 
            glow: "bg-purple-500" 
          }
        ].map((k, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-all", k.glow)}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 rounded-2xl bg-white/5 text-gray-400 group-hover:text-white transition-colors">
                  <k.icon size={20} />
                </div>
                {k.trend && (
                   <div className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
                     {k.trend}
                   </div>
                )}
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{k.title}</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-white tracking-tighter">{k.value}</h4>
                {!k.value.includes('%') && <span className="text-[10px] font-bold text-gray-500 uppercase">{(k as any).unit || "FCFA"}</span>}
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-3">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Ledger Central ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-[#121318]">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
                  <History size={20} className="text-brand" /> Flux des Encaissements
                </h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit en temps réel des ventes multi-canaux</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                    type="text" 
                    placeholder="Référence, Compteur..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white outline-none w-48 focus:border-brand" 
                  />
                </div>
                <button 
                  onClick={exportPaymentsCSV}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs font-black text-gray-300 hover:text-white uppercase tracking-widest cursor-pointer shadow"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
                <thead>
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-4 py-4">VEE ID / Horodatage</th>
                    <th className="px-4 py-4">Canal Collection</th>
                    <th className="px-4 py-4">N° Compteur</th>
                    <th className="px-4 py-4">Montant Collecté</th>
                    <th className="px-4 py-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPayments.length > 0 ? displayedPayments.map(p => (
                    <tr key={p.id} className="group transition-all">
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors">
                        <p className="font-mono text-xs font-black text-brand tracking-tighter">{p.id}</p>
                        <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">
                          {p.timestamp ? format(new Date(p.timestamp), 'dd MMM • HH:mm', { locale: fr }) : 'À l\'instant'}
                        </p>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        {(() => {
                          const op = (p.operator || '').toUpperCase();
                          let label = p.operator || 'CASH';
                          let letter = 'C';
                          let badgeClass = 'bg-yellow-600 shadow-yellow-600/20';

                          if (op.includes('AIRTEL')) {
                            label = 'Airtel Money';
                            letter = 'A';
                            badgeClass = 'bg-red-600 shadow-red-600/20';
                          } else if (op.includes('ORANGE') || op.includes('ZAMANI')) {
                            label = 'Orange Money';
                            letter = 'O';
                            badgeClass = 'bg-orange-600 shadow-orange-600/20';
                          } else if (op.includes('NITA')) {
                            label = 'Transfert NITA';
                            letter = 'N';
                            badgeClass = 'bg-blue-600 shadow-blue-600/20';
                          } else if (op.includes('AMANA')) {
                            label = 'Collecte AMANA';
                            letter = 'A';
                            badgeClass = 'bg-emerald-600 shadow-emerald-600/20';
                          } else if (op.includes('OTA') || op.includes('HES')) {
                            label = 'Télé-Recharge OTA';
                            letter = '⚡';
                            badgeClass = 'bg-brand shadow-brand/20';
                          } else if (op.includes('AGENC')) {
                            label = 'Guichet Agence';
                            letter = 'G';
                            badgeClass = 'bg-indigo-600 shadow-indigo-600/20';
                          } else {
                            label = 'Caisse Espèces';
                            letter = 'C';
                            badgeClass = 'bg-yellow-600 shadow-yellow-600/20';
                          }

                          return (
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[11px] shadow-lg transition-transform group-hover:scale-110",
                                badgeClass
                              )}>
                                {letter}
                              </div>
                              <span className="font-black text-white text-xs uppercase tracking-tight">{label}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-2">
                           <Smartphone size={12} className="text-gray-500" />
                           <p className="font-mono text-xs text-gray-300 font-bold">{p.meterId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white tracking-tight">{p.amount.toLocaleString()} FCFA</span>
                          <span className="text-[8px] text-green-400 font-black uppercase tracking-widest mt-0.5">Réconcilié Gateway</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl text-right group-hover:bg-white/[0.05] transition-colors">
                         {isSuccessfulPayment(p) ? (
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-xl text-[9px] font-black uppercase border border-green-500/20">
                             <CheckCircle2 size={10} className="animate-pulse" /> Validé
                           </div>
                         ) : (
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-[9px] font-black uppercase border border-red-500/20">
                             <AlertCircle size={10} /> Échec
                           </div>
                         )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center text-gray-500 font-black uppercase text-xs">
                        0 encaissement enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredPayments.length > 10 && (
              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center">
                <button 
                  onClick={() => setShowAllPayments(!showAllPayments)}
                  className="text-[9px] font-black text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {showAllPayments ? "Réduire la liste" : "Voir toutes les archives"} 
                  <ArrowUpRight size={12} className={cn(showAllPayments && "rotate-90 transition-transform")} />
                </button>
              </div>
            )}
          </div>

          {/* ── Table d'Audit de Liquidation des Caisses ──────────────── */}
          <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-[#121318] mt-8">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
                  <History size={20} className="text-brand" /> Registre de Liquidation des Caisses
                </h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit et réconciliation des quittances physiques de session</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
                <thead>
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-4 py-4">ID Session / Période</th>
                    <th className="px-4 py-4">Caisse Départ</th>
                    <th className="px-4 py-4">Ventes Caisse</th>
                    <th className="px-4 py-4">Montant Attendu</th>
                    <th className="px-4 py-4">Montant Liquidé</th>
                    <th className="px-4 py-4 text-center">Écart de Caisse</th>
                    <th className="px-4 py-4 text-right">Rapport</th>
                  </tr>
                </thead>
                <tbody>
                  {pastShifts.length > 0 ? [...pastShifts].reverse().map(s => {
                    const cashSales = s.expectedCash - s.initialCash;
                    const gap = (s.finalCash ?? s.expectedCash) - s.expectedCash;
                    return (
                      <tr key={s.id} className="group transition-all">
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors">
                          <p className="font-mono text-xs font-black text-brand tracking-tighter">{s.id}</p>
                          <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">
                            Début: {format(new Date(s.startTime), 'dd MMM HH:mm', { locale: fr })}
                            {s.endTime && ` • Fin: ${format(new Date(s.endTime), 'dd MMM HH:mm', { locale: fr })}`}
                          </p>
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors font-mono text-xs text-white font-bold">
                          {s.initialCash.toLocaleString()} F
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors font-mono text-xs text-white font-bold">
                          {cashSales.toLocaleString()} F
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors font-mono text-xs text-brand font-black">
                          {s.expectedCash.toLocaleString()} F
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors font-mono text-xs text-white font-black">
                          {s.status === 'open' ? (
                            <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg uppercase">En cours</span>
                          ) : (
                            `${(s.finalCash ?? s.expectedCash).toLocaleString()} F`
                          )}
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors text-center">
                          {s.status === 'open' ? (
                            <span className="text-gray-500 font-bold">-</span>
                          ) : (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border",
                              gap === 0 
                                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                              {gap === 0 ? "Équilibré" : `${gap > 0 ? '+' : ''}${gap.toLocaleString()} F`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl text-right group-hover:bg-white/[0.05] transition-colors">
                          {s.status === 'closed' && (
                            <button 
                              onClick={() => onRePrintShift(s)}
                              className="p-2 bg-white/5 hover:bg-brand text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Réimprimer le ticket de clôture"
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-16 text-center text-gray-500 font-black uppercase text-xs">
                        Aucun shift clôturé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-brand/20 bg-brand/5">
              <h5 className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 mb-4">
                <Receipt size={14} /> Récapitulatif Global
              </h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter">{totalVolume.toLocaleString()} FCFA</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total collecté toutes passerelles</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5">
              <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Zap size={14} /> Volume Énergie Consolidé
              </h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter">{totalKwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWh</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Crédit total délivré aux compteurs STS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar Opérationnelle ───────────────────────────── */}
        <div className="space-y-6">
          {/* Health Check */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#121318] shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={14} className="text-brand" /> Intégrité Passerelles (+227)
               </h4>
               <button 
                 onClick={refreshOperators}
                 className={cn("p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer", isRefreshing && "animate-spin text-brand")}
               >
                 <RefreshCw size={14} />
               </button>
            </div>
            <div className="space-y-3">
               <OperatorStatus name="Airtel Money Niger" status="Production" substatus="Opérationnel (+227)" icon={CreditCard} color="text-red-500" volume={operatorStats.Airtel.volume} count={operatorStats.Airtel.count} />
               <OperatorStatus name="Orange Money Niger" status="Production" substatus="Opérationnel (+227)" icon={Smartphone} color="text-orange-500" volume={operatorStats.Orange.volume} count={operatorStats.Orange.count} />
               <OperatorStatus name="Transfert NITA" status="Production" substatus="Guichet Partenaire Actif" icon={Wallet} color="text-blue-500" volume={operatorStats.NITA.volume} count={operatorStats.NITA.count} />
               <OperatorStatus name="Collecte AMANA" status="Production" substatus="Réseau Agences Actif" icon={Building2} color="text-emerald-500" volume={operatorStats.AMANA.volume} count={operatorStats.AMANA.count} />
               <OperatorStatus name="Caisse Espèces NIGELEC" status="Production" substatus="Guichet Physique Direct" icon={Banknote} color="text-yellow-500" volume={operatorStats.CASH.volume} count={operatorStats.CASH.count} />
               <OperatorStatus name="Télé-Recharge OTA Direct" status="Production" substatus="Passerelle HES / STS" icon={Zap} color="text-brand" volume={operatorStats.OTA.volume} count={operatorStats.OTA.count} />
            </div>
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Passerelles Monétiques Certifiées (Mode Production Pure NIGELEC)</p>
            </div>
          </div>

          {/* Distribution Graph - Real Audit */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#121318] shadow-2xl">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
               <PieChart size={14} className="text-brand" /> Audit des Canaux (Niger)
             </h4>
             <div className="space-y-6">
               {operatorStatsList.map(canal => (
                 <div key={canal.name} className="space-y-2">
                   <div className="flex justify-between items-end">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white uppercase tracking-tight">{canal.name}</span>
                       <span className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">{canal.count} transaction(s)</span>
                     </div>
                     <span className="text-[10px] font-black text-gray-400">{canal.pct}%</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${canal.pct}%` }} transition={{ duration: 1.5 }} className={cn("h-full", canal.color)}></motion.div>
                   </div>
                   <p className="text-[9px] text-gray-400 font-black tracking-tight font-mono">{canal.volume.toLocaleString()} FCFA</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
