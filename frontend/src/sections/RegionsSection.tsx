import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Globe, Map as MapIcon, 
    ShieldCheck, Activity, Users, Zap, AlertTriangle,
    FileText, ArrowUpRight, Search, Navigation, 
    Maximize2, Info, ChevronRight, BarChart3, Radio,
    Layers, CheckCircle2, ShieldAlert
} from 'lucide-react';
import L from 'leaflet';
import { Region, Meter, DCU, Ticket } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface RegionsSectionProps {
    regions: Region[];
    meters: Meter[];
    dcus: DCU[];
    setEditingRegion: (region: Region | null) => void;
    setIsRegionModalOpen: (open: boolean) => void;
    handleDeleteRegion: (id: string) => void;
    setCurrentSection: (section: any) => void;
    setCustomerSearch: (query: string) => void;
    setMdmsSearch: (query: string) => void;
    setTicketSearch: (query: string) => void;
    onGenerateRegionalReport: (regionName: string) => void;
    tickets: Ticket[];
}

// 4 Multi-Provider Tile Layers matching MapSection.tsx
const MAP_PROVIDERS = {
    satellite: {
        name: 'Esri Satellite HD',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
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

// 8 Regional Coordinates of Niger
const REGION_COORDINATES: Record<string, { lat: number; lng: number; code: string; metersCount: number; dcuCount: number; availPct: number }> = {
    NIAMEY: { lat: 13.5137, lng: 2.1098, code: 'NY', metersCount: 245, dcuCount: 2, availPct: 96.4 },
    AGADEZ: { lat: 16.9706, lng: 7.9911, code: 'AG', metersCount: 68, dcuCount: 1, availPct: 92.1 },
    ZINDER: { lat: 13.8072, lng: 8.9881, code: 'ZN', metersCount: 82, dcuCount: 1, availPct: 87.2 },
    MARADI: { lat: 13.5000, lng: 7.1000, code: 'MA', metersCount: 54, dcuCount: 1, availPct: 89.5 },
    TAHOUA: { lat: 14.8833, lng: 5.2667, code: 'TH', metersCount: 32, dcuCount: 0, availPct: 91.8 },
    TILLABERI: { lat: 14.2081, lng: 1.4542, code: 'TL', metersCount: 21, dcuCount: 0, availPct: 88.4 },
    DOSSO: { lat: 13.0490, lng: 3.1937, code: 'DS', metersCount: 12, dcuCount: 0, availPct: 94.0 },
    DIFFA: { lat: 13.3154, lng: 12.6113, code: 'DF', metersCount: 15, dcuCount: 0, availPct: 74.6 }
};

export const RegionsSection = ({
    regions,
    meters,
    dcus,
    setEditingRegion,
    setIsRegionModalOpen,
    handleDeleteRegion,
    setCurrentSection,
    setCustomerSearch,
    setMdmsSearch,
    setTicketSearch,
    onGenerateRegionalReport,
    tickets
}: RegionsSectionProps) => {
    const [selectedRegionId, setSelectedRegionId] = useState<string>('NIAMEY');
    const [mapProvider, setMapProvider] = useState<'satellite' | 'osm' | 'terrain' | 'dark'>('satellite');
    const [tableSearchQuery, setTableSearchQuery] = useState('');

    // Leaflet Container Refs
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

    // Selected Region Details
    const selectedRegionData = useMemo(() => {
        return regions.find(r => r.id === selectedRegionId) || regions[0] || { id: 'NIAMEY', areaName: 'Niamey (Capitale)', principal: 'Ibrahim Ousmane', email: 'dr.niamey@nigelec.ne', status: 'enabled' };
    }, [regions, selectedRegionId]);

    const selectedRegionMeta = useMemo(() => {
        return REGION_COORDINATES[selectedRegionId] || REGION_COORDINATES.NIAMEY;
    }, [selectedRegionId]);

    // Filtered Table Regions
    const filteredTableRegions = useMemo(() => {
        return regions.filter(r => 
            r.areaName.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
            r.id.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
            (r.principal || '').toLowerCase().includes(tableSearchQuery.toLowerCase())
        );
    }, [regions, tableSearchQuery]);

    // 1. Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current || leafletMapRef.current) return;

        const initialCoords = REGION_COORDINATES.NIAMEY;
        const map = L.map(mapContainerRef.current, {
            center: [16.0, 7.5], // Center on Niger
            zoom: 6,
            zoomControl: false
        });

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

    // 3. Render Regional Map Markers
    useEffect(() => {
        if (!leafletMapRef.current || !markersLayerGroupRef.current) return;
        const group = markersLayerGroupRef.current;
        group.clearLayers();

        Object.entries(REGION_COORDINATES).forEach(([key, meta]) => {
            const isSelected = selectedRegionId === key;
            const badgeColor = meta.availPct >= 90 ? 'from-[#ff6b35] to-[#d44815]' : meta.availPct >= 80 ? 'from-amber-500 to-amber-700' : 'from-red-500 to-red-700';
            const shadowColor = isSelected ? '0 0 25px rgba(255,107,53,0.9)' : '0 0 12px rgba(0,0,0,0.5)';

            const icon = L.divIcon({
                className: 'custom-region-marker',
                html: `<div style="background:linear-gradient(135deg, ${meta.availPct >= 90 ? '#ff6b35, #d44815' : '#f59e0b, #b45309'});color:#fff;border:${isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)'};border-radius:14px;padding:6px 12px;font-weight:900;font-size:11px;box-shadow:${shadowColor};display:flex;items-center:center;gap:6px;transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all 0.3s ease;">
                        <span style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:8px;font-size:9px;">${meta.code}</span>
                        <span>${key}</span>
                        <span style="color:${meta.availPct >= 90 ? '#86efac' : '#fef08a'};">${meta.availPct}%</span>
                      </div>`,
                iconSize: [120, 36],
                iconAnchor: [60, 18]
            });

            const marker = L.marker([meta.lat, meta.lng], { icon }).addTo(group);
            marker.bindTooltip(`<b>${key} (NIGELEC)</b><br/>Compteurs AMI: ${meta.metersCount}<br/>DCUs: ${meta.dcuCount}<br/>Disponibilité: ${meta.availPct}%`, { direction: 'top' });
            
            marker.on('click', () => {
                setSelectedRegionId(key);
                leafletMapRef.current?.flyTo([meta.lat, meta.lng], 10, { animate: true, duration: 1.2 });
            });
        });
    }, [selectedRegionId]);

    const handleFlyToRegion = (key: string) => {
        setSelectedRegionId(key);
        const meta = REGION_COORDINATES[key];
        if (meta && leafletMapRef.current) {
            leafletMapRef.current.flyTo([meta.lat, meta.lng], 10, { animate: true, duration: 1.2 });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-32 text-white"
        >
            {/* ── Header Cartographique SIG Multicalque (Standard MapSection.tsx) ──── */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-r from-bg-dark via-[#0d0d12] to-black relative overflow-hidden shadow-2xl">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-brand/20 text-brand text-[9px] font-black uppercase rounded-lg border border-brand/30 flex items-center gap-1.5">
                                <Radio size={10} className="animate-pulse" /> NIGELEC GIS ENTERPRISE V6.5 (ESRI & MAPLIBRE INTEGRATED)
                            </span>
                            <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">
                                • Cartographie SIG Multi-Fournisseurs
                            </span>
                        </div>
                        <h2 className="text-3xl 2xl:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Globe className="text-brand" size={32} /> Souveraineté <span className="text-brand">Cartographique SIG</span>
                        </h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.25em] mt-1">
                            Maillage administratif et centres de distribution NIGELEC sur le territoire national du Niger
                        </p>
                    </div>

                    {/* Multi-Provider Tiles Control Bar */}
                    <div className="flex flex-wrap items-center gap-2 bg-black/60 p-2 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setMapProvider('satellite')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                mapProvider === 'satellite' ? "bg-brand text-white shadow-[0_0_15px_rgba(255,107,53,0.4)]" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Globe size={12} /> Esri Satellite
                        </button>
                        <button 
                            onClick={() => setMapProvider('osm')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                mapProvider === 'osm' ? "bg-brand text-white shadow-[0_0_15px_rgba(255,107,53,0.4)]" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <MapIcon size={12} /> OpenStreetMap
                        </button>
                        <button 
                            onClick={() => setMapProvider('terrain')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                mapProvider === 'terrain' ? "bg-brand text-white shadow-[0_0_15px_rgba(255,107,53,0.4)]" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Activity size={12} /> Terrain Topo
                        </button>
                        <button 
                            onClick={() => setMapProvider('dark')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                mapProvider === 'dark' ? "bg-brand text-white shadow-[0_0_15px_rgba(255,107,53,0.4)]" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Layers size={12} /> Dark Mode
                        </button>

                        <button 
                            onClick={() => { setEditingRegion(null); setIsRegionModalOpen(true); }}
                            className="ml-auto px-5 py-2.5 bg-gradient-to-r from-niger-green to-emerald-600 hover:brightness-110 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={14} /> Ajouter une Zone
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Layout: Interactive GIS Map + Regional Telemetry Side Panel ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ── Real Leaflet GIS Regional Map (8 Grid Columns) ────────────────── */}
                <div className="lg:col-span-8 glass-panel rounded-[2.5rem] border border-white/10 bg-[#0c0c0e] relative h-[680px] flex items-center justify-center overflow-hidden shadow-2xl">
                    
                    {/* Live Provider Banner */}
                    <div className="absolute top-6 left-6 z-[400] bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand animate-ping"></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            FOURNISSEUR SIG : <span className="text-brand font-mono">{MAP_PROVIDERS[mapProvider].name}</span>
                        </span>
                    </div>

                    {/* Leaflet Map DOM Element Container */}
                    <div ref={mapContainerRef} className="w-full h-full z-10" />

                    {/* Map Floating Controls */}
                    <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
                        <button 
                            onClick={() => leafletMapRef.current?.flyTo([16.0, 7.5], 6)} 
                            className="w-10 h-10 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-brand/40 transition-all backdrop-blur-md cursor-pointer"
                            title="Recadrer Vue Nationale Niger"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Regional Telemetry & Performance Side Panel (4 Grid Columns) ──── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 rounded-[2.5rem] border border-brand/30 bg-gradient-to-br from-brand/10 via-black/60 to-transparent space-y-6 shadow-2xl relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase bg-brand/20 text-brand border border-brand/30">
                                    REGION SÉLECTIONNÉE
                                </span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{selectedRegionData.areaName}</h3>
                                <p className="text-[9px] font-mono text-gray-400 mt-0.5">Code: {selectedRegionId} · Resp: {selectedRegionData.principal || 'Direction Régionale'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-black text-lg shadow-md">
                                {selectedRegionMeta.code}
                            </div>
                        </div>

                        {/* Direct Telemetry & Performance Grid */}
                        <div className="grid grid-cols-2 gap-3 bg-black/60 p-4 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Compteurs AMI</p>
                                <p className="text-lg font-black text-white font-mono mt-0.5">{selectedRegionMeta.metersCount} Unités</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Concentrateurs DCU</p>
                                <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">{selectedRegionMeta.dcuCount} DCUs</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Taux Disponibilité</p>
                                <p className="text-lg font-black text-green-400 font-mono mt-0.5">{selectedRegionMeta.availPct}%</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Stabilité Tension</p>
                                <p className="text-lg font-black text-white font-mono mt-0.5">99.2% Conforme</p>
                            </div>
                        </div>

                        {/* Interactive Regional Quick Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <button 
                                onClick={() => onGenerateRegionalReport(selectedRegionData.areaName)}
                                className="w-full py-3 bg-brand hover:bg-brand-light text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FileText size={14} /> Générer Rapport ARSE ({selectedRegionId})
                            </button>
                            <button 
                                onClick={() => { setCustomerSearch(selectedRegionId); setCurrentSection('meters'); }}
                                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Users size={12} /> Voir Compteurs de la Région
                            </button>
                            <button 
                                onClick={() => { setCurrentSection('dcus'); }}
                                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Zap size={12} /> Inspecter DCUs de la Zone
                            </button>
                        </div>
                    </div>

                    {/* Regions Selector Progress List */}
                    <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 bg-black/40 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Disponibilité par Région</h4>
                            <BarChart3 size={14} className="text-gray-500" />
                        </div>
                        
                        <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {Object.entries(REGION_COORDINATES).map(([key, meta]) => {
                                const isSelected = selectedRegionId === key;
                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => handleFlyToRegion(key)}
                                        className={cn(
                                            "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                            isSelected ? "bg-brand/20 border-brand/40 text-white" : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn("w-2 h-2 rounded-full", meta.availPct >= 90 ? "bg-green-400" : "bg-amber-400")}></div>
                                            <span className="text-[11px] font-black uppercase">{key}</span>
                                        </div>
                                        <span className="font-mono text-xs font-black text-green-400">{meta.availPct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table de Gestion Administrative des Régions ─────────────────── */}
            <div className="glass-panel overflow-hidden rounded-[3rem] border border-white/10 bg-bg-dark/40 shadow-2xl">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.25em]">Centres Opérationnels de Distribution NIGELEC</h4>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Maillage administratif et responsables régionaux</p>
                    </div>
                    <div className="flex gap-2">
                         <div className="px-4 py-2 bg-black/60 border border-white/10 rounded-xl flex items-center gap-2">
                             <Search size={14} className="text-gray-400" />
                             <input 
                                type="text" 
                                placeholder="RECHERCHER RÉGION, RESPONSABLE..." 
                                value={tableSearchQuery}
                                onChange={(e) => setTableSearchQuery(e.target.value)}
                                className="bg-transparent border-none text-[9px] font-black uppercase text-white focus:outline-none w-48 placeholder:text-gray-600" 
                             />
                         </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02]">
                            <tr className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">
                                <th className="px-8 py-5">Code / Blason</th>
                                <th className="px-8 py-5">Région Administrative</th>
                                <th className="px-8 py-5">Directeur Régional</th>
                                <th className="px-8 py-5">Infrastructure AMI</th>
                                <th className="px-8 py-5">État Réseau</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTableRegions.map(r => {
                                const meta = REGION_COORDINATES[r.id] || { metersCount: 120, dcuCount: 1, availPct: 94.0 };
                                return (
                                    <tr key={r.id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-none">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 p-1.5 overflow-hidden flex items-center justify-center shrink-0">
                                                    {r.blazon ? (
                                                        <img src={r.blazon} alt={r.areaName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <MapIcon size={18} className="text-brand" />
                                                    )}
                                                </div>
                                                <span className="font-mono text-xs text-brand font-black">{r.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div>
                                                <span className="block font-black text-white text-sm uppercase tracking-tight group-hover:text-brand transition-colors">{r.areaName}</span>
                                                <span className="block text-[8px] font-bold text-gray-500 uppercase mt-0.5 tracking-widest">Niveau Hiérarchique {r.label || 'Régional'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-[10px] font-black text-brand uppercase">
                                                    {r.principal?.charAt(0) || 'D'}
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-white uppercase">{r.principal || 'Direction Régionale'}</span>
                                                    <span className="block text-[8px] text-gray-500 font-mono font-bold uppercase">{r.email || `dr.${r.id.toLowerCase()}@nigelec.ne`}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="text-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <div className="text-white font-black text-[11px] font-mono">{meta.metersCount}</div>
                                                    <div className="text-[7px] text-gray-500 font-black uppercase">Compteurs</div>
                                                </div>
                                                <div className="text-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <div className="text-cyan-400 font-black text-[11px] font-mono">{meta.dcuCount}</div>
                                                    <div className="text-[7px] text-gray-500 font-black uppercase">DCUs</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest",
                                                r.status === 'enabled' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", r.status === 'enabled' ? "bg-green-400" : "bg-red-500")}></div>
                                                {r.status === 'enabled' ? 'Optimal (99.4%)' : 'Interrompu'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => handleFlyToRegion(r.id)}
                                                    className="p-2.5 bg-white/5 hover:bg-brand hover:text-white text-gray-400 rounded-xl border border-white/10 transition-all cursor-pointer"
                                                    title="Voir sur la Carte"
                                                >
                                                    <Globe size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => { setEditingRegion(r); setIsRegionModalOpen(true); }}
                                                    className="p-2.5 bg-white/5 hover:bg-brand/20 text-gray-400 hover:text-brand rounded-xl border border-white/10 transition-all cursor-pointer"
                                                    title="Modifier"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRegion(r.id)}
                                                    className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl border border-white/10 transition-all cursor-pointer"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};
