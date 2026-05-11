import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Edit, Trash2, Globe, Map as MapIcon, 
    ShieldCheck, Activity, Users, Zap, AlertTriangle,
    FileText, ArrowUpRight, Search, Navigation, 
    Maximize2, Info, ChevronRight, BarChart3
} from 'lucide-react';
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
    const [selectedMapRegion, setSelectedMapRegion] = useState<string | null>(null);

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

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8 pb-32 text-white"
        >
            {/* ── Header Institutionnel ────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-niger-green/20 text-niger-green text-[8px] font-black uppercase rounded border border-niger-green/30">Supervision Nationale</span>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-brand uppercase tracking-widest">
                            <Globe size={10} /> Déploiement Territorial Niger
                        </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Souveraineté <span className="text-brand">Cartographique</span></h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Maillage administratif et centres de distribution NIGELEC</p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => { setEditingRegion(null); setIsRegionModalOpen(true); }}
                        className="group relative px-6 py-3 bg-brand shadow-[0_10px_30px_rgba(255,107,53,0.3)] hover:bg-brand-light rounded-2xl transition-all flex items-center gap-3 overflow-hidden text-white"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <Plus size={18} className="relative z-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Ajouter une Zone</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Carte Tactique Interactif ─────────────────────────── */}
                <div className="lg:col-span-8 glass-panel rounded-[2.5rem] border border-white/5 bg-[#0c0c0e] relative h-[700px] flex items-center justify-center overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,107,53,0.08)_0%,transparent_70%)]"></div>
                    
                    {/* UI Decorators */}
                    <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none opacity-50 font-mono text-[8px] text-brand uppercase">
                        <div>LAT: 17.6078° N</div>
                        <div>LONG: 8.0817° E</div>
                        <div className="mt-2 text-niger-green">SAT STATUS: OPTIMAL</div>
                    </div>

                    {/* Scanning Laser */}
                    <motion.div 
                        animate={{ top: ['0%', '100%', '0%'], opacity: [0, 0.4, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[1px] bg-brand shadow-[0_0_20px_#ff6b35] z-20 pointer-events-none"
                    />

                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                    
                    <svg viewBox="0 0 800 600" className="w-full h-full relative z-10 p-12">
                        {Object.entries(regionPaths).map(([id, path]) => {
                            const region = regions.find(r => r.id === id);
                            const isSelected = selectedMapRegion === id;
                            return (
                                <g key={id} 
                                    onMouseEnter={() => setSelectedMapRegion(id)}
                                    onMouseLeave={() => setSelectedMapRegion(null)}
                                    className="cursor-pointer"
                                >
                                    <motion.path 
                                        d={path}
                                        initial={false}
                                        animate={{ 
                                            fill: isSelected ? 'rgba(255,107,53,0.3)' : 'rgba(255,107,53,0.02)',
                                            stroke: isSelected ? '#ff6b35' : 'rgba(255,255,255,0.08)',
                                            strokeWidth: isSelected ? 3 : 1.5,
                                            filter: isSelected ? 'drop-shadow(0 0 10px rgba(255,107,53,0.5))' : 'none'
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    />
                                    {/* Region Label Pulse */}
                                    {!isSelected && (
                                        <circle 
                                            cx="400" cy="300" r="2" 
                                            className="fill-brand animate-pulse"
                                            style={{ transformBox: 'fill-box' }}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Quick Stats Overlay (Floating when a region is hovered) */}
                    <AnimatePresence>
                        {selectedMapRegion && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute top-12 right-12 w-80 pointer-events-none z-30"
                            >
                                <div className="glass-panel p-6 rounded-[2rem] border border-brand/30 bg-black/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black italic">
                                            {selectedMapRegion.substring(0, 1)}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">{selectedMapRegion}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-niger-green animate-pulse"></div>
                                                <span className="text-[8px] font-black text-niger-green uppercase tracking-widest tracking-widest">Opérationnel</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <StatMini title="Abonnés AMI" value="12.4k" icon={Users} color="text-brand" />
                                        <StatMini title="DCUs Actifs" value="42" icon={Zap} color="text-yellow-400" />
                                        <StatMini title="Disponibilité" value="99.4%" icon={Activity} color="text-niger-green" />
                                        <StatMini title="Tickets" value="18" icon={AlertTriangle} color="text-red-400" />
                                    </div>
                                    <div className="mt-6 flex gap-2">
                                        <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-bold text-gray-500 uppercase tracking-widest">Zone Prioritaire</div>
                                        <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-bold text-gray-500 uppercase tracking-widest">HSM Signed</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Map Navigation Controls */}
                    <div className="absolute bottom-10 right-10 flex flex-col gap-2">
                        <MapBtn icon={Maximize2} />
                        <MapBtn icon={Navigation} />
                        <MapBtn icon={Info} />
                    </div>
                </div>

                {/* ── Monitoring Latéral ─────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-bg-dark/40 space-y-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Performance Régionale</h4>
                            <BarChart3 size={14} className="text-gray-600" />
                        </div>
                        
                        <div className="space-y-4">
                            {regions.map((r, i) => (
                                <RegionProgress 
                                    key={r.id} 
                                    name={r.areaName} 
                                    value={92 - i * 4} 
                                    color={i === 0 ? "bg-niger-green" : "bg-brand"} 
                                />
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Intégrité Territoriale</span>
                                <span className="text-[10px] font-black text-niger-green">GLOBAL: 96.4%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-niger-green w-[96.4%] shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand/5 border border-brand/20 p-6 rounded-[2.5rem] flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                          <AlertTriangle size={24} />
                       </div>
                       <div>
                          <p className="text-white font-black uppercase text-[10px] mb-1">Maintenance Agadez-Nord</p>
                          <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Intervention prévue sur Phase A-12.</p>
                       </div>
                       <ArrowUpRight size={16} className="text-brand ml-auto" />
                    </div>
                </div>
            </div>

            {/* ── Table de Gestion Administrative ─────────────────────── */}
            <div className="glass-panel overflow-hidden rounded-[3rem] border border-white/5 bg-bg-dark/40 shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Centres Opérationnels de Distribution</h4>
                    <div className="flex gap-2">
                         <div className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl flex items-center gap-2">
                             <Search size={14} className="text-gray-500" />
                             <input type="text" placeholder="Filtrer..." className="bg-transparent border-none text-[8px] font-black uppercase text-white focus:outline-none w-24" />
                         </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.01]">
                            <tr className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="px-10 py-6">Code / Blason</th>
                                <th className="px-10 py-6">Région Administrative</th>
                                <th className="px-10 py-6">Directeur Régional</th>
                                <th className="px-10 py-6">Infrastructure AMI</th>
                                <th className="px-10 py-6">État Réseau</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {regions.map(r => (
                                <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-none">
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-2 overflow-hidden flex items-center justify-center">
                                                {r.blazon ? (
                                                    <img src={r.blazon} alt={r.areaName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <MapIcon size={20} className="text-gray-600" />
                                                )}
                                            </div>
                                            <span className="font-mono text-[10px] text-brand font-black">{r.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div>
                                            <span className="block font-black text-white text-sm uppercase tracking-tight group-hover:text-brand transition-colors">{r.areaName}</span>
                                            <span className="block text-[8px] font-bold text-gray-500 uppercase mt-1 tracking-widest tracking-widest">Niveau Hiérarchique {r.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-500 uppercase">
                                                {r.principal?.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="block text-xs font-bold text-white uppercase">{r.principal}</span>
                                                <span className="block text-[8px] text-gray-600 font-bold uppercase">{r.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center bg-white/5 p-2 rounded-xl border border-white/5 min-w-[70px]">
                                                <div className="text-white font-black text-[10px]">1,240</div>
                                                <div className="text-[7px] text-gray-600 font-black uppercase">Compteurs</div>
                                            </div>
                                            <div className="text-center bg-white/5 p-2 rounded-xl border border-white/5 min-w-[70px]">
                                                <div className="text-brand font-black text-[10px]">15</div>
                                                <div className="text-[7px] text-gray-600 font-black uppercase">DCUs</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-7">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest",
                                            r.status === 'enabled' ? "bg-niger-green/10 text-niger-green border-niger-green/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", r.status === 'enabled' ? "bg-niger-green" : "bg-red-500")}></div>
                                            {r.status === 'enabled' ? 'Optimal' : 'Interrompu'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => { setEditingRegion(r); setIsRegionModalOpen(true); }}
                                                className="p-3 bg-white/5 hover:bg-brand/10 text-gray-500 hover:text-brand rounded-xl border border-white/5 transition-all outline-none"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRegion(r.id)}
                                                className="p-3 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-xl border border-white/5 transition-all outline-none"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Sous-Composants ──────────────────────────────────────────────

const StatMini = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={12} className={color} />
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">{title}</p>
        </div>
        <p className="text-white font-black text-lg leading-none">{value}</p>
    </div>
);

const MapBtn = ({ icon: Icon }: any) => (
    <button className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-brand/40 transition-all pointer-events-auto backdrop-blur-md">
        <Icon size={18} />
    </button>
);

const RegionProgress = ({ name, value, color }: any) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase">
            <span className="text-white tracking-widest">{name}</span>
            <span className="text-gray-500">{value}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                className={cn("h-full rounded-full", color)}
            />
        </div>
    </div>
);
