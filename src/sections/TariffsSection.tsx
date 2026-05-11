import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Tags, Edit, Trash2, Zap, Info, 
    Calculator, ArrowRight, ShieldCheck, 
    TrendingUp, Coins, Percent, Clock, AlertTriangle,
    Activity
} from 'lucide-react';
import { Tariff, TariffTier } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TariffsSectionProps {
    tariffs: Tariff[];
    setEditingTariff: (t: Tariff | null) => void;
    setEditingTiers: (tiers: TariffTier[]) => void;
    setIsTariffModalOpen: (open: boolean) => void;
    handleDeleteTariff: (id: string) => void;
}

export const TariffsSection = ({
    tariffs,
    setEditingTariff,
    setEditingTiers,
    setIsTariffModalOpen,
    handleDeleteTariff
}: TariffsSectionProps) => {
    const [simulatingTariff, setSimulatingTariff] = useState<string | null>(null);
    const [simKwh, setSimKwh] = useState<number>(100);

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
                        <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Gestion Commerciale</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest">
                            <ShieldCheck size={10} /> Standards CEI 62055-41 (STS)
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Souveraineté <span className="text-brand">Tarifaire</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Configuration des segments d'énergie et taxes nationales</p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => { setEditingTariff(null); setEditingTiers([]); setIsTariffModalOpen(true); }}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden text-white"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={18} className="relative z-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Créer un Segment</span>
                    </button>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-widest">
                        <Calculator size={18} className="text-gray-500" /> Simulateur
                    </button>
                </div>
            </div>

            {/* ── Grille Tarifaire ──────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {tariffs.map((tariff) => (
                    <TariffCard 
                        key={tariff.id} 
                        tariff={tariff} 
                        onEdit={() => { 
                            setEditingTariff(tariff); 
                            setEditingTiers(Array.isArray(tariff.tiers) ? tariff.tiers : []); 
                            setIsTariffModalOpen(true); 
                        }} 
                        onDelete={() => handleDeleteTariff(tariff.id!)}
                    />
                ))}
            </div>

            {/* ── Footer Informationnel Taxes ─────────────────────────── */}
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0 animate-pulse">
                        <Percent size={32} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Structuration des Taxes Nationales</h4>
                        <p className="text-gray-500 text-[9px] font-bold leading-relaxed uppercase tracking-widest max-w-2xl">
                            Tous les tarifs incluent la TVA de 19% (sauf tranche sociale), la redevance ORTN pour l'audiovisuel national, 
                            et la taxe habitat conforme à la législation fiscale du Niger. Les modifications tarifaires sont 
                            journalisées dans le registre d'audit central.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/10 text-center min-w-[120px]">
                        <p className="text-[8px] font-black text-gray-600 uppercase mb-1">TVA Moyenne</p>
                        <p className="text-lg font-black text-white italic">19%</p>
                    </div>
                    <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/10 text-center min-w-[120px]">
                        <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Redevance ORTN</p>
                        <p className="text-lg font-black text-brand italic">FIXE</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const TariffCard = ({ tariff, onEdit, onDelete }: any) => {
    const isSocial = tariff.id?.toLowerCase().includes('social');
    const tiers = Array.isArray(tariff.tiers) ? tariff.tiers : [];

    return (
        <div className="glass-panel p-1 rounded-[3rem] border border-white/5 bg-[#121214] group hover:border-brand/40 transition-all duration-500 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand/10 transition-colors"></div>
            
            <div className="p-8">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden",
                            isSocial ? "bg-niger-green/10 text-niger-green border border-niger-green/20" : "bg-brand/10 text-brand border border-brand/20"
                        )}>
                            <Tags size={32} />
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{tariff.name}</h4>
                                {tariff.isTou && (
                                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest border border-purple-500/20">Time-of-Use</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <span className={cn(
                                    "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                    isSocial ? "bg-niger-green/20 text-niger-green border-niger-green/30" : "bg-white/5 text-gray-500 border-white/10"
                                )}>
                                    {isSocial ? "Protection Sociale" : "Modèle Résidentiel"}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-white/5 text-gray-500 border border-white/10 text-[8px] font-black uppercase tracking-widest">STS Compliant</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl transition-all border border-white/10 outline-none"><Edit size={18} /></button>
                        <button onClick={onDelete} className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500/50 hover:text-white rounded-2xl transition-all border border-red-500/10 outline-none"><Trash2 size={18} /></button>
                    </div>
                </div>

                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8 px-2 border-l-2 border-brand/20 italic italic">
                    "{tariff.description || 'Configuration tarifaire standard pour les abonnés basse tension du réseau métropolitain.'}"
                </p>

                {/* Base Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <BaseStat label="Tarif de Base" value={tariff.rate.toFixed(2)} unit="F/kWh" icon={TrendingUp} color="text-brand" />
                    <BaseStat label="Prime Fixe" value={tariff.fixedMonthlyFee || "0"} unit="FCFA" icon={Coins} />
                    <BaseStat label="Nbre Paliers" value={tiers.length} unit="GRADUAL" icon={Clock} />
                </div>

                {/* Tiers Visualization */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={14} className="text-brand" /> Architecture des Tranches
                        </h5>
                        <div className="text-[8px] font-bold text-gray-700 uppercase">Progression Arithmétique</div>
                    </div>
                    
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {tiers.map((t: any, i: number) => (
                            <div key={i} className="group/tier p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-brand/30 transition-all cursor-default">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-xs font-black text-gray-500 italic">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-white font-black text-sm">
                                                {t.minKwh} <ArrowRight size={12} className="text-gray-700" /> {t.maxKwh || '∞'} 
                                                <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase ml-1">kWh</span>
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <MiniTax label="Redevance" val={`${t.redevance}F`} color="text-gray-400" />
                                                <MiniTax label="TVA" val={`${t.vatRate || 19}%`} color="text-red-400" />
                                                <MiniTax label="ORTN" val={`${t.taxeORNT || 0}F`} color="text-blue-400" />
                                                <MiniTax label="Hab." val={`${t.taxeHabitat || 0}F`} color="text-yellow-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white tabular-nums">{t.rate.toFixed(2)}</div>
                                        <div className="text-[9px] font-black text-brand uppercase tracking-widest -mt-1">FCFA/kWh</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ToU Policy */}
                {tariff.isTou && (
                     <div className="mt-8 p-6 rounded-[2rem] bg-purple-500/5 border border-purple-500/20 relative overflow-hidden group/tou">
                         <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover/tou:opacity-100 transition-opacity"></div>
                         <div className="flex justify-between items-center mb-6 relative z-10">
                             <div className="flex items-center gap-3">
                                 <Clock size={20} className="text-purple-400" />
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Politique Time-of-Use active</span>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]"></div>
                         </div>
                         <div className="grid grid-cols-2 gap-4 relative z-10">
                            <ToUZone label="Heures Pleines" time="06:00 - 23:00" desc="Facturation 100%" color="bg-purple-900/30" border="border-purple-500/30" />
                            <ToUZone label="Heures Creuses" time="23:00 - 06:00" desc="Remise Spéciale -25%" color="bg-brand/10" border="border-brand/20" />
                         </div>
                     </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="px-8 py-4 bg-white/[0.03] border-t border-white/5 flex justify-between items-center rounded-b-[3rem]">
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} /> Dernière mise à jour: 12/04/2026 Admin
                </div>
                <button className="text-[9px] font-black text-brand uppercase tracking-[0.2em] hover:underline transition-all">Historique des versions</button>
            </div>
        </div>
    );
};

const BaseStat = ({ label, value, unit, icon: Icon, color = "text-white" }: any) => (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
        <Icon size={16} className={cn("inline-block mb-2 opacity-50", color)} />
        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={cn("text-lg font-black tracking-tight", color)}>{value}</p>
        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">{unit}</p>
    </div>
);

const MiniTax = ({ label, val, color }: any) => (
    <div className="flex flex-col">
        <span className="text-[7px] font-black text-gray-600 uppercase mb-0.5 tracking-tighter">{label}</span>
        <span className={cn("text-[10px] font-bold uppercase", color)}>{val}</span>
    </div>
);

const ToUZone = ({ label, time, desc, color, border }: any) => (
    <div className={cn("p-4 rounded-2xl border", color, border)}>
        <p className="text-[8px] font-black text-white/50 uppercase mb-1">{label}</p>
        <p className="text-xs font-black text-white uppercase mb-1">{time}</p>
        <p className="text-[8px] font-bold text-niger-green uppercase tracking-tighter">{desc}</p>
    </div>
);
