import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Search, Plus, AlertCircle, CheckCircle2, 
    Warehouse, Truck, History, Settings2, Activity, 
    HardDrive, Trash2, Filter, MoreVertical, Layers, 
    ArrowUpRight, BarChart3, Clock, Boxes
} from 'lucide-react';
import { Meter } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AssetsSectionProps {
    meters: Meter[];
    onInstallMeter?: (meterId: string) => void;
    onAddBatch?: () => void;
    onUpdateStatus?: (meterId: string, status: Meter['lifecycleStatus']) => void;
    onAssignInstaller?: (meterId: string, installerId: string) => void;
}

export const AssetsSection = ({ 
    meters, 
    onInstallMeter, 
    onAddBatch, 
    onUpdateStatus 
}: AssetsSectionProps) => {
    const [filter, setFilter] = useState<'all' | 'in_stock' | 'faulty' | 'decommissioned'>('all');
    const [search, setSearch] = useState('');

    // On ne montre que ce qui n'est pas déjà installé (sauf 'all' qui montre tout le magasin)
    const stockMeters = useMemo(() => 
        meters.filter(m => m.lifecycleStatus !== 'installed'), [meters]
    );

    const filteredMeters = useMemo(() => stockMeters.filter(m => {
        const matchesFilter = filter === 'all' || m.lifecycleStatus === filter;
        const matchesSearch = m.id.toLowerCase().includes(search.toLowerCase()) ||
            (m.serialNumber?.toLowerCase().includes(search.toLowerCase())) ||
            (m.batchId?.toLowerCase().includes(search.toLowerCase()));
        return matchesFilter && matchesSearch;
    }), [stockMeters, filter, search]);

    const stats = useMemo(() => ({
        total: stockMeters.length,
        inStock: stockMeters.filter(m => m.lifecycleStatus === 'in_stock').length,
        faulty: stockMeters.filter(m => m.lifecycleStatus === 'faulty').length,
        decommissioned: stockMeters.filter(m => m.lifecycleStatus === 'decommissioned').length,
        batches: new Set(stockMeters.map(m => m.batchId)).size,
        value: stockMeters.filter(m => m.lifecycleStatus === 'in_stock').length * 45000 // Prix moyen fictif
    }), [stockMeters]);

    const suppliers = useMemo(() => {
        const counts: Record<string, number> = {};
        stockMeters.forEach(m => {
            const s = m.supplier || 'NIGELEC STD';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [stockMeters]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20"
        >
            {/* ── Header Institutionnel ────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-niger-green/20 text-niger-green text-[8px] font-black uppercase rounded border border-niger-green/30">Gestion des Actifs v2.4</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-blue-400 uppercase tracking-widest">
                            <Boxes size={10} /> Inventaire National Centralisé
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Gestion du <span className="text-brand">Magasin</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Traçabilité complète, certification des lots et maintenance SAV</p>
                </div>
                
                <div className="flex gap-4">
                    <button
                        onClick={onAddBatch}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={18} className="text-white relative z-10" />
                        <div className="text-left relative z-10">
                            <span className="block text-[10px] font-black text-white uppercase leading-none">Réceptionner Lot</span>
                            <span className="block text-[8px] text-white/60 font-bold uppercase mt-1">Importation Inbound</span>
                        </div>
                    </button>
                    
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all">
                        <BarChart3 size={18} className="text-blue-400" />
                        <span className="text-[10px] font-black text-gray-400 hover:text-white uppercase">Rapport de Stock</span>
                    </button>
                </div>
            </div>

            {/* ── KPIs Critiques ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPIItem 
                    title="Total Inventaire" 
                    value={stats.total.toLocaleString()} 
                    sub="Unités en magasin" 
                    icon={Package} 
                    color="text-brand" 
                    bg="bg-brand/10"
                    trend="+120 ce mois"
                />
                <KPIItem 
                    title="Prêt à la Pose" 
                    value={stats.inStock.toLocaleString()} 
                    sub="Compteurs programmés" 
                    icon={CheckCircle2} 
                    color="text-niger-green" 
                    bg="bg-niger-green/10"
                    trend="Flux Nominal"
                />
                <KPIItem 
                    title="Défectueux / SAV" 
                    value={stats.faulty.toLocaleString()} 
                    sub="En attente expertise" 
                    icon={AlertCircle} 
                    color="text-red-500" 
                    bg="bg-red-500/10"
                    trend="Priorité Haute"
                />
                <KPIItem 
                    title="Valeur de Stock" 
                    value={`${(stats.value / 1000000).toFixed(1)}M`} 
                    sub="Estimation en Millions FCFA" 
                    icon={Warehouse} 
                    color="text-blue-400" 
                    bg="bg-blue-400/10"
                    trend="CAPEX Nigelec"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Filtres & Liste ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto">
                            {[
                                { id: 'all', label: 'Tout', icon: Activity },
                                { id: 'in_stock', label: 'Disponible', icon: CheckCircle2 },
                                { id: 'faulty', label: 'SAV', icon: AlertCircle },
                                { id: 'decommissioned', label: 'Rebut', icon: Trash2 }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                                        filter === f.id
                                            ? "bg-brand text-white shadow-lg shadow-brand/20"
                                            : "text-gray-500 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <f.icon size={12} />
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 md:max-w-xs group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="SÉRIE, LOT, FOURNISSEUR..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-white focus:outline-none focus:border-brand/40 transition-all uppercase tracking-widest placeholder:text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 bg-bg-dark/40 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">Matériel / SN</th>
                                        <th className="px-8 py-5">Lot & Fournisseur</th>
                                        <th className="px-8 py-5">Localisation</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredMeters.map((m) => (
                                            <motion.tr 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={m.id} 
                                                className="group hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("p-3 rounded-2xl border transition-colors", 
                                                            m.lifecycleStatus === 'faulty' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 group-hover:border-brand/30 group-hover:text-brand'
                                                        )}>
                                                            <HardDrive size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white text-xs uppercase tracking-tight">{m.serialNumber || 'SN-NIG-XXXX'}</p>
                                                            <p className="text-[9px] font-mono text-gray-600 mt-1 uppercase">ID: {m.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5 mb-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                                                        <span className="text-[9px] font-black text-white uppercase">{m.supplier || 'HEXING NIGER'}</span>
                                                    </div>
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Lot : {m.batchId || '2024-Q2-AMI'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Warehouse size={12} className="text-gray-500" />
                                                        <p className="text-[10px] font-black text-gray-400 uppercase">{m.warehouseLocation || 'MAGASIN NIAMEY'}</p>
                                                    </div>
                                                    <p className="text-[8px] text-gray-600 font-bold uppercase ml-5">Zone B / Rayon 04</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <StatusBadge status={m.lifecycleStatus || 'in_stock'} />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {m.lifecycleStatus === 'in_stock' && (
                                                            <ActionButton 
                                                                icon={Truck} 
                                                                color="text-niger-green" 
                                                                bg="bg-niger-green/10" 
                                                                hover="hover:bg-niger-green" 
                                                                onClick={() => onInstallMeter?.(m.id)} 
                                                                title="Expédier / Poser" 
                                                            />
                                                        )}
                                                        {m.lifecycleStatus === 'faulty' && (
                                                            <ActionButton 
                                                                icon={Settings2} 
                                                                color="text-blue-400" 
                                                                bg="bg-blue-400/10" 
                                                                hover="hover:bg-blue-400" 
                                                                onClick={() => onUpdateStatus?.(m.id, 'in_stock')} 
                                                                title="Certifier Réparé" 
                                                            />
                                                        )}
                                                        <ActionButton 
                                                            icon={History} 
                                                            color="text-gray-500" 
                                                            bg="bg-white/5" 
                                                            hover="hover:bg-gray-500" 
                                                            onClick={() => {}} 
                                                            title="Journal de Vie" 
                                                        />
                                                        <button className="p-2.5 text-gray-600 hover:text-white transition-colors">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── Side Info & Fournisseurs ────────────────────────── */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <Layers size={14} className="text-brand" /> Synthèse Fournisseurs
                        </h4>
                        
                        <div className="space-y-6">
                            {suppliers.map((s, i) => (
                                <div key={i} className="group cursor-default">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.name}</p>
                                        <p className="text-xs font-black text-white">{s.count} <span className="text-[8px] text-gray-500">Unités</span></p>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(s.count / stats.total) * 100}%` }}
                                            className={cn("h-full rounded-full bg-gradient-to-r", 
                                                i === 0 ? "from-brand to-brand-light" : "from-blue-500 to-blue-400"
                                            )}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 rounded-[2rem] bg-bg-dark/50 border border-white/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase">Dernier Inventaire</p>
                                    <p className="text-[9px] text-gray-500 font-bold italic">Il y a 14 heures</p>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-[9px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em]">
                                Lancer Audit Manuel
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-gradient-to-b from-bg-dark/40 to-transparent flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-[2rem] bg-niger-green/10 flex items-center justify-center text-niger-green mb-6 border border-niger-green/20">
                            <Truck size={32} />
                        </div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Assignation Logistique</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed px-4">
                            Les compteurs marqués comme "Disponibles" peuvent être assignés aux équipes de terrain.
                        </p>
                        <button className="mt-8 px-6 py-3 bg-niger-green/10 border border-niger-green/20 text-niger-green rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-niger-green hover:text-white transition-all">
                             Gérer les Équipes <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const KPIItem = ({ title, value, sub, icon: Icon, color, bg, trend }: any) => (
    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-brand/30 transition-all shadow-xl bg-bg-dark/40">
        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-12 -mt-12", bg)}></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", bg, color)}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[8px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/10">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tracking-tighter mb-2">{value}</h4>
                <p className="text-[9px] text-gray-600 font-bold uppercase">{sub}</p>
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
        in_stock: { bg: 'bg-niger-green/10', text: 'text-niger-green', label: 'DISPONIBLE', dot: 'bg-niger-green' },
        faulty: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'DÉFECTUEUX', dot: 'bg-red-500' },
        decommissioned: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'REBUT', dot: 'bg-gray-500' },
        installed: { bg: 'bg-brand/10', text: 'text-brand', label: 'POSÉ', dot: 'bg-brand' }
    }[status] || { bg: 'bg-white/5', text: 'text-gray-500', label: status.toUpperCase(), dot: 'bg-gray-500' };

    return (
        <span className={cn("px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2", styles.bg, styles.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", styles.dot)}></span>
            {styles.label}
        </span>
    );
};

const ActionButton = ({ icon: Icon, color, bg, hover, onClick, title }: any) => (
    <button
        onClick={onClick}
        className={cn("p-2.5 rounded-xl transition-all border border-white/5 shadow-lg flex items-center justify-center", bg, color, hover, "hover:text-white")}
        title={title}
    >
        <Icon size={14} />
    </button>
);
// Pas besoin de redéfinir cn ici si on le définit en haut, 
// mais comme j'ai utilisé cn partout, je m'assure qu'il est correct.
