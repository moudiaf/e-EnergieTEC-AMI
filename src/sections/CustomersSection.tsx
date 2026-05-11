import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Search, Users, UserCheck, UserX, User, Phone, Mail, X, Eye, Zap, CreditCard, Calendar } from 'lucide-react';
import { Customer, Meter } from '../types';
import { maskEmail, maskPhone } from '../utils/privacy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Mappings ──────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  domestic:   'Domestique BT',
  social:     'Tranche Sociale',
  commercial: 'Professionnel BT',
  industrial: 'Industriel / MT',
};
const TYPE_COLORS: Record<string, string> = {
  domestic:   'bg-brand/10 text-brand border-brand/20',
  social:     'bg-green-500/10 text-green-400 border-green-500/20',
  commercial: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  industrial: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
};
const STATUS_LABELS: Record<string, string> = {
  active:    'Actif',
  inactive:  'Inactif',
  suspended: 'Suspendu',
};
const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  inactive:  'bg-gray-500/10 text-gray-400 border-gray-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const AVATAR_COLORS = [
  'bg-brand/20 text-brand', 'bg-green-500/20 text-green-400',
  'bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400',
  'bg-yellow-500/20 text-yellow-400',
];

interface CustomersSectionProps {
  customers: Customer[];
  customerStatusFilter: string;
  setCustomerStatusFilter: (filter: string) => void;
  setEditingCustomer: (customer: Customer | null) => void;
  setIsCustomerModalOpen: (open: boolean) => void;
  handleDeleteCustomer: (id: string) => void;
  setViewingMeter: (meter: Meter | null) => void;
  meters: Meter[];
  setCurrentSection: (section: string) => void;
}

