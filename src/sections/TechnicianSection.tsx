import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, MapPin, AlertCircle, CheckSquare, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ticket, User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TechnicianSectionProps {
    tickets: Ticket[];
    notifications: any[];
    currentUser: User | null;
    updateTicketStatus: (id: string, status: string) => void;
}

export const TechnicianSection = ({
    tickets,
    notifications,
    currentUser,
    updateTicketStatus
}: TechnicianSectionProps) => {
    const [view, setView] = React.useState<'tickets' | 'notifications'>('tickets');
    const myTickets = tickets.filter(t => t.assignedTo === (currentUser?.role === 'tech' ? 'Technicien Réseau' : currentUser?.name));
    const pendingTickets = myTickets.filter(t => t.status !== 'Résolu' && t.status !== 'Fermé');
    const finishedTickets = myTickets.filter(t => t.status === 'Résolu' || t.status === 'Fermé');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20"
        >
            <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <Smartphone className="text-brand" size={24} /> Mes Interventions
                </h3>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                    Espace de gestion terrain - Mobile optimisé
                </p>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                <button
                    onClick={() => setView('tickets')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                        view === 'tickets' ? "bg-brand text-white shadow-lg" : "text-gray-500"
                    )}
                >
                    Interventions
                </button>
                <button
                    onClick={() => setView('notifications')}
                    className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all relative",
                        view === 'notifications' ? "bg-brand text-white shadow-lg" : "text-gray-500"
                    )}
                >
                    Notifications
                    {notifications.length > 0 && (
                        <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-black animate-pulse" />
                    )}
                </button>
            </div>

            {view === 'tickets' ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-brand/5">
                            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">À Faire</p>
                            <h4 className="text-2xl font-black text-white">{pendingTickets.length}</h4>
                        </div>
                        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-green-500/5">
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Terminés</p>
                            <h4 className="text-2xl font-black text-white">{finishedTickets.length}</h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Interventions Prioritaires</h4>
                        {pendingTickets.length === 0 ? (
                            <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center">
                                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                                <p className="text-sm font-bold text-gray-400">Toutes les interventions sont à jour !</p>
                            </div>
                        ) : (
                            pendingTickets.map(ticket => (
                                <div key={ticket.id} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
                                    <div className={cn(
                                        "absolute top-0 left-0 w-1 h-full",
                                        ticket.priority === 'Critique' ? "bg-red-500" :
                                            ticket.priority === 'Haute' ? "bg-orange-500" : "bg-blue-500"
                                    )} />

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter mb-2 inline-block",
                                                ticket.priority === 'Critique' ? "bg-red-500/20 text-red-500" : "bg-white/10 text-gray-400"
                                            )}>
                                                {ticket.priority}
                                            </span>
                                            <h5 className="text-lg font-bold text-white leading-tight">{ticket.subject}</h5>
                                            <p className="text-[10px] text-brand font-black tracking-widest uppercase mt-1">ID: {ticket.id}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase block">{format(new Date(ticket.timestamp), 'HH:mm')}</span>
                                            <span className="text-[10px] font-bold text-gray-400 block">{format(new Date(ticket.timestamp), 'dd MMM')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-start gap-2 text-sm text-gray-400">
                                            <MapPin size={16} className="text-gray-600 mt-0.5 shrink-0" />
                                            <span className="font-medium">Compteur: <span className="text-white font-mono">{ticket.meterId}</span></span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-gray-400">
                                            <AlertCircle size={16} className="text-gray-600 mt-0.5 shrink-0" />
                                            <p className="line-clamp-2 italic text-xs">"{ticket.description}"</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-white/5">
                                        {ticket.status === 'Nouveau' ? (
                                            <button
                                                onClick={() => updateTicketStatus(ticket.id, 'Ouvert')}
                                                className="flex-1 bg-brand text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-brand/20"
                                            >
                                                <Clock size={18} /> Commencer
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateTicketStatus(ticket.id, 'Résolu')}
                                                className="flex-1 bg-green-500 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                                            >
                                                <CheckSquare size={18} /> Clôturer
                                            </button>
                                        )}
                                        <button className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/5 active:scale-95 transition-all">
                                            <MapPin size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-4 pt-4">
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Historique Récent</h4>
                        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                            {finishedTickets.length === 0 ? (
                                <p className="p-6 text-center text-xs text-gray-600 font-bold uppercase tracking-widest">Aucune intervention terminée aujourd'hui</p>
                            ) : (
                                finishedTickets.slice(0, 5).map(ticket => (
                                    <div key={ticket.id} className="p-4 border-b border-white/5 flex items-center justify-between last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                                <CheckCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{ticket.subject}</p>
                                                <p className="text-[9px] text-gray-500 uppercase font-black">{ticket.id} • {ticket.meterId}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">{format(new Date(ticket.timestamp), 'dd/MM')}</p>
                                            <p className="text-[10px] font-bold text-green-500 uppercase">{ticket.status}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">Dernières Alertes SMS / Email</h4>
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center">
                                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex gap-4 items-start bg-brand/[0.02]">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner",
                                        notif.type === 'SMS' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                                    )}>
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-black text-brand uppercase tracking-widest">{notif.type} • {notif.recipient}</span>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase">{format(new Date(notif.timestamp), 'HH:mm')}</span>
                                        </div>
                                        <p className="text-sm font-bold text-white mb-1 leading-tight">{notif.title}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed font-medium">{notif.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
};
