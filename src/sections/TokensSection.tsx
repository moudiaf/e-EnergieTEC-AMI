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

interface TokensSectionProps {
  tokens: Token[];
  handlePrintReceipt: (token: Token) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

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
      
      const matchesDate = !dateFilter || format(new Date(t.timestamp), 'yyyy-MM-dd') === dateFilter;
      
      return matchesSearch && matchesDate;
    });
  }, [tokens, searchTerm, dateFilter]);

  // ─── KPIs du jour (sur les tokens filtrés ou tous ?) ────────────
  const todayTokens = tokens.filter(t => isSameDay(new Date(t.timestamp), new Date()));
  const totalSalesToday = todayTokens.reduce((s, t) => s + t.amount, 0);
  const totalKwhToday   = todayTokens.reduce((s, t) => s + t.kwh, 0);

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val.replace(/-/g, ''));
    addToast('Token STS copié dans le presse-papier !', 'info');
  };

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
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Journal fiduciaire et énergétique · Conformité Institutionnelle
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4 bg-brand/5">
            <div className="p-2 bg-brand/10 rounded-lg text-brand"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Ventes Jour</p>
              <p className="text-xl font-black text-white">{totalSalesToday.toLocaleString()} <span className="text-[10px] text-gray-500 font-bold">FCFA</span></p>
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4 bg-green-500/5">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Zap size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Énergie Jour</p>
              <p className="text-xl font-black text-white">{totalKwhToday.toFixed(1)} <span className="text-[10px] text-gray-500 font-bold uppercase">kWh</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre de Filtres ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-3xl border-white/5 shadow-xl">
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher par Token, Compteur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 h-12 w-full md:w-72 font-bold text-sm" 
            />
          </div>
          <div className="relative">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field h-12 px-4 font-bold text-xs bg-white/5 border-white/5 text-gray-400" 
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-brand/10 hover:bg-brand rounded-2xl transition-all border border-brand/20 text-xs font-black text-brand hover:text-white uppercase tracking-widest">
            <Printer size={16} /> Rapport Global
          </button>
        </div>
      </div>

      {/* ── Liste des Transactions ────────────────────────────── */}
      <div className="glass-panel overflow-hidden rounded-[2rem] border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Horodatage</th>
                <th className="px-8 py-6">ID Compteur</th>
                <th className="px-8 py-6 text-center">Token STS (20 Digits)</th>
                <th className="px-8 py-6">Détail Fiscal</th>
                <th className="px-8 py-6">Énergie / Total</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTokens.length > 0 ? filteredTokens.map(token => (
                <tr key={token.id} className="hover:bg-brand/[0.02] transition-colors group">
                  {/* Date */}
                  <td className="px-8 py-6 whitespace-nowrap">
                    <p className="text-sm font-black text-white group-hover:text-brand transition-colors">
                      {format(new Date(token.timestamp), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      {format(new Date(token.timestamp), 'HH:mm:ss')} · {token.id}
                    </p>
                  </td>

                  {/* Compteur */}
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/5 border border-brand/20 rounded-xl">
                      <Zap size={12} className="text-brand" />
                      <span className="font-mono text-xs font-black text-brand tracking-wider">{token.meterId}</span>
                    </div>
                  </td>

                  {/* Token */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        onClick={() => copyToClipboard(token.token)}
                        className="cursor-pointer font-mono text-lg font-black text-white tracking-[0.3em] bg-white/5 hover:bg-brand/10 hover:border-brand/30 transition-all px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3 group/token"
                      >
                        {token.token}
                        <Copy size={16} className="text-gray-600 group-hover/token:text-brand transition-colors" />
                      </div>
                    </div>
                  </td>

                  {/* Détail Fiscal */}
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <div className="flex justify-between w-full min-w-[120px]">
                        <span className="text-[9px] font-black text-gray-500 uppercase">TVA:</span>
                        <span className="text-[10px] font-bold text-red-400">{Math.round(token.tva || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between w-full">
                        <span className="text-[9px] font-black text-gray-500 uppercase">ORTN:</span>
                        <span className="text-[10px] font-bold text-blue-400">{Math.round(token.taxeORNT || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between w-full">
                        <span className="text-[9px] font-black text-gray-500 uppercase">Municipale:</span>
                        <span className="text-[10px] font-bold text-yellow-400">{Math.round(token.taxeMunicipale || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </td>

                  {/* Montant / Énergie */}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <Coins size={20} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-white leading-none mb-1">{token.amount.toLocaleString()} <span className="text-[10px] text-gray-500">FCFA</span></p>
                        <p className="text-xs font-black text-green-500 uppercase tracking-widest">{token.kwh.toFixed(1)} kWh Net</p>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handlePrintReceipt(token)}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-brand hover:text-white text-gray-400 rounded-2xl transition-all border border-white/5 hover:border-brand shadow-lg hover:shadow-brand/20 group/print"
                    >
                      <Printer size={16} className="group-hover/print:scale-110 transition-transform"/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Récupérer Reçu</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
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
