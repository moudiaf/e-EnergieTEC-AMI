import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, MapPin, Search, Users, UserCheck, UserX, User, Phone, Mail, X, Eye, Zap, CreditCard, Calendar, Clock, TrendingUp, Filter, AlertTriangle, ChevronDown, Download } from 'lucide-react';
import { Customer, Meter, Region } from '../types';
import { maskEmail, maskPhone } from '../utils/privacy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Mappings ──────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  domestic:   'Domestique BT',
  social:     'Tranche Sociale',
  commercial: 'Professionnel BT',
  industrial: 'Industriel / MT',
  mixed:      'Polyvalent (Mono + Triphasé)',
};
const TYPE_COLORS: Record<string, string> = {
  domestic:   'bg-brand/10 text-brand border-brand/20',
  social:     'bg-green-500/10 text-green-400 border-green-500/20',
  commercial: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
  industrial: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
  mixed:      'bg-amber-400/10 text-amber-300 border-amber-400/20',
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
  regions: Region[];
  setCurrentSection: (section: string) => void;
  setMeterSearch?: (s: string) => void;
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
  regions,
  setCurrentSection,
  setMeterSearch,
}: CustomersSectionProps) => {
  const [search, setSearch] = React.useState('');
  const [zoneFilter, setZoneFilter] = React.useState('all');
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);

  // ─── KPIs Réels ───────────────────────────────────────────────
  const activeCount    = customers.filter(c => c.status === 'active').length;
  const suspendedCount = customers.filter(c => c.status === 'suspended').length;
  const inactiveCount  = customers.filter(c => c.status === 'inactive').length;
  const totalMeters    = meters.length;

  // ─── Filtres + Recherche ───────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = customers.filter(c =>
      (customerStatusFilter === 'all' || c.status === customerStatusFilter) &&
      (zoneFilter === 'all' || c.regionId === zoneFilter)
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, customerStatusFilter, zoneFilter, search]);

  const FILTERS = [
    { key: 'all',       label: 'Tous',      count: customers.length,  icon: Users },
    { key: 'active',    label: 'Actifs',    count: activeCount,       icon: UserCheck },
    { key: 'inactive',  label: 'Inactifs',  count: inactiveCount,     icon: User },
    { key: 'suspended', label: 'Suspendus', count: suspendedCount,    icon: UserX },
  ] as const;

  // Compteurs d'un client
  const getCustomerMeters = (customerId: string) =>
    meters.filter(m => m.customerId === customerId);

  const exportCustomersCSV = () => {
    if (!customers.length) return;
    const headers = ['ID_Abonne', 'Nom_Prenom', 'Email', 'Telephone', 'Type_Tarif', 'Region', 'Adresse', 'Compteurs_Raccordes', 'Credit_Total_kWh', 'Statut'];
    const rows = filtered.map(c => {
      const cMeters = getCustomerMeters(c.id);
      const cred = cMeters.reduce((s, m) => s + (m.credit || 0), 0);
      return [
        c.id,
        `"${c.name}"`,
        c.email,
        c.phone,
        TYPE_LABELS[c.type] || c.type,
        c.regionId,
        `"${c.address || ''}"`,
        cMeters.length || c.meters,
        cred.toFixed(2),
        c.status
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `annuaire_abonnes_nigelec_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            className="glass-panel rounded-3xl p-8 border border-brand/30 w-full max-w-lg shadow-[0_0_60px_rgba(255,107,53,0.15)] mx-4 bg-[#121318]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg",
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
                  <p className="text-xs text-gray-400 font-mono">ID: {viewingCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Coordonnées */}
            <div className="space-y-2 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="text-gray-200 font-mono">{viewingCustomer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span className="text-gray-200 font-mono">{viewingCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span className="text-gray-200">{viewingCustomer.address || 'Adresse non renseignée'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span className="text-gray-300">Abonné depuis le {viewingCustomer.joinDate}</span>
              </div>
            </div>

            {/* Compteurs liés */}
            <div className="mb-6">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Compteurs Associés ({getCustomerMeters(viewingCustomer.id).length})
              </h4>
              {getCustomerMeters(viewingCustomer.id).length === 0 ? (
                <p className="text-xs text-gray-500 italic">Aucun compteur associé</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {getCustomerMeters(viewingCustomer.id).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <p className="text-xs font-black text-white font-mono">{m.id}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{m.phaseType === 'triphase' || (m.phaseType as any) === 'three-phase' ? 'Triphasé 3x230V' : 'Monophasé 230V'} · {m.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg border", (m.credit || 0) < 5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20')}>
                          {(m.credit || 0).toFixed(2)} kWh
                        </span>
                        <button
                          onClick={() => { setViewingMeter(m); setCurrentSection('map'); setViewingCustomer(null); }}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all cursor-pointer"
                          title="Localiser sur la carte"
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
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-200 text-xs font-black uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit size={14} /> Modifier
              </button>
              <button
                onClick={() => { handleDeleteCustomer(viewingCustomer.id); setViewingCustomer(null); }}
                className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── KPI Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Abonnés',    value: customers.length, icon: Users,      color: 'text-white',     bg: 'from-white/5', trend: '100% Intègre', trendColor: 'text-emerald-400' },
          { label: 'Actifs',           value: activeCount,     icon: UserCheck,  color: 'text-green-400', bg: 'from-green-500/10', trend: 'En Règle', trendColor: 'text-green-400' },
          { label: 'Suspendus',        value: suspendedCount,  icon: UserX,      color: 'text-red-400',   bg: 'from-red-500/10', trend: '0 Suspendu', trendColor: 'text-gray-400' },
          { label: 'Compteurs liés',   value: totalMeters,     icon: Zap,        color: 'text-brand',     bg: 'from-brand/10', trend: 'Raccordés', trendColor: 'text-brand' },
        ].map((k, i) => (
          <div key={i} className={cn("glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br to-transparent relative overflow-hidden group", k.bg)}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/5 rounded-2xl">
                <k.icon size={20} className={k.color} />
              </div>
              <div className={cn("flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/5 border border-white/10", k.trendColor)}>
                {k.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{k.label}</p>
              <p className={cn("text-3xl font-black", k.color)}>{k.value.toLocaleString()}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôle ──────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Filtres de statut */}
          <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setCustomerStatusFilter(f.key)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                  customerStatusFilter === f.key
                    ? "bg-brand text-white shadow-lg shadow-brand/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <f.icon size={12} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

          {/* Filtre de Zone */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/5">
            <Filter size={12} className="text-gray-400" />
            <select 
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#14151a]">Toutes les Zones</option>
              {regions.map(r => (
                <option key={r.id} value={r.id} className="bg-[#14151a]">{r.areaName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-64 group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="NOM, ID, EMAIL..."
              className="w-full bg-[#14151a] border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-[10px] font-bold text-white focus:outline-none focus:border-brand transition-all uppercase tracking-widest placeholder:text-gray-600"
            />
          </div>
          <button
            onClick={exportCustomersCSV}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer shadow"
            title="Exporter l'annuaire des abonnés en CSV"
          >
            <Download size={16} className="text-brand" />
          </button>
          <button
            onClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
            className="group relative px-6 py-2.5 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden cursor-pointer"
          >
            <Plus size={18} className="text-white relative z-10" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest relative z-10">Ajouter Abonné</span>
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
            <table className="w-full text-left border-separate border-spacing-y-3 px-8 pb-8">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-6 py-4">Abonné</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Zone</th>
                  <th className="px-6 py-4">Compteurs</th>
                  <th className="px-6 py-4">Crédit</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="">
                {filtered.map((customer, idx) => {
                  const customerMeters = getCustomerMeters(customer.id);
                  const totalCredit   = customerMeters.reduce((s, m) => s + (m.credit || 0), 0);
                  const hasLowCredit  = customerMeters.some(m => (m.credit || 0) < 5);
                  const hasTamper     = customerMeters.some(m => m.tamperStatus === 'tampered' || m.tamperStatus === 'detected');
                  const avatarColor   = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <tr key={customer.id} className="group transition-all">
                      {/* Abonné */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-l border-white/5 rounded-l-2xl group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-lg", avatarColor)}>
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white group-hover:text-brand transition-colors text-xs uppercase tracking-tight">{customer.name}</p>
                              {hasTamper && (
                                <span className="flex items-center gap-1 text-[7px] px-1.5 py-0.5 bg-red-600/20 text-red-500 border border-red-500/30 rounded font-black uppercase animate-pulse">
                                  <AlertTriangle size={8} /> Tamper
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 font-mono">ID: {customer.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold tracking-tight">
                            <Mail size={11} className="text-brand/60" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold tracking-tight">
                            <Phone size={11} className="text-brand/60" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <span className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border", TYPE_COLORS[customer.type] || 'bg-white/10 text-gray-400 border-white/10')}>
                          {TYPE_LABELS[customer.type] || customer.type}
                        </span>
                      </td>

                      {/* Zone */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-gray-400" />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            {regions.find(r => r.id === customer.regionId)?.areaName || customer.regionId || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Compteurs */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black border shadow-inner",
                            customerMeters.length > 0 ? "bg-brand/10 text-brand border-brand/20" : "bg-white/5 text-gray-500 border-white/10"
                          )}>
                            {customerMeters.length || customer.meters}
                          </div>
                          {customerMeters.some(m => m.status !== 'online') && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                          )}
                        </div>
                      </td>

                      {/* Crédit */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <div className="flex items-center gap-2">
                          <CreditCard size={12} className={hasLowCredit ? "text-brand" : "text-gray-400"} />
                          <span className={cn("text-xs font-black", hasLowCredit ? "text-brand animate-pulse" : "text-green-400")}>
                            {totalCredit > 0 ? `${totalCredit.toFixed(2)} kWh` : '0.00 kWh'}
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-white/5 group-hover:bg-white/[0.05] transition-colors">
                        <span className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase border flex items-center gap-2 w-fit",
                          STATUS_COLORS[customer.status] || 'bg-white/10 text-gray-400 border-white/10'
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", 
                            customer.status === 'active' ? "bg-green-400 animate-pulse" : "bg-gray-400"
                          )} />
                          {STATUS_LABELS[customer.status] || customer.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 bg-white/[0.03] border-y border-r border-white/5 rounded-r-2xl group-hover:bg-white/[0.05] transition-colors text-right">
                        <div className="flex justify-end">
                          <div className="relative group/menu">
                            <button className="flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-brand/30 cursor-pointer">
                              Actions <ChevronDown size={12} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-[#14151a] border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible translate-y-2 group-hover/menu:translate-y-0 transition-all z-50 overflow-hidden">
                              <button onClick={() => setViewingCustomer(customer)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 cursor-pointer">
                                <Eye size={14} className="text-brand" /> Voir la Fiche
                              </button>
                              <button onClick={() => { setCurrentSection('audit'); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 cursor-pointer">
                                <Clock size={14} className="text-blue-400" /> Journal d'Audit
                              </button>
                              <button onClick={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 cursor-pointer">
                                <Edit size={14} className="text-green-400" /> Modifier Infos
                              </button>
                              <button 
                                onClick={() => {
                                  if (setMeterSearch) {
                                    setMeterSearch(customer.id);
                                  }
                                  setCurrentSection('meters');
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 cursor-pointer"
                              >
                                <Zap size={14} className="text-orange-400" /> Gérer Compteurs
                              </button>
                              <button onClick={() => handleDeleteCustomer(customer.id)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                                <Trash2 size={14} /> Supprimer Compte
                              </button>
                            </div>
                          </div>
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
        <p className="text-center text-xs text-gray-400 font-bold pt-2">
          {filtered.length} abonné{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur {customers.length}
        </p>
      )}
    </motion.div>
  );
};
