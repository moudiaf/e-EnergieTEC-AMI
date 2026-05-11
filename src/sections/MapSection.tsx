import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Database, Filter, Search, Zap, Wifi, WifiOff, 
  AlertCircle, ArrowUpRight, Crosshair, MapPin as MapPinIcon,
  ShieldAlert, Layers, Map as MapIcon, Maximize2
} from 'lucide-react';
import { Meter, DCU } from '../types';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface MapSectionProps {
  meters: Meter[];
  dcus: DCU[];
  setViewingMeter: (meter: Meter) => void;
  targetMeter?: Meter | null;
}

export const MapSection = ({ meters, dcus, setViewingMeter, targetMeter }: MapSectionProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'warning' | 'offline' | 'tamper'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopology, setShowTopology] = useState(true);
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap'>('standard');
  const [selectedRegion, setSelectedRegion] = useState('NATIONAL');
  const [is3D, setIs3D] = useState(false);
  const [tilt, setTilt] = useState(45);
  const [extrusionScale, setExtrusionScale] = useState(1);

  // Sync region and mode if targetMeter is provided
  useEffect(() => {
    if (targetMeter) {
      const region = targetMeter.location.split(' ')[0].toUpperCase();
      const validRegions = ['NIAMEY', 'AGADEZ', 'ZINDER', 'MARADI', 'TAHOUA', 'DIFFA', 'DOSSO', 'TILLABERI'];
      if (validRegions.includes(region)) {
        setSelectedRegion(region);
      } else {
        setSelectedRegion('NATIONAL');
      }
      setIs3D(false); // Switch to 2D for precise targeting
    }
  }, [targetMeter]);

  const filteredMeters = useMemo(() => {
    return meters.filter(m => {
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'tamper' ? (m.tamperStatus === 'tampered' || m.tamperStatus === 'detected') :
        m.status === filterStatus;
      
      const matchSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRegion = selectedRegion === 'NATIONAL' || m.location.toUpperCase().includes(selectedRegion);
      
      return matchStatus && matchSearch && matchRegion;
    });
  }, [meters, filterStatus, searchQuery, selectedRegion]);

  // Improved Regional Paths for Niger (SVG Normalized)
  const regionPaths: Record<string, string> = {
    'AGADEZ': "M 400 50 L 700 100 L 750 300 L 450 350 L 350 250 Z",
    'DIFFA': "M 700 500 L 750 300 L 700 350 Z",
    'ZINDER': "M 550 520 L 700 500 L 700 350 L 450 350 Z",
    'MARADI': "M 450 530 L 550 520 L 450 350 L 400 380 Z",
    'TAHOUA': "M 350 510 L 450 530 L 400 380 L 350 250 Z",
    'DOSSO': "M 150 500 L 350 510 L 350 250 L 150 300 Z",
    'TILLABERI': "M 100 500 L 150 500 L 150 300 L 50 350 Z",
    'NIAMEY': "M 180 480 L 220 480 L 220 440 L 180 440 Z"
  };

  // Coordinate Projection Logic
  const getCoords = (lat: number, lng: number) => {
    if (selectedRegion === 'NATIONAL') {
      const x = ((lng - 0) / 16) * 700 + 50;
      const y = (1 - (lat - 11) / 13) * 500 + 50;
      return { x, y };
    } else {
      let view = { minLng: 2.0, maxLng: 2.2, minLat: 13.4, maxLat: 13.6 };
      if (selectedRegion === 'AGADEZ') view = { minLng: 5.0, maxLng: 12.0, minLat: 16.0, maxLat: 22.0 };
      if (selectedRegion === 'ZINDER') view = { minLng: 8.0, maxLng: 11.0, minLat: 13.0, maxLat: 15.0 };
      if (selectedRegion === 'MARADI') view = { minLng: 6.0, maxLng: 8.0, minLat: 13.0, maxLat: 15.0 };
      if (selectedRegion === 'DIFFA') view = { minLng: 11.0, maxLng: 14.0, minLat: 13.0, maxLat: 16.0 };
      if (selectedRegion === 'TAHOUA') view = { minLng: 4.0, maxLng: 7.0, minLat: 13.0, maxLat: 18.0 };
      if (selectedRegion === 'DOSSO') view = { minLng: 2.5, maxLng: 4.5, minLat: 12.0, maxLat: 14.5 };
      if (selectedRegion === 'TILLABERI') view = { minLng: 0.5, maxLng: 3.5, minLat: 12.5, maxLat: 15.5 };
      
      const x = ((lng - view.minLng) / (view.maxLng - view.minLng)) * 600 + 100;
      const y = (1 - (lat - view.minLat) / (view.maxLat - view.minLat)) * 400 + 100;
      return { x, y };
    }
  };

  const nationalBackbone = [
    { from: { lat: 13.52, lng: 2.11 }, to: { lat: 13.04, lng: 3.19 }, label: 'Niamey-Dosso (132kV)' },
    { from: { lat: 13.04, lng: 3.19 }, to: { lat: 14.89, lng: 5.26 }, label: 'Dosso-Tahoua (132kV)' },
    { from: { lat: 14.89, lng: 5.26 }, to: { lat: 13.51, lng: 7.10 }, label: 'Tahoua-Maradi (132kV)' },
    { from: { lat: 13.51, lng: 7.10 }, to: { lat: 13.80, lng: 8.98 }, label: 'Maradi-Zinder (132kV)' },
    { from: { lat: 13.80, lng: 8.98 }, to: { lat: 13.31, lng: 12.61 }, label: 'Zinder-Diffa (90kV)' },
    { from: { lat: 13.80, lng: 8.98 }, to: { lat: 16.97, lng: 7.98 }, label: 'Zinder-Agadez (Feeders)' }
  ];

  const getDistrictStats = () => {
    if (selectedRegion === 'NATIONAL') {
      return [
        { label: 'Niamey (Capitale)', count: '96.4%', color: 'text-green-500' },
        { label: 'Agadez (Nord)', count: '92.1%', color: 'text-green-500' },
        { label: 'Maradi (Sud)', count: '89.5%', color: 'text-orange-500' },
        { label: 'Zinder (Est)', count: '87.2%', color: 'text-red-500' }
      ];
    }
    return [
      { label: 'Zone Urbaine', count: '99.1%', color: 'text-green-500' },
      { label: 'Zone Périphérique', count: '94.2%', color: 'text-orange-500' },
      { label: 'Réseau Rural', count: '82.2%', color: 'text-red-500' }
    ];
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      {/* ── Header Géo-Décisionnel ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-[#0a0a0b]/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/5 gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shadow-[0_0_20px_rgba(255,107,53,0.1)]">
            <MapIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Carte <span className="text-brand">Dynamique</span> du Réseau</h1>
            <div className="flex items-center gap-3 mt-2">
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white/5 text-[11px] text-brand font-black uppercase tracking-widest outline-none cursor-pointer appearance-none px-4 py-1.5 rounded-full border border-white/10"
              >
                <option value="NATIONAL">Nation Niger (Global)</option>
                <option value="NIAMEY">Niamey</option>
                <option value="AGADEZ">Agadez</option>
                <option value="ZINDER">Zinder</option>
                <option value="MARADI">Maradi</option>
                <option value="TAHOUA">Tahoua</option>
                <option value="DIFFA">Diffa</option>
                <option value="DOSSO">Dosso</option>
                <option value="TILLABERI">Tillabéri</option>
              </select>
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">AMI INFRASTRUCTURE v5.2</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {(['standard', 'heatmap'] as const).map(m => (
                <button key={m} onClick={() => setMapMode(m)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", mapMode === m ? "bg-white/10 text-white" : "text-gray-500")}>
                    {m}
                </button>
            ))}
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-[300px]">
            {(['all', 'online', 'warning', 'offline', 'tamper'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", filterStatus === s ? "bg-brand text-white shadow-lg" : "text-gray-500")}>
                    {s === 'all' ? 'Tous' : s === 'tamper' ? 'Fraudes' : s}
                </button>
            ))}
          </div>
          <button 
            onClick={() => setIs3D(!is3D)} 
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest", 
              is3D ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
            )}
          >
            <Layers size={16} /> Mode 3D
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
           {/* Regional Health */}
           <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                Santé du Secteur
              </h4>
              <div className="space-y-3">
                {getDistrictStats().map((stat, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase">{stat.label}</p>
                      <p className="text-xl font-black text-white">{stat.count}</p>
                    </div>
                    <ArrowUpRight className={cn("opacity-30 group-hover:opacity-100 transition-all", stat.color)} size={16} />
                  </div>
                ))}
              </div>
           </div>

           {/* Event Live Feed */}
           <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-bg-dark/40 overflow-hidden relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alerte Réseau (Temps Réel)</h4>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              </div>
              <div className="space-y-3 h-[320px] overflow-y-auto custom-scrollbar pr-2">
                 {meters.filter(m => m.status === 'warning' || m.tamperStatus === 'tampered' || m.tamperStatus === 'detected').slice(0, 10).map((m, i) => (
                   <div key={i} className={cn("p-3 rounded-xl border flex flex-col gap-1 transition-all cursor-pointer", m.tamperStatus === 'tampered' ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/20")} onClick={() => setViewingMeter(m)}>
                      <div className="flex justify-between font-black text-white text-[10px]">
                        <span>{m.id}</span>
                        <span className={cn(m.tamperStatus === 'tampered' ? "text-red-500" : "text-orange-500 underline")}>
                          {m.tamperStatus === 'tampered' ? 'FRAUDE' : 'ANOMALIE'}
                        </span>
                      </div>
                      <p className="text-gray-500 uppercase font-bold text-[8px] truncate">{m.location}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ── Map Canvas ────────────────────────────────────────────── */}
        <div className="lg:col-span-3 glass-panel rounded-[3rem] border border-white/5 relative overflow-hidden bg-[#0c0c0e] h-[750px] shadow-2xl flex items-center justify-center perspective-[1500px]">
          
          <motion.div 
             animate={{ 
                rotateX: is3D ? tilt : 0, 
                rotateZ: is3D ? -10 : 0,
                y: is3D ? 50 : 0,
                scale: is3D ? 1.05 : 1
             }}
             transition={{ type: 'spring', stiffness: 40, damping: 20 }}
             className="absolute inset-0 w-full h-full transform-style-3d"
          >
            {/* SVG Base Layers */}
            <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30">
               {Object.entries(regionPaths).map(([id, path]) => (
                <motion.path 
                  key={id} d={path}
                  fill={selectedRegion === id ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.03)'}
                  stroke={selectedRegion === id ? '#ff6b35' : '#1e293b'}
                  strokeWidth={selectedRegion === id ? "2" : "1"}
                />
               ))}
            </svg>
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,53,0.02)_0%,transparent_80%)]"></div>

            <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full z-10 pointer-events-auto overflow-visible">
             <defs>
               <radialGradient id="heatGrad">
                  <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#ff6b35" stopOpacity="0" />
               </radialGradient>
             </defs>

             {/* Network Backbone */}
             {selectedRegion === 'NATIONAL' && nationalBackbone.map((line, i) => {
                const p1 = getCoords(line.from.lat, line.from.lng);
                const p2 = getCoords(line.to.lat, line.to.lng);
                return <motion.line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#ff6b35" strokeWidth="1.5" strokeOpacity="0.2" />;
             })}

             {/* Topology */}
             {showTopology && dcus.map(dcu => {
                const dPos = getCoords(dcu.latitude || 13.5, dcu.longitude || 2.1);
                return filteredMeters.filter(m => m.dcuId === dcu.id).map(m => {
                   const mPos = getCoords(m.latitude || 13.5, m.longitude || 2.1);
                   return <line key={m.id} x1={dPos.x} y1={dPos.y} x2={mPos.x} y2={mPos.y} stroke={m.status === 'online' ? "#ff6b35" : "#444"} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />;
                });
             })}

             {/* Heatmap Layer */}
             {mapMode === 'heatmap' && filteredMeters.map((m, i) => {
                const pos = getCoords(m.latitude || 13.5, m.longitude || 2.1);
                return <circle key={i} cx={pos.x} cy={pos.y} r="25" fill="url(#heatGrad)" opacity="0.4" />;
             })}
          </svg>

          {/* Interactive Elements Layer */}
          <div className="absolute inset-0 z-20 pointer-events-none transform-style-3d">
              {/* DCUs Visualization */}
              {dcus.map(dcu => {
                const pos = getCoords(dcu.latitude || 13.5, dcu.longitude || 2.1);
                return (
                  <div key={dcu.id} className="absolute pointer-events-auto cursor-pointer group" style={{ left: pos.x-12, top: pos.y-12 }}>
                    <div className="w-6 h-6 bg-blue-600 rounded-xl flex items-center justify-center text-white border border-white/20 shadow-xl group-hover:scale-110 transition-transform">
                      <Database size={12} />
                    </div>
                  </div>
                )
              })}

              {/* Meters Visualization */}
              {filteredMeters.map(m => {
                const pos = getCoords(m.latitude || 13.5, m.longitude || 2.1);
                const isTarget = targetMeter?.id === m.id;
                const isFraude = m.tamperStatus === 'tampered' || m.tamperStatus === 'detected';
                
                return (
                  <motion.div 
                    key={m.id}
                    className={cn("absolute pointer-events-auto cursor-pointer group transform-style-3d", isTarget ? "z-50" : "z-30")}
                    style={{ left: pos.x - 4, top: pos.y - 4 }}
                    onClick={() => setViewingMeter(m)}
                  >
                    {is3D ? (
                       <div className="relative transform-style-3d flex flex-col items-center">
                          <div 
                            className={cn(
                              "w-2 rounded-sm transition-all duration-700",
                              isFraude ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : (m.status === 'online' ? "bg-green-500" : "bg-gray-600")
                            )}
                            style={{ 
                                height: `${Math.min(100, (m.credit || 10) * extrusionScale)}px`, 
                                transform: 'translateY(-100%) rotateX(-90deg)',
                                transformOrigin: 'bottom'
                            }}
                          />
                       </div>
                    ) : (
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full border border-white/30 shadow-lg transition-all",
                            isFraude ? "bg-red-500 ring-2 ring-red-400 animate-pulse" : (m.status === 'online' ? "bg-green-500" : "bg-gray-700"),
                            isTarget && "w-4 h-4 ring-4 ring-brand ring-offset-4 ring-offset-black"
                        )} />
                    )}
                    
                    {/* Tooltip Overlay */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 bg-gray-950 border border-white/10 rounded-2xl shadow-3xl opacity-0 group-hover:opacity-100 transition-all min-w-[140px] z-[100] backdrop-blur-xl">
                       <p className="text-[10px] font-black text-white">{m.id}</p>
                       <p className={cn("text-[8px] font-black mt-1 uppercase", isFraude ? 'text-red-500' : 'text-gray-400')}>
                          {isFraude ? 'DÉTECTION FRAUDE' : m.status} · {(m.credit || 0).toFixed(1)} kWh
                       </p>
                    </div>
                  </motion.div>
                )
              })}
          </div>
          </motion.div>

          {/* Map Controls */}
          <div className="absolute top-8 left-8 flex flex-col gap-2 z-40">
             <div className="glass-panel p-2 rounded-2xl border border-white/10 bg-black/60 flex flex-col gap-1">
                <button onClick={() => setExtrusionScale(prev => Math.min(3, prev + 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-white"><Maximize2 size={16} /></button>
                <div className="h-[1px] bg-white/10 mx-2"></div>
                <button onClick={() => setExtrusionScale(prev => Math.max(0.5, prev - 0.2))} className="p-2 hover:bg-white/10 rounded-lg text-white opacity-50 text-xs">-</button>
             </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
             <div className="glass-panel px-6 py-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-3xl flex items-center gap-8 shadow-2xl">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Stable</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Alerte</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Fraude/Critique</span>
                </div>
             </div>
          </div>

          <div className="absolute top-8 right-8 z-40 flex flex-col gap-3">
             <button onClick={() => setSelectedRegion('NATIONAL')} className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-brand transition-all shadow-2xl"><Crosshair size={22} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
