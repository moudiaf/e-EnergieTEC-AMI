import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Key, Fingerprint, Lock, RotateCcw, 
    AlertOctagon, Cpu, ShieldCheck, RefreshCw, 
    Eye, EyeOff, Clipboard, ShieldAlert, Database,
    Activity, Globe, Terminal, Server, AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SecuritySectionProps {
  audits: any[];
  onRotateKeys: () => Promise<void>;
}

export const SecuritySection = ({ audits, onRotateKeys }: SecuritySectionProps) => {
  const [showKeys, setShowKeys] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateKeysInternal = async () => {
    setIsRotating(true);
    await onRotateKeys();
    setIsRotating(false);
  };

  const securityStatus = [
    { label: 'Chiffrement Core', status: 'AES-256 GCM', icon: Database, color: 'text-green-500', detail: 'Validation FIPS 140-2' },
    { label: 'Transport AMI', status: 'TLS 1.3 / DTLS', icon: Globe, color: 'text-blue-400', detail: 'Certificats RSA-4096' },
    { label: 'Standard STS', status: 'IEC 62055-41', icon: Key, color: 'text-brand', detail: 'SGC 600451 Active' },
    { label: 'Accès Console', status: 'MFA Hardened', icon: Fingerprint, color: 'text-purple-500', detail: 'Politique RBAC v2' },
  ];

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
            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded border border-red-500/30 tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]">Souveraineté Cryptographique</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest bg-niger-green/10 px-2 py-0.5 rounded border border-niger-green/20">
                <ShieldCheck size={10} /> Conforme ANSSI-Niger
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Centre de Sécurité <span className="text-brand">& Chiffrement</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 italic">Gestion des clés STS/DLMS et intégrité du réseau AMI NIGELEC</p>
        </div>
        
        <div className="flex gap-4">
            <div className="glass-panel p-4 px-6 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center gap-4 group">
                <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-ping absolute inset-0"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 relative z-10"></div>
                </div>
                <div>
                   <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">État du HSM Central</p>
                   <p className="text-xs font-black text-white uppercase group-hover:text-green-400 transition-colors tracking-tight">Operationnel / Certifié</p>
                </div>
            </div>
        </div>
      </div>

      {/* ── Security KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {securityStatus.map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-[2.5rem] border border-white/5 bg-[#121214] group hover:border-brand/40 transition-all duration-500 relative overflow-hidden flex flex-col shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-brand/5 transition-colors"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform", s.color)}>
                  <s.icon size={22} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                   <p className="text-sm font-black text-white tracking-tight">{s.status}</p>
                </div>
            </div>
            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-auto border-t border-white/5 pt-3">
                {s.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STS KEY MANAGEMENT (KMC) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-inner group transition-all">
                  <Key size={32} className="group-hover:rotate-45 transition-transform" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Key Management <span className="text-brand">Center</span> (KMC)</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic italic">Infrastructure de gestion des secrets STS v1/v2</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeys(!showKeys)}
                className="p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all border border-white/10 shadow-lg"
              >
                {showKeys ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 relative z-10">
              {[
                { type: 'MASTER KEY', id: 'MK-NG-2024-001', algorithm: 'AES-128 (STS v2)', status: 'Active', expiry: '2029-12-31', risk: 'Low' },
                { type: 'VENDING KEY', id: 'VK-NIAMEY-05', algorithm: 'SHA-256 HMAC', status: 'Active', expiry: '2025-06-15', risk: 'Low' },
                { type: 'KEY CHANGE KEY', id: 'KCK-RESERVE-02', algorithm: 'DES3 (Legacy)', status: 'Standby', expiry: '2026-01-01', risk: 'Medium' },
              ].map((k, i) => (
                <div key={i} className="group/key flex justify-between items-center p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-brand/30 transition-all cursor-default">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-gray-600 group-hover/key:text-brand transition-colors">
                      <Lock size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">{k.type}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-black/40 text-[8px] font-bold text-gray-500 border border-white/5">{k.algorithm}</span>
                      </div>
                      <p className="text-base font-mono font-black text-white tracking-widest">
                        {showKeys ? k.id : '•••• •••• •••• ' + k.id.split('-').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                        "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest mb-1.5 inline-block",
                        k.status === 'Active' ? 'bg-niger-green/20 text-niger-green border border-niger-green/20' : 'bg-gray-500/20 text-gray-500 border border-gray-500/20'
                    )}>
                        {k.status}
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Exp: {k.expiry}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
              <div className="flex items-center gap-3 text-red-500/60 text-[10px] font-bold italic">
                  <AlertTriangle size={14} /> La rotation des clés impacte l'ensemble des Terminaux de Vente (POS)
              </div>
              <button 
                onClick={handleRotateKeysInternal}
                disabled={isRotating}
                className="group relative px-8 py-4 bg-white/5 hover:bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/10 disabled:opacity-50 shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                    {isRotating ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                    {isRotating ? 'Rollover en cours...' : 'Exécuter Rollover STS (Key Rotation)'}
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] relative overflow-hidden shadow-2xl h-full">
               <div className="flex justify-between items-start mb-8">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <Fingerprint size={28} />
                    </div>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase rounded">HARDENED</span>
               </div>
               <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Habilitation Hardened (IAM)</h4>
               <p className="text-[10px] text-gray-500 font-bold leading-relaxed mb-8 uppercase tracking-widest">Politiques d'accès strictes pour le personnel NIGELEC</p>
               
               <div className="space-y-4">
                 {[
                    { label: 'Authentification MFA', val: 'Activée (TOTP)', color: 'text-niger-green' },
                    { label: 'Session Time-out', val: '15 Minutes', color: 'text-white' },
                    { label: 'Ip Filtering', val: 'Blacklist National', color: 'text-red-400' },
                 ].map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 text-xs uppercase tracking-tighter">
                        <span className="text-gray-500 font-black">{p.label}</span>
                        <span className={cn("font-black", p.color)}>{p.val}</span>
                    </div>
                 ))}
               </div>
            </div>

            <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-[#121214] flex flex-col shadow-2xl h-full">
              <div className="flex justify-between items-start mb-8">
                    <div className="p-3 rounded-2xl bg-brand/10 text-brand border border-brand/20">
                        <ShieldAlert size={28} />
                    </div>
                    <Terminal size={20} className="text-gray-700" />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">Signature de Paquets AMI</h4>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed mb-6 uppercase tracking-widest">Intégrité cryptographique des flux MDMS/HES</p>
              
              <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 font-mono text-[10px] text-blue-400/80 break-all leading-relaxed relative flex-grow group/code">
                <div className="absolute top-3 right-4 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[8px] font-black text-blue-500">SIGNED</span>
                </div>
                <span className="text-gray-700">SHA256_VERIFY: </span>
                0x8F2D...B4A9_F3E1_D9C4_ECC2_2026_AMI_PROTECT
                <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-gray-600 font-bold italic italic">
                    Protocol: DLMS/COSEM HDLC Layer Security (Suite 0)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY AUDIT LOG (JOURNAL MAÎTRE) */}
        <div className="glass-panel p-8 rounded-[3rem] border border-white/10 bg-[#0a0a0b] shadow-[0_0_50px_rgba(0,0,0,0.5)] h-max lg:sticky lg:top-8 border-l-4 border-l-red-500/40">
           <div className="flex items-center gap-5 mb-10">
             <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/10">
               <AlertOctagon size={28} className="animate-pulse" />
             </div>
             <div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Journal <span className="text-red-500">Maître</span></h4>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Audit en temps réel (HSM Log)</p>
             </div>
           </div>

           <div className="space-y-8">
             {audits.filter(a => 
               a.action.includes('KEY') || a.action.includes('AUTH') || 
               a.action.includes('FRAUD') || a.action.includes('RESET') ||
               a.action.includes('SECURITY') || a.action.includes('ACCESS')
             ).slice(0, 7).map((l, idx) => (
                <div key={idx} className="flex gap-5 group/log cursor-default">
                  <div className="mt-1.5 flex flex-col items-center gap-1">
                    <div className={cn("w-2.5 h-2.5 rounded-full ring-4", 
                      l.action.includes('FRAUD') || l.action.includes('FAIL') ? 'bg-red-500 ring-red-500/20' : 
                      l.action.includes('UPDATE') || l.action.includes('CONFIG') ? 'bg-orange-500 ring-orange-500/10' : 
                      l.action.includes('SUCCESS') || l.action.includes('RESET') ? 'bg-niger-green ring-niger-green/10' : 'bg-blue-500 ring-blue-500/10'
                    )}></div>
                    <div className="w-[1px] h-full bg-white/5"></div>
                  </div>
                  <div className="flex-1 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[11px] font-black text-white group-hover/log:text-brand transition-colors uppercase tracking-tight">{l.action}</p>
                        <span className="text-[8px] text-gray-700 font-bold tabular-nums">{new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed line-clamp-2 italic italic mb-2">
                        "{l.details}"
                    </p>
                    <div className="flex items-center gap-2">
                         <span className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] font-black text-gray-600 uppercase">IP: 41.138.xxx</span>
                         <span className="px-1.5 py-0.5 rounded bg-white/5 text-[7px] font-black text-gray-600 uppercase">Verified</span>
                    </div>
                  </div>
                </div>
             ))}
             {audits.length === 0 && (
               <div className="flex flex-col items-center py-10 opacity-30">
                   <Shield size={40} className="mb-4 text-gray-500" />
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">Aucun événement critique répertorié</p>
               </div>
             )}
           </div>

           <button className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-white/10 shadow-2xl">
              <Clipboard size={16} className="text-gray-500" /> Full Security Export (PDF)
           </button>
        </div>
      </div>

      {/* ── Security Policy Overlay (Footer) ────────────────────── */}
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 mt-8">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-red-500 flex-shrink-0 animate-pulse">
                <AlertOctagon size={32} />
            </div>
            <div>
                <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Vigilance Stratégique & Audit Continu</h4>
                <p className="text-gray-500 text-[9px] font-bold leading-relaxed uppercase tracking-widest max-w-2xl">
                    Conformément à la loi nigérienne sur la cybersécurité, tout accès non autorisé est passible de sanctions. 
                    Le système mdms e-energietec utilise des signatures numériques sha-256 pour chaque transaction token sts 
                    et journal d'audit hsm, garantissant l'absence de fraude administrative.
                </p>
            </div>
        </div>
        <div className="flex gap-4">
            <div className="px-5 py-3 bg-black/40 rounded-2xl border border-white/10 text-center min-w-[150px]">
                <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Dernier Rollover</p>
                <p className="text-lg font-black text-white italic">12/04/2026</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
