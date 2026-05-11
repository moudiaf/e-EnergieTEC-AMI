import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';
import { AlertCircle, TrendingDown, TrendingUp, ShieldAlert, Zap, Coins, Activity, AlertTriangle, Eye, X } from 'lucide-react';
import { Alert, Token, Payment, Meter } from '../types';

interface AnalyticsSectionProps {
  trends?: any[];
  distribution?: any[];
  energyBalance?: any[];
  meters: Meter[];
  alerts: Alert[];
  tokens?: Token[];
  payments?: Payment[];
  onSimulateAnomaly: () => void;
  setViewingMeter?: (m: Meter) => void;
  setCurrentSection?: (s: string) => void;
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

const PALETTE = ['#ff6b35', '#00A651', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];

export const AnalyticsSection = ({
  meters, alerts, tokens = [], payments = [], onSimulateAnomaly,
  setViewingMeter, setCurrentSection
}: AnalyticsSectionProps) => {
  const [auditMeter, setAuditMeter] = useState<Meter | null>(null);

  // ─── 1. TENDANCE DE CONSOMMATION 30 DERNIERS JOURS ──────────────
  const consumptionTrend = useMemo(() => {
    const days: Record<string, { kwh: number; revenue: number }> = {};
    // Générer les 30 derniers jours
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      days[key] = { kwh: 0, revenue: 0 };
    }
    tokens.forEach(t => {
      const key = new Date(t.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      if (days[key] !== undefined) {
        days[key].kwh     += t.kwh || 0;
        days[key].revenue += t.amount || 0;
      }
    });
    return Object.entries(days).map(([name, v]) => ({
      name,
      kWh: Math.round(v.kwh * 10) / 10,
      Revenus: Math.round(v.revenue),
    }));
  }, [tokens]);

  // ─── 2. RÉPARTITION PAR SEGMENT / TYPE ──────────────────────────
  const segmentDistrib = useMemo(() => {
    const map: Record<string, { kwh: number; revenue: number; count: number }> = {};
    tokens.forEach(t => {
      const meter = meters.find(m => m.id === t.meterId);
      const type  = meter?.type || 'Inconnu';
      if (!map[type]) map[type] = { kwh: 0, revenue: 0, count: 0 };
      map[type].kwh     += t.kwh || 0;
      map[type].revenue += t.amount || 0;
      map[type].count++;
    });
    return Object.entries(map).map(([name, v]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      kWh: Math.round(v.kwh),
      Revenus: Math.round(v.revenue),
      Transactions: v.count,
    }));
  }, [tokens, meters]);

  // ─── 3. BILAN ÉNERGÉTIQUE PAR RÉGION ────────────────────────────
  const energyBalanceData = useMemo(() => {
    const regions: Record<string, { metered: number; injected: number }> = {
      'Niamey':  { metered: 0, injected: 0 },
      'Zinder':  { metered: 0, injected: 0 },
      'Maradi':  { metered: 0, injected: 0 },
      'Agadez':  { metered: 0, injected: 0 },
      'Tahoua':  { metered: 0, injected: 0 },
    };
    tokens.forEach(t => {
      const meter = meters.find(m => m.id === t.meterId);
      const loc   = meter?.location || '';
      const region = Object.keys(regions).find(r => loc.includes(r)) || 'Niamey';
      regions[region].metered += t.kwh || 0;
    });
    // Injection simulée légèrement supérieure (pertes techniques + commerciales)
    return Object.entries(regions).map(([name, v]) => {
      const metered  = Math.round(v.metered);
      const injected = Math.round(metered * (1 + (Math.random() * 0.15 + 0.05)));
      const loss     = injected > 0 ? Math.round(((injected - metered) / injected) * 100 * 10) / 10 : 0;
      return { areaName: name, injectedKwh: injected, meteredKwh: metered, lossPercentage: loss };
    });
  }, [tokens, meters]);

  const avgLoss = energyBalanceData.length > 0
    ? (energyBalanceData.reduce((s, b) => s + b.lossPercentage, 0) / energyBalanceData.length).toFixed(1)
    : '0.0';

