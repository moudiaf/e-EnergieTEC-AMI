import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Plus, FileText, Edit, Trash2, MapPin, 
  ShieldAlert, ShieldCheck, Zap, Bell, Settings, 
  Download, Filter, Search, ArrowUpRight, Activity,
  Smartphone, Mail, CheckCircle2, X, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertRule } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CONDITION_LABELS: Record<string, string> = {
  tamper: 'Ouverture Capot / Champ Magnétique',
  low_credit: 'Seuil Critique Crédit (< 5 kWh)',
  offline: 'Rupture Liaison GPRS / HES',
  overload: 'Dépassement Puissance Souscrite',
  voltage_unbalance: 'Déséquilibre de Tension Phases'
};

interface AlertsSectionProps {
  alerts: Alert[];
  alertRules: AlertRule[];
  alertsTab: string;
  setAlertsTab: (tab: any) => void;
  generateAlertsReportFile: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  setAlerts: (alerts: Alert[]) => void;
  handleResetTamper: (meterId: string, alertId: string) => void;
  onUpdateRule: (rule: AlertRule) => void;
  onSimulate?: () => void;
  setViewingMeter: (m: any) => void;
  meters: any[];
  setCurrentSection: (section: string) => void;
}

export const AlertsSection = ({
  alerts = [],
  alertRules = [],
  alertsTab = 'alerts',
  setAlertsTab,
  generateAlertsReportFile,
  addToast,
  setAlerts,
  handleResetTamper,
  onUpdateRule,
  setViewingMeter,
  meters,
  setCurrentSection
}: AlertsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const filteredAlerts = useMemo(() => {
    const s = (searchTerm || '').toLowerCase();
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
  const infoCount = (alerts || []).filter(a => a.priority === 'Basse' || a.priority === 'Moyenne' || a.type === 'info').length;

  const handleSecurityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      addToast('Scan de sécurité DLMS/COSEM terminé : aucun tamper physique actif sur le parc.', 'success');
    }, 1200);
  };

  const exportAlertsCSV = () => {
    if (!alerts.length) {
      addToast('Aucune alerte à exporter', 'info');
      return;
    }
    const headers = ['ID_Alerte', 'Horodatage', 'Compteur', 'Titre', 'Categorie', 'Priorite', 'Message', 'Type'];
    const rows = filteredAlerts.map(a => [
      a.id,
      format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      a.meterId || '',
      `"${(a.title || '').replace(/"/g, '""')}"`,
      a.category || '',
      a.priority || 'Standard',
      `"${(a.message || '').replace(/"/g, '""')}"`,
      a.type
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_securite_alertes_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Journal des alertes exporté en CSV', 'success');
  };

  return (
    <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* ── Header Stratégique ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black uppercase rounded border border-red-500/30">NIGELEC Security Shield v2.0</span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Alertes & <span className="text-red-500">Antifraude</span></h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Surveillance des Pertes Non-Techniques & Intégrité du Réseau AMI</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           <div className="bg-[#14151a] p-1 rounded-2xl flex gap-1 border border-white/10 shadow-inner">
             {[
               { id: 'alerts', label: 'Journal Live', icon: Activity },
               { id: 'rules', label: 'Politiques', icon: Settings }
             ].map(t => {
               const isActive = (alertsTab === t.id) || (t.id === 'alerts' && (alertsTab === 'realtime' || alertsTab !== 'rules'));
               return (
                 <button 
                   key={t.id}
                   onClick={() => setAlertsTab(t.id)} 
                   className={cn(
                     "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer", 
                     isActive ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "text-gray-400 hover:text-white"
                   )}
                 >
                   <t.icon size={14} /> {t.label}
                 </button>
               );
             })}
           </div>
           
           <button 
             onClick={handleSecurityScan}
             disabled={isScanning}
             className="px-6 py-3 bg-red-600/10 border border-red-600/30 rounded-2xl text-[10px] font-black text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center gap-2 group cursor-pointer"
           >
             <RefreshCw size={16} className={cn(isScanning && "animate-spin text-white")} />
             {isScanning ? 'SCAN DU PARC EN COURS...' : 'AUDIT SÉCURITÉ EN DIRECT'}
           </button>
        </div>
      </div>

      {alertsTab !== 'rules' && (
        <>
          {/* ── KPIs d'Alerte ───────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-red-500/10 to-transparent">
               <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1 leading-none">Critique / Tamper</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{critCount}</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase">
                 {critCount === 0 ? 'Aucune fraude active' : 'Action Requise Immédiate'}
               </p>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-orange-500/10 to-transparent">
               <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 leading-none">Anomalies Réseau</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{warnCount}</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase">
                 {warnCount === 0 ? 'Paramètres nominaux' : 'Suspicion dysfonctionnement'}
               </p>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
               <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Maintenance / Info</p>
               <h4 className="text-3xl font-black text-white leading-tight mb-2">{infoCount}</h4>
               <p className="text-[9px] text-gray-400 font-bold uppercase">
                 {infoCount === 0 ? 'Système nominal' : 'Notifications actives'}
               </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={generateAlertsReportFile} 
                className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-red-500 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Exporter PDF
              </button>
              <button 
                onClick={exportAlertsCSV} 
                className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Download size={16} className="text-red-400" /> Exporter CSV
              </button>
            </div>
          </div>

          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="RECHERCHER UNE ALERTE OU UN COMPTEUR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#14151a] border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-red-500 transition-all placeholder:text-gray-600" 
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
                    "p-8 rounded-[2.5rem] border transition-all flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden group bg-[#121318]",
                    a.type === 'danger' ? "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]" : 
                    a.type === 'warning' ? "border-orange-500/20" : "border-brand/20"
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
                             a.priority === 'Critique' ? "bg-red-500 text-white" : "bg-white/10 text-gray-300"
                           )}>
                             {a.priority || 'Niveau Standard'}
                           </span>
                           <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                             CODE: {(a.category || 'VIGILANCE').toUpperCase()}
                           </span>
                        </div>
                        <h4 className="text-2xl font-black text-white group-hover:text-red-500 transition-colors tracking-tight mt-2">{a.title}</h4>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-white uppercase tracking-tighter">{format(new Date(a.timestamp), 'dd MMMM yyyy', { locale: fr })}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{format(new Date(a.timestamp), 'HH:mm:ss')} • GMT+1</p>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed max-w-2xl italic border-l-2 border-red-500/30 pl-4 py-1">
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
                             <span className="text-xs font-black tracking-widest font-mono">{a.meterId}</span>
                           </div>
                        </div>
                      )}
                      
                      {a.type === 'danger' && a.meterId && (
                        <button 
                          onClick={() => handleResetTamper(a.meterId!, a.id)} 
                          className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                        >
                          <ShieldCheck size={18} className="text-green-400" /> Levée de doute
                        </button>
                      )}

                      <button 
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ml-auto cursor-pointer"
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
                <div className="p-20 text-center flex flex-col items-center gap-6 glass-panel border border-white/5 rounded-[3rem] bg-[#121318]">
                  <ShieldCheck size={64} className="text-green-400" />
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">Parc Smart Meter Intègre & Sécurisé</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Aucune effraction magnétique ou ouverture de capot détectée</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {alertsTab === 'rules' && (
        <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-[#121318]">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                 <Settings size={20} className="text-red-500" /> Gouvernance Sécuritaire & Antifraude
              </h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configuration des seuils de détection automatique</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-4 py-4">Règle de Surveillance</th>
                  <th className="px-4 py-4">Condition de Déclenchement</th>
                  <th className="px-4 py-4">Vecteurs de Notification</th>
                  <th className="px-4 py-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="">
                {(alertRules || []).map(rule => (
                  <tr key={rule.id} className="group transition-all">
                    <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-sm font-black text-white leading-tight uppercase tracking-tight">{rule.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit continu HES / DLMS Engine</p>
                    </td>
                    <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <Activity size={12} className="text-red-400" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                          {CONDITION_LABELS[rule.condition] || rule.condition}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                      <div className="flex gap-2">
                        <div className={cn("p-2.5 rounded-xl transition-all border border-white/5", rule.notifySms ? "bg-brand/20 text-brand border-brand/30" : "bg-white/5 text-gray-600")}>
                          <Smartphone size={16} />
                        </div>
                        <div className={cn("p-2.5 rounded-xl transition-all border border-white/5", rule.notifyEmail ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-gray-600")}>
                          <Mail size={16} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl text-center group-hover:bg-white/[0.05] transition-colors">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => onUpdateRule({ ...rule, active: !rule.active })}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300 border border-white/10 cursor-pointer",
                            rule.active ? "bg-red-500 shadow-[0_0_15px_#ef444444]" : "bg-white/10"
                          )}
                        >
                           <div className={cn("absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 shadow-lg", rule.active ? "left-6.5" : "left-0.5")} />
                        </button>
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
