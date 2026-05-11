import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { ShieldCheck, AlertTriangle, Zap, Activity, Eye, Search, MapPin, ShieldAlert, Cpu } from 'lucide-react';
import { Meter, Token } from '../types';

interface RevenueAssuranceSectionProps {
  meters: Meter[];
  tokens: Token[];
  onSimulateAnomaly?: () => void;
}

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export const RevenueAssuranceSection = ({ meters, tokens, onSimulateAnomaly }: RevenueAssuranceSectionProps) => {
  // Generate dummy transformer (Poste HTA/BT) data based on meters
  const transformerData = useMemo(() => {
    // Group by neighborhoods/transformers
    const neighborhoods = ['Quartier Plateau', 'Francophonie', 'Kouara Kano', 'Yantala', 'Talladjé', 'Dar Es Salam'];
    
    return neighborhoods.map(neighborhood => {
      // Find meters in this pseudo-neighborhood (or just mock it if not enough real data)
      const neighborhoodMeters = meters.filter(m => m.location.includes(neighborhood)) || [];
      const meterIds = neighborhoodMeters.map(m => m.id);
      
      // Sum STS tokens
      const stsConsumption = tokens
        .filter(t => meterIds.includes(t.meterId))
        .reduce((sum, t) => sum + (t.kwh || 0), 0);
        
      // If we don't have enough data, mock STS consumption
      const finalStsConsumption = stsConsumption > 0 ? stsConsumption : Math.floor(Math.random() * 5000) + 2000;
      
      // Simulate injected energy at the transformer level (Poste HTA/BT)
      // We'll intentionally make some neighborhoods have high losses to demonstrate the "vol d'électricité" (theft)
      const isHighTheft = ['Talladjé', 'Dar Es Salam'].includes(neighborhood);
      const lossMultiplier = isHighTheft ? (Math.random() * 0.3 + 0.3) : (Math.random() * 0.08 + 0.02); // 30-60% vs 2-10%
      
      const injectedEnergy = Math.round(finalStsConsumption / (1 - lossMultiplier));
      const technicalLoss = Math.round(injectedEnergy * 0.05); // Assume 5% is standard technical loss
      const commercialLoss = Math.round(injectedEnergy - finalStsConsumption - technicalLoss);
      const lossPercentage = Math.round((commercialLoss / injectedEnergy) * 100);

      return {
        neighborhood,
        transformerId: `TRF-${Math.floor(Math.random() * 9000) + 1000}`,
        injected: injectedEnergy,
        stsBilled: finalStsConsumption,
        technicalLoss,
        commercialLoss: Math.max(0, commercialLoss), // Unbilled / Theft
        lossPercentage: Math.max(0, lossPercentage),
        metersCount: neighborhoodMeters.length || Math.floor(Math.random() * 200) + 50,
        status: isHighTheft ? 'critical' : lossPercentage > 10 ? 'warning' : 'healthy'
      };
    }).sort((a, b) => b.lossPercentage - a.lossPercentage);
  }, [meters, tokens]);

  const totalInjected = transformerData.reduce((s, t) => s + t.injected, 0);
  const totalStsBilled = transformerData.reduce((s, t) => s + t.stsBilled, 0);
  const totalTheft = transformerData.reduce((s, t) => s + t.commercialLoss, 0);
  const averageLoss = Math.round((totalTheft / totalInjected) * 100);

  const criticalNeighborhoods = transformerData.filter(t => t.status === 'critical');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
              <ShieldAlert className="text-red-500" size={24} />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Revenue Assurance</h3>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mt-1 ml-14">
            Bilan Énergétique de Transformateur · Détection des Fraudes &amp; Vols
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2">
            <Search size={14} /> Scanner le Réseau
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Énergie Totale Injectée (Postes HTA/BT)', value: totalInjected.toLocaleString(), unit: 'kWh', icon: Zap, color: 'text-blue-400', bg: 'from-blue-500/10 border-blue-500/20' },
          { label: 'Consommation STS Facturée', value: totalStsBilled.toLocaleString(), unit: 'kWh', icon: ShieldCheck, color: 'text-green-400', bg: 'from-green-500/10 border-green-500/20' },
          { label: 'Énergie Non Comptabilisée (Vol)', value: totalTheft.toLocaleString(), unit: 'kWh', icon: AlertTriangle, color: 'text-red-500', bg: 'from-red-500/10 border-red-500/30' },
          { label: 'Taux de Perte Commerciale', value: `${averageLoss}%`, unit: '', icon: Activity, color: 'text-orange-400', bg: 'from-orange-500/10 border-orange-500/20' },
        ].map((k, i) => (
          <div key={i} className={`glass-panel p-6 rounded-2xl border bg-gradient-to-br ${k.bg} to-transparent relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 opacity-5">
              <k.icon size={100} />
            </div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest max-w-[120px] leading-tight">{k.label}</p>
              <div className={`p-2 rounded-lg bg-black/20 backdrop-blur-md`}>
                <k.icon size={18} className={k.color} />
              </div>
            </div>
            <p className={`text-3xl font-black ${k.color} relative z-10 drop-shadow-md`}>
              {k.value} <span className="text-sm font-bold opacity-70 ml-1">{k.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Explanation Banner ────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex items-start gap-4">
        <div className="p-3 bg-blue-500/20 rounded-xl shrink-0 mt-1">
          <Cpu className="text-blue-400" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-white mb-1">Comment fonctionne le Bilan de Transformateur ?</h4>
          <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
            L'algorithme compare l'énergie globale mesurée au niveau du <span className="text-blue-400 font-bold">Poste de Transformation (HTA/BT)</span> avec la somme de l'énergie comptabilisée par tous les <span className="text-green-400 font-bold">compteurs STS en aval</span>. Toute différence significative dépassant les pertes techniques théoriques (5%) met en évidence un <span className="text-red-400 font-bold">raccordement direct non compté (vol)</span>. Cela permet d'isoler mathématiquement les quartiers problématiques.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Graph: Bilan par Transformateur ──────────────────────── */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Analyse des Écarts par Transformateur</h4>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                Injecté vs STS Billed vs Pertes Commerciales (Vol)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50"></span> Injecté (HTA/BT)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500"></span> Facturé (STS)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500"></span> Vol Détecté</div>
            </div>
          </div>

          <div className="h-[350px] w-full min-h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transformerData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="neighborhood" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} unit="k" tickFormatter={(v) => `${v/1000}`} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#050505', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  formatter={(value: number, name: string) => [
                    <span className="font-bold">{value.toLocaleString()} kWh</span>, 
                    name === 'injected' ? 'Énergie Injectée' : name === 'stsBilled' ? 'Facturé (STS)' : 'Vol Détecté'
                  ]}
                  labelStyle={{ color: '#9ca3af', fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Bar dataKey="injected" fill="#3b82f640" stroke="#3b82f6" strokeWidth={1} radius={[4,4,0,0]} barSize={40} />
                <Bar dataKey="stsBilled" fill="#00A651" radius={[4,4,0,0]} barSize={40} stackId="a" />
                <Bar dataKey="commercialLoss" fill="#ef4444" radius={[4,4,0,0]} barSize={40} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Table: Quartiers à Haut Risque ──────────────────────── */}
        <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-500/5 to-transparent flex flex-col">
          <div className="mb-6">
            <h4 className="font-black text-lg text-red-500 flex items-center gap-2 mb-1">
              <AlertTriangle size={20} />
              QUARTIERS SOUS INVESTIGATION
            </h4>
            <p className="text-xs text-gray-400">Transformateurs présentant un écart critique nécessitant une inspection terrain.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {transformerData.map((data, idx) => (
              <div key={idx} className={cn(
                "p-4 rounded-2xl border transition-all hover:bg-white/5 cursor-pointer",
                data.status === 'critical' ? "bg-red-500/10 border-red-500/30" :
                data.status === 'warning' ? "bg-orange-500/10 border-orange-500/30" :
                "bg-white/5 border-white/5"
              )}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-black text-white text-sm">{data.neighborhood}</h5>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{data.transformerId}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded font-black text-[10px] uppercase",
                    data.status === 'critical' ? "bg-red-500 text-white" :
                    data.status === 'warning' ? "bg-orange-500/20 text-orange-400" :
                    "bg-green-500/20 text-green-400"
                  )}>
                    {data.lossPercentage}% Perte
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[9px] text-gray-500 uppercase tracking-wider">STS Billed</span>
                    <span className="font-bold text-white">{data.stsBilled.toLocaleString()} <span className="text-gray-500 text-[10px]">kWh</span></span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-red-400 uppercase tracking-wider">Écart (Vol)</span>
                    <span className="font-bold text-red-400">{data.commercialLoss.toLocaleString()} <span className="text-red-500/50 text-[10px]">kWh</span></span>
                  </div>
                </div>
                
                {data.status === 'critical' && (
                  <button className="w-full mt-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2">
                    <MapPin size={12} /> Dépêcher Équipe Technique
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
