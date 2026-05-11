import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle2, Receipt, Printer, 
  RefreshCw, FileText, Search, Filter, ArrowUpRight, 
  Clock, Download, ChevronRight, Ban, Zap, Info
} from 'lucide-react';
import { Invoice, Customer, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
  glow?: string;
}

const StatCard = ({ title, value, unit, icon: Icon, color, trend, glow }: StatCardProps) => (
  <div className="glass-panel p-6 rounded-[2rem] border border-white/5 flex items-center gap-6 relative overflow-hidden group hover:translate-y-[-4px] transition-all">
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-all", glow)}></div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg", color)}>
      <Icon size={28} />
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-black text-white tracking-tighter">
        {value} {unit && <span className="text-[10px] font-bold text-gray-500 uppercase">{unit}</span>}
      </h4>
      {trend && (
        <div className="flex items-center gap-1 text-[9px] font-black text-green-400 mt-1">
          <ArrowUpRight size={10} /> {trend} ce mois
        </div>
      )}
    </div>
  </div>
);

interface BillingSectionProps {
  invoices: Invoice[];
  customers: Customer[];
  currentUser: User | null;
  isBillingLoading: boolean;
  handleRunBilling: () => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  handleGenerateInvoicePDF: (invoice: Invoice) => void;
  handleMassPayment: () => void;
}

export const BillingSection = ({
  invoices,
  customers,
  currentUser,
  isBillingLoading,
  handleRunBilling,
  setSelectedInvoice,
  setIsPaymentModalOpen,
  handleGenerateInvoicePDF,
  handleMassPayment
}: BillingSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');

  // ─── Calculs ──────────────────────────────────────────────────
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((acc, i) => acc + i.totalTTC, 0);
  const totalRecovered   = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.totalTTC, 0);
  const totalEnergy      = invoices.reduce((acc, i) => acc + i.kwhConsumed, 0);
  const recoveryRate     = (totalRecovered / (totalRecovered + totalOutstanding || 1)) * 100;

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const customer = customers.find(c => c.id === inv.customerId);
      const matchesSearch = 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.meterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'paid' && inv.status === 'paid') ||
        (statusFilter === 'unpaid' && inv.status === 'unpaid') ||
        (statusFilter === 'overdue' && inv.status === 'overdue');
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, customers, searchTerm, statusFilter]);

  return (
    <motion.div 
      key="billing" 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-12"
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Facturation & <span className="text-brand">Recouvrement</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Souveraineté Énergétique · Digitalisation Nigelec</p>
        </div>
        
        {currentUser?.role === 'admin' && (
          <div className="flex gap-4">
            <button
              onClick={handleMassPayment}
              className="px-6 py-4 rounded-2xl flex items-center gap-3 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest group"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
              Réconciliation Masse
            </button>
            <button
              onClick={handleRunBilling}
              disabled={isBillingLoading}
              className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand/30 disabled:opacity-50"
            >
              {isBillingLoading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
              Lancer Cycle Mensuel
            </button>
          </div>
        )}
      </div>

      {/* ── KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Solde à Recouvrer" value={totalOutstanding.toLocaleString()} unit="FCFA" icon={AlertTriangle} color="bg-red-500" glow="bg-red-500" />
        <StatCard title="Total Recouvré" value={totalRecovered.toLocaleString()} unit="FCFA" icon={CheckCircle2} color="bg-green-500" glow="bg-green-500" trend="+14%" />
        <StatCard title="Énergie Facturée" value={totalEnergy.toFixed(1)} unit="kWh" icon={Zap} color="bg-brand" glow="bg-brand" />
        <StatCard title="Taux de Recouvrement" value={recoveryRate.toFixed(1)} unit="%" icon={TrendingUp} color="bg-blue-500" glow="bg-blue-500" />
      </div>

      {/* ── Liste & Filtres ───────────────────────────────────── */}
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-bg-dark/40">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="flex bg-white/5 rounded-2xl p-1 shadow-inner">
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'unpaid', label: 'Impayées' },
              { id: 'paid', label: 'Payées' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === f.id ? "bg-brand text-white shadow-lg" : "text-gray-500 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Client, Compteur, N°..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white outline-none w-64 focus:border-brand" 
              />
            </div>
            <button className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-5">Référence Facture</th>
                <th className="px-8 py-5">Abonné / Compteur</th>
                <th className="px-8 py-5">Période</th>
                <th className="px-8 py-5">Détail VEE</th>
                <th className="px-8 py-5">Total TTC</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-gray-600 font-black uppercase text-xs opacity-30 italic">Aucune facture enregistrée pour ces critères</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const customer = customers.find(c => c.id === inv.customerId);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Receipt size={18} className="text-brand opacity-40 group-hover:opacity-100 transition-opacity" />
                          <div>
                            <p className="font-mono text-xs font-black text-white">{inv.id}</p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase mt-1">Généré le {inv.month}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-white group-hover:text-brand transition-colors truncate max-w-[200px]">{customer?.name}</p>
                        <p className="font-mono text-[10px] text-gray-500 tracking-tighter mt-1">{inv.meterId}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase bg-white/5 px-2.5 py-1 rounded-lg">
                          Consommation {inv.month}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white flex items-center gap-1.5 line-through decoration-brand/30">
                            {inv.kwhConsumed.toFixed(1)} <span className="text-[10px] text-gray-500 font-bold">kWh</span>
                          </span>
                          <span className="text-[9px] text-brand font-black uppercase">Taux: {inv.rate} FCFA/kWh</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-white leading-none mb-1">{inv.totalTTC.toLocaleString()} FCFA</span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase">TVA Incluse: {Math.round(inv.tva || 0)} FCFA</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit",
                          inv.status === 'paid' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {inv.status === 'paid' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {inv.status === 'paid' ? 'Payée' : 'Impayée'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                              className="px-5 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-lg shadow-brand/20"
                            >
                              Payer
                            </button>
                          )}
                          <button 
                            onClick={() => handleGenerateInvoicePDF(inv)}
                            className="p-2.5 bg-white/5 text-gray-500 hover:text-white rounded-xl border border-white/10 hover:border-brand/30 transition-all group/btn"
                            title="Télécharger Facture PDF"
                          >
                            <Printer size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {filteredInvoices.length > 0 && (
          <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
            Vue consolidée du recouvrement institutionnel
          </div>
        )}
      </div>

      {/* ── Assistance ────────────────────────────────────────── */}
      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex items-center gap-6">
        <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 font-black"><Info size={24} /></div>
        <div className="flex-1">
          <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">Rappel Réglementaire ARSE</h5>
          <p className="text-[10px] text-gray-500 leading-relaxed italic">
            Conformément à la grille tarifaire 2024, toutes les factures postpaid incluent les redevances institutionnelles (ORTN, Municipale) et la taxe habitat prélevée en première ligne.
          </p>
        </div>
      </div>

    </motion.div>
  );
};

// Placeholder for trending up if missing in some versions
const TrendingUp = ({ size, className }: any) => <ArrowUpRight size={size} className={className} />;
const Building2 = ({ size, className }: any) => <FileText size={size} className={className} />;
const Banknote = ({ size, className }: any) => <Receipt size={size} className={className} />;
