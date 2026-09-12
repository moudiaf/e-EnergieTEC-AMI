import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Globe, Map as MapIcon, 
    ShieldCheck, Activity, Users, Zap, AlertTriangle,
    FileText, ArrowUpRight, Search, Navigation, 
    Maximize2, Info, ChevronRight, BarChart3, Radio,
    Layers, CheckCircle2, ShieldAlert, Download, RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import { Region, Meter, DCU, Ticket } from '../types';
import { useAmi } from '../context/AmiContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

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

// 8 Regional Coordinates of Niger (Geographic Center Points)
const REGION_COORDINATES: Record<string, { lat: number; lng: number; code: string }> = {
    NIAMEY: { lat: 13.5137, lng: 2.1098, code: 'NY' },
    AGADEZ: { lat: 16.9706, lng: 7.9911, code: 'AG' },
    ZINDER: { lat: 13.8072, lng: 8.9881, code: 'ZN' },
    MARADI: { lat: 13.5000, lng: 7.1000, code: 'MA' },
    TAHOUA: { lat: 14.8833, lng: 5.2667, code: 'TH' },
    TILLABERI: { lat: 14.2081, lng: 1.4542, code: 'TL' },
    DOSSO: { lat: 13.0490, lng: 3.1937, code: 'DS' },
    DIFFA: { lat: 13.3154, lng: 12.6113, code: 'DF' }
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
    const { handleReadRegionTelemetry, handleReadTelemetry, addToast } = useAmi();
    const [selectedRegionId, setSelectedRegionId] = useState<string>('NIAMEY');
    const [mapProvider, setMapProvider] = useState<'satellite' | 'osm' | 'terrain' | 'dark'>('satellite');
    const [tableSearchQuery, setTableSearchQuery] = useState('');
    const [isPollingRegion, setIsPollingRegion] = useState(false);

    // Leaflet Container Refs
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const leafletMapRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

    // Dynamic Regional Calculation Function
    const getRegionStats = useMemo(() => {
        return (regId: string, regName: string = '') => {
            const regUpper = regId.toUpperCase();
            const nameUpper = regName.toUpperCase();

            // Compteurs réels rattachés
            const regMeters = meters.filter(m => {
                const loc = (m.location || '').toUpperCase();
                const rId = ((m as any).regionId || '').toUpperCase();
                return loc.includes(regUpper) || (nameUpper && loc.includes(nameUpper)) || rId === regUpper;
            });

            // Concentrateurs DCUs réels rattachés
            const regDcus = dcus.filter(d => {
                const dReg = (d.regionId || d.name || '').toUpperCase();
                return dReg.includes(regUpper) || (nameUpper && dReg.includes(nameUpper));
            });

            const onlineCount = regMeters.filter(m => m.status === 'online').length;
            const availPct = regMeters.length > 0 
                ? Math.round((onlineCount / regMeters.length) * 1000) / 10 
                : 0.0;

            const coord = REGION_COORDINATES[regUpper] || REGION_COORDINATES.NIAMEY;

            return {
                lat: coord.lat,
                lng: coord.lng,
                code: coord.code,
                metersCount: regMeters.length,
                meters: regMeters,
                dcuCount: regDcus.length,
                availPct: availPct
            };
        };
    }, [meters, dcus]);

    // Selected Region Details
    const selectedRegionData = useMemo(() => {
        return regions.find(r => r.id === selectedRegionId) || regions[0] || { id: 'NIAMEY', areaName: 'Niamey', principal: 'Ibrahim Ousmane', email: 'dr.niamey@nigelec.ne', status: 'enabled' };
    }, [regions, selectedRegionId]);

    const selectedRegionMeta = useMemo(() => {
        return getRegionStats(selectedRegionId, selectedRegionData.areaName);
    }, [selectedRegionId, selectedRegionData, getRegionStats]);

    // Trigger DLMS Batch Reading for Selected Region
    const handleTriggerRegionTelemetry = async (regId: string) => {
        setIsPollingRegion(true);
        try {
            const res = await handleReadRegionTelemetry(regId);
            addToast(`⚡ Télérelève régionale DLMS (${regId}) : ${res.polledCount}/${res.totalMeters || selectedRegionMeta.metersCount} compteurs interrogés avec succès !`, 'success');
        } catch (err: any) {
            // Fallback individual reading
            try {
                let successCount = 0;
                for (const m of selectedRegionMeta.meters) {
                    await handleReadTelemetry(m.id);
                    successCount++;
                }
                addToast(`⚡ Télérelève régionale DLMS (${regId}) : ${successCount} compteur(s) actualisé(s) en direct !`, 'success');
            } catch (innerErr: any) {
                addToast(`Erreur télérelève régionale : ${err.message || innerErr.message}`, 'error');
            }
        } finally {
            setIsPollingRegion(false);
        }
    };

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

        Object.entries(REGION_COORDINATES).forEach(([key]) => {
            const meta = getRegionStats(key, '');
            const isSelected = selectedRegionId === key;
            const shadowColor = isSelected ? '0 0 25px rgba(255,107,53,0.9)' : '0 0 12px rgba(0,0,0,0.5)';

            const icon = L.divIcon({
                className: 'custom-region-marker',
                html: `<div style="background:linear-gradient(135deg, #ff6b35, #d44815);color:#fff;border:${isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)'};border-radius:14px;padding:6px 12px;font-weight:900;font-size:11px;box-shadow:${shadowColor};display:flex;align-items:center;gap:6px;transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all 0.3s ease;">
                        <span style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:8px;font-size:9px;">${meta.code}</span>
                        <span>${key}</span>
                        <span style="color:#86efac;">${meta.availPct}%</span>
                      </div>`,
                iconSize: [120, 36],
                iconAnchor: [60, 18]
            });

            const marker = L.marker([meta.lat, meta.lng], { icon }).addTo(group);
            marker.bindTooltip(`<b>${key} (NIGELEC)</b><br/>Compteurs AMI: ${meta.metersCount}<br/>Disponibilité: ${meta.availPct}%`, { direction: 'top' });
            
            marker.on('click', () => {
                setSelectedRegionId(key);
                leafletMapRef.current?.flyTo([meta.lat, meta.lng], 10, { animate: true, duration: 1.2 });
            });
        });
    }, [selectedRegionId, getRegionStats]);

    const handleFlyToRegion = (key: string) => {
        setSelectedRegionId(key);
        const meta = REGION_COORDINATES[key];
        if (meta && leafletMapRef.current) {
            leafletMapRef.current.flyTo([meta.lat, meta.lng], 10, { animate: true, duration: 1.2 });
        }
    };

    const exportRegionsCSV = () => {
        if (!regions.length) return;
        const headers = ['Code_Region', 'Nom_Region', 'Directeur_Regional', 'Contact', 'Email', 'Compteurs_Raccordes', 'Disponibilite_Pct', 'Statut'];
        const rows = regions.map(r => {
            const meta = getRegionStats(r.id, r.areaName);
            return [
                r.id,
                `"${r.areaName}"`,
                `"${r.principal || ''}"`,
                r.contact || '',
                r.email || '',
                meta.metersCount,
                `${meta.availPct}%`,
                r.status === 'enabled' ? 'Actif' : 'Inactif'
            ];
        });
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `centres_regionaux_nigelec_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-32 text-white pt-2"
        >
            {/* ── Header Cartographique SIG Multicalque ──── */}
            <div className="bg-[#121318] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded-lg border border-brand/30 flex items-center gap-1.5">
                                <Radio size={12} className="animate-pulse" /> NIGELEC GIS ENTERPRISE V6.5
                            </span>
                            <span className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                                • Cartographie SIG & Télérelève Multi-Régions
                            </span>
                        </div>
                        <h2 className="text-3xl 2xl:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Globe className="text-brand" size={32} /> Directions Régionales <span className="text-brand">& Télérelève</span>
                        </h2>
                        <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">
                            Supervision et interrogation en direct des compteurs intelligents sur les 8 régions du Niger
                        </p>
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#181920] p-2.5 rounded-2xl border border-white/15">
                        <button 
                            onClick={() => setMapProvider('satellite')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                                mapProvider === 'satellite' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-md" : "bg-[#14151a] border-white/10 text-gray-300 hover:text-white"
                            )}
                        >
                            <Globe size={14} /> Esri Satellite
                        </button>
                        <button 
                            onClick={() => setMapProvider('osm')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                                mapProvider === 'osm' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-md" : "bg-[#14151a] border-white/10 text-gray-300 hover:text-white"
                            )}
                        >
                            <MapIcon size={14} /> OpenStreetMap
                        </button>
                        <button 
                            onClick={() => setMapProvider('terrain')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                                mapProvider === 'terrain' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-md" : "bg-[#14151a] border-white/10 text-gray-300 hover:text-white"
                            )}
                        >
                            <Activity size={14} /> Terrain Topo
                        </button>
                        <button 
                            onClick={() => setMapProvider('dark')}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                                mapProvider === 'dark' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-md" : "bg-[#14151a] border-white/10 text-gray-300 hover:text-white"
                            )}
                        >
                            <Layers size={14} /> Dark Mode
                        </button>

                        <button 
                            onClick={() => { setEditingRegion(null); setIsRegionModalOpen(true); }}
                            className="ml-auto px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={16} /> Ajouter une Zone
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Layout: Map + Telemetry Panel ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ── Real Leaflet GIS Regional Map (8 Grid Columns) ────────────────── */}
                <div className="lg:col-span-8 bg-[#121318] rounded-3xl border border-white/15 relative h-[680px] flex items-center justify-center overflow-hidden shadow-2xl">
                    
                    {/* Live Provider Banner */}
                    <div className="absolute top-6 left-6 z-[400] bg-[#181920] backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-brand animate-ping"></div>
                        <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                            SIG : <span className="text-brand font-mono font-bold">{MAP_PROVIDERS[mapProvider].name}</span>
                        </span>
                    </div>

                    {/* Leaflet Map DOM Element Container */}
                    <div ref={mapContainerRef} className="w-full h-full z-10" />

                    {/* Map Controls */}
                    <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
                        <button 
                            onClick={() => leafletMapRef.current?.flyTo([16.0, 7.5], 6)} 
                            className="w-10 h-10 rounded-xl bg-[#181920] border border-white/20 flex items-center justify-center text-white hover:border-brand transition-all backdrop-blur-md cursor-pointer"
                            title="Recadrer Vue Nationale Niger"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Regional Telemetry & Performance Side Panel (4 Grid Columns) ──── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#121318] p-6 rounded-3xl border border-brand/40 shadow-2xl space-y-6 relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-brand/20 text-brand border border-brand/30">
                                    RÉGION SÉLECTIONNÉE
                                </span>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">{selectedRegionData.areaName}</h3>
                                <p className="text-xs font-mono font-bold text-gray-300 mt-1">Code: {selectedRegionId} · Resp: {selectedRegionData.principal || 'Direction Régionale'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-black text-lg shadow-md shrink-0">
                                {selectedRegionMeta.code}
                            </div>
                        </div>

                        {/* Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-3 bg-[#181920] p-4 rounded-2xl border border-white/10">
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Compteurs AMI</p>
                                <p className="text-lg font-black text-white font-mono mt-0.5">{selectedRegionMeta.metersCount} Unité(s)</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Topologie</p>
                                <p className="text-lg font-black text-cyan-300 font-mono mt-0.5">Cellulaire GPRS</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Disponibilité</p>
                                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{selectedRegionMeta.availPct}%</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">Tension Réseau</p>
                                <p className="text-lg font-black text-white font-mono mt-0.5">230V / 400V</p>
                            </div>
                        </div>

                        {/* Direct Regional DLMS Telemetry Action */}
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <button 
                                onClick={() => handleTriggerRegionTelemetry(selectedRegionId)}
                                disabled={isPollingRegion}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isPollingRegion ? <RefreshCw size={16} className="animate-spin" /> : <Radio size={16} />}
                                {isPollingRegion ? `Télérelève [${selectedRegionId}] en cours...` : `⚡ Télérelever les Compteurs de ${selectedRegionId}`}
                            </button>

                            <button 
                                onClick={() => onGenerateRegionalReport(selectedRegionData.areaName)}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FileText size={14} /> Rapport ARSE ({selectedRegionId})
                            </button>
                            <button 
                                onClick={() => { setCustomerSearch(selectedRegionId); setCurrentSection('meters'); }}
                                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Users size={14} /> Voir Compteurs dans la Liste
                            </button>
                        </div>

                        {/* Mini Preview of Region's Meters */}
                        {selectedRegionMeta.meters.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Compteurs de la zone :</p>
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                    {selectedRegionMeta.meters.map(m => (
                                        <div key={m.id} className="p-2 bg-[#181920] border border-white/10 rounded-xl flex items-center justify-between text-xs font-mono">
                                            <span className="text-white font-bold">{m.id}</span>
                                            <span className="text-emerald-400 font-bold">{m.voltage}V</span>
                                            <span className="text-amber-300 font-bold">{m.credit} kWh</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Regions Selector Progress List */}
                    <div className="bg-[#121318] p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Disponibilité par Région</h4>
                            <BarChart3 size={16} className="text-brand" />
                        </div>
                        
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {Object.entries(REGION_COORDINATES).map(([key]) => {
                                const meta = getRegionStats(key, '');
                                const isSelected = selectedRegionId === key;
                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => handleFlyToRegion(key)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                            isSelected ? "bg-brand/20 border-brand/40 text-white" : "bg-[#181920] border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                                            <span className="text-xs font-bold uppercase">{key}</span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-emerald-400">{meta.availPct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table de Gestion Administrative des Régions ─────────────────── */}
            <div className="bg-[#121318] overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
                <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">Annuaire des Directions Régionales NIGELEC</h4>
                        <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">8 Régions administratives du Niger supervisées en temps réel</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={14} className="text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="Rechercher une région..."
                                value={tableSearchQuery}
                                onChange={e => setTableSearchQuery(e.target.value)}
                                className="bg-[#181920] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:border-brand outline-none"
                            />
                        </div>

                        <button 
                            onClick={exportRegionsCSV}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
                            title="Exporter la liste des régions"
                        >
                            <Download size={14} /> Exporter CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-[#181920]/80 text-[11px] font-black uppercase text-gray-300 tracking-wider">
                                <th className="p-4 pl-6">Code & Région</th>
                                <th className="p-4">Directeur Régional</th>
                                <th className="p-4">Contact & Email</th>
                                <th className="p-4 text-center">Compteurs Connectés</th>
                                <th className="p-4 text-center">Tension / Topologie</th>
                                <th className="p-4 text-center">Disponibilité</th>
                                <th className="p-4 text-center">Statut</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                            {filteredTableRegions.map(r => {
                                const meta = getRegionStats(r.id, r.areaName);
                                return (
                                    <tr key={r.id} className="hover:bg-white/[0.03] transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-xs">
                                                    {meta.code}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase">{r.areaName}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono font-bold">ID: {r.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-200">{r.principal || 'Non assigné'}</p>
                                            <p className="text-[10px] text-gray-400">Direction d'Exploitation</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-mono text-gray-300 font-bold">{r.contact || '+227 20 72 26 81'}</p>
                                            <p className="text-[10px] text-gray-400">{r.email || `dr.${r.id.toLowerCase()}@nigelec.ne`}</p>
                                        </td>
                                        <td className="p-4 text-center font-mono font-black text-white">
                                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                                                {meta.metersCount} AMI
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-white font-mono font-bold">230V / 400V</span>
                                            <span className="block text-[10px] text-cyan-300 font-medium">Cellulaire GPRS</span>
                                        </td>
                                        <td className="p-4 text-center font-mono font-black text-emerald-400">
                                            {meta.availPct}%
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                Opérationnel
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleTriggerRegionTelemetry(r.id)}
                                                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                                                    title={`Télérelever les compteurs de ${r.areaName}`}
                                                >
                                                    <Radio size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleFlyToRegion(r.id)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                    title="Centrer sur la carte"
                                                >
                                                    <Navigation size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => { setEditingRegion(r); setIsRegionModalOpen(true); }}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                                                    title="Modifier"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteRegion(r.id)}
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
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
