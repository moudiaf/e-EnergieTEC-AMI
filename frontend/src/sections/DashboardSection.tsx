import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Coins, Microchip, AlertTriangle, Activity, Zap, ShieldCheck, Clock, MapPin, Users, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Meter, Token, Alert, User, Payment } from '../types';
import { useAmi } from '../context/AmiContext';
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

  const { handleReadTelemetry, addToast } = useAmi();
  const [refreshingMeterId, setRefreshingMeterId] = React.useState<string | null>(null);

  const handleLiveRefresh = async (meterId: string) => {
    setRefreshingMeterId(meterId);
    try {
      if (handleReadTelemetry) {
        await handleReadTelemetry(meterId);
        addToast(`⚡ Télémesure DLMS actualisée pour ${meterId}`, 'success');
      }
    } catch (err: any) {
      addToast(`Erreur lecture DLMS : ${err.message}`, 'error');
    } finally {
      setRefreshingMeterId(null);
    }
  };

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

  const total          = meters.length;
  const dispoRate       = total > 0 ? (onlineMeters / total) * 100 : 0;
  const pertesRate      = total > 0 ? (100 - dispoRate) : 0;
  const fraudeRate      = total > 0 ? (tamperMeters / total) * 100 : 0;
  const resolutionRate  = alerts.length > 0 ? (resolvedAlerts / alerts.length) * 100 : 0;

  const tauxDispoStr      = total > 0 ? `${dispoRate.toFixed(1)}%` : 'N/A';
  const pertesReseauStr   = total > 0 ? `${pertesRate.toFixed(1)}%` : 'N/A';
  const pctFraudeStr      = total > 0 ? `${fraudeRate.toFixed(1)}%` : 'N/A';
  const tauxResolutionStr = alerts.length > 0 ? `${resolutionRate.toFixed(1)}%` : 'N/A';

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
    { name: 'Airtel',  value: payments.filter(p => p.operator === 'Airtel').reduce((s, p) => s + p.amount, 0),                   color: '#00A651' },
    { name: 'Portail', value: payments.filter(p => ['NITA','AMANA'].includes(p.operator)).reduce((s, p) => s + p.amount, 0),     color: '#1a1a1a' },
    { name: 'Agence',  value: payments.filter(p => ['CASH','AGENCY'].includes(p.operator)).reduce((s, p) => s + p.amount, 0),    color: '#262626' },
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
    return {
      name: h === 23 ? '23:59' : `${String(h).padStart(2,'0')}:00`,
      cons: Math.round(cons),
      prod: Math.round(cons * 1.05),
    };
  });

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12 relative"
    >
      {/* ── SCADA Smart Grid Vector Telemetry Background ──────── */}
      <div className="absolute -inset-x-8 -top-8 bottom-0 pointer-events-none overflow-hidden -z-10">
        {/* Grille technique haute précision */}
        <div className="absolute inset-0 scada-grid-pattern opacity-40" />

        {/* Halos volumétriques Mesh Gradient (Ambre NIGELEC + Vert Niger + Bleu Dispatching) */}
        <div className="absolute -top-24 right-1/4 w-[650px] h-[450px] bg-brand/12 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute top-1/3 -left-32 w-[550px] h-[550px] bg-niger-green/10 rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-blue-500/8 rounded-full blur-[130px] mix-blend-screen" />

        {/* Lignes de flux vectorielles SCADA (interconnexions Haute Tension) */}
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="scadaLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00A651" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="scadaLineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00A651" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <path d="M 50 140 L 260 140 L 360 240 L 680 240 L 760 180 L 1150 180" fill="none" stroke="url(#scadaLineGrad1)" strokeWidth="1.2" strokeDasharray="6 6" />
          <path d="M 80 420 L 340 420 L 460 540 L 920 540 L 1020 460 L 1350 460" fill="none" stroke="url(#scadaLineGrad2)" strokeWidth="1" strokeDasharray="8 4" />
          <path d="M 550 60 L 550 280 L 700 420 L 700 780" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* Points nodaux de dispatching avec pulsation */}
          <circle cx="360" cy="240" r="3" fill="#ff6b35" className="animate-pulse" />
          <circle cx="680" cy="240" r="2.5" fill="#38bdf8" />
          <circle cx="460" cy="540" r="3" fill="#00A651" className="animate-pulse" />
          <circle cx="920" cy="540" r="2.5" fill="#ff6b35" />
        </svg>
      </div>

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <div className="relative glass-panel p-8 rounded-[36px] border border-white/10 overflow-hidden bg-gradient-to-br from-[#0e172a]/90 via-[#0a0f1d]/85 to-[#060913]/95 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Subtle grid texture inside the banner */}
        <div className="absolute inset-0 scada-grid-pattern opacity-30 pointer-events-none" />

        {/* Top edge light reflection */}
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/15 rounded-full blur-[120px] -mr-40 -mt-40 mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-niger-green/10 rounded-full blur-[100px] -ml-20 -mb-20 mix-blend-screen pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {/* Badge République du Niger */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-inner">
                <div className="w-5 h-3 rounded-[2px] overflow-hidden flex flex-col border border-white/20">
                  <div className="h-1/3 bg-[#ff6b35]" />
                  <div className="h-1/3 bg-white flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#ff6b35]" />
                  </div>
                  <div className="h-1/3 bg-[#00A651]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">République du Niger</span>
              </div>

              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-niger-green/20 border border-brand/40 text-[10px] font-black uppercase text-white tracking-widest animate-pulse shadow-[0_0_15px_rgba(255,107,53,0.15)]">
                Réseau Intelligent NIGELEC
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", fraudeRate > 2 ? "bg-red-500" : "bg-green-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  {fraudeRate > 2 ? `⚠ Fraude: ${pctFraudeStr}` : 'Réseau Stable'}
                </span>
              </div>
              <button
                onClick={() => setCurrentSection('statistics')}
                className="ml-2 px-4 py-1.5 rounded-xl bg-brand/10 border border-brand/30 text-[10px] font-black uppercase text-brand hover:bg-brand hover:text-white transition-all tracking-widest flex items-center gap-2 group cursor-pointer shadow-sm"
              >
                <Activity size={14} className="group-hover:animate-pulse" />
                Statistiques Réseau
              </button>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">
              Supervision <span className="text-brand">Nationale</span>
            </h2>
            <p className="text-gray-400 font-medium max-w-xl">
              Analyse en temps réel de la consommation, des ventes STS et de l'intégrité du réseau intelligent nigérien.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass-panel p-4 px-6 rounded-2xl bg-black/40 border border-white/10 shadow-lg">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Disponibilité</p>
              <div className={cn("text-2xl font-black text-center", dispoRate >= 90 ? "text-green-400" : "text-orange-400")}>{tauxDispoStr}</div>
            </div>
            <div className="glass-panel p-4 px-6 rounded-2xl bg-black/40 border border-white/10 shadow-lg">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Pertes Réseau</p>
              <div className={cn("text-2xl font-black text-center", pertesRate <= 5 ? "text-niger-green" : "text-red-400")}>{pertesReseauStr}</div>
            </div>
            <div className="glass-panel p-4 px-6 rounded-2xl bg-black/40 border border-white/10 shadow-lg">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Alertes Ouvertes</p>
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

      {/* ── MESURES ÉLECTRIQUES EN DIRECT DU RÉSEAU (DLMS/COSEM TEMPS RÉEL) ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden bg-gradient-to-br from-[#0c1322]/95 via-[#080d19]/90 to-[#04060d]/95">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
              <Zap size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                  Mesures Électriques en Direct <span className="text-cyan-400 font-mono">(DLMS/COSEM)</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  GPRS HES TEMPS RÉEL
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Télésurveillance instantanée des grandeurs électriques : Tension Réseau, Intensité du Courant et Puissance Active.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => meters.forEach(m => handleLiveRefresh(m.id))}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <RefreshCw size={14} className={refreshingMeterId ? "animate-spin" : ""} />
              Télérelever Tout
            </button>
          </div>
        </div>

        {/* Grille des compteurs connectés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {meters.map((meter) => {
            const isTri = meter.phaseType === 'triphase';
            const volt = isTri ? (meter.voltage || 400) : (meter.voltage || 230);
            const rawCurrent = (meter as any).current || 0;
            const pKw = (meter.power && meter.power > 0) 
              ? meter.power 
              : (rawCurrent > 0 ? +((volt * rawCurrent * ((meter as any).powerFactor || 0.98)) / 1000).toFixed(3) : 0);
            const currentAmp = rawCurrent > 0 
              ? rawCurrent.toFixed(2) 
              : (volt > 0 ? ((pKw * 1000) / volt).toFixed(2) : '0.00');
            const isRefreshing = refreshingMeterId === meter.id;

            return (
              <div
                key={meter.id}
                className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/40 transition-all space-y-4 shadow-inner"
              >
                {/* Entête Compteur */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      meter.status === 'online' ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" : "bg-red-500"
                    )} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-white">{meter.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                          isTri ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        )}>
                          {isTri ? "3φ Triphasé (400V)" : "1φ Monophasé (230V)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{meter.location} • Régime {isTri ? 'Triphasé' : 'Monophasé'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono border",
                      meter.relayStatus === 'OPEN' 
                        ? "bg-red-500/20 text-red-400 border-red-500/30" 
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    )}>
                      {meter.relayStatus === 'OPEN' ? "⚡ RELAIS OUVERT" : "✓ RELAIS EN SERVICE"}
                    </span>
                  </div>
                </div>

                {/* 3 Mesures Majeures (Tension, Intensité, Puissance) */}
                <div className="grid grid-cols-3 gap-3">
                  {/* 1. Tension Réseau */}
                  <div className="bg-slate-900/90 border border-white/5 rounded-xl p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                      <Zap size={13} /> Tension Réseau
                    </div>
                    <div className="text-2xl font-mono font-black text-amber-300">
                      {volt.toFixed(1)} <span className="text-xs font-sans text-gray-400">V</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold">
                      {isTri ? "U12 Composée (400V)" : "Phase-N Simple (230V)"}
                    </div>
                  </div>

                  {/* 2. Intensité du Courant */}
                  <div className="bg-slate-900/90 border border-white/5 rounded-xl p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                      <Activity size={13} /> Intensité
                    </div>
                    <div className="text-2xl font-mono font-black text-cyan-300">
                      {currentAmp} <span className="text-xs font-sans text-gray-400">A</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold">
                      Courant Efficace RMS
                    </div>
                  </div>

                  {/* 3. Puissance Active */}
                  <div className="bg-slate-900/90 border border-white/5 rounded-xl p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-brand uppercase tracking-wider mb-1">
                      <Radio size={13} /> Puissance
                    </div>
                    <div className="text-2xl font-mono font-black text-brand">
                      {pKw.toFixed(2)} <span className="text-xs font-sans text-gray-400">kW</span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold">
                      {Math.round(pKw * 1000)} W instantanés
                    </div>
                  </div>
                </div>

                {/* Barre de métadonnées et actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs text-gray-400">
                  <div className="flex items-center gap-4 font-mono text-[11px]">
                    <div>Fréquence : <span className="text-white font-bold">50.0 Hz</span></div>
                    <div>cos φ : <span className="text-white font-bold">0.98</span></div>
                    <div>Solde : <span className="text-emerald-400 font-bold">{(meter.credit || 0).toFixed(2)} kWh</span></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLiveRefresh(meter.id)}
                      disabled={isRefreshing}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={12} className={cn(isRefreshing ? "animate-spin text-cyan-400" : "")} />
                      {isRefreshing ? "Lecture..." : "Télérelever"}
                    </button>
                    <button
                      onClick={() => {
                        setViewingMeter(meter);
                        setCurrentSection('meters');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Fiche Complète
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* ── Graphique Profil de Charge ──────────────────────── */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
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
            <div className="h-[300px] w-full relative overflow-hidden" style={{ minHeight: '300px', minWidth: '0' }}>
              <ResponsiveContainer width="100%" height={300} minWidth={0} debounce={50}>
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
            <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <h4 className="text-lg font-bold mb-4 flex items-center gap-3">
                <Coins size={20} className="text-orange-400" />
                Canaux de Vente
                <span className="ml-auto text-xs text-gray-500 font-normal">{payments.length} tx</span>
              </h4>
              {salesByChannel.every(s => s.value === 0) ? (
                <div className="h-[160px] flex items-center justify-center text-gray-500 text-sm">Aucun paiement</div>
              ) : (
                <div className="h-[160px] w-full relative overflow-hidden" style={{ minHeight: '160px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height={160} minWidth={0} debounce={50}>
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
            <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                <ShieldCheck size={20} className="text-green-400" />
                Intégrité Réseau
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Disponibilité Compteurs</span>
                    <span className={dispoRate >= 90 ? "text-green-400" : "text-orange-400"}>{tauxDispoStr}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${dispoRate}%` }} transition={{ duration: 1.5 }}
                      className={cn("h-full rounded-full", dispoRate >= 90 ? "bg-green-500" : "bg-orange-500")} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Résolution Alertes</span>
                    <span className="text-white">{tauxResolutionStr}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${resolutionRate}%` }} transition={{ duration: 1.5, delay: 0.2 }}
                      className="h-full bg-niger-green rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span className="text-gray-500">Fraudes Détectées</span>
                    <span className={fraudeRate > 2 ? "text-red-400" : "text-green-400"}>{pctFraudeStr}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(fraudeRate * 10, 100)}%` }} transition={{ duration: 1.5, delay: 0.4 }}
                      className={cn("h-full rounded-full", fraudeRate > 2 ? "bg-red-500" : "bg-green-500/30")} />
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
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Users size={20} className="text-brand" />
              Segments Clients
            </h3>
            <div className="h-[200px] w-full relative overflow-hidden" style={{ minHeight: '200px', minWidth: '0' }}>
              <ResponsiveContainer width="100%" height={200} minWidth={0} debounce={50}>
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
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
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
