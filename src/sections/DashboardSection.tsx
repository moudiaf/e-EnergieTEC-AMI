import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Coins, Microchip, AlertTriangle, Activity, Zap, ShieldCheck, Clock, MapPin, Users } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Meter, Token, Alert, User, Payment } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardSectionProps {
  tokens: Token[];
  payments: Payment[];
  meters: Meter[];
  alerts: Alert[];
  currentUser: User | null;
  handleSimulateTamper: () => void;
  handleResetTamper: (meterId: string, alertId: string) => void;
  setViewingMeter: (meter: Meter) => void;
  setCurrentSection: (section: string) => void;
}

export const DashboardSection = ({
  tokens, payments, meters, alerts, currentUser,
  handleSimulateTamper, handleResetTamper, setViewingMeter, setCurrentSection
}: DashboardSectionProps) => {

  // ─── KPIs DYNAMIQUES ──────────────────────────────────────────
  const today       = new Date().toDateString();
  const todayTokens = tokens.filter(t => new Date(t.timestamp).toDateString() === today);
  const dailySales  = todayTokens.reduce((acc, t) => acc + t.amount, 0);
  const dailyKwh    = todayTokens.reduce((acc, t) => acc + (t.kwh || 0), 0);
  const totalRevenue = tokens.reduce((acc, t) => acc + t.amount, 0);

  const onlineMeters  = meters.filter(m => m.status === 'online').length;
  const offlineMeters = meters.filter(m => m.status === 'offline').length;
  const warningMeters = meters.filter(m => m.status === 'warning').length;
  const tamperMeters  = meters.filter(m => (m as any).tamperStatus === 'detected').length;

  const criticalAlerts = alerts.filter(a => a.type === 'danger' && a.status === 'unread').length;
  const unreadAlerts   = alerts.filter(a => a.status === 'unread').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'read').length;

  const total          = meters.length || 1;
  const tauxDispo      = ((onlineMeters  / total) * 100).toFixed(1);
  const pertesReseau   = (((offlineMeters + warningMeters) / total) * 100).toFixed(1);
  const pctFraude      = ((tamperMeters  / total) * 100).toFixed(1);
  const tauxResolution = alerts.length > 0 ? ((resolvedAlerts / alerts.length) * 100).toFixed(1) : '100';

  // ─── SEGMENTS CLIENTS (réels) ──────────────────────────────────
  const domesticCount   = meters.filter(m => m.type === 'domestic' || m.type === 'social').length;
  const commercialCount = meters.filter(m => m.type === 'commercial').length;
  const industrialCount = meters.filter(m => m.type === 'industrial' || m.type === 'haute_tension').length;
  const epCount         = meters.filter(m => m.type === 'eclairage_public').length;

  const segmentsData = [
    { name: 'Domestique', value: domesticCount,   pct: Math.round((domesticCount   / total) * 100), color: '#ff6b35' },
    { name: 'Commercial', value: commercialCount,  pct: Math.round((commercialCount / total) * 100), color: '#00A651' },
    { name: 'Industriel', value: industrialCount,  pct: Math.round((industrialCount / total) * 100), color: '#3b82f6' },
    { name: 'Éclairage',  value: epCount,           pct: Math.round((epCount          / total) * 100), color: '#f59e0b' },
  ].filter(s => s.value > 0);

  // ─── CANAUX DE VENTE (réels) ───────────────────────────────────
  const salesByChannel = [
    { name: 'Orange',  value: payments.filter(p => p.operator === 'Orange').reduce((s, p) => s + p.amount, 0),                   color: '#ff6b35' },
    { name: 'Airtel',  value: payments.filter(p => p.operator === 'Airtel').reduce((s, p) => s + p.amount, 0),                   color: '#ef4444' },
    { name: 'Digital', value: payments.filter(p => ['NITA','AMANA'].includes(p.operator)).reduce((s, p) => s + p.amount, 0),     color: '#3b82f6' },
    { name: 'Espèces', value: payments.filter(p => ['CASH','AGENCY'].includes(p.operator)).reduce((s, p) => s + p.amount, 0),    color: '#f59e0b' },
  ];

  // ─── PROFIL DE CHARGE (hémolyse sur tokens) ──────────────────
  const HOURS = [0, 4, 8, 12, 16, 20, 23];
  const hourlyData = HOURS.map((h, i) => {
    const nextH = HOURS[i + 1] || 24;
    const sliceTokens = tokens.filter(t => {
      const th = new Date(t.timestamp).getHours();
      return th >= h && th < nextH;
    });
    const cons = sliceTokens.reduce((s, t) => s + (t.kwh || 0), 0);
    const base = 80 + i * 70;
    return {
      name: h === 23 ? '23:59' : `${String(h).padStart(2,'0')}:00`,
      cons: Math.round(cons || base),
      prod: Math.round((cons || base) * 1.05 + 10),
    };
  });

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div className="relative glass-panel p-8 rounded-[40px] border border-white/5 overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/10 rounded-full blur-[120px] -mr-40 -mt-40 mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-niger-green/5 rounded-full blur-[100px] -ml-20 -mb-20 mix-blend-screen" />

        {/* Drapeau Niger */}
        <div className="absolute top-6 right-8 flex flex-col items-end gap-2 opacity-80">
          <div className="w-16 h-10 rounded shadow-2xl overflow-hidden border border-white/20 flex flex-col">
            <div className="h-1/3 bg-[#ff6b35]" />
            <div className="h-1/3 bg-white flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b35]" />
            </div>
            <div className="h-1/3 bg-[#00A651]" />
          </div>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">République du Niger</p>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-niger-green/20 border border-brand/30 text-[10px] font-black uppercase text-white tracking-widest animate-pulse">
                Réseau Intelligent NIGELEC
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", Number(pctFraude) > 2 ? "bg-red-500" : "bg-green-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  {Number(pctFraude) > 2 ? `⚠ Fraude: ${pctFraude}%` : 'Réseau Stable'}
                </span>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={handleSimulateTamper}
                  className="ml-2 px-4 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase text-red-500 hover:bg-red-500 hover:text-white transition-all tracking-widest flex items-center gap-2 group"
                >
                  <AlertTriangle size={14} className="group-hover:animate-bounce" />
                  Simuler Fraude
                </button>
              )}
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">
              Supervision <span className="text-brand">Nationale</span> <span className="text-niger-green">Niger</span>
            </h2>
            <p className="text-gray-400 font-medium max-w-xl">
              Analyse en temps réel de la consommation, des ventes STS et de l'intégrité du réseau intelligent nigérien.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass-panel p-4 px-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Disponibilité</p>
              <div className={cn("text-2xl font-black text-center", Number(tauxDispo) >= 90 ? "text-green-400" : "text-orange-400")}>{tauxDispo}%</div>
            </div>
            <div className="glass-panel p-4 px-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Pertes Réseau</p>
              <div className={cn("text-2xl font-black text-center", Number(pertesReseau) <= 5 ? "text-niger-green" : "text-red-400")}>{pertesReseau}%</div>
            </div>
            <div className="glass-panel p-4 px-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Alertes Ouvertes</p>
              <div className={cn("text-2xl font-black text-center", unreadAlerts > 5 ? "text-red-400" : "text-white")}>{unreadAlerts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventes du Jour"    value={dailySales.toLocaleString()} unit="FCFA"              icon={Coins}         trend={`+${todayTokens.length} tx`}              color="bg-brand" />
        <StatCard title="Énergie Délivrée"  value={dailyKwh.toFixed(1)}         unit="kWh"               icon={Zap}           trend={`Cumul: ${totalRevenue.toLocaleString()} FCFA`} color="bg-niger-green" />
        <StatCard title="Compteurs Actifs"  value={onlineMeters.toString()}      unit={`/ ${meters.length}`} icon={Microchip}  color="bg-blue-500" />
        <StatCard title="Alertes Critiques" value={criticalAlerts.toString()}    icon={AlertTriangle}     color="bg-red-500"  trend={criticalAlerts > 5 ? "⚠ Action requise" : "✓ Normal"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* ── Graphique Profil de Charge ──────────────────────── */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-brand/20 to-niger-green/20 text-brand">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Profil de Charge (24h)</h3>
                  <p className="text-sm text-gray-500">Flux d'énergie sur l'ensemble du réseau NIGELEC</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-brand inline-block rounded" />Consommation</span>
                <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-niger-green inline-block rounded" />Production</span>
              </div>
            </div>
            <div className="h-[300px] w-full" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00A651" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00A651" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4b5563',fontSize:10,fontWeight:'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#4b5563',fontSize:10,fontWeight:'bold'}} />
                  <Tooltip
                    formatter={(v: any, name: string) => [`${Number(v).toFixed(1)} kWh`, name === 'cons' ? 'Consommation' : 'Production']}
                    contentStyle={{ backgroundColor:'rgba(10,10,11,0.95)', border:'1px solid rgba(255,107,53,0.3)', borderRadius:'16px' }}
                    cursor={{ stroke:'#ff6b35', strokeWidth:1, strokeDasharray:'4 4' }}
                  />
                  <Area type="monotone" dataKey="cons" stroke="#ff6b35" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" animationDuration={2000} />
                  <Area type="monotone" dataKey="prod" stroke="#00A651" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ── Canaux de Vente ─────────────────────────────── */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-3">
                <Coins size={20} className="text-orange-400" />
                Canaux de Vente
                <span className="ml-auto text-xs text-gray-500 font-normal">{payments.length} tx</span>
              </h4>
              {salesByChannel.every(s => s.value === 0) ? (
                <div className="h-[160px] flex items-center justify-center text-gray-500 text-sm">Aucun paiement</div>
              ) : (
                <div className="h-[160px] w-full" style={{ height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={salesByChannel} barSize={28}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#4b5563',fontSize:10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#4b5563',fontSize:9}} />
                      <Tooltip
                        formatter={(v: any) => [`${Number(v).toLocaleString()} FCFA`]}
                        contentStyle={{ backgroundColor:'#111', border:'none', borderRadius:'8px' }}
                      />
                      <Bar dataKey="value" radius={[6,6,0,0]}>
                        {salesByChannel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {salesByChannel.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-400 truncate">{s.name}:</span>
                    <span className="font-bold text-white">{s.value.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Intégrité Réseau ─────────────────────────────── */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5">
              <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                <ShieldCheck size={20} className="text-green-400" />
                Intégrité Réseau
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Disponibilité Compteurs</span>
                    <span className={Number(tauxDispo) >= 90 ? "text-green-400" : "text-orange-400"}>{tauxDispo}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${tauxDispo}%` }} transition={{ duration: 1.5 }}
                      className={cn("h-full rounded-full", Number(tauxDispo) >= 90 ? "bg-green-500" : "bg-orange-500")} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Résolution Alertes</span>
                    <span className="text-white">{tauxResolution}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${tauxResolution}%` }} transition={{ duration: 1.5, delay: 0.2 }}
                      className="h-full bg-niger-green rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Fraudes Détectées</span>
                    <span className={Number(pctFraude) > 2 ? "text-red-400" : "text-green-400"}>{pctFraude}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(Number(pctFraude) * 10, 100)}%` }} transition={{ duration: 1.5, delay: 0.4 }}
                      className={cn("h-full rounded-full", Number(pctFraude) > 2 ? "bg-red-500" : "bg-green-500/30")} />
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-black text-green-400">{onlineMeters}</p><p className="text-[9px] text-gray-500 uppercase font-bold">En ligne</p></div>
                  <div><p className="text-lg font-black text-orange-400">{warningMeters}</p><p className="text-[9px] text-gray-500 uppercase font-bold">Alerte</p></div>
                  <div><p className="text-lg font-black text-red-400">{offlineMeters}</p><p className="text-[9px] text-gray-500 uppercase font-bold">Hors ligne</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Colonne Droite ──────────────────────────────────────── */}
        <div className="space-y-8">
          {/* Segments Clients */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Users size={20} className="text-brand" />
              Segments Clients
            </h3>
            <div className="h-[200px] w-full relative" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <RePieChart>
                  <Pie
                    data={segmentsData.length > 0 ? segmentsData : [{ name: 'Aucun', value: 1, color: '#ffffff10' }]}
                    innerRadius={60} outerRadius={80} paddingAngle={6} dataKey="value" strokeWidth={0}
                  >
                    {(segmentsData.length > 0 ? segmentsData : [{ color: '#ffffff10' }]).map((entry, i) => (
                      <Cell key={i} fill={entry.color || '#ffffff10'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, name: string) => [`${v} compteurs`, name]}
                    contentStyle={{ backgroundColor:'#111', border:'none', borderRadius:'8px' }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black">{meters.length}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Compteurs</span>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {segmentsData.map(s => (
                <div key={s.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}44` }} />
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{s.value}</span>
                    <span className="text-sm font-black text-white">{s.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertes Récentes */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold flex items-center gap-3">
                <Clock size={20} className="text-brand" />
                Alertes Récentes
              </h4>
              <button onClick={() => setCurrentSection('alerts')}
                className="text-[10px] font-black uppercase text-brand tracking-widest hover:underline">
                Tout voir
              </button>
            </div>
            <div className="space-y-5">
              {alerts.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">Aucune alerte</p>
              ) : alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex gap-4 group cursor-pointer border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className={cn("mt-1 w-2 h-2 rounded-full flex-shrink-0 animate-pulse",
                    alert.type === 'danger'  ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                    alert.type === 'warning' ? "bg-orange-500" : "bg-green-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-brand transition-colors mb-1 truncate">{alert.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed line-clamp-2">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
                        {format(new Date(alert.timestamp), 'HH:mm', { locale: fr })} • {alert.type.toUpperCase()}
                      </p>
                      {alert.meterId && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const m = meters.find(met => met.id === alert.meterId);
                              if (m) { setViewingMeter(m); setCurrentSection('map'); }
                            }}
                            className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1"
                          >
                            <MapPin size={8} /> Voir
                          </button>
                          {alert.type === 'danger' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleResetTamper(alert.meterId!, alert.id); }}
                              className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[8px] font-black uppercase tracking-tighter hover:bg-brand hover:text-white transition-all"
                            >
                              Levée
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
