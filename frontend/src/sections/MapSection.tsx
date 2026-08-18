import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Database, Filter, Search, Zap, Wifi, WifiOff, 
  AlertCircle, ArrowUpRight, Crosshair, MapPin as MapPinIcon,
  ShieldAlert, Layers, Map as MapIcon, Maximize2, Radio,
  Activity, Power, RefreshCw, Sliders, Globe, Cpu, Server,
  CheckCircle2, X, Eye, EyeOff, BarChart2, ShieldCheck, Moon, Sun, Mountain
} from 'lucide-react';
import L from 'leaflet';
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

// Tile Providers for Leaflet Maplibre / ArcGIS / OSM / CARTO
const MAP_PROVIDERS = {
  satellite: {
    name: 'Esri Satellite HD',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  terrain: {
    name: 'OpenTopo Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style &copy; OpenTopoMap',
    maxZoom: 17
  },
  dark: {
    name: 'CARTO Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }
};

const REGION_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  NATIONAL: { lat: 16.0, lng: 7.5, zoom: 6 },
  NIAMEY: { lat: 13.5137, lng: 2.1098, zoom: 13 },
  AGADEZ: { lat: 16.973, lng: 7.990, zoom: 11 },
  ZINDER: { lat: 13.807, lng: 8.988, zoom: 12 },
  MARADI: { lat: 13.500, lng: 7.101, zoom: 12 },
  TAHOUA: { lat: 14.889, lng: 5.265, zoom: 11 },
  DIFFA: { lat: 13.315, lng: 12.611, zoom: 11 },
  DOSSO: { lat: 13.044, lng: 3.195, zoom: 12 },
  TILLABERI: { lat: 14.208, lng: 2.086, zoom: 11 }
};

export const MapSection = ({ meters, dcus, setViewingMeter, targetMeter }: MapSectionProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'warning' | 'offline' | 'tamper'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('NATIONAL');
  const [is3D, setIs3D] = useState(false);
  
  // GIS Tile Layer & Calques
  const [mapProvider, setMapProvider] = useState<'satellite' | 'osm' | 'terrain' | 'dark'>('satellite');
  const [showMetersLayer, setShowMetersLayer] = useState(true);
  const [showDcusLayer, setShowDcusLayer] = useState(true);
  const [showSubstationsLayer, setShowSubstationsLayer] = useState(true);
  const [showHeatmapLayer, setShowHeatmapLayer] = useState(false);

  // Selected Entity Telemetry Drawer
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'meter' | 'dcu' | 'substation', data: any } | null>(null);
  const [telemetryActionSuccess, setTelemetryActionSuccess] = useState<string | null>(null);

  // Leaflet Map Container Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Filtered Data
  const filteredMeters = useMemo(() => {
    return meters.filter(m => {
      const matchStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'tamper' ? (m.tamperStatus === 'tampered' || m.tamperStatus === 'detected') :
        m.status === filterStatus;
      
      const matchSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ((m as any).customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchRegion = selectedRegion === 'NATIONAL' || m.location.toUpperCase().includes(selectedRegion);
      
      return matchStatus && matchSearch && matchRegion;
    });
  }, [meters, filterStatus, searchQuery, selectedRegion]);

  // NIGELEC Official Substations / Transformers (Postes HTA/BT)
  const substations = useMemo(() => [
    { id: 'TR-NY-01', name: 'Poste HTA/BT Niamey Plateau', area: 'NIAMEY', lat: 13.525, lng: 2.105, powerKv: '15kV/400V', capacityKva: 630, loadPct: 78 },
    { id: 'TR-NY-02', name: 'Poste HTA/BT Niamey Goudel', area: 'NIAMEY', lat: 13.540, lng: 2.090, powerKv: '15kV/400V', capacityKva: 400, loadPct: 92 },
    { id: 'TR-MA-01', name: 'Poste HTA/BT Maradi Sud', area: 'MARADI', lat: 13.500, lng: 7.110, powerKv: '20kV/400V', capacityKva: 500, loadPct: 64 },
    { id: 'TR-ZN-01', name: 'Poste HTA/BT Zinder Centre', area: 'ZINDER', lat: 13.820, lng: 8.990, powerKv: '20kV/400V', capacityKva: 500, loadPct: 81 },
    { id: 'TR-AG-01', name: 'Poste HTA/BT Agadez Nord', area: 'AGADEZ', lat: 16.980, lng: 7.990, powerKv: '15kV/400V', capacityKva: 250, loadPct: 45 }
  ], []);

  const filteredSubstations = useMemo(() => {
    return substations.filter(s => selectedRegion === 'NATIONAL' || s.area === selectedRegion);
  }, [substations, selectedRegion]);

  // Target Meter Sync
  useEffect(() => {
    if (targetMeter) {
      const region = targetMeter.location.split(' ')[0].toUpperCase();
      if (REGION_CENTERS[region]) setSelectedRegion(region);
      setSelectedEntity({ type: 'meter', data: targetMeter });
      if (leafletMapRef.current && targetMeter.latitude && targetMeter.longitude) {
        leafletMapRef.current.setView([targetMeter.latitude, targetMeter.longitude], 15, { animate: true });
      }
    }
  }, [targetMeter]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initialView = REGION_CENTERS[selectedRegion] || REGION_CENTERS.NATIONAL;
    const map = L.map(mapContainerRef.current, {
      center: [initialView.lat, initialView.lng],
      zoom: initialView.zoom,
      zoomControl: false
    });

    // Add Tile Layer
    const provider = MAP_PROVIDERS[mapProvider];
    const tileLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 2. Update Map Provider (Tile Layer Switcher)
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const provider = MAP_PROVIDERS[mapProvider];
    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution
    }).addTo(leafletMapRef.current);
  }, [mapProvider]);

  // 3. Update Region View Center
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const view = REGION_CENTERS[selectedRegion] || REGION_CENTERS.NATIONAL;
    leafletMapRef.current.setView([view.lat, view.lng], view.zoom, { animate: true });
  }, [selectedRegion]);

  // 4. Render GIS Layer Markers (Compteurs, DCUs, Substations)
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerGroupRef.current) return;
    const group = markersLayerGroupRef.current;
    group.clearLayers();

    // A. Substations Layer (Hexagon Amber)
    if (showSubstationsLayer) {
      filteredSubstations.forEach(sub => {
        const icon = L.divIcon({
          className: 'custom-substation-marker',
          html: `<div style="width:24px;height:24px;background:linear-gradient(135deg,#f59e0b,#d97706);transform:rotate(45deg);border:2px solid #fff;box-shadow:0 0 12px rgba(245,158,11,0.6);border-radius:4px;display:flex;align-items:center;justify-content:center;">
                  <span style="transform:rotate(-45deg);color:#000;font-weight:bold;font-size:10px;">⚡</span>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const marker = L.marker([sub.lat, sub.lng], { icon }).addTo(group);
        marker.bindTooltip(`<b>${sub.name}</b><br/>Charge: ${sub.loadPct}% (${sub.capacityKva} kVA)`, { direction: 'top' });
        marker.on('click', () => setSelectedEntity({ type: 'substation', data: sub }));
      });
    }

    // B. DCUs Layer (Square Cyan)
    if (showDcusLayer) {
      dcus.forEach((dcu, idx) => {
        const lat = dcu.latitude || (13.52 + idx * 0.015);
        const lng = dcu.longitude || (2.10 + idx * 0.015);
        const icon = L.divIcon({
          className: 'custom-dcu-marker',
          html: `<div style="width:26px;height:26px;background:linear-gradient(180deg,#06b6d4,#2563eb);border:2px solid #fff;box-shadow:0 0 15px rgba(6,182,212,0.6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;">
                  📡
                </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        const marker = L.marker([lat, lng], { icon }).addTo(group);
        marker.bindTooltip(`<b>${dcu.name}</b><br/>IP: ${dcu.ipAddress} · ${dcu.connectedMeters} compteurs`, { direction: 'top' });
        marker.on('click', () => setSelectedEntity({ type: 'dcu', data: dcu }));
      });
    }

    // C. Meters Layer (Circle Green/Orange/Red)
    if (showMetersLayer) {
      filteredMeters.forEach(m => {
        const isFraude = m.tamperStatus === 'tampered' || m.tamperStatus === 'detected';
        const isWarning = m.status === 'warning';
        const color = isFraude ? '#ef4444' : isWarning ? '#f97316' : (m.status === 'online' ? '#22c55e' : '#6b7280');
        const glow = isFraude ? '0 0 12px #ef4444' : (m.status === 'online' ? '0 0 8px #22c55e' : 'none');

        const icon = L.divIcon({
          className: 'custom-meter-marker',
          html: `<div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:${glow};"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        const lat = m.latitude || (13.5137 + (Math.random() - 0.5) * 0.05);
        const lng = m.longitude || (2.1098 + (Math.random() - 0.5) * 0.05);

        const marker = L.marker([lat, lng], { icon }).addTo(group);
        marker.bindTooltip(`<b>${m.id}</b><br/>${(m as any).customerName || 'Abonné NIGELEC'}<br/>${m.credit?.toFixed(1) || 0} kWh`, { direction: 'top' });
        marker.on('click', () => {
          setViewingMeter(m);
          setSelectedEntity({ type: 'meter', data: m });
        });
      });
    }
  }, [filteredMeters, dcus, filteredSubstations, showMetersLayer, showDcusLayer, showSubstationsLayer]);

  const triggerTelemetryAction = (actionName: string) => {
    setTelemetryActionSuccess(actionName);
    setTimeout(() => setTelemetryActionSuccess(null), 3500);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      {/* ── Header GIS Hexing/Landis+Gyr Standards ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-[#0a0a0b]/90 backdrop-blur-2xl p-8 rounded-[32px] border border-white/10 gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-60"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/30 shadow-[0_0_25px_rgba(255,107,53,0.15)]">
            <Globe size={32} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase rounded-full border border-cyan-500/30">NIGELEC GIS ENTERPRISE v6.5 (ESRI & MAPLIBRE INTEGRATED)</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">• Cartographie SIG Multi-Fournisseurs</span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Console <span className="text-brand">SIG SIG-AMI</span> Réseau</h1>
            <div className="flex items-center gap-3 mt-2">
              <select 
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-white/5 text-[11px] text-brand font-black uppercase tracking-widest outline-none cursor-pointer appearance-none px-4 py-1.5 rounded-full border border-white/10 hover:border-brand/40 transition-all"
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
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">{filteredMeters.length} Compteurs · {dcus.length} DCUs Mappés</span>
            </div>
          </div>
        </div>
        
        {/* 4 Multi-Provider BaseMap Tile Switcher (Satellite, OSM, Terrain, Dark) */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner">
            {[
              { id: 'satellite', label: 'Esri Satellite', icon: Globe },
              { id: 'osm', label: 'OpenStreetMap', icon: MapIcon },
              { id: 'terrain', label: 'Terrain Topo', icon: Mountain },
              { id: 'dark', label: 'Dark Mode', icon: Moon }
            ].map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setMapProvider(m.id as any)} 
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2", 
                    mapProvider === m.id ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-gray-400 hover:text-white"
                  )}
                >
                    <m.icon size={12} /> {m.label}
                </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-[280px]">
            {(['all', 'online', 'warning', 'offline', 'tamper'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", filterStatus === s ? "bg-white/10 text-white shadow-lg" : "text-gray-500")}>
                    {s === 'all' ? 'Tous' : s === 'tamper' ? 'Fraudes' : s}
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Barre de Contrôle des Calques SIG (Layers Control) ────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel px-6 py-3.5 rounded-2xl border border-white/5 bg-black/40 text-xs">
        <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
          <Sliders size={14} className="text-brand" /> Calques SIG Actifs :
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={showMetersLayer} onChange={e => setShowMetersLayer(e.target.checked)} className="rounded accent-brand" />
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Compteurs ({filteredMeters.length})
          </label>
          <label className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={showDcusLayer} onChange={e => setShowDcusLayer(e.target.checked)} className="rounded accent-cyan-500" />
            <span className="w-2 h-2 rounded-[2px] bg-cyan-400"></span> DCU Concentrateurs ({dcus.length})
          </label>
          <label className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase cursor-pointer hover:text-white transition-colors">
            <input type="checkbox" checked={showSubstationsLayer} onChange={e => setShowSubstationsLayer(e.target.checked)} className="rounded accent-amber-500" />
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Postes HTA/BT ({filteredSubstations.length})
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Panneau de Recherche & Télémesure GIS Latérale ────────────────── */}
        <div className="space-y-6">
           {/* Barre de Recherche Instantanée SIG */}
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="RECHERCHER COMPTEUR, DCU, CLIENT..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand/50 transition-all placeholder:text-gray-600 shadow-inner"
              />
           </div>

           {/* Inspections Télémesure Sélectionnée (Sinon Statistiques Régionales) */}
           {selectedEntity ? (
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-[2rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-black/40 to-transparent space-y-5 shadow-2xl relative">
                <button 
                  onClick={() => setSelectedEntity(null)} 
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>

                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {selectedEntity.type === 'meter' ? 'Compteur AMI' : selectedEntity.type === 'dcu' ? 'Concentrateur DCU' : 'Poste HTA/BT'}
                      </span>
                   </div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedEntity.data.name || selectedEntity.data.id}</h3>
                   <p className="text-[9px] font-mono text-gray-400 mt-0.5">{selectedEntity.data.id} · {selectedEntity.data.location || selectedEntity.data.ipAddress || selectedEntity.data.area}</p>
                </div>

                {/* Direct Telemetry Table — Adaptative Triphasé HTA/BT vs Monophasé */}
                {selectedEntity.type === 'substation' ? (
                  <div className="space-y-3 bg-black/60 p-4 rounded-2xl border border-amber-500/20">
                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Régime de Tension</span>
                        <span className="text-[9px] font-black text-white font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">Triphasé 3×400V+N ({selectedEntity.data.powerKv})</span>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Phase L1-N</p>
                           <p className="text-xs font-black text-amber-400 font-mono mt-0.5">230.4 V</p>
                           <p className="text-[7px] text-gray-400 font-mono mt-0.5">240 A</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Phase L2-N</p>
                           <p className="text-xs font-black text-amber-400 font-mono mt-0.5">231.2 V</p>
                           <p className="text-[7px] text-gray-400 font-mono mt-0.5">235 A</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Phase L3-N</p>
                           <p className="text-xs font-black text-amber-400 font-mono mt-0.5">229.8 V</p>
                           <p className="text-[7px] text-gray-400 font-mono mt-0.5">242 A</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                        <div>
                           <p className="text-[8px] font-black text-gray-500 uppercase">Charge Transfo</p>
                           <p className="font-mono font-black text-white">{selectedEntity.data.loadPct}% ({selectedEntity.data.capacityKva} kVA)</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-500 uppercase">Équilibrage Phases</p>
                           <p className="font-mono font-black text-green-400">98.4% Conforme</p>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 bg-black/50 p-4 rounded-2xl border border-white/5">
                     <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tension Phase (V)</p>
                        <p className="text-sm font-black text-white font-mono mt-0.5">230.4 V</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Courant Charge (A)</p>
                        <p className="text-sm font-black text-cyan-400 font-mono mt-0.5">12.8 A</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Facteur Puissance</p>
                        <p className="text-sm font-black text-green-400 font-mono mt-0.5">0.98 cos φ</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Type Régime</p>
                        <p className="text-xs font-black text-white font-mono mt-0.5">Triphasé 400V</p>
                     </div>
                  </div>
                )}

                {/* Dynamic Remote Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                   {telemetryActionSuccess && (
                     <div className="p-2.5 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-[9px] font-black uppercase text-center flex items-center justify-center gap-2">
                       <CheckCircle2 size={12} /> {telemetryActionSuccess}
                     </div>
                   )}
                   <button 
                     onClick={() => triggerTelemetryAction('Télé-Coupure Disjoncteur Exécutée')} 
                     className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                     <Power size={12} /> Télé-Coupure à Distance
                   </button>
                   <button 
                     onClick={() => triggerTelemetryAction('Relais Réarmé avec Succès')} 
                     className="w-full py-2.5 bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/30 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                     <ShieldCheck size={12} /> Réarmement Relais
                   </button>
                   <button 
                     onClick={() => triggerTelemetryAction('Ping Telemetry OK (Latence: 42ms)')} 
                     className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={12} /> Ping SIG Temps-Réel
                   </button>
                </div>
             </motion.div>
           ) : (
             <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-brand" /> Disponibilité par Région
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Niamey (Capitale)', count: '96.4%', color: 'text-green-400' },
                    { label: 'Agadez (Nord)', count: '92.1%', color: 'text-green-400' },
                    { label: 'Maradi (Sud)', count: '89.5%', color: 'text-green-400' },
                    { label: 'Zinder (Est)', count: '87.2%', color: 'text-orange-400' },
                    { label: 'Tahoua (Centre)', count: '91.8%', color: 'text-green-400' },
                    { label: 'Tillabéri (Ouest)', count: '88.4%', color: 'text-orange-400' },
                    { label: 'Dosso (Sud-Ouest)', count: '94.0%', color: 'text-green-400' },
                    { label: 'Diffa (Extrême-Est)', count: '84.6%', color: 'text-red-400' }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px]">
                       <span className="font-bold text-gray-400 uppercase">{s.label}</span>
                       <span className={cn("font-black font-mono", s.color)}>{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[8px] text-gray-500 font-bold uppercase text-center mt-4">
                  Cliquez sur n'importe quel équipement de la carte pour inspecter la télémesure en direct
                </div>
             </div>
           )}
        </div>

        {/* ── Zone Cartographique Leaflet / MapLibre (Esri, OSM, Terrain, Dark) ────────────────── */}
        <div className="lg:col-span-3 glass-panel rounded-[2.5rem] border border-white/10 bg-[#08080a] relative overflow-hidden min-h-[620px] flex flex-col justify-between shadow-2xl">
          
          {/* Leaflet Map Canvas Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[600px] z-0 rounded-[2.5rem]" />

          {/* Active Provider Floating HUD */}
          <div className="absolute top-6 left-6 z-40 pointer-events-none">
             <div className="px-4 py-2 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Fournisseur SIG : <span className="text-brand">{MAP_PROVIDERS[mapProvider].name}</span>
                </span>
             </div>
          </div>

          {/* Dynamic Map Legend */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
             <div className="glass-panel px-6 py-3 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-3xl flex items-center gap-6 shadow-2xl">
                <div className="flex items-center gap-2.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Compteur Stable</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Alerte</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Fraude / Tamper</span>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <div className="flex items-center gap-2.5">
                   <div className="w-3 h-3 rounded-[3px] bg-gradient-to-b from-cyan-500 to-blue-600 shadow-[0_0_8px_rgba(6,182,212,0.5)] border border-white/20"></div>
                   <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">DCU Concentrateur</span>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <div className="flex items-center gap-2.5">
                   <div className="w-3 h-3 rotate-45 bg-amber-500 border border-white/30 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Poste HTA/BT</span>
                </div>
             </div>
          </div>

          {/* Reset View Button */}
          <div className="absolute top-6 right-6 z-40 flex flex-col gap-3">
             <button onClick={() => setSelectedRegion('NATIONAL')} className="w-11 h-11 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-brand transition-all shadow-2xl" title="Recadrer sur la carte nationale"><Crosshair size={20} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
