import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Shift } from '../../types';
import { Wallet, Clock, CheckCircle2, AlertCircle, TrendingUp, DollarSign, X, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  onOpenShift: (initialCash: number) => void;
  onCloseShift: (finalCash: number) => void;
}

export const ShiftModal = ({ isOpen, onClose, shift, onOpenShift, onCloseShift }: ShiftModalProps) => {
  const [cashInput, setCashInput] = useState<string>('');
  
  const handleAction = () => {
    const amount = parseFloat(cashInput);
    if (isNaN(amount)) return;
    
    if (shift?.status === 'open') {
      onCloseShift(amount);
    } else {
      onOpenShift(amount);
    }
    setCashInput('');
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={shift?.status === 'open' ? "Clôture de Caisse Journalière" : "Ouverture de Caisse"}>
      <div className="space-y-6">
        {shift?.status === 'open' ? (
          <>
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-brand/10 rounded-xl text-brand">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">Session Ouverte</p>
                <p className="text-white font-bold text-sm">Depuis {format(new Date(shift.startTime), 'HH:mm', { locale: fr })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cash Initial</p>
                <p className="text-white font-black">{shift.initialCash.toLocaleString()} FCFA</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Digital (MoMo)</p>
                <p className="text-white font-black">{shift.totalDigital.toLocaleString()} FCFA</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Comptage de Caisse Physique (FCFA)</label>
              <input 
                type="number" 
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Entrez le montant réel en caisse..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-brand transition-all"
              />
              <p className="text-[10px] text-gray-600 font-medium italic">Le système comparera ce montant avec les ventes enregistrées pour détecter d'éventuels écarts.</p>
            </div>

            <button 
              onClick={handleAction}
              disabled={!cashInput}
              className="w-full btn-primary py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Valider la Clôture
            </button>
          </>
        ) : shift?.status === 'closed' ? (
           <div className="space-y-6">
             <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Caisse Clôturée</h4>
                <p className="text-gray-400 text-sm font-bold mt-2">Rapport de session généré et archivé.</p>
             </div>

             <div className="space-y-3 bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Attendu Physique</span>
                  <span className="text-white font-black">{shift.expectedCash.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Réel Déclaré</span>
                  <span className="text-white font-black">{shift.finalCash?.toLocaleString()} FCFA</span>
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-sm font-black">
                  <span className="text-gray-400 uppercase tracking-[0.2em] text-[10px]">Écart de Caisse</span>
                  <span className={cn(shift.finalCash! - shift.expectedCash === 0 ? "text-green-500" : "text-red-500")}>
                    {(shift.finalCash! - shift.expectedCash).toLocaleString()} FCFA
                  </span>
                </div>
             </div>

             <button 
              onClick={() => {
                onClose();
                // We'll let the user open a new shift via a separate flow or reset this
              }}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm hover:bg-white/10 transition-all"
             >
               Fermer ce Rapport
             </button>
             
             <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest">
               ID SESSION: {shift.id}
             </p>
           </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm font-medium">Ouvrez une nouvelle session pour commencer à enregistrer des encaissements en agence.</p>
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Fond de Caisse de Départ (FCFA)</label>
              <input 
                type="number" 
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Montant initial en caisse..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-brand transition-all"
              />
            </div>
            <button 
              onClick={handleAction}
              disabled={!cashInput}
              className="w-full btn-primary py-4 rounded-2xl font-black text-sm shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Zap size={18} className="fill-current" /> Démarrer la Session
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
