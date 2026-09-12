import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bolt, RefreshCw, Printer, Sun } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Meter, User, Invoice } from '../types';
import { useAmi } from '../context/AmiContext';
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
}: CustomerDashboardSectionProps) => {
  const { tokens = [] } = useAmi();

  const userMeters = useMemo(() => 
    meters.filter(m => m.customerId === currentUser.associatedCustomerId),
    [meters, currentUser]
  );
  const userMeterIds = useMemo(() => userMeters.map(m => m.id), [userMeters]);
  const userTokens = useMemo(() => 
    tokens.filter(t => userMeterIds.includes(t.meterId)),
    [tokens, userMeterIds]
  );

  const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = DAYS[d.getDay()];
      const datePrefix = d.toISOString().slice(0, 10);
      const dayKwh = userTokens
        .filter(t => t.timestamp && new Date(t.timestamp).toISOString().slice(0, 10) === datePrefix)
        .reduce((sum, t) => sum + (t.kwh || 0), 0);
      return {
        day: dayLabel,
        val: Math.round(dayKwh * 10) / 10
      };
    });
  }, [userTokens]);

  return (
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

    {/* Section Solaire Photovoltaïque & Net-Metering DERMS Client */}
    {(() => {
      const userMeters = meters.filter(m => m.customerId === currentUser.associatedCustomerId);
      const solarKwh = userMeters.reduce((acc, m) => acc + (m.solarExportKwh || m.solarInjection || 0), 0);
      const solarCredit = Math.round(solarKwh * 59.35);
      const co2Saved = (solarKwh * 0.72).toFixed(1);

      if (solarKwh <= 0) {
        return (
          <div className="glass-panel p-4 rounded-3xl border border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-2 font-bold text-gray-300">
              <Sun size={18} className="text-gray-500" /> Mon Compteur NIGELEC : Tarif Standard (Sans Injection Solaire)
            </span>
            <span className="font-mono text-gray-400">Net-Metering: 0.00 kWh</span>
          </div>
        );
      }

      return (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sun size={24} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Net-Metering Solaire & Injection Réseau</h4>
                <p className="text-xs text-amber-400 font-bold">Compteur Bidirectionnel Détecté (Producteur Réseau NIGELEC)</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold uppercase rounded-xl border border-amber-500/30">
              DERMS Connecté
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-300 font-bold uppercase">Énergie Photovoltaïque Injectée</span>
              <p className="text-xl font-mono font-bold text-amber-400 mt-1">{solarKwh.toFixed(2)} kWh</p>
              <span className="text-[10px] text-emerald-400 font-bold">↑ Réinjecté au réseau NIGELEC</span>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-300 font-bold uppercase">Crédit Financier Généré</span>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-1">+{solarCredit.toLocaleString('fr-FR')} FCFA</p>
              <span className="text-[10px] text-gray-400">Déduit sur la prochaine facturation</span>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-300 font-bold uppercase">Bilan Carbone Évité</span>
              <p className="text-xl font-mono font-bold text-cyan-400 mt-1">-{co2Saved} kg CO₂</p>
              <span className="text-[10px] text-cyan-300 font-medium">Énergie Propre NIGELEC</span>
            </div>
          </div>
        </div>
      );
    })()}

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
          <h4 className="font-bold text-lg mb-8">Ma Consommation Journalière (kWh)</h4>
          <div className="h-[250px] w-full relative overflow-hidden" style={{ minHeight: '250px', minWidth: '0' }}>
             <ResponsiveContainer width="100%" height={250} minWidth={0} debounce={50}>
                <AreaChart data={chartData}>
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
};
