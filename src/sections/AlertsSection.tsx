import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Plus, FileText, Edit, Trash2, MapPin, 
  ShieldAlert, ShieldCheck, Zap, Bell, Settings, 
  Download, Filter, Search, ArrowUpRight, Activity,
  Smartphone, Mail, CheckCircle2, X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertRule } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AlertsSectionProps {
  alerts: Alert[];
  alertRules: AlertRule[];
  alertsTab: 'alerts' | 'rules';
  setAlertsTab: (tab: 'alerts' | 'rules') => void;
  generateAlertsReportFile: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setAlerts: (alerts: Alert[]) => void;
  handleResetTamper: (meterId: string, alertId: string) => void;
  onUpdateRule: (rule: AlertRule) => void;
  onSimulate: () => void;
  setViewingMeter: (m: any) => void;
  meters: any[];
  setCurrentSection: (section: string) => void;
}

export const AlertsSection = ({
  alerts = [],
  alertRules = [],
  alertsTab,
  setAlertsTab,
  generateAlertsReportFile,
  addToast,
  setAlerts,
  handleResetTamper,
  onUpdateRule,
  onSimulate,
  setViewingMeter,
  meters,
  setCurrentSection
}: AlertsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredAlerts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return (alerts || []).filter(a => {
      const title = (a.title || '').toLowerCase();
      const message = (a.message || '').toLowerCase();
      const meterId = (a.meterId || '').toLowerCase();
      const category = (a.category || '').toLowerCase();
      
      return title.includes(s) || 
             message.includes(s) ||
             meterId.includes(s) ||
             category.includes(s);
    });
  }, [alerts, searchTerm]);

  const critCount = (alerts || []).filter(a => a.priority === 'Critique' || a.type === 'danger').length;
  const warnCount = (alerts || []).filter(a => a.priority === 'Haute' || a.type === 'warning').length;
  const infoCount = (alerts || []).filter(a => a.priority === 'Normale' || a.type === 'info').length;

  return (
    <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* ── Header Stratégique ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/30">Nigelec Security Shield v2.0</span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Alertes & <span className="text-red-500">Antifraude</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 italic">Surveillance des Pertes Non-Techniques & Intégrité Réseau</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white/5 p-1 rounded-2xl flex gap-1 border border-white/5 shadow-inner">
             {[
               { id: 'alerts', label: 'Journal Live', icon: Activity },
               { id: 'rules', label: 'Politiques', icon: Settings }
             ].map(t => (
               <button 
                 key={t.id}
                 onClick={() => setAlertsTab(t.id as any)} 
                 className={cn(
                   "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2", 
                   alertsTab === t.id ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "text-gray-500 hover:text-white"
                 )}
               >
                 <t.icon size={14} /> {t.label}
               </button>
             ))}
           </div>
           
           <button 
             onClick={onSimulate}
             className="px-6 py-3 bg-red-600/10 border border-red-600/30 rounded-2xl text-[10px] font-black text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center gap-2 group"
           >
             <Zap size={16} className="group-hover:animate-pulse" /> SIMULATEUR FRAUDE
           </button>
        </div>
      </div>

      {alertsTab === 'alerts' && (
        <>
          {/* ── KPIs d'Alerte ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-red-500/10 to-transparent">
               <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 leading-none">Critique / Tamper</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{critCount}</h4>
               <p className="text-[9px] text-gray-500 font-bold uppercase italic">Action Requise Immédiate</p>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-orange-500/10 to-transparent">
               <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 leading-none">Anomalies Réseau</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{warnCount}</h4>
               <p className="text-[9px] text-gray-500 font-bold uppercase italic">Suspicion de Dysfonctionnement</p>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Maintenance / Info</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{infoCount}</h4>
               <p className="text-[9px] text-gray-500 font-bold uppercase italic">Rapports d'État Système</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={generateAlertsReportFile} 
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-red-500 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Exporter PDF
              </button>
            </div>
          </div>

          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une alerte ou un compteur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl pl-12 pr-6 py-4 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-red-500/40"
            />
          </div>

          {/* ── Journal des Alertes ────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length > 0 ? filteredAlerts.map((a, i) => (
                <motion.div 
                  key={a.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "p-8 rounded-[2.5rem] border transition-all flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden group",
                    a.type === 'danger' ? "bg-red-500/5 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.05)]" : 
                    a.type === 'warning' ? "bg-orange-500/5 border-orange-500/20" : "bg-brand/5 border-brand/20"
                  )}
                >
                  {/* Icon & Priority */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center relative",
                      a.type === 'danger' ? "bg-red-500/10 text-red-500" : a.type === 'warning' ? "bg-orange-500/10 text-orange-500" : "bg-brand/10 text-brand"
                    )}>
                      <AlertTriangle size={32} />
                      {a.type === 'danger' && <div className="absolute inset-0 rounded-3xl ring-4 ring-red-500/20 animate-ping"></div>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex gap-2">
                           <span className={cn(
                             "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-lg",
                             a.priority === 'Critique' ? "bg-red-500 text-white" : "bg-white/10 text-gray-400"
                           )}>
                             {a.priority || 'Niveau Standard'}
                           </span>
                           <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">
                             CODE: {(a.category || 'VIGILANCE').toUpperCase()}
                           </span>
                        </div>
                        <h4 className="text-2xl font-black text-white group-hover:text-red-500 transition-colors tracking-tight mt-2">{a.title}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-white uppercase tracking-tighter">{format(new Date(a.timestamp), 'dd MMMM yyyy', { locale: fr })}</p>
                         <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">{format(new Date(a.timestamp), 'HH:mm:ss')} • GMT+1</p>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed max-w-2xl italic border-l-2 border-white/5 pl-4 py-1">
                      "{a.message}"
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                      {a.meterId && (
                        <div 
                          className="flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer hover:bg-red-500 hover:text-white transition-all group/btn shadow-lg"
                          onClick={() => {
                             const m = (meters || []).find(met => met.id === a.meterId);
                             if (m) { setViewingMeter(m); setCurrentSection('map'); }
                          }}
                        >
                           <MapPin size={16} className="group-hover/btn:scale-110 transition-transform" />
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black opacity-60 uppercase">Cibler Compteur</span>
                             <span className="text-xs font-black tracking-widest">{a.meterId}</span>
                           </div>
                        </div>
                      )}
                      
                      {a.type === 'danger' && a.meterId && (
                        <button 
                          onClick={() => handleResetTamper(a.meterId!, a.id)} 
                          className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <ShieldCheck size={18} className="text-green-500" /> Levée de doute
                        </button>
                      )}

                      <button 
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ml-auto"
                        onClick={() => {
                          addToast('Alerte archivée avec succès', 'success');
                          setAlerts((alerts || []).filter(al => al.id !== a.id));
                        }}
                      >
                         Archiver l'alerte
                      </button>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-20 text-center flex flex-col items-center gap-6 glass-panel border border-white/5 rounded-[3rem] opacity-30">
                  <ShieldCheck size={64} className="text-green-500" />
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">Réseau Intègre</h4>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Aucune anomalie critique détectée actuellement</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {alertsTab === 'rules' && (
        <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-bg-dark/40">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                 <Settings size={20} className="text-red-500" /> Gouvernance Sécuritaire
              </h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configuration des seuils de détection automatique</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-2xl text-[10px] font-black uppercase transition-all">
              <Plus size={16} /> Créer une Stratégie
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-6">Règle de Surveillance</th>
                  <th className="px-8 py-6">Condition de Déclenchement</th>
                  <th className="px-8 py-6">Vecteurs de Notification</th>
                  <th className="px-8 py-6">Statut</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(alertRules || []).map(rule => (
                  <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-white leading-tight">{rule.name}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit continu MDMS</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <Activity size={12} className="text-red-500" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{rule.condition}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        <div className={cn("p-2 rounded-xl transition-all", rule.notifySms ? "bg-brand/20 text-brand" : "bg-white/5 text-gray-700")}>
                          <Smartphone size={16} />
                        </div>
                        <div className={cn("p-2 rounded-xl transition-all", rule.notifyEmail ? "bg-blue-500/20 text-blue-500" : "bg-white/5 text-gray-700")}>
                          <Mail size={16} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => onUpdateRule({ ...rule, active: !rule.active })}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all duration-300",
                          rule.active ? "bg-green-500 shadow-[0_0_15px_#22c55e44]" : "bg-white/10"
                        )}
                      >
                         <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300", rule.active ? "left-7" : "left-1")} />
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white border border-white/5 transition-all"><Edit size={16} /></button>
                        <button className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 border border-white/5 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};
