import React from 'react';
import { motion } from 'framer-motion';
import { Bolt, RefreshCw, Printer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Meter, User, Invoice } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomerDashboardSectionProps {
  currentUser: User;
  meters: Meter[];
  invoices: Invoice[];
  fetchData: () => void;
  setCurrentSection: (section: any) => void;
  setSelectedInvoice: (invoice: Invoice) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  handleGenerateInvoicePDF: (invoice: Invoice) => void;
}

export const CustomerDashboardSection = ({
  currentUser,
  meters,
  invoices,
  fetchData,
  setCurrentSection,
  setSelectedInvoice,
  setIsPaymentModalOpen,
  handleGenerateInvoicePDF
}: CustomerDashboardSectionProps) => (
  <motion.div key="customer-dash" className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Espace Client Personnel</h3>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">N° Client: {currentUser.associatedCustomerId}</p>
      </div>
      <button onClick={fetchData} className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-400 hover:text-brand transition-colors"><RefreshCw size={20}/></button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {meters.filter(m => m.customerId === currentUser.associatedCustomerId).map(m => (
        <div key={m.id} className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
           <div className="flex justify-between items-start mb-6 relative z-10">
             <div className="p-3 rounded-2xl bg-brand/10 text-brand"><Bolt size={24}/></div>
             <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase", m.status === 'online' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{m.status}</span>
           </div>
           <p className="text-xs font-bold text-gray-500 uppercase mb-1">Compteur {m.paymentMode}</p>
           <h4 className="text-xl font-black text-white mb-6 font-mono">{m.id}</h4>
           
           <div className="space-y-3 mb-6">
             <div className="flex justify-between items-center text-xs">
               <span className="text-gray-500 font-bold uppercase">Solde Crédit</span>
               <span className="font-black text-brand">{m.credit.toFixed(2)} kWh</span>
             </div>
             <div className="flex justify-between items-center text-xs">
               <span className="text-gray-500 font-bold uppercase">Consom. Actuelle</span>
               <span className="font-black text-white">{m.power} W</span>
             </div>
           </div>
           
           <button onClick={() => setCurrentSection('sts-prepaid')} className="w-full py-3 bg-white/5 hover:bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-brand shadow-lg hover:shadow-brand/20">Recharger Maintenant</button>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div className="glass-panel p-8 rounded-3xl border border-white/5">
          <h4 className="font-bold text-lg mb-8">Mes Dernières Factures</h4>
          <div className="space-y-4">
            {invoices.filter(i => i.customerId === currentUser.associatedCustomerId).slice(0, 3).map(inv => (
              <div key={inv.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                 <div>
                   <p className="font-bold text-white uppercase text-xs">{inv.month}</p>
                   <p className="text-[10px] text-gray-500 font-mono">{inv.id}</p>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <p className="font-black text-white text-sm">{inv.totalTTC.toLocaleString()} FCFA</p>
                     <button 
                       onClick={() => { if(inv.status !== 'paid') { setSelectedInvoice(inv); setIsPaymentModalOpen(true); } }}
                       className={cn("text-[10px] font-black uppercase mt-1", inv.status === 'paid' ? "text-green-500" : "text-brand")}
                     >
                       {inv.status === 'paid' ? 'Payée' : 'Payer'}
                     </button>
                   </div>
                   <button onClick={() => handleGenerateInvoicePDF(inv)} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"><Printer size={14}/></button>
                 </div>
              </div>
            ))}
            {invoices.filter(i => i.customerId === currentUser.associatedCustomerId).length === 0 && (
              <p className="text-center py-6 text-gray-500 text-xs font-bold uppercase">Aucune facture en attente</p>
            )}
          </div>
       </div>

       <div className="glass-panel p-8 rounded-3xl border border-white/5">
          <h4 className="font-bold text-lg mb-8">Ma Consommation (Simulée)</h4>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={[
                    { day: 'Lun', val: 5.2 }, { day: 'Mar', val: 4.8 }, { day: 'Mer', val: 7.5 },
                    { day: 'Jeu', val: 6.2 }, { day: 'Ven', val: 8.5 }, { day: 'Sam', val: 12.0 },
                    { day: 'Dim', val: 10.5 }
                ]}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} />
                  <Area type="monotone" dataKey="val" stroke="#FF6B35" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>
    </div>
  </motion.div>
);
