import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Key, Database, Globe, Bell, Smartphone, 
    RotateCcw, Save, FileCheck, Percent, Zap,
    Cpu, Radio, Signal, Lock, ShieldCheck, Settings2,
    Terminal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsSectionProps {
  settings: any;
  onSave: (settings: any) => Promise<void>;
}

export const SettingsSection = ({ settings, onSave }: SettingsSectionProps) => {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveInternal = async () => {
    setIsSaving(true);
    await onSave(localSettings);
    setIsSaving(false);
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8 pb-32 text-white"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30 tracking-widest shadow-[0_0_15px_rgba(255,107,53,0.2)]">Configuration Core</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest bg-niger-green/10 px-2 py-0.5 rounded border border-niger-green/20">
                <ShieldCheck size={10} /> Gouvernance Nationale Certifiée
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Paramètres <span className="text-brand">Système (VEE)</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 italic">Administration des protocoles STS, politiques fiscales et redondance réseau</p>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={handleSaveInternal}
                disabled={isSaving}
                className="group relative px-10 py-4 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden text-white border border-brand/20 disabled:opacity-50"
            >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isSaving ? <RotateCcw size={20} className="animate-spin relative z-10" /> : <Save size={20} className="relative z-10" />}
                <span className="text-[10px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">
                    {isSaving ? 'Synchronisation...' : 'Enregistrer les Changements'}
                </span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* STS & PROTOCOLS */}
        <div className="space-y-8">
            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                        <Key size={32} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Infrastructure <span className="text-brand">STS</span></h4>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Conformité association STS (IEC 62055-41)</p>
                    </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Supply Group Code (SGC)</label>
                        <div className="relative group">
                            <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-brand transition-colors" size={16} />
                            <input 
                                type="text" 
                                value={localSettings.sgc || '600451'} 
                                onChange={(e) => handleChange('sgc', e.target.value)}
                                className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-white font-mono font-black placeholder:text-gray-800 focus:outline-none focus:border-brand/40 uppercase tracking-widest transition-all" 
                            />
                        </div>
                        <p className="text-[8px] text-gray-700 font-bold uppercase tracking-tighter px-1">Identifiant unique NIGELEC</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Key Revision (KRN)</label>
                        <div className="relative">
                            <select 
                                value={localSettings.krn || '1'} 
                                onChange={(e) => handleChange('krn', e.target.value)}
                                className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-white font-black appearance-none outline-none focus:border-brand/40 uppercase tracking-widest cursor-pointer transition-all"
                            >
                                <option value="1">Revision 1 (Current)</option>
                                <option value="2">Revision 2 (Rollover Enabled)</option>
                            </select>
                            <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" size={16} />
                        </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4">Fonction Critique : Transition Clé de Racine</p>
                    <button className="px-8 py-3 bg-white/5 hover:bg-orange-600 text-orange-500 hover:text-white border border-orange-500/20 rounded-xl transition-all flex items-center gap-3 group">
                        <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Rollover National Automatisé</span>
                    </button>
                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-4">⚠️ impacte tous les jetons en circulation</p>
                  </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <FileCheck size={30} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">Régulation <span className="text-blue-500">& Gouvernance</span></h4>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Directives ARSE (Niger)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">TVA Appliquée</div>
                            <Percent size={14} className="text-gray-700 group-hover:text-brand transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <input 
                                type="number" 
                                value={localSettings.vat_rate || 19} 
                                onChange={(e) => handleChange('vat_rate', parseFloat(e.target.value))}
                                className="w-24 h-10 bg-black/40 border border-white/5 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-brand/30"
                            />
                            <span className="text-sm font-black text-brand mb-1">%</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Seuil Pertes Max.</div>
                            <Zap size={14} className="text-gray-700 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <input 
                                type="number" 
                                value={localSettings.tech_loss_threshold || 7.5} 
                                onChange={(e) => handleChange('tech_loss_threshold', parseFloat(e.target.value))}
                                className="w-24 h-10 bg-black/40 border border-white/5 rounded-xl text-center text-2xl font-black text-white outline-none focus:border-orange-500/30"
                            />
                            <span className="text-sm font-black text-orange-500 mb-1">%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">Génération des Rapports Réglementaires</label>
                    <div className="flex gap-4">
                        {['Quotidien', 'Hebdomadaire', 'Mensuel'].map(f => (
                            <button 
                                key={f}
                                onClick={() => handleChange('audit_frequency', f)}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                    localSettings.audit_frequency === f || (!localSettings.audit_frequency && f === 'Mensuel') 
                                        ? "bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-500/10" 
                                        : "bg-white/5 border-white/5 text-gray-600 hover:border-white/20"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* CLOUD & HARDWARE STATUS */}
        <div className="space-y-8">
            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Maintenance <span className="text-purple-400">& Services</span></h4>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Disponibilité critique du MDMS Core</p>
                    </div>
                </div>

                <div className="space-y-4 flex-grow">
                    <ToggleCard 
                        icon={Bell} 
                        label="Mode Maintenance Global" 
                        desc="Désactive l'accès au portail client" 
                        active={localSettings.maintenance_mode} 
                        color="text-orange-500" 
                        onToggle={() => handleChange('maintenance_mode', !localSettings.maintenance_mode)} 
                    />
                    <ToggleCard 
                        icon={Smartphone} 
                        label="Passerelle SMS Intégrée" 
                        desc="Routeur Orange/Airtel actif" 
                        active={localSettings.sms_gateway_active} 
                        color="text-brand" 
                        onToggle={() => handleChange('sms_gateway_active', !localSettings.sms_gateway_active)} 
                    />
                    <ToggleCard 
                        icon={Globe} 
                        label="Géo-Redondance Active" 
                        desc="Backup Niamey &rarr; Maradi" 
                        active={localSettings.geo_redundancy_active} 
                        color="text-blue-400" 
                        onToggle={() => handleChange('geo_redundancy_active', !localSettings.geo_redundancy_active)} 
                    />
                    <ToggleCard 
                        icon={Signal} 
                        label="Supervision SCADA Directe" 
                        desc="Connexion bas niveau RTU" 
                        active={true} 
                        color="text-niger-green" 
                        onToggle={() => {}} 
                        disabled
                    />
                </div>

                <div className="mt-10 p-6 rounded-[2rem] bg-black/40 border border-white/5 relative group/terminal">
                    <div className="flex items-center gap-3 mb-4">
                        <Terminal size={14} className="text-niger-green" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Connectivité Backend (VEE)</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px] leading-relaxed">
                        <p className="text-gray-500">SYSTEM_UPTIME: <span className="text-white">128d 4h 12m</span></p>
                        <p className="text-gray-500">API_VERSION: <span className="text-brand">v4.2.1-stable</span></p>
                        <p className="text-gray-500">DB_CLUSTER: <span className="text-blue-400">NIAMEY-HQ-01 (ACTIVE)</span></p>
                    </div>
                    <div className="absolute top-4 right-6 w-2 h-2 rounded-full bg-niger-green animate-pulse"></div>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

const ToggleCard = ({ icon: Icon, label, desc, active, color, onToggle, disabled = false }: any) => (
    <div className={cn(
        "flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group transition-all",
        !disabled && "hover:bg-white/[0.05] hover:border-white/10"
    )}>
        <div className="flex items-center gap-5">
            <div className={cn("w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110", color)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">{label}</p>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none mt-1">{desc}</p>
            </div>
        </div>
        <div 
            onClick={!disabled ? onToggle : undefined}
            className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300 border",
                active ? "bg-brand/20 border-brand/40" : "bg-black/40 border-white/10",
                disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
        >
            <motion.div 
                animate={{ x: active ? 26 : 4 }}
                className={cn(
                    "absolute top-1 w-4 h-4 rounded-full shadow-lg",
                    active ? "bg-brand" : "bg-gray-600"
                )}
            />
        </div>
    </div>
);
