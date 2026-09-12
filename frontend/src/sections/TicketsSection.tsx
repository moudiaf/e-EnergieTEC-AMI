import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Headset, Search, Filter, 
  Clock, CheckCircle2, AlertTriangle, 
  MessageSquare, User as UserIcon, Calendar,
  ArrowUpRight, Download, Inbox, Hash, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { Ticket, User } from '../types';
import { maskPhone } from '../utils/privacy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TicketsSectionProps {
  tickets: Ticket[];
  currentUser: User | null;
  setEditingTicket: (ticket: Ticket | null) => void;
  setIsTicketModalOpen: (open: boolean) => void;
  ticketSearch: string;
  setTicketSearch: (query: string) => void;
}

export const TicketsSection = ({
  tickets,
  currentUser,
  setEditingTicket,
  setIsTicketModalOpen,
  ticketSearch,
  setTicketSearch
}: TicketsSectionProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'open' | 'resolved'>('all');
  const isCustomer = currentUser?.role === 'customer';

  const filteredTickets = useMemo(() => {
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    return safeTickets.filter(t => {
      if (isCustomer && currentUser?.associatedCustomerId) {
        if (t.customerId !== currentUser.associatedCustomerId) {
          return false;
        }
      }

      const query = (ticketSearch || '').toLowerCase();
      const matchesSearch = 
        (t.subject || '').toLowerCase().includes(query) || 
        (t.description || '').toLowerCase().includes(query) || 
        (t.id || '').toLowerCase().includes(query) || 
        (t.meterId || '').toLowerCase().includes(query);
      
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'new' && (t.status === 'Nouveau' || (t.status as any) === 'new')) ||
        (activeTab === 'open' && (t.status === 'Ouvert' || t.status === 'En attente' || (t.status as any) === 'open')) ||
        (activeTab === 'resolved' && (t.status === 'Résolu' || (t.status as any) === 'resolved'));
      
      return matchesSearch && matchesTab;
    });
  }, [tickets, ticketSearch, activeTab, isCustomer, currentUser]);

  const exportTicketsCSV = () => {
    if (!tickets.length) return;
    const headers = ['ID_Ticket', 'Horodatage', 'Compteur', 'Client', 'Sujet', 'Description', 'Priorite', 'Statut', 'Assigne_A'];
    const rows = filteredTickets.map(t => [
      t.id,
      t.timestamp ? format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss') : '',
      t.meterId || '',
      t.customerId || '',
      `"${(t.subject || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.priority || 'Normale',
      t.status || 'Nouveau',
      t.assignedTo || 'Non assigné'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_tickets_support_nigelec_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatsCard = ({ title, count, icon: Icon, color, glow }: any) => (
    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10 transition-all group-hover:opacity-20", glow)}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className={cn("p-3 rounded-2xl bg-white/5", color)}>
            <Icon size={20} />
          </div>
          <p className="text-2xl font-black text-white">{count}</p>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );

  if (isCustomer) {
    return (
      <motion.div key="tickets-customer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
        <div className="flex justify-between items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Support & Assistance</h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Échangez directement avec les équipes d'astreinte NIGELEC</p>
          </div>
          <button 
            onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }}
            className="btn-primary px-8 py-4 rounded-3xl text-sm font-black flex items-center gap-3 shadow-2xl shadow-brand/30 hover:translate-y-[-2px] transition-all cursor-pointer"
          >
            <Plus size={20} /> Nouveau Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((t, i) => (
              <motion.div 
                key={t.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-brand/30 transition-all bg-[#121318]"
              >
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    t.priority === 'Critique' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-brand/10 text-brand border-brand/20"
                  )}>
                    {t.priority}
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
                    t.status === 'Résolu' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/10 text-white border-white/10"
                  )}>
                    {t.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white mb-3 group-hover:text-brand transition-colors line-clamp-1">{t.subject}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 italic">« {t.description} »</p>
                </div>
                <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                    <Zap size={10} className="text-brand" />
                    <span className="text-[10px] font-mono font-black text-gray-300">{t.meterId}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold ml-auto font-mono">
                    {t.timestamp ? format(new Date(t.timestamp), 'dd MMM, HH:mm') : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTickets.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center gap-6 glass-panel rounded-[3rem] border-white/5 bg-[#121318]">
              <div className="p-8 bg-white/5 rounded-full"><Inbox size={48} className="text-gray-400" /></div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400 text-center px-12">Vous n'avez aucune requête en cours de traitement pour le moment</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Admin / Service Desk View
  return (
    <motion.div key="tickets-admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Service <span className="text-brand">Desk</span> AMI</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Support Technique · Gestion des Incidents & Réclamations NIGELEC</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={exportTicketsCSV}
            className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-gray-300 hover:text-white uppercase tracking-widest transition-all cursor-pointer shadow"
          >
            <Download size={16} className="inline mr-2 text-brand" /> Exporter Registre CSV
          </button>
          <button 
            onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }}
            className="btn-primary px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 cursor-pointer shadow-xl shadow-brand/20"
          >
            <Plus size={20} /> Ouvrir un Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Nouveaux Tickets" count={tickets.filter(t => t.status === 'Nouveau' || (t.status as any) === 'new').length} icon={Inbox} color="text-brand" glow="bg-brand" />
        <StatsCard title="En Cours / Attente" count={tickets.filter(t => t.status === 'Ouvert' || t.status === 'En attente' || (t.status as any) === 'open').length} icon={Clock} color="text-blue-400" glow="bg-blue-500" />
        <StatsCard title="Requêtes Résolues" count={tickets.filter(t => t.status === 'Résolu' || (t.status as any) === 'resolved').length} icon={CheckCircle2} color="text-green-500" glow="bg-green-500" />
        <StatsCard title="Priorité Critique" count={tickets.filter(t => t.priority === 'Critique' || (t.priority as any) === 'critical').length} icon={AlertTriangle} color="text-red-500" glow="bg-red-500" />
      </div>

      <div className="glass-panel overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl bg-[#121318]">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="flex bg-white/5 rounded-2xl p-1 shadow-inner">
            {[
              { id: 'all', label: 'Flux Global' },
              { id: 'new', label: 'Nouveaux' },
              { id: 'open', label: 'En Cours' },
              { id: 'resolved', label: 'Résolus' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  activeTab === tab.id ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4 flex-1 max-w-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={16} />
              <input 
                type="text"
                placeholder="N° TICKET, COMPTEUR, SUJET..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full bg-[#14151a] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] font-black uppercase text-white focus:border-brand outline-none transition-all placeholder:text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-4 py-4">Référence Ticket</th>
                <th className="px-4 py-4">Détail du Problème</th>
                <th className="px-4 py-4 text-center">Priorité</th>
                <th className="px-4 py-4 text-center">Statut</th>
                <th className="px-4 py-4">Assignation</th>
                <th className="px-4 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="group transition-all">
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex flex-col gap-1">
                      <p className="font-mono text-xs font-black text-brand tracking-widest">{ticket.id}</p>
                      <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase font-mono">
                        <Calendar size={10} /> {ticket.timestamp ? format(new Date(ticket.timestamp), 'dd/MM/yyyy') : ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors max-w-sm">
                    <p className="text-sm font-black text-white leading-tight mb-1 group-hover:text-brand transition-colors tracking-tight">{ticket.subject}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mb-2 italic">« {ticket.description} »</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-lg text-[9px] text-gray-300 font-black uppercase tracking-widest border border-white/5 font-mono">
                        <Zap size={10} className="text-brand" /> {ticket.meterId || 'Non Spécifié'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex justify-center">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        ticket.priority === 'Critique' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        ticket.priority === 'Haute' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                        ticket.priority === 'Normale' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                           ticket.priority === 'Critique' || ticket.priority === 'Haute' ? "bg-red-400 animate-pulse" : "bg-gray-400"
                        )} />
                        {ticket.priority}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex justify-center">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase border",
                        ticket.status === 'Résolu' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-gray-300 border-white/10 shadow-xl"
                      )}>
                        {ticket.status === 'Résolu' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {ticket.status}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 ring-1 ring-white/10 group-hover:ring-brand/30 group-hover:bg-brand/5 transition-all">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white leading-none mb-1">{ticket.assignedTo || 'Non assigné'}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Astreinte NIGELEC</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl text-right group-hover:bg-white/[0.05] transition-colors">
                    <button 
                      onClick={() => { setEditingTicket(ticket); setIsTicketModalOpen(true); }} 
                      className="p-3 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-2xl hover:bg-brand hover:border-brand transition-all group/btn shadow-lg cursor-pointer"
                      title="Modifier ou traiter le ticket"
                    >
                      <Edit size={16} className="group-hover/btn:scale-110 transition-transform"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTickets.length === 0 && (
            <div className="py-20 text-center">
              <Inbox size={48} className="mx-auto text-white/10 mb-4" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">0 incident en attente dans ce registre</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
