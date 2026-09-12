import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Printer, Copy, Calendar, Download, TrendingUp, Zap, Coins, Info, ArrowUpRight } from 'lucide-react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Token } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TOKEN_TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  'recharge': { label: 'Recharge Crédit', bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' },
  'clear-credit': { label: 'Compensation Crédit', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
  'key-change': { label: 'Changement Clé', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
  'clear-tamper': { label: 'Effacer Alarme', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
  'payment-mode': { label: 'Mode Paiement', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' }
};

interface TokensSectionProps {
  tokens: Token[];
  handlePrintReceipt: (token: Token) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const parseDateSafe = (ts: any): Date => {
  if (!ts) return new Date();
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch {
    return new Date();
  }
};

export const TokensSection = ({ tokens, handlePrintReceipt, addToast }: TokensSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  // ─── Filtrage ──────────────────────────────────────────────────
  const filteredTokens = useMemo(() => {
    return tokens.filter(t => {
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.meterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.token.includes(searchTerm);
      
      const matchesDate = !dateFilter || format(parseDateSafe(t.timestamp), 'yyyy-MM-dd') === dateFilter;
      
      return matchesSearch && matchesDate;
    });
  }, [tokens, searchTerm, dateFilter]);

  // ─── KPIs du jour (sur les tokens filtrés ou tous ?) ────────────
  const todayTokens = tokens.filter(t => isSameDay(parseDateSafe(t.timestamp), new Date()));
  const totalSalesToday = todayTokens.reduce((s, t) => s + t.amount, 0);
  const totalKwhToday   = todayTokens.reduce((s, t) => s + t.kwh, 0);

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val.replace(/-/g, ''));
    addToast('Token STS copié dans le presse-papier !', 'info');
  };

  const exportToCSV = () => {
    if (!tokens.length) {
      addToast('Aucune transaction à exporter', 'info');
      return;
    }
    const headers = ['ID_Transaction', 'Horodatage', 'Compteur', 'Client', 'Type', 'Montant_FCFA', 'Energie_kWh', 'Token_STS_20_Digits', 'Statut'];
    const rows = filteredTokens.map(t => [
      t.id,
      format(parseDateSafe(t.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      t.meterId,
      t.customerId || '',
      t.type || 'recharge',
      t.amount,
      t.kwh,
      `"${t.token}"`,
      t.status || 'Actif'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_ventes_sts_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Journal des ventes STS exporté avec succès en CSV', 'success');
  };

  const handlePrintGlobalReport = () => {
    window.print();
  };

  const totalSalesAll = useMemo(() => tokens.reduce((s, t) => s + t.amount, 0), [tokens]);
  const totalKwhAll   = useMemo(() => tokens.reduce((s, t) => s + t.kwh, 0), [tokens]);

  return (
    <motion.div 
      key="tokens" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-12"
    >
      {/* ── En-tête & KPIs ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Historique des Ventes</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Journal fiduciaire et énergétique STS · Conformité Réglementaire NIGELEC
          </p>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4 bg-brand/5">
            <div className="p-2 bg-brand/10 rounded-lg text-brand"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Encaissé</p>
              <p className="text-xl font-black text-white">{totalSalesAll.toLocaleString()} <span className="text-[10px] text-gray-500 font-bold">FCFA</span></p>
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4 bg-green-500/5">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Zap size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Énergie Délivrée</p>
              <p className="text-xl font-black text-white">{totalKwhAll.toFixed(1)} <span className="text-[10px] text-gray-500 font-bold uppercase">kWh</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de Filtres & Actions ────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-3xl border-white/5 shadow-xl">
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher par Token, Compteur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 h-12 w-full md:w-72 font-bold text-sm bg-[#14151a] border-white/10 text-white rounded-2xl" 
            />
          </div>
          <div className="relative">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field h-12 px-4 font-bold text-xs bg-[#14151a] border-white/10 text-gray-300 rounded-2xl" 
            />
          </div>
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="px-3 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/10"
            >
              Effacer Date
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 text-xs font-black text-gray-300 hover:text-white uppercase tracking-widest cursor-pointer shadow-lg"
          >
            <Download size={16} className="text-brand" /> Export CSV
          </button>
          <button 
            onClick={handlePrintGlobalReport}
            className="flex items-center gap-2 px-5 py-3 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-2xl transition-all border border-brand/30 text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg"
          >
            <Printer size={16} /> Imprimer Journal
          </button>
        </div>
      </div>

      {/* ── Liste des Transactions ────────────────────────────── */}
      <div className="glass-panel overflow-hidden rounded-[2rem] border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
            <thead>
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <th className="px-4 py-4">Horodatage / ID</th>
                <th className="px-4 py-4">ID Compteur</th>
                <th className="px-4 py-4">Type de Jeton</th>
                <th className="px-4 py-4 text-center">Token STS (20 Digits)</th>
                <th className="px-4 py-4">Détail Fiscal</th>
                <th className="px-4 py-4">Énergie / Total</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="">
              {filteredTokens.length > 0 ? filteredTokens.map(token => (
                <tr key={token.id} className="group transition-all">
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors whitespace-nowrap">
                    <p className="text-sm font-black text-white group-hover:text-brand transition-colors">
                      {format(new Date(token.timestamp), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      {format(new Date(token.timestamp), 'HH:mm:ss')} · <span className="text-gray-600">ID {token.id}</span>
                    </p>
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-xl">
                      <Zap size={12} className="text-brand" />
                      <span className="font-mono text-xs font-black text-brand tracking-wider">{token.meterId}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    {(() => {
                      const style = TOKEN_TYPE_STYLES[token.type] || { label: token.type || 'Recharge Crédit', bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' };
                      return (
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border", style.bg, style.text)}>
                          {style.label}
                        </span>
                      );
                    })()}
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex justify-center">
                      <div 
                        onClick={() => copyToClipboard(token.token)}
                        className="cursor-pointer font-mono text-[16px] font-black text-white tracking-[0.2em] bg-white/5 hover:bg-brand/10 hover:border-brand/30 transition-all px-5 py-2.5 rounded-xl border border-white/5 flex items-center gap-3 group/token"
                      >
                        {token.token}
                        <Copy size={14} className="text-gray-600 group-hover/token:text-brand transition-colors" />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    {token.type === 'recharge' || !token.type ? (
                      <div className="flex flex-col gap-1 min-w-[140px]">
                         <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-gray-500 uppercase">TVA:</span>
                          <span className="text-[10px] font-bold text-red-400/80">{Math.round(token.tva || 0).toLocaleString()} <span className="text-[7px] text-gray-600 uppercase">FCFA</span></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-gray-500 uppercase">Redevance:</span>
                          <span className="text-[10px] font-bold text-blue-400/80">{Math.round((token.taxeORNT || 0) + (token.taxeMunicipale || 0)).toLocaleString()} <span className="text-[7px] text-gray-600 uppercase">FCFA</span></span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">-</span>
                    )}
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    {token.type === 'recharge' || !token.type ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                          <Coins size={18} />
                        </div>
                        <div>
                          <p className="text-lg font-black text-white leading-none mb-1">{token.amount.toLocaleString()} <span className="text-[9px] text-gray-500">FCFA</span></p>
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{token.kwh.toFixed(1)} kWh Net</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                          <Info size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white leading-none mb-1">Technique</p>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Gratuit</p>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl text-right group-hover:bg-white/[0.05] transition-colors">
                    <button 
                      onClick={() => handlePrintReceipt(token)}
                      className="p-3 bg-white/5 border border-white/10 text-gray-500 hover:text-white rounded-2xl hover:bg-brand hover:border-brand transition-all group/btn shadow-lg"
                    >
                      <Printer size={16} className="group-hover/btn:scale-110 transition-transform"/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Coins size={64} />
                      <p className="text-sm font-black uppercase tracking-widest">Aucune transaction trouvée</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      {filteredTokens.length > 0 && (
        <div className="flex justify-between items-center px-8 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <p>Affichage de {filteredTokens.length} transaction(s) sur {tokens.length}</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white/5 rounded-lg hover:text-white">Précédent</button>
            <button className="px-3 py-1 bg-white/5 rounded-lg hover:text-white">Suivant</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
