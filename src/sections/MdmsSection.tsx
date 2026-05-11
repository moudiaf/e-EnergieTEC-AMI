import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, RefreshCw, Database, CheckCircle2, TrendingUp, Eye, 
  MapPin, Cpu, Zap, Activity, ShieldCheck, Server, Network,
  AlertCircle, BarChart2, Clock, Terminal, PieChart, Search as SearchIcon
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
              <div className="h-[200px] w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                <div className="h-[180px] w-1/2 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                <div className="w-1/2 space-y-3">
                  {mdmsStats?.validationStats?.map((s: any) => (
                    <div key={s.status} className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (STAT_COLORS as any)[s.status] || '#555' }}></div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{s.status}</span>
                        </div>
                        <span className="text-[10px] font-black text-white">{s.count}</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: `${(s.count / (mdmsStats.totalReadings || 1)) * 100}%`,
                          backgroundColor: (STAT_COLORS as any)[s.status] || '#555' 
                        }}></div>
                      </div>
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
            <div className="h-[250px] w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                <th className="px-8 py-5">Compteur / Location</th>
                <th className="px-8 py-5">Date/Heure</th>
                <th className="px-8 py-5">Voltage (V)</th>
                <th className="px-8 py-5">Charge (kWh)</th>
                <th className="px-8 py-5 text-center">Status VEE</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedMeterIntervals
                .filter(interval => {
                  const m = meters.find(met => met.id === interval.meterId);
                  const query = mdmsSearch.toLowerCase();
                  return interval.meterId.toLowerCase().includes(query) || 
                         (m?.location?.toLowerCase().includes(query));
                })
                .slice(0, 10).map(interval => {
                  const meter = meters.find(m => m.id === interval.meterId);
                  return (
                  <tr key={interval.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-mono text-xs font-black text-brand">{interval.meterId}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{meter?.location || 'Inconnue'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-600" />
                        <span className="text-[11px] font-bold text-gray-400">
                          {format(new Date(interval.timestamp), 'dd MMM • HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn("text-xs font-black", interval.voltage < 210 ? "text-red-400" : "text-white")}>
                        {interval.voltage} <span className="text-[9px] opacity-40">V</span>
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-green-400">
                        {interval.consumption.toFixed(3)} <span className="text-[9px] opacity-40 uppercase">kWh</span>
                      </span>
                    </td>
                    <td className="px-8 py-6">
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
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => {
                          if (meter) {
                            setViewingMeter(meter);
                            setCurrentSection('map');
                          }
                        }}
                        className="p-3 bg-white/5 hover:bg-brand hover:text-white text-gray-500 rounded-xl transition-all border border-white/5 hover:border-brand shadow-lg hover:shadow-brand/20 group/map"
                      >
                        <MapPin size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              {selectedMeterIntervals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-600 font-black uppercase text-xs opacity-30">
                    Aucune lecture MDMS disponible dans le cache VEE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
