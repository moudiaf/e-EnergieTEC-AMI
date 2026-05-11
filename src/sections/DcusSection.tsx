import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Signal, Wifi, Cpu, HardDrive, 
    RefreshCw, Globe, MapPin, Activity, AlertTriangle, 
    MoreVertical, Power, Database, Server, Router,
    ChevronRight, ArrowUpRight, BarChart3, WifiOff
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
    handleDeleteDcu: (id: string) => void;
    onRebootDcu?: (id: string) => void;
    onPingDcu?: (id: string) => void;
}

export const DcusSection = ({
    dcus,
    setEditingDcu,
    setIsDcuModalOpen,
    handleDeleteDcu,
    onRebootDcu,
    onPingDcu
}: DcusSectionProps) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'offline' | 'error'>('all');

    const filteredDcus = useMemo(() => dcus.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                             d.id.toLowerCase().includes(search.toLowerCase()) ||
                             d.ipAddress.includes(search);
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
                        <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Infrastructure AMI</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest">
                            <Router size={10} /> Réseau de Concentration National
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Supervision <span className="text-brand">DCU</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Monitoring temps-réel des passerelles de collecte PLC/RF</p>
                </div>
                
                <div className="flex gap-4">
                    <button
                        onClick={() => { setEditingDcu(null); setIsDcuModalOpen(true); }}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={18} className="text-white relative z-10" />
                        <div className="text-left relative z-10">
                            <span className="block text-[10px] font-black text-white uppercase leading-none">Déployer DCU</span>
                            <span className="block text-[8px] text-white/60 font-bold uppercase mt-1">Nouvel Équipement</span>
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
                    color="text-niger-green" 
                    bg="bg-niger-green/10"
                    trend="Flux Nominal"
                />
                <KPIItem 
                    title="Alertes Critiques" 
                    value={stats.error.toLocaleString()} 
                    sub="Hors-ligne ou Erreur" 
                    icon={AlertTriangle} 
                    color="text-red-500" 
                    bg="bg-red-500/10"
                    trend="Action Requise"
                />
                <KPIItem 
                    title="Capacité de Relais" 
                    value={stats.totalMeters.toLocaleString()} 
                    sub="Compteurs AMI Connectés" 
                    icon={Database} 
                    color="text-brand" 
                    bg="bg-brand/10"
                    trend="Moy. 1045/DCU"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Liste des DCU ────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
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
                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
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
                                placeholder="NOM, IP, IDENTIFIANT..."
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
                                        <th className="px-8 py-5">Identité Équipement</th>
                                        <th className="px-8 py-5">Performance & Charge</th>
                                        <th className="px-8 py-5">Réseau & Signal</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Contrôle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredDcus.map((d) => (
                                            <motion.tr 
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={d.id} 
                                                className="group hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("p-3 rounded-2xl border transition-colors", 
                                                            d.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-gray-500 group-hover:border-brand/30 group-hover:text-brand'
                                                        )}>
                                                            <Router size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white text-xs uppercase tracking-tight">{d.name || 'DCU-NIG-XXXX'}</p>
                                                            <p className="text-[9px] font-mono text-gray-600 mt-1 uppercase">ID: {d.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center text-[8px] font-black uppercase text-gray-500 tracking-tighter">
                                                            <span>Charge Relais</span>
                                                            <span className="text-white">{d.connectedMeters} Mètres</span>
                                                        </div>
                                                        <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min((d.connectedMeters || 0) / 10, 100)}%` }}></div>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <div className="flex items-center gap-1">
                                                                <Cpu size={10} className="text-gray-600" />
                                                                <span className="text-[9px] font-bold text-gray-400">{d.cpuUsage || 0}% CPU</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Activity size={10} className="text-gray-600" />
                                                                <span className="text-[9px] font-bold text-gray-400">{d.performance || 0}% Perf</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Signal size={12} className={cn(d.signalStrength > 70 ? "text-niger-green" : "text-orange-400")} />
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d.modemType || 'GPRS/4G'}</p>
                                                        </div>
                                                        <p className="text-[9px] font-mono text-gray-500">{d.ipAddress}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <StatusBadge status={d.status} lastPing={d.lastPing} />
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ActionButton 
                                                            icon={RefreshCw} 
                                                            color="text-blue-400" 
                                                            bg="bg-blue-400/10" 
                                                            hover="hover:bg-blue-400" 
                                                            onClick={() => onPingDcu?.(d.id)} 
                                                            title="Tester Connexion (Ping)" 
                                                        />
                                                        <ActionButton 
                                                            icon={Power} 
                                                            color="text-red-500" 
                                                            bg="bg-red-500/10" 
                                                            hover="hover:bg-red-500" 
                                                            onClick={() => onRebootDcu?.(d.id)} 
                                                            title="Rebooter à Distance" 
                                                        />
                                                        <button 
                                                            onClick={() => { setEditingDcu(d); setIsDcuModalOpen(true); }}
                                                            className="p-2.5 text-gray-600 hover:text-white transition-colors"
                                                        >
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

                {/* ── Side Info & Logs ────────────────────────────────── */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-brand/5 via-transparent to-transparent">
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <Activity size={14} className="text-brand" /> Santé du Réseau PLC
                        </h4>
                        
                        <div className="space-y-6">
                            <QualityItem label="Disponibilité LTE" value="99.4%" trend="+0.2%" color="text-niger-green" />
                            <QualityItem label="Latence Moyenne" value="124ms" trend="-12ms" color="text-blue-400" />
                            <QualityItem label="Taux d'Erreurs RF" value="1.2%" trend="+0.1%" color="text-orange-400" />
                        </div>

                        <div className="mt-10 p-6 rounded-[2rem] bg-bg-dark/50 border border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                                <Globe size={24} />
                            </div>
                            <p className="text-[10px] font-black text-white uppercase">Géolocalisation Active</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 mb-6">Tous les DCU sont mappés sur le SIG</p>
                            <button className="w-full py-3 bg-white/5 hover:bg-brand rounded-xl border border-white/5 text-[9px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em]">
                                Voir sur la Carte
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-gradient-to-b from-bg-dark/40 to-transparent">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Logs d'Événements</h4>
                        <div className="space-y-4">
                            <LogItem type="success" time="14:22" msg="DCU-NY-01 : Mise à jour firmware OK" />
                            <LogItem type="error" time="12:05" msg="DCU-ZN-04 : Signal faible (RSSI -94db)" />
                            <LogItem type="warning" time="09:15" msg="DCU-MA-02 : Reboot système automatique" />
                        </div>
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
                    <span className="text-[8px] font-black text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
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

const StatusBadge = ({ status, lastPing }: { status: string, lastPing?: string }) => {
    const styles = {
        active: { bg: 'bg-niger-green/10', text: 'text-niger-green', label: 'ACTIF', dot: 'bg-niger-green' },
        error: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'ALARME', dot: 'bg-red-500' },
        offline: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'OFFLINE', dot: 'bg-gray-500' }
    }[status] || { bg: 'bg-white/5', text: 'text-gray-500', label: status.toUpperCase(), dot: 'bg-gray-500' };

    return (
        <div className="flex flex-col gap-1.5 items-start">
            <span className={cn("px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2", styles.bg, styles.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", styles.dot)}></span>
                {styles.label}
            </span>
            {lastPing && (
                <span className="text-[8px] text-gray-600 font-bold uppercase ml-1 italic">Ping: {format(new Date(lastPing), 'HH:mm')}</span>
            )}
        </div>
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

const QualityItem = ({ label, value, trend, color }: any) => (
    <div className="flex justify-between items-center group">
        <div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className={cn("text-lg font-black", color)}>{value}</p>
        </div>
        <span className="text-[8px] font-black text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:bg-brand/10 group-hover:text-brand transition-all">
            {trend}
        </span>
    </div>
);

const LogItem = ({ type, time, msg }: any) => (
    <div className="flex gap-3 items-start group">
        <span className="text-[9px] font-mono text-gray-600 pt-1">{time}</span>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className={cn("w-1 h-1 rounded-full",
                    type === 'success' ? 'bg-niger-green' : type === 'error' ? 'bg-red-500' : 'bg-orange-400'
                )}></span>
                <p className="text-[9px] font-bold text-gray-400 group-hover:text-white transition-colors">{msg}</p>
            </div>
        </div>
    </div>
);
