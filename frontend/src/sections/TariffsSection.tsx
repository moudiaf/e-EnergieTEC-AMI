import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Tags, Edit, Trash2, Zap, Info, 
    Calculator, ArrowRight, ShieldCheck, 
    TrendingUp, Coins, Percent, Clock, AlertTriangle,
    Activity, Download, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Tariff, TariffTier, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TariffsSectionProps {
    tariffs: Tariff[];
    setEditingTariff: (t: Tariff | null) => void;
    setEditingTiers: (tiers: TariffTier[]) => void;
    setIsTariffModalOpen: (open: boolean) => void;
    handleDeleteTariff: (id: string) => void;
    currentUser?: User | null;
}

export const TariffsSection = ({
    tariffs,
    setEditingTariff,
    setEditingTiers,
    setIsTariffModalOpen,
    handleDeleteTariff,
    currentUser
}: TariffsSectionProps) => {
    const [isSimModalOpen, setIsSimModalOpen] = useState(false);
    const [selectedTariffId, setSelectedTariffId] = useState<string>('domestic');
    const [simKwh, setSimKwh] = useState<number>(120);
    const isAuditor = currentUser?.role === 'auditor';

    // Simulation Calculation
    const simResults = useMemo(() => {
        const tariff = tariffs.find(t => t.id === selectedTariffId) || tariffs[0];
        if (!tariff) return { kwh: simKwh, energyHT: 0, primeFixe: 0, redevance: 0, tva: 0, ortn: 0, habitat: 0, totalTTC: 0, effectiveRate: 0 };

        const tiers = Array.isArray(tariff.tiers) ? tariff.tiers : [];
        let remainingKwh = simKwh;
        let energyHT = 0;
        let redevance = 0;
        let ortn = 0;
        let habitat = 0;
        let primeFixe = tariff.fixedMonthlyFee || 0;
        let tva = 0;

        if (tiers.length > 0) {
            for (let i = 0; i < tiers.length; i++) {
                const tier = tiers[i];
                const tierMin = tier.minKwh || 0;
                const tierMax = tier.maxKwh ?? Infinity;
                const tierCapacity = tierMax - tierMin + 1;

                if (remainingKwh > 0) {
                    const kwhInThisTier = Math.min(remainingKwh, tierCapacity);
                    energyHT += kwhInThisTier * (tier.rate || tariff.rate);
                    remainingKwh -= kwhInThisTier;

                    if (i === 0) {
                        redevance = tier.redevance ?? 250;
                        ortn = tier.taxeORNT ?? 3;
                        habitat = tier.taxeHabitat ?? 100;
                    }
                }
            }
        } else {
            energyHT = simKwh * tariff.rate;
        }

        const taxRate = tariff.taxRate !== undefined ? tariff.taxRate : 19;
        tva = (energyHT + redevance + primeFixe) * (taxRate / 100);
        const totalTTC = Math.round(energyHT + primeFixe + redevance + tva + ortn + habitat);
        const effectiveRate = simKwh > 0 ? (totalTTC / simKwh).toFixed(2) : '0.00';

        return {
            tariffName: tariff.name,
            kwh: simKwh,
            energyHT: Math.round(energyHT),
            primeFixe,
            redevance,
            tva: Math.round(tva),
            ortn,
            habitat,
            totalTTC,
            effectiveRate
        };
    }, [tariffs, selectedTariffId, simKwh]);

    const exportTariffsCSV = () => {
        if (!tariffs.length) return;
        const headers = ['Code_Segment', 'Nom_Grille', 'Tarif_Base_FCFA', 'Prime_Fixe_FCFA', 'TVA_Pct', 'Description'];
        const rows = tariffs.map(t => [
            t.id,
            `"${t.name}"`,
            t.rate,
            t.fixedMonthlyFee || 0,
            `${t.taxRate || 19}%`,
            `"${(t.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `grille_tarifaire_nigelec_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-32 text-white pt-2"
        >
            {/* ── Header Institutionnel ────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded border border-brand/30">Gestion Commerciale & Tarification</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <ShieldCheck size={14} /> Grille Officielle NIGELEC (CEI 62055-41)
                        </span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Souveraineté <span className="text-brand">Tarifaire</span></h3>
                    <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">Configuration des 6 segments d'énergie, paliers progressifs et taxes nationales</p>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                    {isAuditor ? (
                        <div className="px-6 py-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-400 font-bold text-xs uppercase tracking-wider flex items-center gap-3">
                            <ShieldCheck size={16} /> Consultation Officielle ARSE (Lecture Seule)
                        </div>
                    ) : (
                        <button 
                            onClick={() => { setEditingTariff(null); setEditingTiers([]); setIsTariffModalOpen(true); }}
                            className="px-6 py-3.5 bg-brand hover:bg-brand-light text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(255,107,53,0.4)] transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                        >
                            <Plus size={18} />
                            <span>Créer un Segment</span>
                        </button>
                    )}
                    
                    <button 
                        onClick={() => setIsSimModalOpen(true)}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-2xl flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider text-white shadow cursor-pointer"
                    >
                        <Calculator size={18} /> Simulateur Facturation
                    </button>

                    <button 
                        onClick={exportTariffsCSV}
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider text-white shadow cursor-pointer"
                    >
                        <Download size={18} className="text-brand" /> Exporter Grille CSV
                    </button>
                </div>
            </div>

            {/* ── Grille Tarifaire ──────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {tariffs.map((tariff) => (
                    <TariffCard 
                        key={tariff.id} 
                        tariff={tariff} 
                        isAuditor={isAuditor}
                        onEdit={() => { 
                            if (!isAuditor) {
                                setEditingTariff(tariff); 
                                setEditingTiers(Array.isArray(tariff.tiers) ? tariff.tiers : []); 
                                setIsTariffModalOpen(true); 
                            }
                        }} 
                        onDelete={() => !isAuditor && handleDeleteTariff(tariff.id!)}
                    />
                ))}
            </div>

            {/* ── Footer Informationnel Taxes ─────────────────────────── */}
            <div className="bg-[#121318] border border-white/15 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand flex-shrink-0">
                        <Percent size={32} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Structuration des Taxes Nationales du Niger</h4>
                        <p className="text-gray-300 text-xs font-bold leading-relaxed uppercase tracking-wider max-w-2xl">
                            Tous les tarifs incluent la TVA de 19% (exonérée sur tranche sociale), la redevance ORTN pour l'audiovisuel public, 
                            la taxe municipale et la taxe habitat conforme à la réglementation fiscale ARSE.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-3 bg-[#181920] rounded-2xl border border-white/10 text-center min-w-[120px]">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">TVA Normale</p>
                        <p className="text-lg font-black text-white">19%</p>
                    </div>
                    <div className="px-5 py-3 bg-[#181920] rounded-2xl border border-white/10 text-center min-w-[120px]">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Redevance ORTN</p>
                        <p className="text-lg font-black text-brand">3 FCFA</p>
                    </div>
                </div>
            </div>

            {/* ── Modal Simulateur Tarifaire Interactif ───────────────── */}
            <AnimatePresence>
                {isSimModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#14151c] border border-white/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white"
                        >
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-brand/20 rounded-2xl text-brand border border-brand/30">
                                        <Calculator size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Simulateur de Facturation NIGELEC</h3>
                                        <p className="text-xs text-gray-300 font-bold uppercase tracking-wider">Calcul analytique progressif des tranches et taxes</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsSimModalOpen(false)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-2">Choisir le Tarif :</label>
                                    <select 
                                        value={selectedTariffId} 
                                        onChange={(e) => setSelectedTariffId(e.target.value)}
                                        className="w-full bg-[#1c1d26] border border-white/20 rounded-xl p-3 text-xs font-bold text-white uppercase focus:outline-none focus:border-brand"
                                    >
                                        {tariffs.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-300 mb-2">Consommation Estimée (kWh) :</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max="10000" 
                                        value={simKwh}
                                        onChange={(e) => setSimKwh(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-[#1c1d26] border border-white/20 rounded-xl p-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-brand"
                                    />
                                </div>
                            </div>

                            {/* Breakdown Results */}
                            <div className="bg-[#181922] p-5 rounded-2xl border border-white/10 space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>Énergie Consommée HT ({simResults.kwh} kWh) :</span>
                                    <span className="font-mono text-white">{simResults.energyHT.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>Prime Fixe Mensuelle :</span>
                                    <span className="font-mono text-white">{simResults.primeFixe.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>Redevance Fixe / Entretien :</span>
                                    <span className="font-mono text-white">{simResults.redevance.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>TVA Applicable (19%) :</span>
                                    <span className="font-mono text-white">{simResults.tva.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>Taxe ORTN (Audiovisuel) :</span>
                                    <span className="font-mono text-white">{simResults.ortn} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-gray-300 uppercase">
                                    <span>Taxe Habitat :</span>
                                    <span className="font-mono text-white">{simResults.habitat} FCFA</span>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-black text-brand uppercase tracking-wider">Total TTC à Payer :</span>
                                        <p className="text-[10px] text-gray-400 uppercase">Prix moyen effectif : {simResults.effectiveRate} F/kWh</p>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-400 font-mono">
                                        {simResults.totalTTC.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setIsSimModalOpen(false)}
                                className="w-full py-3 bg-brand hover:bg-brand-light rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all shadow cursor-pointer"
                            >
                                Fermer le Simulateur
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const TariffCard = ({ tariff, onEdit, onDelete, isAuditor = false }: any) => {
    const isSocial = tariff.id?.toLowerCase().includes('social');
    const tiers = Array.isArray(tariff.tiers) ? tariff.tiers : [];

    return (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] group hover:border-brand/40 transition-all duration-300 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand/10 transition-colors"></div>
            
            <div>
                {/* Header Card */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0",
                            isSocial ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-brand/20 text-brand border border-brand/30"
                        )}>
                            <Tags size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-xl font-black text-white uppercase tracking-tight">{tariff.name}</h4>
                                {tariff.isTou && (
                                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold uppercase tracking-wider border border-purple-500/30">Time-of-Use</span>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                    isSocial ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-white/10 text-gray-300 border-white/15"
                                )}>
                                    {isSocial ? "Protection Sociale" : "Régime Général NIGELEC"}
                                </span>
                                <span className="px-2.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/15 text-[9px] font-bold uppercase tracking-wider">CEI 62055-41</span>
                            </div>
                        </div>
                    </div>
                    
                    {!isAuditor && (
                        <div className="flex gap-2">
                            <button onClick={onEdit} className="p-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all border border-white/15 cursor-pointer" title="Modifier"><Edit size={16} /></button>
                            <button onClick={onDelete} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20 cursor-pointer" title="Supprimer"><Trash2 size={16} /></button>
                        </div>
                    )}
                </div>

                <p className="text-gray-300 text-xs font-bold uppercase tracking-wider leading-relaxed mb-6 px-3 border-l-2 border-brand/40">
                    {tariff.description || 'Configuration tarifaire standard pour les abonnés basse tension du réseau NIGELEC.'}
                </p>

                {/* Base Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <BaseStat label="Tarif de Base" value={tariff.rate.toFixed(2)} unit="F/kWh" icon={TrendingUp} color="text-brand" />
                    <BaseStat label="Prime Fixe" value={tariff.fixedMonthlyFee?.toLocaleString('fr-FR') || "0"} unit="FCFA" icon={Coins} color="text-emerald-400" />
                    <BaseStat label="Paliers" value={tiers.length || 1} unit="TRANCHES" icon={Clock} color="text-blue-400" />
                </div>

                {/* Tiers Visualization */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <Activity size={14} className="text-brand" /> Architecture des Tranches
                        </h5>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Tarif Progressif NIGELEC</div>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {tiers.length > 0 ? (
                            tiers.map((t: any, i: number) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-[#181920] border border-white/10 hover:border-brand/40 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-gray-400">
                                                #{i + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-white font-bold text-xs font-mono">
                                                    {t.minKwh} <ArrowRight size={12} className="text-gray-400" /> {t.maxKwh || '∞'} 
                                                    <span className="text-[10px] text-gray-400 font-sans font-bold uppercase ml-1">kWh</span>
                                                </div>
                                                <div className="flex gap-3 mt-1 text-[10px] font-bold uppercase text-gray-400">
                                                    <span>Redevance: {t.redevance ?? 250}F</span>
                                                    <span>TVA: {t.vatRate !== undefined ? t.vatRate : 19}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white font-mono">{t.rate.toFixed(2)}</div>
                                            <div className="text-[9px] font-bold text-brand uppercase tracking-wider -mt-1">FCFA/kWh</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 rounded-2xl bg-[#181920] border border-white/10 text-center text-xs font-bold text-gray-400 uppercase">
                                Tarif Unique Linéaire : {tariff.rate.toFixed(2)} FCFA / kWh
                            </div>
                        )}
                    </div>
                </div>

                {/* ToU Policy */}
                {tariff.isTou && (
                     <div className="mt-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                 <Clock size={16} className="text-purple-400" />
                                 <span className="text-xs font-bold text-white uppercase">Politique Horosaisonnière (ToU)</span>
                             </div>
                             <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <ToUZone label="Heures Pleines" time="06:00 - 23:00" desc="Facturation 100%" color="bg-purple-900/40" border="border-purple-500/30" />
                            <ToUZone label="Heures Creuses" time="23:00 - 06:00" desc="Remise Nuit -25%" color="bg-brand/10" border="border-brand/30" />
                         </div>
                     </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Validé Commission Tarifaire NIGELEC
                </div>
                <span className="text-brand font-mono">SGC 600876</span>
            </div>
        </div>
    );
};

const BaseStat = ({ label, value, unit, icon: Icon, color = "text-white" }: any) => (
    <div className="bg-[#181920] p-3 rounded-2xl border border-white/10 text-center">
        <Icon size={16} className={cn("inline-block mb-1 opacity-70", color)} />
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn("text-base font-black tracking-tight font-mono", color)}>{value}</p>
        <p className="text-[8px] font-bold text-gray-500 uppercase">{unit}</p>
    </div>
);

const ToUZone = ({ label, time, desc, color, border }: any) => (
    <div className={cn("p-3 rounded-xl border", color, border)}>
        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{label}</p>
        <p className="text-xs font-mono font-bold text-white uppercase mb-0.5">{time}</p>
        <p className="text-[9px] font-bold text-emerald-400 uppercase">{desc}</p>
    </div>
);
