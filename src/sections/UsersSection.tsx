import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Trash2, Shield, User as UserIcon, UserCheck, 
    Key, MoreVertical, Search, Filter, ShieldCheck, 
    Activity, Lock, LogIn, Fingerprint, Globe, 
    AlertTriangle, Server, Database, Clock
} from 'lucide-react';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
        admin: { label: "Super Admin", style: "bg-red-500/10 text-red-500 border-red-500/20", icon: Shield },
        manager: { label: "Manager Vision", style: "bg-brand/10 text-brand border-brand/20", icon: UserCheck },
        tech: { label: "Expert Terrain", style: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Server },
        billing: { label: "Facturation", style: "bg-green-500/10 text-green-500 border-green-500/20", icon: Database },
        vendor: { label: "Vendeur STS", style: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Key },
        customer: { label: "Abonné AMI", style: "bg-white/5 text-gray-500 border-white/10", icon: UserIcon },
    };

    const config = roles[role] || roles.customer;
    const Icon = config.icon;

    return (
        <span className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border flex items-center gap-2", config.style)}>
            <Icon size={12} />
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

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Module Sécurité</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest">
                            <ShieldCheck size={10} /> Authentification Fortifiée (PBKDF2)
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Souveraineté <span className="text-brand">des Accès</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Gestion RBAC et monitoring des opérateurs e-EnergieTEC</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 focus-within:text-brand transition-colors" size={14} />
                         <input 
                             type="text" 
                             placeholder="RECHERCHER UN OPÉRATEUR..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black text-white placeholder:text-gray-700 focus:outline-none focus:border-brand/40 uppercase tracking-widest"
                         />
                    </div>
                    <button 
                        onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden text-white"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={20} className="relative z-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">Nouvel Opérateur</span>
                    </button>
                </div>
            </div>

            {/* ── Dashboard de Habilitation ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SecurityStat label="Administrateurs" value={users.filter(u => u.role === 'admin').length} icon={Shield} color="text-red-500" bg="bg-red-500/10" />
                <SecurityStat label="Managers" value={users.filter(u => u.role === 'manager').length} icon={UserCheck} color="text-brand" bg="bg-brand/10" />
                <SecurityStat label="Experts Terrain" value={users.filter(u => u.role === 'tech').length} icon={Server} color="text-blue-400" bg="bg-blue-400/10" />
                <SecurityStat label="Sessions Actives" value={users.length} icon={Activity} color="text-niger-green" bg="bg-niger-green/10" />
            </div>

            {/* ── Grid des Opérateurs ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                <AnimatePresence mode='popLayout'>
                    {filteredUsers.map((u) => (
                        <motion.div 
                            layout
                            key={u.id} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-panel p-1 rounded-[2.5rem] border border-white/5 bg-[#121214] group hover:border-brand/40 transition-all duration-500 relative overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="p-8 pb-6">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-2xl group-hover:scale-110 transition-transform shadow-inner">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-niger-green rounded-full border-4 border-[#121214]"></div>
                                    </div>
                                    <RoleBadge role={u.role} />
                                </div>

                                <div className="space-y-1 mb-8">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter truncate">{u.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-500">@{u.username}</span>
                                        <div className="w-1 h-1 rounded-full bg-gray-800"></div>
                                        <span className="text-[10px] text-brand/60 font-black">NIVEAU {u.role === 'admin' ? 'AAA' : 'STD'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-600 font-black">
                                        <div className="flex items-center gap-2"><Clock size={10} /> Last Login</div>
                                        <div className="text-white">Aujourd'hui, 01:14</div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-600 font-black">
                                        <div className="flex items-center gap-2"><Globe size={10} /> IP Address</div>
                                        <div className="text-niger-green">41.138.xxx.x</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/[0.01] border-t border-white/5 flex gap-2">
                                <button 
                                    onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-2xl transition-all border border-white/10"
                                >
                                    Paramètres
                                </button>
                                <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="px-4 py-3 bg-red-500/5 hover:bg-red-500 text-red-500/50 hover:text-white rounded-2xl transition-all border border-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Footer de Sécurité ─────────────────────────────────── */}
            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 border-dashed flex flex-col md:flex-row items-center justify-between gap-8 bg-black/20">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm mb-1">Politique de mot de passe NIGELEC</h4>
                        <p className="text-gray-500 text-[9px] font-bold leading-relaxed uppercase tracking-widest max-w-xl">
                            Les identifiants sont strictement personnels. Toute action effectuée avec un compte identifié 
                            est irréversiblement tracée dans le journal d'audit matériel (HSM). Les sessions inactives 
                            sont déconnectées après 15 minutes.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                     <div className="flex items-center gap-2 px-4 py-2 bg-niger-green/10 text-niger-green rounded-xl border border-niger-green/20 text-[9px] font-black uppercase tracking-widest">
                         <Fingerprint size={14} /> Biométrie Active
                     </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const SecurityStat = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 bg-bg-dark/40 relative overflow-hidden group">
        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12", bg)}></div>
        <div className="relative z-10 flex flex-col gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5", bg, color)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
                <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{value}</div>
            </div>
        </div>
    </div>
);
