import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Shield, User as UserIcon, UserCheck, 
    Key, MoreVertical, Search, Filter, ShieldCheck, 
    Activity, Lock, LogIn, Fingerprint, Globe, 
    AlertTriangle, Server, Database, Clock, Download,
    CheckCircle2, Edit
} from 'lucide-react';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface UsersSectionProps {
    users: User[];
    setEditingUser: (user: User | null) => void;
    setIsUserModalOpen: (open: boolean) => void;
    handleDeleteUser: (id: string) => void;
}

const RoleBadge = ({ role }: { role: string }) => {
    const roles: Record<string, { label: string, style: string, icon: any }> = {
        admin: { label: "Super Admin", style: "bg-red-500/20 text-red-300 border-red-500/40", icon: Shield },
        manager: { label: "Directeur Régional", style: "bg-brand/20 text-brand border-brand/40", icon: UserCheck },
        tech: { label: "Expert Terrain", style: "bg-blue-500/20 text-blue-300 border-blue-500/40", icon: Server },
        billing: { label: "Facturation & Recouvrement", style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: Database },
        vendor: { label: "Guichetier STS", style: "bg-purple-500/20 text-purple-300 border-purple-500/40", icon: Key },
        auditor: { label: "Auditeur ARSE", style: "bg-amber-500/20 text-amber-300 border-amber-500/40", icon: ShieldCheck },
        customer: { label: "Abonné NIGELEC", style: "bg-white/10 text-gray-300 border-white/20", icon: UserIcon },
    };

    const config = roles[role] || roles.customer;
    const Icon = config.icon;

    return (
        <span className={cn("px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5", config.style)}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export const UsersSection = ({
    users,
    setEditingUser,
    setIsUserModalOpen,
    handleDeleteUser
}: UsersSectionProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const safeUsers = Array.isArray(users) ? users : [];

    const filteredUsers = useMemo(() => {
        return safeUsers.filter(u => {
            const query = searchTerm.toLowerCase();
            const matchesSearch = 
                (u.name || '').toLowerCase().includes(query) || 
                (u.username || '').toLowerCase().includes(query) ||
                (u.role || '').toLowerCase().includes(query);
            
            const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
            return matchesSearch && matchesRole;
        });
    }, [safeUsers, searchTerm, selectedRoleFilter]);

    const exportUsersCSV = () => {
        if (!safeUsers.length) return;
        const headers = ['ID_Utilisateur', 'Nom_Complet', 'Identifiant', 'Role_RBAC', 'Statut'];
        const rows = safeUsers.map(u => [
            u.id,
            `"${u.name}"`,
            `"${u.username}"`,
            u.role,
            'Actif'
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `utilisateurs_gestion_acces_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
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
                        <span className="px-2.5 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded border border-brand/30">Module Sécurité & IAM</span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <ShieldCheck size={14} /> Chiffrement Bcrypt & Contrôle RBAC
                        </span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Gestion <span className="text-brand">des Accès</span></h3>
                    <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">Habilitations des opérateurs, profils RBAC et contrôle d'intégrité e-EnergieTEC</p>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                    <button 
                        onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                        className="px-6 py-3.5 bg-brand hover:bg-brand-light text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(255,107,53,0.4)] transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    >
                        <Plus size={18} />
                        <span>Nouvel Opérateur</span>
                    </button>

                    <button 
                        onClick={exportUsersCSV}
                        className="px-6 py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-wider text-white shadow cursor-pointer"
                    >
                        <Download size={18} className="text-brand" /> Exporter CSV
                    </button>
                </div>
            </div>

            {/* ── Dashboard de Habilitation ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SecurityStat label="Administrateurs" value={safeUsers.filter(u => u.role === 'admin').length} icon={Shield} color="text-red-400" bg="bg-red-500/10" />
                <SecurityStat label="Guichetiers STS" value={safeUsers.filter(u => u.role === 'vendor').length} icon={Key} color="text-purple-400" bg="bg-purple-500/10" />
                <SecurityStat label="Techniciens Terrain" value={safeUsers.filter(u => u.role === 'tech').length} icon={Server} color="text-blue-400" bg="bg-blue-500/10" />
                <SecurityStat label="Auditeurs ARSE" value={safeUsers.filter(u => u.role === 'auditor').length} icon={ShieldCheck} color="text-amber-400" bg="bg-amber-500/10" />
            </div>

            {/* ── Barre de Recherche et Filtres ─────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#14151a] p-4 rounded-3xl border border-white/15 shadow-lg">
                <div className="flex gap-2 p-1 bg-black/50 rounded-2xl border border-white/10 flex-wrap">
                    {[
                        { id: 'all', label: 'Tous les Rôles' },
                        { id: 'admin', label: 'Admin' },
                        { id: 'vendor', label: 'Guichetier' },
                        { id: 'tech', label: 'Technicien' },
                        { id: 'auditor', label: 'Auditeur' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedRoleFilter(f.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border",
                                selectedRoleFilter === f.id
                                    ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow"
                                    : "bg-[#181920] border-white/15 text-gray-300 hover:text-white"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 md:max-w-xs group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher nom, identifiant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#181920] border border-white/20 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-brand uppercase tracking-wider"
                    />
                </div>
            </div>

            {/* ── Grid des Opérateurs ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                <AnimatePresence mode='popLayout'>
                    {filteredUsers.map((u) => (
                        <motion.div 
                            layout
                            key={u.id} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 rounded-3xl border border-white/15 bg-[#121318] group hover:border-brand/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-2xl space-y-6"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xl shadow">
                                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#121318]"></div>
                                    </div>
                                    <RoleBadge role={u.role} />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight truncate">{u.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-gray-400">@{u.username}</span>
                                        <span className="text-[10px] text-gray-500">•</span>
                                        <span className="text-xs text-brand font-bold uppercase">{u.id}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-gray-300 font-bold uppercase">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Niveau de Sécurité :</span>
                                        <span className="text-emerald-400 font-mono">{u.role === 'admin' ? 'NIVEAU 1 (ROOT)' : 'NIVEAU 2 (RBAC)'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Statut Compte :</span>
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Actif
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex gap-2">
                                <button 
                                    onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-bold text-white uppercase tracking-wider rounded-xl transition-all border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Edit size={14} /> Modifier
                                </button>
                                {u.username !== 'admin' && (
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20 cursor-pointer"
                                        title="Supprimer l'accès"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Footer de Sécurité ─────────────────────────────────── */}
            <div className="p-8 rounded-3xl border border-white/15 flex flex-col md:flex-row items-center justify-between gap-8 bg-[#121318] shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                        <Lock size={28} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Politique de Sécurité des Accès NIGELEC</h4>
                        <p className="text-gray-300 text-xs font-bold leading-relaxed uppercase tracking-wider max-w-xl">
                            Les identifiants et clés API sont strictement personnels. Chaque transaction STS et lecture télémesure 
                            est signée et enregistrée de manière immuable dans le Journal d'Audit central.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                     <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                         <Fingerprint size={16} /> Signature Cryptographique Active
                     </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const SecurityStat = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className="p-6 rounded-3xl border border-white/15 bg-[#121318] relative overflow-hidden group shadow-xl">
        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12", bg)}></div>
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <div className="text-3xl font-black text-white font-mono tracking-tight">{value}</div>
            </div>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10", bg, color)}>
                <Icon size={22} />
            </div>
        </div>
    </div>
);
