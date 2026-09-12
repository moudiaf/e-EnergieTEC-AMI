import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Signal, Wifi, Cpu, HardDrive, 
    RefreshCw, Globe, MapPin, Activity, AlertTriangle, 
    MoreVertical, Power, Database, Server, Router,
    ChevronRight, ArrowUpRight, BarChart3, WifiOff, Edit2, Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { DCU } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DcusSectionProps {
    dcus: DCU[];
    setEditingDcu: (dcu: DCU | null) => void;
    setIsDcuModalOpen: (open: boolean) => void;
    onOpenLoadSheddingModal?: () => void;
    handleDeleteDcu: (id: string) => void;
    onRebootDcu?: (id: string) => void;
    onPingDcu?: (id: string) => void;
    setCurrentSection?: (section: string) => void;
}

export const DcusSection = ({
    dcus,
    setEditingDcu,
    setIsDcuModalOpen,
    onOpenLoadSheddingModal,
    handleDeleteDcu,
    onRebootDcu,
    onPingDcu,
    setCurrentSection
}: DcusSectionProps) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'offline' | 'error'>('all');

    const filteredDcus = useMemo(() => dcus.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                             d.id.toLowerCase().includes(search.toLowerCase()) ||
                             (d.ipAddress || '').includes(search);
        const matchesFilter = filter === 'all' || d.status === filter;
        return matchesSearch && matchesFilter;
    }), [dcus, search, filter]);

    const stats = useMemo(() => ({
        total: dcus.length,
        active: dcus.filter(d => d.status === 'active').length,
        error: dcus.filter(d => d.status === 'error').length,
        offline: dcus.filter(d => d.status === 'offline').length,
        avgSignal: dcus.length ? Math.round(dcus.reduce((s, d) => s + (d.signalStrength || 0), 0) / dcus.length) : 0,
        totalMeters: dcus.reduce((s, d) => s + (d.connectedMeters || 0), 0)
    }), [dcus]);

    // Logs dynamiques récents basés sur les DCUs réels
    const recentLogs = useMemo(() => {
        return dcus.slice(0, 4).map((d, i) => ({
            id: i + 1,
            type: d.status === 'active' ? 'success' : d.status === 'error' ? 'error' : 'info',
            time: 'En direct',
            msg: d.status === 'active'
                ? `${d.name} (${d.regionId}) : Liaison ${d.modemType || 'GPRS'} active sur ${d.ipAddress || '47.90.150.122:4888'}`
                : `${d.name} (${d.regionId}) : Liaison ${d.modemType || 'GPRS'} déconnectée (Hors-Ligne)`
        }));
    }, [dcus]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20"
        >
            {/* ── Header Institutionnel ────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded border border-brand/30">Infrastructure AMI</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Router size={14} /> Réseau de Concentration National NIGELEC
                        </span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Supervision <span className="text-brand">DCU</span></h3>
                    <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">Monitoring temps-réel des passerelles de collecte PLC / GPRS / 4G / RF</p>
                </div>
                
                <div className="flex gap-4">
                    <button
                        onClick={() => {
                            if (onOpenLoadSheddingModal) {
                                onOpenLoadSheddingModal();
                            } else {
                                alert("Module de délestage activé.");
                            }
                        }}
                        className="px-5 py-3 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 font-bold rounded-2xl transition-all flex items-center gap-3 cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                        <Power size={18} className="text-amber-400" />
                        <div className="text-left">
                            <span className="block text-xs font-bold uppercase leading-none">Plan Délestage</span>
                            <span className="block text-[10px] text-amber-200/70 font-medium uppercase mt-1">Coupure / Rétablissement</span>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => { setEditingDcu(null); setIsDcuModalOpen(true); }}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all flex items-center gap-3 cursor-pointer"
                    >
                        <Plus size={18} className="text-white" />
                        <div className="text-left">
                            <span className="block text-xs font-bold text-white uppercase leading-none">Déployer DCU</span>
                            <span className="block text-[10px] text-white/80 font-medium uppercase mt-1">Nouvel Équipement</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* ── KPIs Infrastructure ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPIItem 
                    title="Total Passerelles" 
                    value={stats.total.toLocaleString()} 
                    sub="Unités enregistrées" 
                    icon={Server} 
                    color="text-blue-400" 
                    bg="bg-blue-400/10"
                    trend={`${stats.active} Actives`}
                />
                <KPIItem 
                    title="Taux de Disponibilité" 
                    value={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%`} 
                    sub="Communication Over-the-Air" 
                    icon={Activity} 
                    color={stats.active > 0 ? "text-emerald-400" : "text-red-400"} 
                    bg={stats.active > 0 ? "bg-emerald-500/10" : "bg-red-500/10"} 
                    trend={stats.active > 0 ? "Flux Nominal" : "Liaisons Inactives"}
                />
                <KPIItem 
                    title="Alertes Critiques" 
                    value={stats.error.toLocaleString()} 
                    sub="Hors-ligne ou Erreur" 
                    icon={AlertTriangle} 
                    color="text-red-400" 
                    bg="bg-red-500/10"
                    trend={stats.error > 0 ? "Action Requise" : "Aucune Alarme"}
                />
                <KPIItem 
                    title="Capacité de Relais" 
                    value={stats.totalMeters.toLocaleString()} 
                    sub="Compteurs AMI Connectés" 
                    icon={Database} 
                    color="text-brand" 
                    bg="bg-brand/10"
                    trend={stats.total > 0 ? `Moy. ${Math.round(stats.totalMeters / stats.total)}/DCU` : '0/DCU'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Liste des DCU ────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#14151a] p-4 rounded-3xl border border-white/10">
                        <div className="flex gap-2 p-1 bg-black/50 rounded-2xl border border-white/10">
                            {[
                                { id: 'all', label: 'Tout', icon: Activity },
                                { id: 'active', label: 'Online', icon: Signal },
                                { id: 'offline', label: 'Offline', icon: WifiOff },
                                { id: 'error', label: 'Alarme', icon: AlertTriangle }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                        filter === f.id
                                            ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md"
                                            : "text-gray-300 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    <f.icon size={14} />
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 md:max-w-xs group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher nom, IP, ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#181920] border border-white/20 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-brand transition-all uppercase tracking-wider placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="bg-[#121318] overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#181920] border-b border-white/10">
                                    <tr className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                                        <th className="px-4 py-4">Équipement & ID</th>
                                        <th className="px-4 py-4">Charge & CPU</th>
                                        <th className="px-4 py-4">Réseau & IP</th>
                                        <th className="px-4 py-4">Statut</th>
                                        <th className="px-4 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredDcus.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-300 text-sm font-bold uppercase">
                                                    0 concentrateur DCU trouvé
                                                </td>
                                            </tr>
                                        ) : filteredDcus.map((d) => (
                                            <motion.tr 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={d.id} 
                                                className="hover:bg-white/[0.04] transition-colors"
                                            >
                                                {/* Identité Équipement */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2.5 rounded-xl border transition-colors shrink-0", 
                                                            d.status === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/10 border-white/20 text-brand'
                                                        )}>
                                                            <Router size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm uppercase tracking-tight">{d.name || 'DCU-NIG-XXXX'}</p>
                                                            <p className="text-xs font-mono font-bold text-gray-300 mt-0.5">ID: {d.id}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Performance & Charge */}
                                                <td className="px-4 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-200">
                                                            <span>Charge</span>
                                                            <span className="text-amber-400 font-mono">{d.connectedMeters} mètres</span>
                                                        </div>
                                                        <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${Math.min(((d.connectedMeters || 0) / 300) * 100, 100)}%` }}></div>
                                                        </div>
                                                        <div className="flex gap-3 text-xs">
                                                            <span className="font-bold text-gray-300 flex items-center gap-1">
                                                                <Cpu size={12} className="text-gray-400" /> {d.cpuUsage || 12}% CPU
                                                            </span>
                                                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                                                                <Activity size={12} className="text-emerald-400" /> {d.performance || 98}% Perf
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Réseau & Signal */}
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Signal size={14} className={cn((d.signalStrength || 80) > 70 ? "text-emerald-400" : "text-amber-400")} />
                                                            <span className="text-xs font-bold text-white uppercase">{d.modemType || '4G LTE'}</span>
                                                        </div>
                                                        <span className="text-xs font-mono font-bold text-gray-300">{d.ipAddress || '10.0.1.X'}</span>
                                                    </div>
                                                </td>

                                                {/* Statut */}
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={d.status} lastPing={d.lastPing} />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        <ActionButton 
                                                            icon={RefreshCw} 
                                                            color="text-blue-400" 
                                                            bg="bg-blue-500/20" 
                                                            hover="hover:bg-blue-500 hover:text-white" 
                                                            onClick={() => onPingDcu?.(d.id)} 
                                                            title="Tester Connexion (Ping)" 
                                                        />
                                                        <ActionButton 
                                                            icon={Power} 
                                                            color="text-amber-400" 
                                                            bg="bg-amber-500/20" 
                                                            hover="hover:bg-amber-500 hover:text-white" 
                                                            onClick={() => onRebootDcu?.(d.id)} 
                                                            title="Rebooter à Distance" 
                                                        />
                                                        <ActionButton 
                                                            icon={Edit2} 
                                                            color="text-emerald-400" 
                                                            bg="bg-emerald-500/20" 
                                                            hover="hover:bg-emerald-500 hover:text-white" 
                                                            onClick={() => { setEditingDcu(d); setIsDcuModalOpen(true); }} 
                                                            title="Modifier la Fiche DCU" 
                                                        />
                                                        <ActionButton 
                                                            icon={Trash2} 
                                                            color="text-red-400" 
                                                            bg="bg-red-500/20" 
                                                            hover="hover:bg-red-500 hover:text-white" 
                                                            onClick={() => handleDeleteDcu(d.id)} 
                                                            title="Supprimer le DCU" 
                                                        />
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

                {/* ── Side Info & Logs ────────────────────────────────── */}
                <div className="space-y-6">
                    <div className="bg-[#121318] p-6 rounded-3xl border border-white/15 shadow-2xl">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Activity size={16} className="text-brand" /> Santé du Réseau PLC & RF
                        </h4>
                        
                        <div className="space-y-5">
                            <QualityItem 
                              label="Disponibilité Réseau LTE" 
                              value={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '0.0%'} 
                              trend={stats.active > 0 ? "Nominal" : "Inactif"} 
                              color={stats.active > 0 ? "text-emerald-400" : "text-red-400"} 
                            />
                            <QualityItem 
                              label="Taux d'Erreurs RF / GPRS" 
                              value={stats.total > 0 ? `${((stats.error / stats.total) * 100).toFixed(1)}%` : '0.0%'} 
                              trend={stats.error > 0 ? "Anomalies" : "Optimal"} 
                              color={stats.error > 0 ? "text-red-400" : "text-emerald-400"} 
                            />
                        </div>

                        <div className="mt-8 p-5 rounded-2xl bg-[#181920] border border-white/10 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/30">
                                <Globe size={24} />
                            </div>
                            <p className="text-xs font-bold text-white uppercase">Géolocalisation SIG Active</p>
                            <p className="text-xs text-gray-300 font-bold mt-1 mb-5">Tous les DCU sont cartographiés sur le réseau NIGELEC</p>
                            <button 
                                onClick={() => setCurrentSection?.('map')}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-md"
                            >
                                Voir sur la Carte SIG
                            </button>
                        </div>
                    </div>

                    {/* Event Logs Réels */}
                    <div className="bg-[#121318] p-6 rounded-3xl border border-white/15 shadow-2xl">
                        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Server size={14} className="text-brand" /> Journal d'Événements Passerelles
                        </h4>
                        <div className="space-y-3">
                            {recentLogs.map((log) => (
                                <LogItem key={log.id} type={log.type} time={log.time} msg={log.msg} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const KPIItem = ({ title, value, sub, icon: Icon, color, bg, trend }: any) => (
    <div className="bg-[#121318] p-6 rounded-3xl border border-white/15 relative overflow-hidden group hover:border-brand/40 transition-all shadow-xl">
        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-15 -mr-12 -mt-12", bg)}></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl border border-white/10", bg, color)}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tracking-tight mb-1">{value}</h4>
                <p className="text-xs text-gray-400 font-bold uppercase">{sub}</p>
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status, lastPing }: { status: string, lastPing?: string }) => {
    const styles = {
        active: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: 'ACTIF', dot: 'bg-emerald-400' },
        error: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: 'ALARME', dot: 'bg-red-400' },
        offline: { bg: 'bg-gray-500/20 border-gray-500/40', text: 'text-gray-300', label: 'OFFLINE', dot: 'bg-gray-400' }
    }[status] || { bg: 'bg-white/10 border-white/20', text: 'text-gray-300', label: status.toUpperCase(), dot: 'bg-gray-300' };

    return (
        <div className="flex flex-col gap-1 items-start">
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border inline-flex items-center gap-1.5", styles.bg, styles.text)}>
                <span className={cn("w-2 h-2 rounded-full animate-pulse", styles.dot)}></span>
                {styles.label}
            </span>
            {lastPing && (
                <span className="text-[10px] text-gray-300 font-mono font-bold ml-1">Ping: {format(new Date(lastPing), 'HH:mm')}</span>
            )}
        </div>
    );
};

const ActionButton = ({ icon: Icon, color, bg, hover, onClick, title }: any) => (
    <button
        onClick={onClick}
        className={cn("p-2 rounded-xl transition-all border border-white/10 shadow flex items-center justify-center cursor-pointer", bg, color, hover)}
        title={title}
    >
        <Icon size={14} />
    </button>
);

const QualityItem = ({ label, value, trend, color }: any) => (
    <div className="flex justify-between items-center p-3 bg-[#181920] rounded-xl border border-white/10">
        <div>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">{label}</p>
            <p className={cn("text-xl font-black", color)}>{value}</p>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            {trend}
        </span>
    </div>
);

const LogItem = ({ type, time, msg }: any) => (
    <div className="flex gap-2.5 items-start p-2.5 rounded-xl bg-[#181920] border border-white/5">
        <span className="text-[10px] font-mono text-amber-400 font-bold pt-0.5">{time}</span>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0",
                    type === 'success' ? 'bg-emerald-400' : type === 'error' ? 'bg-red-400' : 'bg-amber-400'
                )}></span>
                <p className="text-xs font-bold text-gray-200">{msg}</p>
            </div>
        </div>
    </div>
);
