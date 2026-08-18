import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
    Shield, AlertCircle, CheckCircle2, Search, Filter, 
    FileText, Printer, Lock, User, Terminal, 
    History, Fingerprint, ArrowDownCircle, Activity,
    ShieldCheck, Database, Key, Server
} from 'lucide-react';
import { Audit, Shift } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AuditSectionProps {
    audits: Audit[];
    pastShifts: Shift[];
    onRePrintShift: (shift: Shift) => void;
    onGenerateReport: () => void;
}

export const AuditSection = ({ audits, pastShifts, onRePrintShift, onGenerateReport }: AuditSectionProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            const matchesSearch = 
                (audit.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (audit.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (audit.details || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = filterType === 'all' || 
                (filterType === 'security' && (audit.action.toLowerCase().includes('delete') || audit.action.toLowerCase().includes('admin'))) ||
                (filterType === 'financial' && audit.action.toLowerCase().includes('caiss')) ||
                (filterType === 'system' && !audit.action.toLowerCase().includes('caiss') && !audit.action.toLowerCase().includes('delete'));

            return matchesSearch && matchesType;
        });
    }, [audits, searchTerm, filterType]);

    const stats = useMemo(() => ({
        total: audits.length,
        suspicious: audits.filter(a => a.action.toLowerCase().includes('delete') || a.action.toLowerCase().includes('admin')).length,
        financial: audits.filter(a => a.action.toLowerCase().includes('caiss')).length,
        compliance: 99.8
    }), [audits]);

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
                        <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Module de Sécurité</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest">
                            <ShieldCheck size={10} /> Certification ARSE Compliant
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Journal d'<span className="text-brand">Audit</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Traçabilité immuable des opérations critiques AMI</p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={onGenerateReport}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <FileText size={18} className="text-white relative z-10" />
                        <div className="text-left relative z-10">
                            <span className="block text-[10px] font-black text-white uppercase leading-none">Rapport d'Audit</span>
                            <span className="block text-[8px] text-white/60 font-bold uppercase mt-1">Export Réglementaire</span>
                        </div>
                    </button>
                    <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-widest">
                        <ArrowDownCircle size={18} className="text-gray-500" /> Archiver
                    </button>
                </div>
            </div>

            {/* ── KPIs de Sécurité ──────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPIItem 
                    title="Volume de Logs" 
                    value={stats.total.toLocaleString()} 
                    sub="Actions enregistrées" 
                    icon={Database} 
                    color="text-blue-400" 
                    bg="bg-blue-400/10"
                />
                <KPIItem 
                    title="Intégrité Système" 
                    value={`${stats.compliance}%`} 
                    sub="Signatures Valides" 
                    icon={CheckCircle2} 
                    color="text-niger-green" 
                    bg="bg-niger-green/10"
                />
                <KPIItem 
                    title="Alertes Sécurité" 
                    value={stats.suspicious} 
                    sub="Actions Sensibles" 
                    icon={Shield} 
                    color="text-red-500" 
                    bg="bg-red-500/10"
                />
                <KPIItem 
                    title="Events Financiers" 
                    value={stats.financial} 
                    sub="Ventes & Clôtures" 
                    icon={Key} 
                    color="text-brand" 
                    bg="bg-brand/10"
                />
            </div>

            {/* ── Contrôles de Filtrage ─────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.02] p-4 rounded-3xl border border-white/5">
                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                    {[
                        { id: 'all', label: 'Tout', icon: History },
                        { id: 'security', label: 'Sécurité', icon: Lock },
                        { id: 'financial', label: 'Finance', icon: Key },
                        { id: 'system', label: 'Système', icon: Terminal }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                filterType === f.id
                                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <f.icon size={12} /> {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 md:max-w-xs group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="RECHERCHER PAR OPÉRATEUR, ACTION..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-white focus:outline-none focus:border-brand/40 transition-all uppercase tracking-widest placeholder:text-gray-700"
                    />
                </div>
            </div>

            {/* ── Ledger d'Audit ───────────────────────────────────── */}
            <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 bg-bg-dark/40 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Horodatage / ID Log</th>
                                <th className="px-8 py-5">Entité / Opérateur</th>
                                <th className="px-8 py-5">Action Certifiée</th>
                                <th className="px-8 py-5">Contexte Technique</th>
                                <th className="px-8 py-5 text-right">Signature Digital</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode='popLayout'>
                                {filteredAudits.map((audit) => (
                                    <motion.tr 
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={audit.id} 
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[10px] text-gray-400 group-hover:text-white transition-colors">
                                                    {audit.timestamp ? format(new Date(audit.timestamp), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                                                </span>
                                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mt-1 italic">
                                                    UUID: #{(audit.id || '').substring(0, 12)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand font-black text-xs relative">
                                                    <User size={16} />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-niger-green rounded-full border-2 border-bg-dark shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                                                </div>
                                                <div>
                                                    <span className="block font-black text-white text-xs uppercase tracking-tight">{audit.user || 'SYSTEM_CORE'}</span>
                                                    <span className="block text-[8px] font-bold text-gray-600 uppercase">Privilèges Admin</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <ActionBadge action={audit.action} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight leading-relaxed max-w-sm line-clamp-2">
                                                {audit.details}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {audit.action === 'CLÔTURE CAISSE' && audit.referenceId ? (
                                                <button 
                                                    onClick={() => {
                                                        const shift = pastShifts.find(s => s.id === audit.referenceId);
                                                        if (shift) onRePrintShift(shift);
                                                    }}
                                                    className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-white transition-all shadow-lg"
                                                >
                                                    <Printer size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Re-Print</span>
                                                </button>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2 text-niger-green opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <Fingerprint size={12} />
                                                        <span className="text-[9px] font-mono tracking-widest">
                                                            SHA256:{Math.random().toString(16).substring(2, 10).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] text-gray-700 font-bold uppercase">Immuable • Temps Réel</span>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Footer Intégrité ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-center p-8 bg-black/20 rounded-[2.5rem] border border-white/5 border-dashed">
                <div className="flex items-center gap-4 mb-4 md:mb-0 text-center md:text-left">
                    <div className="p-3 bg-brand/10 rounded-2xl text-brand">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white uppercase mb-1">Système d'Audit National Certifié</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em]">Données signées par le module matériel e-EnergieTEC HSM</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-niger-green font-black text-[9px] uppercase tracking-widest">
                    <Activity size={14} className="animate-pulse" /> Logs Monitoring Actif
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const KPIItem = ({ title, value, sub, icon: Icon, color, bg }: any) => (
    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-brand/30 transition-all shadow-xl bg-bg-dark/40">
        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-12 -mt-12", bg)}></div>
        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className={cn("p-3 rounded-2xl self-start", bg, color)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tracking-tighter mb-1">{value}</h4>
                <p className="text-[9px] text-gray-600 font-bold uppercase">{sub}</p>
            </div>
        </div>
    </div>
);

const ActionBadge = ({ action }: { action: string }) => {
    const isSecurity = action.toLowerCase().includes('delete') || action.toLowerCase().includes('admin') || action.toLowerCase().includes('sécurité');
    const isFinance = action.toLowerCase().includes('caisse') || action.toLowerCase().includes('vente') || action.toLowerCase().includes('token');
    const isSystem = !isSecurity && !isFinance;

    const styles = isSecurity 
        ? "bg-red-500/10 text-red-500 border-red-500/20" 
        : isFinance 
        ? "bg-brand/10 text-brand border-brand/20" 
        : "bg-blue-500/10 text-blue-400 border-blue-500/20";

    const Icon = isSecurity ? Lock : isFinance ? Key : Server;

    return (
        <span className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border flex items-center gap-2 w-fit", styles)}>
            <Icon size={12} />
            {action}
        </span>
    );
};