  // ─── 4. CANAUX DE PAIEMENT ───────────────────────────────────────
  const channelData = useMemo(() => [
    { name: 'Orange',  value: payments.filter(p => p.operator === 'Orange').reduce((s, p) => s + p.amount, 0),  color: '#ff6b35' },
    { name: 'Airtel',  value: payments.filter(p => p.operator === 'Airtel').reduce((s, p) => s + p.amount, 0),  color: '#ef4444' },
    { name: 'Digital', value: payments.filter(p => ['NITA','AMANA'].includes(p.operator)).reduce((s, p) => s + p.amount, 0), color: '#3b82f6' },
    { name: 'Espèces', value: payments.filter(p => ['CASH','AGENCY'].includes(p.operator)).reduce((s, p) => s + p.amount, 0), color: '#f59e0b' },
  ].filter(c => c.value > 0), [payments]);

  // ─── 5. CALCUL DYNAMIQUE DU SCORE ML FRAUDE ─────────────────────
  // Indicateurs utilisés :
  //   - tamperStatus : +0.45 si détecté
  //   - status offline : +0.20
  //   - status warning : +0.15
  //   - alerte danger active sur ce compteur : +0.30
  //   - alerte warning active : +0.15
  //   - solarInjection élevée sans facture : +0.10
  //   - Score ML manuel (mlFraudScore) : conservé si > calculé
  const metersWithScore = useMemo(() => meters.map(m => {
    let score = m.mlFraudScore || 0;
    // Calcul dynamique
    let computed = 0;
    if (m.tamperStatus === 'tampered' || m.tamperStatus === 'detected') computed += 0.45;
    if (m.status === 'offline')  computed += 0.20;
    if (m.status === 'warning')  computed += 0.15;
    const meterAlerts = alerts.filter(a => a.meterId === m.id);
    if (meterAlerts.some(a => a.type === 'danger' && a.status === 'unread'))  computed += 0.30;
    if (meterAlerts.some(a => a.type === 'warning' && a.status === 'unread')) computed += 0.15;
    if ((m.solarInjection || 0) > 50) computed += 0.10;
    // Garder le plus élevé entre le score manuel et le calculé
    const finalScore = Math.min(Math.max(score, computed), 1.0);
    const meterTokens = tokens.filter(t => t.meterId === m.id);
    const lastTokenDate = meterTokens.length > 0
      ? new Date(Math.max(...meterTokens.map(t => new Date(t.timestamp).getTime())))
      : null;
    return {
      ...m,
      mlFraudScore: finalScore,
      meterAlerts,
      lastTokenDate,
      tokenCount: meterTokens.length,
      totalKwh: meterTokens.reduce((s, t) => s + (t.kwh || 0), 0),
    };
  }), [meters, alerts, tokens]);

  const highRiskMeters = metersWithScore
    .filter(m => m.mlFraudScore > 0.5)
    .sort((a, b) => b.mlFraudScore - a.mlFraudScore);

  const anomalies = alerts.filter(a =>
    a.type === 'danger' ||
    a.message?.toLowerCase().includes('fuite') ||
    a.message?.toLowerCase().includes('fraude') ||
    a.message?.toLowerCase().includes('tamper')
  );

  // ─── 6. KPIs GLOBAUX ────────────────────────────────────────────
  const totalKwh      = tokens.reduce((s, t) => s + (t.kwh || 0), 0);
  const totalRevenue  = tokens.reduce((s, t) => s + t.amount, 0);
  const totalTokens   = tokens.length;
  const avgKwhPerTx   = totalTokens > 0 ? (totalKwh / totalTokens).toFixed(2) : '0';

  // Variation 30 vs 60 jours
  const now     = Date.now();
  const last30  = tokens.filter(t => now - new Date(t.timestamp).getTime() < 30 * 86400000);
  const prev30  = tokens.filter(t => {
    const age = now - new Date(t.timestamp).getTime();
    return age >= 30 * 86400000 && age < 60 * 86400000;
  });
  const trend30kwh = prev30.length > 0
    ? ((last30.reduce((s,t)=>s+t.kwh,0) - prev30.reduce((s,t)=>s+t.kwh,0)) / prev30.reduce((s,t)=>s+t.kwh,0) * 100).toFixed(1)
    : '0';