export const CustomersSection = ({
  customers,
  customerStatusFilter,
  setCustomerStatusFilter,
  setEditingCustomer,
  setIsCustomerModalOpen,
  handleDeleteCustomer,
  setViewingMeter,
  meters,
  setCurrentSection,
}: CustomersSectionProps) => {
  const [search, setSearch] = React.useState('');
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);

  // ─── KPIs ─────────────────────────────────────────────────────
  const activeCount    = customers.filter(c => c.status === 'active').length;
  const suspendedCount = customers.filter(c => c.status === 'suspended').length;
  const inactiveCount  = customers.filter(c => c.status === 'inactive').length;
  const totalMeters    = customers.reduce((s, c) => s + (c.meters || 0), 0);

  // ─── Filtres + Recherche ───────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = customers.filter(c =>
      customerStatusFilter === 'all' || c.status === customerStatusFilter
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, customerStatusFilter, search]);

  const FILTERS = [
    { key: 'all',       label: 'Tous',      count: customers.length,  icon: Users },
    { key: 'active',    label: 'Actifs',    count: activeCount,       icon: UserCheck },
    { key: 'inactive',  label: 'Inactifs',  count: inactiveCount,     icon: User },
    { key: 'suspended', label: 'Suspendus', count: suspendedCount,    icon: UserX },
  ] as const;

  // Compteurs d'un client
  const getCustomerMeters = (customerId: string) =>
    meters.filter(m => m.customerId === customerId);

  return (
    <motion.div
      key="customers"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >

      {/* ── Modal Fiche Client ───────────────────────────────────── */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setViewingCustomer(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 border border-brand/30 w-full max-w-lg shadow-[0_0_60px_rgba(255,107,53,0.15)] mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black",
                  AVATAR_COLORS[viewingCustomer.id.charCodeAt(1) % AVATAR_COLORS.length])}>
                  {viewingCustomer.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase border", TYPE_COLORS[viewingCustomer.type] || 'bg-white/10 text-gray-400')}>
                      {TYPE_LABELS[viewingCustomer.type] || viewingCustomer.type}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase border", STATUS_COLORS[viewingCustomer.status] || 'bg-white/10 text-gray-400')}>
                      {STATUS_LABELS[viewingCustomer.status] || viewingCustomer.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{viewingCustomer.name}</h3>
                  <p className="text-xs text-gray-500">ID: {viewingCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Coordonnées */}
            <div className="space-y-2 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={13} className="text-gray-500 shrink-0" />
                <span className="text-gray-300 font-mono">{maskEmail(viewingCustomer.email)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={13} className="text-gray-500 shrink-0" />
                <span className="text-gray-300 font-mono">{maskPhone(viewingCustomer.phone)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={13} className="text-gray-500 shrink-0" />
                <span className="text-gray-300">{viewingCustomer.address || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={13} className="text-gray-500 shrink-0" />
                <span className="text-gray-300">Abonné depuis le {viewingCustomer.joinDate}</span>
              </div>
            </div>

            {/* Compteurs liés */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                Compteurs AMI ({getCustomerMeters(viewingCustomer.id).length})
              </h4>
              {getCustomerMeters(viewingCustomer.id).length === 0 ? (
                <p className="text-xs text-gray-600 italic">Aucun compteur associé</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {getCustomerMeters(viewingCustomer.id).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs font-black text-white">{m.id}</p>
                        <p className="text-[10px] text-gray-500">{m.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", (m.credit || 0) < 5 ? 'text-brand' : 'text-green-400')}>
                          {(m.credit || 0).toFixed(1)} kWh
                        </span>
                        <button
                          onClick={() => { setViewingMeter(m); setCurrentSection('map'); setViewingCustomer(null); }}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                        >
                          <MapPin size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingCustomer(viewingCustomer); setIsCustomerModalOpen(true); setViewingCustomer(null); }}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-xs font-black uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Edit size={14} /> Modifier
              </button>
              <button
                onClick={() => { handleDeleteCustomer(viewingCustomer.id); setViewingCustomer(null); }}
                className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── KPI Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Abonnés',    value: customers.length, icon: Users,      color: 'text-white',     bg: 'from-white/5' },
          { label: 'Actifs',           value: activeCount,     icon: UserCheck,  color: 'text-green-400', bg: 'from-green-500/10' },
          { label: 'Suspendus',        value: suspendedCount,  icon: UserX,      color: 'text-red-400',   bg: 'from-red-500/10' },
          { label: 'Compteurs liés',   value: totalMeters,     icon: Zap,        color: 'text-brand',     bg: 'from-brand/10' },
        ].map((k, i) => (
          <div key={i} className={cn("glass-panel p-5 rounded-2xl border border-white/5 bg-gradient-to-br to-transparent", k.bg)}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{k.label}</p>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={cn("text-2xl font-black", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôle ──────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setCustomerStatusFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2",
                customerStatusFilter === f.key
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <f.icon size={12} />
              {f.label}
              <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-black",
                customerStatusFilter === f.key ? "bg-white/20 text-white" : "bg-white/5 text-gray-400"
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Recherche + Ajouter */}
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Nom, ID, email, type..."
              className="input-field pl-8 py-2 text-sm w-full sm:w-56"
            />
          </div>
          <button
            onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
            className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold whitespace-nowrap"
          >
            <Plus size={16} /> Nouveau Client
          </button>
        </div>
      </div>

      {/* ── Tableau ────────────────────────────────────────────── */}
      <div className="glass-panel overflow-hidden rounded-3xl border border-white/5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-gray-500">
            <Search size={40} className="opacity-30" />
            <p className="text-sm font-bold">Aucun client ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarif NIGELEC</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compteurs</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Crédit</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((customer, idx) => {
                  const customerMeters = getCustomerMeters(customer.id);
                  const firstMeter    = customerMeters[0];
                  const totalCredit   = customerMeters.reduce((s, m) => s + (m.credit || 0), 0);
                  const hasLowCredit  = customerMeters.some(m => (m.credit || 0) < 5);
                  const hasTamper     = customerMeters.some(m => m.tamperStatus === 'tampered' || m.tamperStatus === 'detected');
                  const avatarColor   = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0", avatarColor)}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white group-hover:text-brand transition-colors text-sm">{customer.name}</p>
                              {hasTamper && <span className="text-[7px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded font-black uppercase">Tamper</span>}
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {customer.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono">
                            <Mail size={10} className="text-gray-500" />
                            {maskEmail(customer.email)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                            <Phone size={10} className="text-gray-500" />
                            {maskPhone(customer.phone)}
                          </div>
                        </div>
                      </td>

                      {/* Tarif */}
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase border", TYPE_COLORS[customer.type] || 'bg-white/10 text-gray-400 border-white/10')}>
                          {TYPE_LABELS[customer.type] || customer.type}
                        </span>
                      </td>

                      {/* Compteurs */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black",
                            customer.meters > 0 ? "bg-brand/10 text-brand" : "bg-white/5 text-gray-500"
                          )}>
                            {customerMeters.length || customer.meters}
                          </div>
                          {customerMeters.some(m => m.status !== 'online') && (
                            <span className="text-[8px] text-orange-400 font-black">⚠ Alerte</span>
                          )}
                        </div>
                      </td>

                      {/* Crédit consolidé */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={11} className={hasLowCredit ? "text-brand" : "text-gray-500"} />
                          <span className={cn("text-sm font-black", hasLowCredit ? "text-brand" : "text-green-400")}>
                            {totalCredit > 0 ? `${totalCredit.toFixed(1)} kWh` : '—'}
                          </span>
                          {hasLowCredit && <span className="text-[8px] text-brand/70">(bas)</span>}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                          STATUS_COLORS[customer.status] || 'bg-white/10 text-gray-400 border-white/10'
                        )}>
                          {STATUS_LABELS[customer.status] || customer.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingCustomer(customer)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                            title="Voir la fiche"
                          >
                            <Eye size={15} />
                          </button>
                          {firstMeter && (
                            <button
                              onClick={() => { setViewingMeter(firstMeter); setCurrentSection('map'); }}
                              className="p-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-lg transition-all"
                              title="Localiser sur la carte"
                            >
                              <MapPin size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="p-2 bg-red-500/5 hover:bg-red-500 text-red-500/50 hover:text-white rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pied de page */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-gray-600 font-bold pt-2">
          {filtered.length} client{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur {customers.length}
        </p>
      )}
    </motion.div>
  );
};
