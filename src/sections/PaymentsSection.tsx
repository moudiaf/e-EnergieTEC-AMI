import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Payment, Shift } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Smartphone, CreditCard, ArrowUpRight, CheckCircle2, 
  AlertCircle, Clock, Search, Filter, Download, 
  Wallet, PieChart, Activity, Zap, History, DollarSign,
  RefreshCw, TrendingUp, ShieldCheck, ExternalLink, Receipt
} from 'lucide-react';
import { format, differenceInMinutes, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PaymentsSectionProps {
  payments: Payment[];
  currentShift: Shift | null;
  onInitiatePayment?: () => void;
  onManageShift: () => void;
}

const OperatorStatus = ({ name, status, icon: Icon, color }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand/30 hover:bg-brand/5 transition-all">
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-xl bg-white/5", color)}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{name}</p>
        <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Latence: <span className="text-green-500">12ms</span></p>
      </div>
    </div>
    <div className="flex flex-col items-end">
      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", 
        status === 'Online' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
      )}>{status}</span>
    </div>
  </div>
);

export const PaymentsSection = ({ payments, currentShift, onInitiatePayment, onManageShift }: PaymentsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Calculs ──────────────────────────────────────────────────
  const totalVolume = payments.reduce((acc, p) => acc + p.amount, 0);
  const commissionRate = 0.015; // 1.5%
  const totalCommission = totalVolume * commissionRate;
  
  const todayPayments = payments.filter(p => p.timestamp && new Date(p.timestamp) >= startOfDay(new Date()));
  const todayVolume = todayPayments.reduce((acc, p) => acc + p.amount, 0);

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

  const refreshOperators = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* ── Header Stratégique ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Vending Gateway v4.2</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 uppercase tracking-widest">
              <ShieldCheck size={10} /> Canal Sécurisé AES-256
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Portail Marchand <span className="text-brand">Hub</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Plateforme de Réconciliation Nigelec Smart</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={onManageShift}
            className={cn(
              "flex flex-col items-center justify-center px-6 py-3 border rounded-2xl transition-all relative overflow-hidden group",
              currentShift?.status === 'open' 
                ? "bg-brand/10 border-brand/50 text-brand" 
                : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Clock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {currentShift?.status === 'open' ? 'Session Active' : 'Session Fermée'}
              </span>
            </div>
            {currentShift?.status === 'open' && (
              <p className="text-[9px] font-bold opacity-60">Durée: {hours}h {minutes}m</p>
            )}
            <div className="absolute inset-0 bg-brand/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </button>
          
          <button 
            onClick={onInitiatePayment}
            className="btn-primary px-10 py-4 rounded-3xl text-sm font-black shadow-2xl shadow-brand/30 flex items-center gap-3 hover:translate-y-[-2px] active:scale-95 transition-all"
          >
            <Zap size={20} className="fill-current" />
            + VENTE STS
          </button>
        </div>
      </div>

      {/* ── KPIs Financiers ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Volume Transactionnel (24h)", 
            value: todayVolume.toLocaleString(), 
            sub: `${todayPayments.length} transactions aujourd'hui`, 
            icon: Wallet, 
            trend: "+12.5%", 
            color: "text-brand", 
            glow: "bg-brand" 
          },
          { 
            title: "Commissions Marchand", 
            value: totalCommission.toLocaleString(), 
            sub: "Calculé à 1.5% du volume", 
            icon: DollarSign, 
            trend: "+5.2%", 
            color: "text-green-400", 
            glow: "bg-green-500" 
          },
          { 
            title: "Solde Liquidité Caisse", 
            value: (currentShift?.cashBalance || 0).toLocaleString(), 
            sub: "Espèces physiques en main", 
            icon: Banknote, 
            trend: null, 
            color: "text-blue-400", 
            glow: "bg-blue-500" 
          },
          { 
            title: "Taux de Réussite VEE", 
            value: "99.8%", 
            sub: "Validation passerelle STS", 
            icon: CheckCircle2, 
            trend: "Optimal", 
            color: "text-purple-400", 
            glow: "bg-purple-500" 
          }
        ].map((k, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-all", k.glow)}></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="p-3 rounded-2xl bg-white/5 text-gray-500 group-hover:text-white transition-colors">
                  <k.icon size={20} />
                </div>
                {k.trend && (
                   <div className="flex items-center gap-1 text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                     {k.trend.includes('%') && <ArrowUpRight size={10} />} {k.trend}
                   </div>
                )}
              </div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{k.title}</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-black text-white tracking-tighter">{k.value}</h4>
                {k.value !== '99.8%' && <span className="text-[10px] font-bold text-gray-600 uppercase">FCFA</span>}
              </div>
              <p className="text-[9px] text-gray-600 font-bold uppercase mt-3">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Ledger Central ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-bg-dark/40">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
                  <History size={20} className="text-brand" /> Flux des Encaissements
                </h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit en temps réel des ventes passerelles</p>
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
                <button className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest">
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-8 py-5">VEE ID / Horodatage</th>
                    <th className="px-8 py-5">Canal Collection</th>
                    <th className="px-8 py-5">N° Compteur</th>
                    <th className="px-8 py-5">Montant Collecté</th>
                    <th className="px-8 py-5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayments.length > 0 ? filteredPayments.slice(0, 8).map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-mono text-xs font-black text-brand">{p.id}</p>
                        <p className="text-[9px] text-gray-600 font-bold mt-1 uppercase">
                          {p.timestamp ? format(new Date(p.timestamp), 'dd MMM • HH:mm', { locale: fr }) : 'A l\'instant'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] shadow-lg",
                            p.operator === 'Orange' ? "bg-orange-600 shadow-orange-600/20" :
                            p.operator === 'Airtel' ? "bg-red-600 shadow-red-600/20" : 
                            p.operator === 'NITA' ? "bg-blue-600 shadow-blue-600/20" : 
                            p.operator === 'AMANA' ? "bg-green-600 shadow-green-600/20" : "bg-brand shadow-brand/20"
                          )}>
                            {p.operator.charAt(0)}
                          </div>
                          <span className="font-black text-white text-xs uppercase">{p.operator}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-mono text-xs text-gray-400">{p.meterId}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white">{p.amount.toLocaleString()} FCFA</span>
                          <span className="text-[8px] text-green-500/70 font-black uppercase">Réconcilié</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase">
                           <CheckCircle2 size={10} /> Validé
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-black uppercase text-xs opacity-30">Aucun enregistrement</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-center">
              <button className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                Voir toutes les archives du shift <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-brand/20 bg-brand/5">
              <h5 className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 mb-4">
                <Receipt size={14} /> Récapitulatif Hebdomadaire
              </h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter">{(totalVolume * 4).toLocaleString()} FCFA</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Projection mensuelle basée sur 24h</p>
                </div>
                <button className="px-4 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Détails</button>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-blue-500/20 bg-blue-500/5">
              <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <ShieldCheck size={14} /> État du Solde AMANA
              </h5>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter">1,250,500 F</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Limite de crédit marchand: 5M F</p>
                </div>
                <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Recharger</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar Opérationnelle ───────────────────────────── */}
        <div className="space-y-6">
          {/* Health Check */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-bg-dark/40 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
               <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={14} className="text-brand" /> Intégrité Passerelles
               </h4>
               <button 
                 onClick={refreshOperators}
                 className={cn("p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all", isRefreshing && "animate-spin text-brand")}
               >
                 <RefreshCw size={14} />
               </button>
            </div>
            <div className="space-y-3">
               <OperatorStatus name="Orange Money Hub" status="Online" icon={Smartphone} color="text-orange-500" />
               <OperatorStatus name="Airtel Cash GW" status="Online" icon={CreditCard} color="text-red-500" />
               <OperatorStatus name="NITA Cash Vending" status="Online" icon={Wallet} color="text-blue-500" />
               <OperatorStatus name="Collecte AMANA" status="Online" icon={Building2} color="text-green-500" />
            </div>
            <div className="mt-6 p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-green-500" />
              <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">Tous les nœuds sont opérationnels</p>
            </div>
          </div>

          {/* Distribution Graph Simulation */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-bg-dark/40 shadow-2xl">
             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
               <PieChart size={14} className="text-brand" /> Mix des Collections (Today)
             </h4>
             <div className="space-y-6">
               {[
                 { name: 'Portefeuilles Mobiles', volume: todayVolume * 0.65, pct: '65%', color: 'bg-brand' },
                 { name: 'Encaissements CASH', volume: todayVolume * 0.25, pct: '25%', color: 'bg-blue-600' },
                 { name: 'Ventes Agence', volume: todayVolume * 0.10, pct: '10%', color: 'bg-green-600' }
               ].map(canal => (
                 <div key={canal.name} className="space-y-2">
                   <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-white uppercase tracking-tight">{canal.name}</span>
                     <span className="text-[10px] font-black text-gray-500">{canal.pct}</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: canal.pct }} transition={{ duration: 1.5 }} className={cn("h-full", canal.color)}></motion.div>
                   </div>
                   <p className="text-[9px] text-gray-600 font-bold">{canal.volume.toLocaleString()} F réconciliés</p>
                 </div>
               ))}
             </div>
          </div>

          {/* Assistance Button */}
          <button className="w-full group glass-panel p-6 rounded-3xl border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500 transition-all text-left">
            <h4 className="text-[10px] font-black text-orange-500 group-hover:text-white uppercase tracking-widest mb-1 flex items-center justify-between">
              Assistance Dealer 
              <ExternalLink size={14} />
            </h4>
            <p className="text-[8px] text-gray-500 group-hover:text-white/80 font-bold uppercase tracking-widest">Support Vending 24/7 au Niger</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Component placeholders for missing icons
const Banknote = ({ size, className }: any) => <DollarSign size={size} className={className} />;
const Building2 = ({ size, className }: any) => <Smartphone size={size} className={className} />;