  return (
    <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">

      {/* ── En-tête ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Analytique &amp; Performance</h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Analyse prédictive · Consommation · Bilan energétique · Détection fraude
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSimulateAnomaly}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <AlertTriangle size={14} /> Simuler Fraude
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Énergie Livrée', value: totalKwh.toFixed(1), unit: 'kWh',       icon: Zap,      color: 'text-brand',       bg: 'from-brand/10' },
          { label: 'Chiffre d\'Affaires',  value: totalRevenue.toLocaleString(), unit: 'FCFA', icon: Coins,    color: 'text-niger-green', bg: 'from-niger-green/10' },
          { label: 'Transactions STS',     value: totalTokens.toString(), unit: 'tokens', icon: Activity, color: 'text-blue-400',     bg: 'from-blue-500/10' },
          { label: 'Moy. Énergie / Tx',   value: avgKwhPerTx, unit: 'kWh/tx',             icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/10' },
        ].map((k, i) => (
          <div key={i} className={`glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br ${k.bg} to-transparent`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">{k.label}</p>
              <k.icon size={16} className={k.color} />
            </div>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}<span className="text-sm font-bold text-gray-500 ml-1">{k.unit}</span></p>
          </div>
        ))}
      </div>

      {/* ── Graphique Tendance 30 jours ──────────────────────────── */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-bold text-lg">Consommation &amp; Revenus — 30 derniers jours</h4>
            <p className="text-xs text-gray-500 mt-1">kWh livrés et FCFA encaissés par jour</p>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold",
            Number(trend30kwh) >= 0
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          )}>
            {Number(trend30kwh) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend30kwh}% vs mois précédent
          </div>
        </div>
        {consumptionTrend.every(d => d.kWh === 0 && d.Revenus === 0) ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
            <Activity size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-bold">Aucun token enregistré pour la période</p>
            <p className="text-xs mt-1">Effectuez une recharge pour voir la courbe</p>
          </div>
        ) : (
          <div className="h-[300px] w-full min-h-[300px]" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={consumptionTrend.filter((_, i) => i % 3 === 0 || i === consumptionTrend.length - 1)}>
                <defs>
                  <linearGradient id="gKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00A651" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00A651" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor:'#0a0a0b', borderRadius:'16px', border:'1px solid rgba(255,107,53,0.2)' }} />
                <Legend wrapperStyle={{ fontSize:'11px', fontWeight:'bold' }} />
                <Area yAxisId="left"  type="monotone" dataKey="kWh"    stroke="#ff6b35" strokeWidth={3} fillOpacity={1} fill="url(#gKwh)" />
                <Area yAxisId="right" type="monotone" dataKey="Revenus" stroke="#00A651" strokeWidth={2} fillOpacity={1} fill="url(#gRev)" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Répartition par segment + Canaux de paiement ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Répartition segments */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5">
          <h4 className="font-bold text-lg mb-2">Répartition par Segment Tarifaire</h4>
          <p className="text-xs text-gray-500 mb-6">Énergie (kWh) livrée par type d'abonné</p>
          {segmentDistrib.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">Aucune donnée</div>
          ) : (
            <>
              <div className="h-[180px] w-full min-h-[180px]" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={segmentDistrib} barSize={36}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ backgroundColor:'#0a0a0b', borderRadius:'12px', border:'none' }} />
                    <Bar dataKey="kWh" radius={[6,6,0,0]}>
                      {segmentDistrib.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {segmentDistrib.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span className="text-gray-400 truncate">{s.name}:</span>
                    <span className="font-bold text-white">{s.kWh} kWh</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Canaux de paiement */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5">
          <h4 className="font-bold text-lg mb-2">Performance Canaux de Paiement</h4>
          <p className="text-xs text-gray-500 mb-6">Volume financier encaissé par canal (FCFA)</p>
          {channelData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">Aucun paiement enregistré</div>
          ) : (
            <>
              <div className="h-[180px] w-full min-h-[180px]" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <RePieChart>
                    <Pie data={channelData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" strokeWidth={0}>
                      {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} FCFA`]}
                      contentStyle={{ backgroundColor:'#0a0a0b', borderRadius:'12px', border:'none' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {channelData.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-400">{c.name}:</span>
                    <span className="font-bold text-white">{c.value.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bilan Énergétique ──────────────────────────────────────── */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5">
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h4 className="text-xl font-black text-white uppercase tracking-tight">Bilan Énergétique &amp; Pertes Réseau</h4>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              Énergie injectée (Substation) vs Énergie facturée (AMI) — par région NIGELEC
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Pertes Moy. Nationales</p>
            <p className={cn("text-3xl font-black", Number(avgLoss) > 15 ? "text-red-500" : Number(avgLoss) > 8 ? "text-orange-400" : "text-green-400")}>
              {avgLoss}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-4">Zone / Région</th>
                  <th className="pb-4 text-right">Injecté (kWh)</th>
                  <th className="pb-4 text-right">Facturé (kWh)</th>
                  <th className="pb-4 text-right">Pertes (%)</th>
                  <th className="pb-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {energyBalanceData.map((b, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 text-sm font-bold text-white">{b.areaName}</td>
                    <td className="py-4 text-right text-sm text-gray-400 font-mono">{b.injectedKwh.toLocaleString()}</td>
                    <td className="py-4 text-right text-sm text-brand font-mono">{b.meteredKwh.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <span className={cn("text-sm font-black",
                        b.lossPercentage > 20 ? "text-red-500" :
                        b.lossPercentage > 12 ? "text-orange-400" : "text-green-400"
                      )}>{b.lossPercentage}%</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className={cn("inline-block w-2 h-2 rounded-full",
                        b.lossPercentage > 20 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                        b.lossPercentage > 12 ? "bg-orange-500" : "bg-green-500"
                      )} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-[260px] bg-white/[0.02] rounded-2xl p-4 border border-white/5 min-h-[260px]" style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <BarChart data={energyBalanceData} barGap={4}>
                <XAxis dataKey="areaName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ backgroundColor:'#0a0a0b', borderRadius:'12px', border:'none' }} />
                <Bar dataKey="injectedKwh" name="Injecté" fill="#ffffff15" radius={[4,4,0,0]} barSize={18} />
                <Bar dataKey="meteredKwh"  name="Facturé"  radius={[4,4,0,0]} barSize={18}>
                  {energyBalanceData.map((e, i) => (
                    <Cell key={i} fill={e.lossPercentage > 20 ? '#ef4444' : e.lossPercentage > 12 ? '#f97316' : '#00A651'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest mt-2">
              Blanc = Injecté · Couleur = Facturé
            </p>
          </div>
        </div>
      </div>

      {/* Modal Audit Compteur */}
      {auditMeter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setAuditMeter(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl p-8 border border-purple-500/30 w-full max-w-lg shadow-[0_0_60px_rgba(168,85,247,0.2)] mx-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase rounded border border-purple-500/30 mb-3 inline-block">Rapport d'Audit ML</span>
                <h3 className="text-xl font-black text-white">{(auditMeter as any).id}</h3>
                <p className="text-sm text-gray-400 mt-1">{(auditMeter as any).location}</p>
              </div>
              <button onClick={() => setAuditMeter(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"><X size={16} /></button>
            </div>
            <div className="flex items-center gap-6 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="relative w-20 h-20 shrink-0">
                <div className="w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center">
                  <span className={cn("text-xl font-black", (auditMeter as any).mlFraudScore > 0.8 ? "text-red-400" : (auditMeter as any).mlFraudScore > 0.65 ? "text-orange-400" : "text-yellow-400")}>
                    {Math.round((auditMeter as any).mlFraudScore * 100)}%
                  </span>
                </div>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(168,85,247,0.15)" strokeWidth="4" />
                  <circle cx="40" cy="40" r="36" fill="transparent"
                    stroke={(auditMeter as any).mlFraudScore > 0.8 ? '#ef4444' : (auditMeter as any).mlFraudScore > 0.65 ? '#f97316' : '#eab308'}
                    strokeWidth="4" strokeDasharray={226} strokeDashoffset={226 - (226 * (auditMeter as any).mlFraudScore)} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Score de Risque ML</p>
                <p className={cn("text-sm font-black", (auditMeter as any).mlFraudScore > 0.8 ? "text-red-400" : (auditMeter as any).mlFraudScore > 0.65 ? "text-orange-400" : "text-yellow-400")}>
                  {(auditMeter as any).mlFraudScore > 0.8 ? 'CRITIQUE - Intervention requise' : (auditMeter as any).mlFraudScore > 0.65 ? 'ELEVE - Surveillance active' : 'MODERE - Monitoring'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Calcule sur indicateurs temps reel</p>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Facteurs de Risque</h4>
              {[
                { label: 'Statut physique', value: (auditMeter as any).status, risk: (auditMeter as any).status !== 'online' },
                { label: 'Anti-sabotage', value: (auditMeter as any).tamperStatus === 'tampered' ? 'DETECTE' : 'Normal', risk: (auditMeter as any).tamperStatus === 'tampered' },
                { label: 'Alertes actives', value: `${(auditMeter as any).meterAlerts?.filter((a: any) => a.status === 'unread').length || 0} non lues`, risk: (auditMeter as any).meterAlerts?.some((a: any) => a.type === 'danger') },
                { label: 'Transactions STS', value: `${(auditMeter as any).tokenCount || 0} tokens`, risk: false },
                { label: 'Energie facturee', value: `${((auditMeter as any).totalKwh || 0).toFixed(1)} kWh`, risk: false },
                { label: 'Dernier token', value: (auditMeter as any).lastTokenDate ? new Date((auditMeter as any).lastTokenDate).toLocaleString('fr-FR') : 'Aucun', risk: !(auditMeter as any).lastTokenDate },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-white/5">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={cn("font-bold", item.risk ? "text-red-400" : "text-white")}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {setViewingMeter && setCurrentSection && (
                <button onClick={() => { setViewingMeter(auditMeter); setCurrentSection('map'); setAuditMeter(null); }}
                  className="flex-1 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2">
                  <Eye size={14} /> Voir sur la Carte
                </button>
              )}
              <button onClick={() => setAuditMeter(null)}
                className="flex-1 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-black uppercase hover:bg-purple-500 hover:text-white transition-all">
                Cloturer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detection ML */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">IA : Fraudes Subtiles</h4>
              <p className="text-xs text-gray-500 mt-1">Score ML calcule en temps reel · {highRiskMeters.length} compteur(s) a risque</p>
            </div>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase rounded border border-purple-500/30">ML Model v2.4</span>
          </div>
          <div className="space-y-3">
            {highRiskMeters.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-600">
                <span className="text-3xl mb-3">OK</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Statut Nominal</span>
                <span className="text-[9px] text-gray-600 mt-1">Aucune fraude subtile detectee</span>
              </div>
            ) : highRiskMeters.slice(0, 5).map((f, idx) => {
              const score = f.mlFraudScore || 0;
              const strokeColor = score > 0.8 ? '#ef4444' : score > 0.65 ? '#f97316' : '#eab308';
              return (
                <div key={idx} className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                  <div className="relative shrink-0 w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center font-black text-white text-[10px] group-hover:border-purple-500/40 transition-colors">
                      {Math.round(score * 100)}%
                    </div>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="22" fill="transparent" stroke={`${strokeColor}22`} strokeWidth="3" />
                      <circle cx="24" cy="24" r="22" fill="transparent" stroke={strokeColor} strokeWidth="3"
                        strokeDasharray={138} strokeDashoffset={138 - (138 * score)} strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-[10px] font-black text-white">{f.id}</p>
                      {(f.tamperStatus === 'tampered' || f.tamperStatus === 'detected') && (
                        <span className="text-[7px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-black uppercase">Tamper</span>
                      )}
                      {f.status !== 'online' && (
                        <span className="text-[7px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded font-black uppercase">{f.status}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-500 truncate">{f.location}</p>
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: strokeColor }}>
                      {score > 0.8 ? 'Suspicion bypass elevee' : score > 0.65 ? 'Ecart de consommation anormal' : 'Surveillance recommandee'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button onClick={() => setAuditMeter(f as any)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 text-[8px] font-black uppercase text-gray-400 hover:bg-purple-500 hover:text-white transition-all border border-white/5 hover:border-purple-500">
                      Audit
                    </button>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${score * 100}%`, backgroundColor: strokeColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {highRiskMeters.length > 5 && (
            <p className="text-center text-[9px] text-gray-600 mt-4 font-bold uppercase tracking-widest">
              +{highRiskMeters.length - 5} autres compteurs a risque
            </p>
          )}
        </div>

        {/* Anomalies Critiques */}
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-red-500/5">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-500" size={20} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Anomalies Critiques (AMI)</h4>
              <p className="text-xs text-gray-500 mt-0.5">{anomalies.length} evenement{anomalies.length > 1 ? 's' : ''} detecte{anomalies.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {anomalies.length > 0 ? anomalies.slice(0, 8).map((a, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white leading-tight truncate">{a.title}</p>
                  <p className="text-[9px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{a.message}</p>
                  <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">
                    {new Date(a.timestamp).toLocaleString('fr-FR')}{a.meterId && ` - ${a.meterId}`}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center py-8 text-gray-600">
                <span className="text-2xl mb-2">OK</span>
                <p className="text-[10px] italic font-bold">Aucune anomalie physique detectee</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
