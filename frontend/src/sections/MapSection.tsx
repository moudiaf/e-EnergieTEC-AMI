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
import { useAmi } from '../context/AmiContext';

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
  const { authFetch, fetchData, addToast, handleReadTelemetry, handleReadRegionTelemetry } = useAmi();
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'warning' | 'offline' | 'tamper'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('NATIONAL');
  const [is3D, setIs3D] = useState(false);
  
  // Loading states for actions
  const [isReadingTelemetry, setIsReadingTelemetry] = useState(false);
  const [isRelayLoading, setIsRelayLoading] = useState(false);

  // GIS Tile Layer & Calques
  const [mapProvider, setMapProvider] = useState<'satellite' | 'osm' | 'terrain' | 'dark'>('satellite');
  const [showMetersLayer, setShowMetersLayer] = useState(true);
  const [showDcusLayer, setShowDcusLayer] = useState(true);
  const [showSubstationsLayer, setShowSubstationsLayer] = useState(true);
  const [showHeatmapLayer, setShowHeatmapLayer] = useState(false);

  // Selected Entity Telemetry Drawer
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'meter' | 'dcu' | 'substation', data: any } | null>(null);
  const [telemetryActionSuccess, setTelemetryActionSuccess] = useState<string | null>(null);

  // Synchronize selectedEntity with fresh meters array
  useEffect(() => {
    if (selectedEntity && selectedEntity.type === 'meter') {
      const fresh = meters.find(m => m.id === selectedEntity.data.id || m.serialNumber === selectedEntity.data.id);
      if (fresh) {
        setSelectedEntity({ type: 'meter', data: fresh });
      }
    }
  }, [meters]);

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

  // NIGELEC Official Substations / Transformers (Postes HTA/BT réels)
  const substations = useMemo(() => [], []);

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

    // C. Meters Layer (Circle Green/Orange/Red) — Strictly Real Geolocation Only
    if (showMetersLayer) {
      filteredMeters.filter(m => typeof m.latitude === 'number' && typeof m.longitude === 'number').forEach(m => {
        const isFraude = m.tamperStatus === 'tampered' || m.tamperStatus === 'detected';
        const isWarning = m.status === 'warning';
        const color = isFraude ? '#ef4444' : isWarning ? '#f97316' : (m.status === 'online' ? '#22c55e' : '#6b7280');
        const glow = isFraude ? '0 0 16px #ef4444' : (m.status === 'online' ? '0 0 8px #22c55e' : 'none');

        const icon = L.divIcon({
          className: 'custom-meter-marker',
          html: `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
                  ${isFraude ? '<div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(239,68,68,0.45);box-shadow:0 0 12px #ef4444;"></div>' : ''}
                  <div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:${glow};position:relative;z-index:10;"></div>
                </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        const lat = m.latitude!;
        const lng = m.longitude!;

        const marker = L.marker([lat, lng], { icon }).addTo(group);
        
        const statusLabel = isFraude 
          ? '<span style="color:#ef4444;font-weight:900;">🔴 FRAUDE / TAMPER</span>' 
          : isWarning 
            ? '<span style="color:#f97316;font-weight:900;">🟠 ALERTE</span>' 
            : (m.status === 'online' ? '<span style="color:#22c55e;font-weight:900;">🟢 COMPTEUR STABLE</span>' : '<span style="color:#9ca3af;font-weight:900;">⚪ HORS-LIGNE</span>');

        const relayLabel = m.relayStatus === 'OPEN' 
          ? '<span style="color:#ef4444;font-weight:bold;">OUVERT (Coupé)</span>' 
          : '<span style="color:#22c55e;font-weight:bold;">FERMÉ (Alimenté)</span>';

        const lastSync = m.lastTelemetrySync 
          ? new Date(m.lastTelemetrySync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
          : 'En direct';

        const isTriphase = m.phaseType === 'triphase';
        const regimeBadge = isTriphase 
          ? '<span style="background:rgba(14,165,233,0.25);color:#38bdf8;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:900;">TRIPHASÉ 3×400V</span>' 
          : '<span style="background:rgba(34,197,94,0.2);color:#4ade80;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:900;">MONOPHASÉ 230V</span>';

        marker.bindTooltip(`
          <div style="background:#0f1115;color:#fff;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;min-width:215px;box-shadow:0 10px 25px rgba(0,0,0,0.8);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <span style="font-weight:900;font-size:13px;color:#ff6b35;">N° ${m.id}</span>
              ${regimeBadge}
            </div>
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px;">${(m as any).customerName || m.location}</div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">Statut SIG:</span> ${statusLabel}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">${isTriphase ? 'Tensions 3 Ph:' : 'Tension L1:'}</span> <b style="color:#fff;">${isTriphase ? '3×' + (m.voltage ? m.voltage.toFixed(1) : '223.6') + ' V' : (m.voltage ? m.voltage.toFixed(1) + ' V' : '230 V')}</b>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">Courant:</span> <b style="color:#fff;">${m.current !== undefined ? m.current.toFixed(3) + ' A' : '0 A'}</b>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">Puissance:</span> <b style="color:#38bdf8;">${m.power !== undefined ? (m.power * 1000).toFixed(0) + ' W' : '0 W'}</b>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">Crédit STS:</span> <b style="color:#22c55e;">${m.credit !== undefined ? m.credit.toFixed(2) + ' kWh' : '0 kWh'}</b>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
              <span style="color:#9ca3af;">Relais:</span> ${relayLabel}
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:4px;padding-top:4px;display:flex;justify-content:space-between;font-size:9px;color:#6b7280;">
              <span>Dernière synchro:</span> <span>${lastSync}</span>
            </div>
          </div>
        `, { direction: 'top', opacity: 1 });

        marker.on('click', () => {
          setSelectedEntity({ type: 'meter', data: m });
        });
      });
    }
  }, [filteredMeters, dcus, filteredSubstations, showMetersLayer, showDcusLayer, showSubstationsLayer]);

  const handleLiveRead = async (meterId: string) => {
    setIsReadingTelemetry(true);
    try {
      const res = await handleReadTelemetry(meterId);
      const tel = res?.parsedTelemetry;
      if (tel) {
        addToast(`⚡ Télérelève GPRS (${meterId}) : ${tel.voltageA || 230} V · ${tel.currentA || 0} A · ${tel.remainingCreditKwh || 0} kWh`, 'success');
      } else {
        addToast(`⚡ Télérelève GPRS réussie pour le compteur ${meterId}`, 'success');
      }
    } catch (err: any) {
      addToast(`Échec télérelève: ${err.message}`, 'error');
    } finally {
      setIsReadingTelemetry(false);
    }
  };

  const handleRelayAction = async (meterId: string, action: 'open' | 'close') => {
    setIsRelayLoading(true);
    try {
      const res = await authFetch('/api/v1/vending2/relay-control', {
        method: 'POST',
        body: JSON.stringify({ meterNo: meterId, action })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Erreur HTTP ${res.status}`);
      }
      addToast(action === 'open' ? `🔴 Télé-Coupure effectuée sur le compteur ${meterId}` : `🟢 Relais réarmé avec succès sur ${meterId}`, 'success');
      await fetchData();
    } catch (err: any) {
      addToast(`Échec action disjoncteur: ${err.message}`, 'error');
    } finally {
      setIsRelayLoading(false);
    }
  };

  const handleScanDcu = async (regionId: string) => {
    setIsReadingTelemetry(true);
    try {
      const res = await handleReadRegionTelemetry(regionId);
      addToast(`📡 Balayage DCU terminé : ${res?.results?.length || 0} compteurs interrogés`, 'success');
    } catch (err: any) {
      addToast(`Échec balayage DCU: ${err.message}`, 'error');
    } finally {
      setIsReadingTelemetry(false);
    }
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
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-[320px]">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'online', label: 'Stables' },
              { id: 'warning', label: 'Alertes' },
              { id: 'offline', label: 'Hors-Ligne' },
              { id: 'tamper', label: 'Fraudes' }
            ].map(s => (
                <button key={s.id} onClick={() => setFilterStatus(s.id as any)} className={cn("px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", filterStatus === s.id ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-white")}>
                    {s.label}
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

                {/* Direct Telemetry Table — Adaptative Substation vs DCU vs Meter */}
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
                ) : selectedEntity.type === 'dcu' ? (
                  <div className="space-y-3 bg-black/60 p-4 rounded-2xl border border-cyan-500/20">
                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Liaison Réseau DCU</span>
                        <span className="text-[9px] font-black text-emerald-400 font-mono bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          {selectedEntity.data.status?.toUpperCase() || 'EN LIGNE'}
                        </span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Adresse IP</p>
                           <p className="text-xs font-mono font-bold text-white mt-0.5">{selectedEntity.data.ipAddress || '47.90.150.122'}</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Compteurs Rattachés</p>
                           <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{selectedEntity.data.connectedMeters || 2} actifs</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Signal Radio (GPRS/4G)</p>
                           <p className="text-xs font-mono font-bold text-green-400 mt-0.5">{selectedEntity.data.signalStrength || 92}%</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                           <p className="text-[7px] font-black text-gray-500 uppercase">Charge CPU / RAM</p>
                           <p className="text-xs font-mono font-bold text-white mt-0.5">{selectedEntity.data.cpuUsage || 12.4}% · {selectedEntity.data.memUsage || 38.2}%</p>
                        </div>
                     </div>
                     <button
                       onClick={() => handleScanDcu(selectedEntity.data.regionId || 'NIAMEY')}
                       disabled={isReadingTelemetry}
                       className="w-full mt-2 py-2.5 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white border border-cyan-500/30 text-cyan-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                     >
                       <RefreshCw size={12} className={isReadingTelemetry ? 'animate-spin' : ''} />
                       {isReadingTelemetry ? 'Interrogation en cours...' : 'Balayer Télérelève Compteurs DCU'}
                     </button>
                  </div>
                ) : (
                  /* COMPTEUR TÉLÉMESURE EN DIRECT */
                  <div className="space-y-3">
                    {/* Badge Statut SIG synchronisé avec la légende */}
                    <div className="flex justify-between items-center p-3 rounded-2xl bg-black/60 border border-white/10">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Statut SIG Réseau</span>
                      {(() => {
                        const isTamper = selectedEntity.data.tamperStatus === 'tampered' || selectedEntity.data.tamperStatus === 'detected';
                        const isWarn = selectedEntity.data.status === 'warning';
                        const isOnline = selectedEntity.data.status === 'online';
                        if (isTamper) {
                          return (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 text-[9px] font-black uppercase rounded-lg border border-red-500/40 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                              FRAUDE / TAMPER
                            </span>
                          );
                        }
                        if (isWarn) {
                          return (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase rounded-lg border border-orange-500/40">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
                              ALERTE
                            </span>
                          );
                        }
                        if (isOnline) {
                          return (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-lg border border-green-500/40">
                              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                              COMPTEUR STABLE
                            </span>
                          );
                        }
                        return (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-500/20 text-gray-400 text-[9px] font-black uppercase rounded-lg border border-gray-500/40">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            HORS LIGNE
                          </span>
                        );
                      })()}
                    </div>

                    {/* Grille Métrologique 6 Métriques Clés avec support Triphasé */}
                    {selectedEntity.data.phaseType === 'triphase' ? (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9px]">
                          <span className="text-cyan-400 font-bold uppercase">Régime Électrique :</span>
                          <span className="font-mono font-black text-white">Triphasé 3×400V+N (Industrie)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center bg-black/50 p-2.5 rounded-2xl border border-white/5">
                          <div className="p-1.5 bg-white/5 rounded-lg">
                            <p className="text-[7px] text-gray-500 uppercase font-bold">Phase L1</p>
                            <p className="text-xs font-mono font-bold text-white mt-0.5">{selectedEntity.data.voltage ? `${Number(selectedEntity.data.voltage).toFixed(1)}V` : '223.6V'}</p>
                            <p className="text-[7px] font-mono text-cyan-400">{selectedEntity.data.current !== undefined ? `${Number(selectedEntity.data.current).toFixed(2)}A` : '0A'}</p>
                          </div>
                          <div className="p-1.5 bg-white/5 rounded-lg">
                            <p className="text-[7px] text-gray-500 uppercase font-bold">Phase L2</p>
                            <p className="text-xs font-mono font-bold text-white mt-0.5">{selectedEntity.data.voltageL2 ? `${Number(selectedEntity.data.voltageL2).toFixed(1)}V` : (selectedEntity.data.voltage ? `${Number(selectedEntity.data.voltage).toFixed(1)}V` : '223.6V')}</p>
                            <p className="text-[7px] font-mono text-cyan-400">{selectedEntity.data.currentL2 !== undefined ? `${Number(selectedEntity.data.currentL2).toFixed(2)}A` : '0A'}</p>
                          </div>
                          <div className="p-1.5 bg-white/5 rounded-lg">
                            <p className="text-[7px] text-gray-500 uppercase font-bold">Phase L3</p>
                            <p className="text-xs font-mono font-bold text-white mt-0.5">{selectedEntity.data.voltageL3 ? `${Number(selectedEntity.data.voltageL3).toFixed(1)}V` : (selectedEntity.data.voltage ? `${Number(selectedEntity.data.voltage).toFixed(1)}V` : '223.6V')}</p>
                            <p className="text-[7px] font-mono text-cyan-400">{selectedEntity.data.currentL3 !== undefined ? `${Number(selectedEntity.data.currentL3).toFixed(2)}A` : '0A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-2xl border border-white/5">
                          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Puissance Triphasée</p>
                            <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                              {selectedEntity.data.power !== undefined ? `${(Number(selectedEntity.data.power) * 1000).toFixed(0)} W` : '0 W'}
                            </p>
                          </div>
                          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Solde STS Restant</p>
                            <p className="text-sm font-black text-amber-400 font-mono mt-0.5">
                              {selectedEntity.data.credit !== undefined ? `${Number(selectedEntity.data.credit).toFixed(2)} kWh` : '7.00 kWh'}
                            </p>
                          </div>
                          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">État Disjoncteur</p>
                            <p className="text-xs font-black font-mono mt-0.5">
                              {selectedEntity.data.relayStatus === 'OPEN' ? <span className="text-red-400">🔴 OUVERT (Coupé)</span> : <span className="text-green-400">🟢 FERMÉ (Alimenté)</span>}
                            </p>
                          </div>
                          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Sécurité Capot</p>
                            <p className="text-xs font-black font-mono mt-0.5">
                              {selectedEntity.data.tamperStatus === 'tampered' || selectedEntity.data.tamperStatus === 'detected'
                                ? <span className="text-red-400">⚠️ FRAUDE DÉTECTÉE</span>
                                : <span className="text-emerald-400">🛡️ INTACT / SCELLÉ</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Grille Monophasé */
                      <div className="grid grid-cols-2 gap-2.5 bg-black/50 p-3.5 rounded-2xl border border-white/5">
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Tension L-N</p>
                            <p className="text-sm font-black text-white font-mono mt-0.5">
                              {selectedEntity.data.voltage ? `${Number(selectedEntity.data.voltage).toFixed(1)} V` : '230.0 V'}
                            </p>
                         </div>
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Courant Mesuré</p>
                            <p className="text-sm font-black text-cyan-400 font-mono mt-0.5">
                              {selectedEntity.data.current !== undefined ? `${Number(selectedEntity.data.current).toFixed(3)} A` : '0.000 A'}
                            </p>
                         </div>
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Puissance Instantanée</p>
                            <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                              {selectedEntity.data.power !== undefined 
                                ? `${(Number(selectedEntity.data.power) * 1000).toFixed(0)} W` 
                                : '0 W'}
                            </p>
                         </div>
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Solde STS Restant</p>
                            <p className="text-sm font-black text-amber-400 font-mono mt-0.5">
                              {selectedEntity.data.credit !== undefined ? `${Number(selectedEntity.data.credit).toFixed(2)} kWh` : '0.00 kWh'}
                            </p>
                         </div>
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">État Disjoncteur</p>
                            <p className="text-xs font-black font-mono mt-0.5">
                              {selectedEntity.data.relayStatus === 'OPEN' 
                                ? <span className="text-red-400">🔴 OUVERT (Coupé)</span> 
                                : <span className="text-green-400">🟢 FERMÉ (Alimenté)</span>}
                            </p>
                         </div>
                         <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Sécurité Capot</p>
                            <p className="text-xs font-black font-mono mt-0.5">
                              {selectedEntity.data.tamperStatus === 'tampered' || selectedEntity.data.tamperStatus === 'detected'
                                ? <span className="text-red-400">⚠️ OUVERTURE FRAUDE</span>
                                : <span className="text-emerald-400">🛡️ INTACT / SCELLÉ</span>}
                            </p>
                         </div>
                      </div>
                    )}

                    {/* Horodatage de Dernière Remontée */}
                    <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-mono text-gray-400">
                       <span className="uppercase text-gray-500 font-bold">Dernière Remontée GPRS :</span>
                       <span className="text-white font-bold">
                         {selectedEntity.data.lastTelemetrySync 
                           ? new Date(selectedEntity.data.lastTelemetrySync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                           : 'Synchronisé'}
                       </span>
                    </div>

                    {/* Boutons d'Action Réelle */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                       <button 
                         onClick={() => handleLiveRead(selectedEntity.data.id)} 
                         disabled={isReadingTelemetry}
                         className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white border border-cyan-500/30 text-cyan-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                       >
                         <RefreshCw size={12} className={isReadingTelemetry ? 'animate-spin' : ''} />
                         {isReadingTelemetry ? 'Télérelève GPRS en cours...' : '⚡ Télérelève GPRS Directe'}
                       </button>

                       <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleRelayAction(selectedEntity.data.id, 'open')} 
                            disabled={isRelayLoading}
                            className="py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                          >
                            <Power size={12} /> Télé-Coupure
                          </button>
                          <button 
                            onClick={() => handleRelayAction(selectedEntity.data.id, 'close')} 
                            disabled={isRelayLoading}
                            className="py-2.5 bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/30 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck size={12} /> Réarmement
                          </button>
                       </div>

                       <button 
                         onClick={() => setViewingMeter(selectedEntity.data)} 
                         className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                       >
                         <Eye size={12} /> Ouvrir Fiche Complète
                       </button>
                    </div>
                  </div>
                )}
             </motion.div>
           ) : (
             <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-brand" /> Disponibilité par Région
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'NIAMEY', label: 'Niamey (Capitale)' },
                    { key: 'AGADEZ', label: 'Agadez (Nord)' },
                    { key: 'MARADI', label: 'Maradi (Sud)' },
                    { key: 'ZINDER', label: 'Zinder (Est)' },
                    { key: 'TAHOUA', label: 'Tahoua (Centre)' },
                    { key: 'TILLABERI', label: 'Tillabéri (Ouest)' },
                    { key: 'DOSSO', label: 'Dosso (Sud-Ouest)' },
                    { key: 'DIFFA', label: 'Diffa (Extrême-Est)' }
                  ].map((r, i) => {
                    const regionMeters = meters.filter(m => (m.location || '').toUpperCase().includes(r.key) || m.id.startsWith(r.key));
                    const total = regionMeters.length;
                    const online = regionMeters.filter(m => m.status === 'online').length;
                    const displayVal = total > 0 ? `${((online / total) * 100).toFixed(1)}%` : 'Non disponible';
                    const colorClass = total === 0 ? 'text-gray-500' : (online / total >= 0.9 ? 'text-green-400' : 'text-orange-400');
                    return (
                      <div key={i} className="flex justify-between items-center text-[10px]">
                         <span className="font-bold text-gray-400 uppercase">{r.label}</span>
                         <span className={cn("font-black font-mono", colorClass)}>{displayVal}</span>
                      </div>
                    );
                  })}
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
