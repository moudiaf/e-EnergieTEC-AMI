import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAmi } from '../context/AmiContext';
import { 
  FileText, RefreshCw, Database, CheckCircle2, TrendingUp, Eye, 
  MapPin, Cpu, Zap, Activity, ShieldCheck, Server, Network,
  AlertCircle, BarChart2, Clock, Terminal, PieChart, Search as SearchIcon, X, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, 
  Tooltip, PieChart as RePieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MdmsSectionProps {
  mdmsStats: any;
  selectedMeterIntervals: any[];
  generateMdmsReportFile: () => void;
  onSimulateMassReading: () => void;
  fetchData: () => void;
  setViewingMeter: (m: any) => void;
  meters: any[];
  setCurrentSection: (section: string) => void;
  mdmsSearch: string;
  setMdmsSearch: (query: string) => void;
}

const STAT_COLORS = {
  valid: '#00A651',
  estimated: '#3b82f6',
  failed: '#ef4444',
  missing: '#f59e0b'
};

export const MdmsSection = ({
  mdmsStats,
  selectedMeterIntervals,
  generateMdmsReportFile,
  onSimulateMassReading,
  fetchData,
  setViewingMeter,
  meters,
  setCurrentSection,
  mdmsSearch,
  setMdmsSearch
}: MdmsSectionProps) => {
  const { authFetch } = useAmi();
  const [selectedTransformer, setSelectedTransformer] = useState<string | null>(null);
  const [showDlmsInspector, setShowDlmsInspector] = useState(false);
  const [inspectingMeter, setInspectingMeter] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<any>(null);
  const [loadingDlms, setLoadingDlms] = useState(false);
  const [hesError, setHesError] = useState<string | null>(null);

  const fetchDlmsData = async (meterId: string) => {
    setInspectingMeter(meterId);
    setShowDlmsInspector(true);
    setDecodedData(null);
    setHesError(null);
    setLoadingDlms(true);
    
    // Identifier le type de compteur
    const meter = meters.find(m => m.id === meterId);
    const isTriphase = meter?.phaseType === 'triphase' || meter?.type === 'industrial' || meter?.type === 'commercial' && meter?.voltage > 300;

    try {
      // Simulation d'une trame HDLC/DLMS brute (plus longue pour le triphasé)
      const dummyFrame = isTriphase 
        ? "7EA019032111100000E6E700DB080000000000000000BE4F7E8899AA"
        : "7EA019032111100000E6E700DB080000000000000000BE4F7E";
      
      const response = await authFetch('/api/hes/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: dummyFrame })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      // Injecter la trame brute pour affichage
      setDecodedData({ ...data, frame: dummyFrame });
    } catch (e: any) {
      console.error("Erreur de décodage DLMS", e);
      setHesError(e.message || "Passerelle HES Gateway injoignable");
    } finally {
      setLoadingDlms(false);
    }
  };

  // ─── Calculs Ingestion ──────────────────────────────────────────
  const healthScore = useMemo(() => {
    if (!mdmsStats) return 0;
    const valid = mdmsStats.validationStats?.find((s: any) => s.status === 'valid')?.count || 0;
    return Math.round((valid / (mdmsStats.totalReadings || 1)) * 100);
  }, [mdmsStats]);

  const hourlyIngestion = useMemo(() => [
    { hour: '00h', count: 120, rate: 98.2 },
    { hour: '04h', count: 98,  rate: 97.5 },
    { hour: '08h', count: 145, rate: 99.1 },
    { hour: '12h', count: 180, rate: 96.4 },
    { hour: '16h', count: 165, rate: 98.8 },
    { hour: '20h', count: 210, rate: 94.2 },
    { hour: '23h', count: 155, rate: 97.9 }
  ], []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-20"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">VEE Engine v5.0</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-green-500 uppercase tracking-widest">
              <ShieldCheck size={10} /> Intégrité MDMS Validée
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">MDMS <span className="text-brand">Analyse</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Supervision de l'Ingestion Granulaire & Validation (DLMS/COSEM)</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onSimulateMassReading}
            className="group relative px-6 py-3 bg-brand/10 hover:bg-brand rounded-2xl transition-all border border-brand/20 hover:border-brand flex items-center gap-3"
          >
            <RefreshCw size={18} className="text-brand group-hover:text-white animate-spin-slow" />
            <div className="text-left">
              <span className="block text-[10px] font-black text-brand group-hover:text-white uppercase leading-none">Simulation VEE</span>
              <span className="block text-[8px] text-brand/60 group-hover:text-white/60 font-bold uppercase mt-1">Mass Reading Mode</span>
            </div>
          </button>
          
          <button 
            onClick={generateMdmsReportFile}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all"
          >
            <FileText size={18} className="text-blue-400" />
            <span className="text-[10px] font-black text-gray-400 hover:text-white uppercase">Exporter Audit MDMS</span>
          </button>
        </div>
      </div>

      {/* ── KPIs Critiques ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem 
          title="Lectures Reçues (24h)" 
          value={mdmsStats?.totalReadings?.toLocaleString()} 
          sub="Intervalle 15 min" 
          icon={Database} 
          color="text-brand" 
          bg="bg-brand/10" 
        />
        <KPIItem 
          title="Indice de Santé VEE" 
          value={`${healthScore}%`} 
          sub="Taux de validité des données" 
          icon={Activity} 
          color="text-green-500" 
          bg="bg-green-500/10" 
          trend="+0.4%"
        />
        <KPIItem 
          title="Latence Moyenne" 
          value="48ms" 
          sub="Gateway HES -> MDMS Central" 
          icon={Clock} 
          color="text-blue-400" 
          bg="bg-blue-400/10" 
        />
        <KPIItem 
          title="Erreurs de Framing" 
          value={mdmsStats?.validationStats?.find((s: any) => s.status === 'failed')?.count || 0} 
          sub="Paquets DLMS non conformes" 
          icon={AlertCircle} 
          color="text-red-500" 
          bg="bg-red-500/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Pipeline d'Ingestion (Visualisation) ────────────────── */}
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden bg-bg-dark/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16"></div>
          
          <div>
            <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
              <Network size={20} className="text-brand" /> Architecture Topologie
            </h4>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Status des couches de communication Nigelec</p>
          </div>

          <div className="space-y-6 relative ml-4">
            <div className="absolute left-[-17px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-brand/50 via-blue-500/50 to-green-500/50"></div>
            
            <TopologyNode 
              icon={Cpu} 
              label="Compteurs Smart AMI" 
              status="Online" 
              count={`${meters.length} unités`} 
              sub="RF / PLC Mesh / GPRS" 
              color="border-brand/40 bg-brand/5"
            />
            <TopologyNode 
              icon={Server} 
              label="HES Concentrators" 
              status="Connected" 
              count="14 DCUs" 
              sub="Gateway UDP/TCP Stack" 
              color="border-blue-500/40 bg-blue-500/5"
            />
            <TopologyNode 
              icon={Database} 
              label="MDMS VEE Core" 
              status="Active" 
              count="Apache Kafka" 
              sub="Data Lake Ingestion" 
              color="border-green-500/40 bg-green-500/5"
            />
            <TopologyNode 
              icon={Terminal} 
              label="API Services" 
              status="Ready" 
              count="REST / gRPC" 
              sub="External Access Layer" 
              color="border-purple-500/40 bg-purple-500/5"
            />
          </div>
        </div>

        {/* ── Graphiques Ingestion & VEE ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ingestion Profile */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-bg-dark/40">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <BarChart2 size={14} className="text-brand" /> Flux d'ingestion (Horaire)
              </h4>
                <div className="h-[200px] w-full relative overflow-hidden" style={{ minHeight: '200px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height={200} debounce={50}>
                    <AreaChart data={hourlyIngestion}>
                    <defs>
                      <linearGradient id="colorIngest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize:9, fill:'#4b5563'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:8, fill:'#4b5563'}} />
                    <Tooltip contentStyle={{backgroundColor:'#111', border:'none', borderRadius:'12px', fontSize:'10px'}} />
                    <Area type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={3} fillOpacity={1} fill="url(#colorIngest)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* VEE Distribution */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-bg-dark/40">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <PieChart size={14} className="text-blue-400" /> Distribution VEE
              </h4>
              <div className="flex items-center gap-4">
                <div className="h-[180px] w-1/2 relative overflow-hidden" style={{ minHeight: '180px', minWidth: '0' }}>
                  <ResponsiveContainer width="100%" height={180} debounce={50}>
                    <RePieChart>
                      <Pie
                        data={mdmsStats?.validationStats?.map((s: any) => ({ name: s.status, value: s.count })) || []}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {mdmsStats?.validationStats?.map((s: any) => (
                           <Cell key={s.status} fill={(STAT_COLORS as any)[s.status] || '#555'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {mdmsStats?.validationStats?.map((s: any) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (STAT_COLORS as any)[s.status] }} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{s.status}</span>
                      </div>
                      <span className="text-[10px] font-black text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Load Profile Granular */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-bg-dark/40">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap size={14} className="text-brand" /> Profil de Charge AMI (Temps Réel)
              </h4>
              <div className="flex gap-2">
                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 uppercase">Granularité 15min</span>
              </div>
            </div>
            <div className="h-[250px] w-full relative overflow-hidden" style={{ minHeight: '250px', minWidth: '0' }}>
              <ResponsiveContainer width="100%" height={250} debounce={50}>
                <BarChart data={[
                  { time: '00:00', val: 1.2, est: 0 }, { time: '04:00', val: 0.8, est: 0 }, { time: '08:00', val: 0, est: 3.5 },
                  { time: '12:00', val: 4.8, est: 0 }, { time: '16:00', val: 4.2, est: 0 }, { time: '20:00', val: 5.6, est: 0 },
                  { time: '23:59', val: 2.1, est: 0.5 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize:9, fill:'#4b5563'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:8, fill:'#4b5563'}} />
                  <Tooltip contentStyle={{backgroundColor:'#111', border:'none', borderRadius:'12px', fontSize:'10px'}} />
                  <Bar dataKey="val" fill="#FF6B35" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="est" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
               <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase">
                 <div className="w-2 h-2 rounded bg-brand"></div> Lectures Réelles
               </div>
               <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase">
                 <div className="w-2 h-2 rounded bg-blue-500/60"></div> Estimations VEE
               </div>
            </div>
          </div>

          {/* ── Bilan Énergétique (Energy Balance) ──────────────────── */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-bg-dark/40">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
                  <Zap size={20} className="text-yellow-400" /> Bilan Énergétique (Energy Balance)
                </h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Comparaison Injection Transformateur vs Consommation Clients</p>
              </div>
              <div className="px-4 py-2 bg-yellow-400/10 rounded-xl border border-yellow-400/20 text-center">
                <span className="block text-[8px] font-black text-yellow-400 uppercase">Pertes Moyennes</span>
                <span className="block text-lg font-black text-white">
                  {mdmsStats?.energyBalance?.length > 0 ? (mdmsStats.energyBalance.reduce((acc: number, b: any) => acc + b.lossPercentage, 0) / mdmsStats.energyBalance.length).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mdmsStats?.energyBalance?.map((b: any) => (
                <div key={b.transformerId} className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase">Transformateur</p>
                      <p className="font-mono text-xs font-black text-brand">{b.transformerId}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                      b.lossPercentage > 12 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                    )}>
                      {b.lossPercentage > 12 ? '⚠️ Perte Élevée' : '✓ Normal'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500 font-bold uppercase">Injection</span>
                      <span className="text-white font-black">{b.inputEnergy.toLocaleString()} kWh</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500 font-bold uppercase">Livraison</span>
                      <span className="text-white font-black">{b.deliveredEnergy.toLocaleString()} kWh</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className={cn("h-full", b.lossPercentage > 12 ? "bg-red-500" : "bg-brand")}
                        style={{ width: `${Math.min(100, (b.deliveredEnergy / b.inputEnergy) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-600 uppercase">Pertes (NPT)</span>
                    <span className={cn("text-xs font-black", b.lossPercentage > 12 ? "text-red-400" : "text-white")}>
                      {b.lossPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ledger des Événements MDMS ──────────────────────────── */}
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl bg-bg-dark/40">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <h4 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-3">
              <Eye size={20} className="text-brand" /> Journal Granulaire MDMS
            </h4>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Audit détaillé des paquets DLMS/COSEM reçus</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text"
                placeholder="Compteur, Zone..."
                value={mdmsSearch}
                onChange={(e) => setMdmsSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white outline-none w-64 focus:border-brand transition-all"
              />
            </div>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-brand uppercase tracking-widest hover:bg-brand/10 transition-all">
              Filtrer
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-6 py-5">Compteur / Location</th>
                <th className="px-4 py-5">Phase</th>
                <th className="px-4 py-5">Date/Heure</th>
                <th className="px-4 py-5">Voltage</th>
                <th className="px-4 py-5">Charge (kWh)</th>
                <th className="px-4 py-5 text-center">Status VEE</th>
                <th className="px-4 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedMeterIntervals
                .filter(interval => {
                  const m = meters.find(met => met.id === interval.meterId);
                  const query = mdmsSearch.toLowerCase();
                  return (interval.meterId || '').toLowerCase().includes(query) || 
                         (m?.location || '').toLowerCase().includes(query);
                })
                .slice(0, 10).map(interval => {
                  const meter = meters.find(m => m.id === interval.meterId);
                  const isTriphase = meter?.phaseType === 'triphase';
                  return (
                  <tr key={interval.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs font-black text-brand">{interval.meterId}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{meter?.location || 'Inconnue'}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                        isTriphase ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      )}>
                        {isTriphase ? '3φ' : '1φ'}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-600" />
                        <span className="text-[11px] font-bold text-gray-400">
                          {format(new Date(interval.timestamp), 'dd MMM • HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      {isTriphase && interval.voltageL1 ? (
                        <div className="space-y-1">
                          <span className={cn("text-xs font-black", interval.voltage < 370 ? "text-red-400" : "text-white")}>
                            {interval.voltage?.toFixed(1)} <span className="text-[8px] opacity-40">V (L-L)</span>
                          </span>
                          <div className="flex gap-1.5">
                            {[
                              { label: 'L1', value: interval.voltageL1 },
                              { label: 'L2', value: interval.voltageL2 },
                              { label: 'L3', value: interval.voltageL3 },
                            ].map((ph) => (
                              <span key={ph.label} className={cn("text-[8px] font-bold px-1 py-0.5 rounded",
                                (ph.value < 207 || ph.value > 253) ? "bg-red-500/10 text-red-400" : "bg-white/5 text-gray-400"
                              )}>
                                {ph.label}:{ph.value?.toFixed(1)}V
                              </span>
                            ))}
                          </div>
                          {interval.voltageUnbalance != null && (
                            <span className={cn("text-[7px] font-bold",
                              interval.voltageUnbalance > 2 ? "text-red-400" : "text-gray-600"
                            )}>
                              Déséq: {interval.voltageUnbalance}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={cn("text-xs font-black", interval.voltage < 210 ? "text-red-400" : "text-white")}>
                          {interval.voltage?.toFixed(1)} <span className="text-[9px] opacity-40">V</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-xs font-black text-green-400">
                        {interval.consumption.toFixed(3)} <span className="text-[9px] opacity-40 uppercase">kWh</span>
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-center">
                        <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5",
                          interval.status === 'valid' ? "bg-green-500/10 text-green-500" :
                          interval.status === 'estimated' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {interval.status === 'valid' && <CheckCircle2 size={10} />}
                          {interval.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right flex gap-2 justify-end">
                      <button 
                        onClick={() => fetchDlmsData(interval.meterId)}
                        className="p-3 bg-white/5 hover:bg-blue-500 hover:text-white text-gray-500 rounded-xl transition-all border border-white/5 hover:border-blue-500 shadow-lg"
                      >
                        <Activity size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (meter) {
                            setViewingMeter(meter);
                            setCurrentSection('map');
                          }
                        }}
                        className="p-3 bg-white/5 hover:bg-brand hover:text-white text-gray-500 rounded-xl transition-all border border-white/5 hover:border-brand shadow-lg"
                      >
                        <MapPin size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              {selectedMeterIntervals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-gray-600 font-black uppercase text-xs opacity-30">
                    Aucune lecture MDMS disponible dans le cache VEE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DLMS INSPECTOR MODAL */}
      {showDlmsInspector && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel w-full max-w-2xl bg-[#0a0a0b] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tighter">Inspecteur DLMS/COSEM</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Diagnostic OBIS Temps Réel · {inspectingMeter}</p>
                </div>
              </div>
              <button onClick={() => setShowDlmsInspector(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingDlms ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Décryptage de la trame APDU par HES...</p>
                </div>
              ) : hesError ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                  <AlertCircle className="text-red-500" size={40} />
                  <p className="text-xs font-black text-red-400 uppercase tracking-widest">{hesError}</p>
                  <p className="text-[10px] text-gray-500 max-w-sm">La passerelle HES Gateway est injoignable ou a renvoyé une erreur de décapsulation.</p>
                </div>
              ) : !decodedData ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">En attente de décodage...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-mono text-[10px] text-blue-300 break-all leading-relaxed">
                    <span className="text-gray-500 mr-2 uppercase">Trame Brute:</span>
                    {decodedData.frame}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {decodedData.objects.map((obj: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                          <div>
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{obj.obis}</p>
                            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{obj.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white">{obj.value}</span>
                          <span className="text-[10px] font-bold text-gray-500 ml-1 uppercase">{obj.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
              <div className="flex gap-4">
                <div className="text-[10px]"><span className="text-gray-500 uppercase font-black mr-2">Protocole:</span><span className="text-green-500 font-bold">DLMS-V2</span></div>
                <div className="text-[10px]"><span className="text-gray-500 uppercase font-black mr-2">Chiffrement:</span><span className="text-blue-500 font-bold">AES-GCM-128</span></div>
              </div>
              <button onClick={() => fetchDlmsData(inspectingMeter!)} className="px-6 py-2 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20">Rafraîchir</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const KPIItem = ({ title, value, sub, icon: Icon, color, bg, trend }: any) => (
  <div className="glass-panel p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-brand/30 transition-all shadow-xl bg-bg-dark/40">
    <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-12 -mt-12", bg)}></div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", bg, color)}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h4 className="text-3xl font-black text-white tracking-tighter mb-2">{value || '0'}</h4>
        <p className="text-[9px] text-gray-600 font-bold uppercase">{sub}</p>
      </div>
    </div>
  </div>
);

const TopologyNode = ({ icon: Icon, label, status, count, sub, color }: any) => (
  <div className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer", color)}>
    <div className="p-3 bg-white/5 rounded-xl">
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{label}</span>
        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", 
          status === 'Online' || status === 'Connected' || status === 'Active' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        )}>{status}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-gray-400 uppercase">{sub}</span>
        <span className="text-[9px] font-black text-white">{count}</span>
      </div>
    </div>
  </div>
);
