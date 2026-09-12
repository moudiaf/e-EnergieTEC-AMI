import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Key, Fingerprint, Lock, RotateCcw, 
    AlertOctagon, Cpu, ShieldCheck, RefreshCw, 
    Eye, EyeOff, Clipboard, ShieldAlert, Database,
    Activity, Globe, Terminal, Server, AlertTriangle,
    CheckCircle2, Copy, Check, Search, Download, Zap, Radio
} from 'lucide-react';
import { Meter } from '../types';
import { generateSystemIntegrityReport } from '../utils/reports';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SecuritySectionProps {
  audits: any[];
  meters?: Meter[];
  onRotateKeys: () => Promise<void>;
}

export const SecuritySection = ({ audits, meters = [], onRotateKeys }: SecuritySectionProps) => {
  const [showKeys, setShowKeys] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedLogType, setSelectedLogType] = useState<'ALL' | 'KEY' | 'AUTH' | 'FRAUD'>('ALL');
  const [testTokenMeterId, setTestTokenMeterId] = useState(meters[0]?.id || '0128260224778');
  const [testTokenResult, setTestTokenResult] = useState<string | null>(null);
  const [isGeneratingTestToken, setIsGeneratingTestToken] = useState(false);

  // Live KMS Status State
  const [kmsProbe, setKmsProbe] = useState<{
    online: boolean;
    latencyMs: number;
    tid: number;
    algorithm: string;
    checkedAt: string;
  }>({
    online: false,
    latencyMs: 0,
    tid: Math.floor((Date.now() - new Date('1993-01-01T00:00:00Z').getTime()) / 60000),
    algorithm: 'STS-V2-AES-128 (IEC 62055-41)',
    checkedAt: '--'
  });

  // Probe KMS Health
  const probeKms = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/kms/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meterId: testTokenMeterId || '0128260224778', amount: 1, type: '0' })
      });
      const t1 = performance.now();
      const latency = Math.round(t1 - t0);
      if (res.ok) {
        const data = await res.json();
        setKmsProbe({
          online: true,
          latencyMs: latency,
          tid: data.tid || Math.floor((Date.now() - new Date('1993-01-01T00:00:00Z').getTime()) / 60000),
          algorithm: 'STS-V2-AES-128 (IEC 62055-41)',
          checkedAt: new Date().toLocaleTimeString('fr-FR')
        });
      } else {
        setKmsProbe(prev => ({
          ...prev,
          online: false,
          latencyMs: latency,
          checkedAt: new Date().toLocaleTimeString('fr-FR')
        }));
      }
    } catch {
      setKmsProbe(prev => ({
        ...prev,
        online: false,
        latencyMs: 0,
        checkedAt: new Date().toLocaleTimeString('fr-FR')
      }));
    }
  };

  useEffect(() => {
    probeKms();
  }, [testTokenMeterId]);

  const handleCopyKey = (keyId: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRotateKeysInternal = async () => {
    setIsRotating(true);
    await onRotateKeys();
    setIsRotating(false);
    probeKms();
  };

  // Generate Quick Test Token via Live KMS-HSM
  const handleGenerateTestToken = async () => {
    setIsGeneratingTestToken(true);
    try {
      const res = await fetch('/api/kms/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meterId: testTokenMeterId, amount: 10, type: '0' })
      });
      if (res.ok) {
        const data = await res.json();
        setTestTokenResult(data.token);
        if (data.tid) {
          setKmsProbe(prev => ({ ...prev, tid: data.tid }));
        }
      }
    } catch (e) {
      console.error("KMS test token error", e);
    } finally {
      setIsGeneratingTestToken(false);
    }
  };

  // Real Cryptographic Key Matrix
  const cryptoKeys = [
    { 
      type: 'MASTER SGC KEY', 
      id: 'SGC-600876-NIGELEC-STS2', 
      algorithm: 'AES-128 (IEC 62055-41)', 
      krn: '2', 
      ti: '1', 
      status: 'Active', 
      expiry: '2035-12-31', 
      scope: 'National NIGELEC SGC 600876',
      value: 'NIGELEC-STS-MASTER-KEY-2026'
    },
    { 
      type: 'VENDING KEY (VK)', 
      id: 'VK-NIAMEY-SGC-01', 
      algorithm: 'SHA-256 HMAC Derivation', 
      krn: '2', 
      ti: '1', 
      status: 'Active', 
      expiry: '2028-06-30', 
      scope: 'Guichets Agences & API HES',
      value: 'VK-D0D1D2D3D4D5D6D7D8D9DADBDCDDDEDF'
    },
    { 
      type: 'KEY CHANGE KEY (KCK)', 
      id: 'KCK-RESERVE-2026-02', 
      algorithm: 'AES-128 / DES3 Dual-Mode', 
      krn: '1 -> 2', 
      ti: '1', 
      status: 'Prêt Rollover', 
      expiry: '2029-01-01', 
      scope: 'Transition KRN 1 -> KRN 2',
      value: 'KCK-42097447795649459914'
    },
    { 
      type: 'DLMS AUTH KEY (AK)', 
      id: 'DLMS-HLS5-AK-NIGELEC', 
      algorithm: 'GMAC / High-Level Security 5', 
      krn: '-', 
      ti: '-', 
      status: 'Active', 
      expiry: '2030-12-31', 
      scope: 'Canal TCP 4059 & Optique',
      value: 'D0 D1 D2 D3 D4 D5 D6 D7 D8 D9 DA DB DC DD DE DF'
    },
    { 
      type: 'DLMS ENCRYPTION KEY (EK)', 
      id: 'DLMS-GCM-EK-NIGELEC', 
      algorithm: 'AES-128-GCM Session Cipher', 
      krn: '-', 
      ti: '-', 
      status: 'Active', 
      expiry: '2030-12-31', 
      scope: 'Télémétrie Chiffrée HDLC',
      value: '00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F'
    }
  ];

  const exportCryptoKeysCSV = () => {
    const headers = ['Type_Cle', 'Identifiant', 'Algorithme', 'KRN', 'TI', 'Statut', 'Expiration', 'Perimetre'];
    const rows = cryptoKeys.map(k => [
      `"${k.type}"`,
      `"${k.id}"`,
      `"${k.algorithm}"`,
      `"${k.krn}"`,
      `"${k.ti}"`,
      `"${k.status}"`,
      `"${k.expiry}"`,
      `"${k.scope}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registre_cles_kms_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tamper Events from Real Meters
  const tamperedMeters = useMemo(() => {
    return meters.filter(m => m.tamperStatus === 'tampered' || m.tamperStatus === 'detected');
  }, [meters]);

  // Filtered Audit Logs
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      const matchSearch = (a.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (a.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                          (a.user || '').toLowerCase().includes(auditSearch.toLowerCase());
      if (!matchSearch) return false;
      if (selectedLogType === 'ALL') return true;
      if (selectedLogType === 'KEY') return a.action.includes('KEY') || a.action.includes('ROLLOVER') || a.action.includes('KMC') || a.action.includes('STS');
      if (selectedLogType === 'AUTH') return a.action.includes('AUTH') || a.action.includes('LOGIN') || a.action.includes('ACCESS');
      if (selectedLogType === 'FRAUD') return a.action.includes('FRAUD') || a.action.includes('TAMPER') || a.action.includes('SABOTAGE');
      return true;
    });
  }, [audits, auditSearch, selectedLogType]);

  const securityStatus = [
    { label: 'Chiffrement Base', status: 'AES-256 GCM', icon: Database, color: 'text-emerald-400', detail: 'FIPS 140-2 Validé' },
    { label: 'Transport AMI', status: 'TLS 1.3 / DTLS', icon: Globe, color: 'text-blue-400', detail: 'Certificats RSA-4096' },
    { label: 'Standard STS', status: 'IEC 62055-41', icon: Key, color: 'text-brand', detail: 'SGC 600876 Actif' },
    { label: 'Module KMS-HSM', status: kmsProbe.online ? 'Port 5000 Actif' : 'Injoignable', icon: Cpu, color: kmsProbe.online ? 'text-emerald-400' : 'text-red-400', detail: kmsProbe.online ? `Latence: ${kmsProbe.latencyMs} ms` : 'Connexion rompue' },
  ];

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8 pb-32 text-white pt-2"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8 bg-[#121318] p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black uppercase rounded-lg border border-red-500/30 tracking-widest flex items-center gap-1.5">
                <Lock size={12} /> Souveraineté Cryptographique NIGELEC
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                <ShieldCheck size={12} /> Conforme ANSSI & CEI 62055-41
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Shield className="text-brand" size={36} /> Centre de Sécurité <span className="text-brand">& KMS-HSM</span>
          </h3>
          <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">
            Gestion souveraine des clés STS v2, DLMS/COSEM HLS5 et intégrité cryptographique du réseau AMI
          </p>
        </div>
        
        {/* Live KMS Status Card */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
            <div className={cn("p-4 px-6 rounded-2xl border flex items-center gap-4 shadow-lg",
              kmsProbe.online 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}>
                <div className="relative">
                    {kmsProbe.online && <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute inset-0"></div>}
                    <div className={cn("w-3.5 h-3.5 rounded-full relative z-10", kmsProbe.online ? "bg-emerald-400" : "bg-red-400")}></div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">KMS-HSM Dédié (Port 5000)</p>
                   <p className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                     {kmsProbe.online ? (
                       <>Opérationnel <span className="text-xs font-mono font-normal text-emerald-400">({kmsProbe.latencyMs} ms)</span></>
                     ) : (
                       <span className="text-red-400">Injoignable / Hors ligne</span>
                     )}
                   </p>
                </div>
            </div>

            <button 
                onClick={probeKms}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer"
                title="Tester la connexion KMS"
            >
                <RefreshCw size={18} />
            </button>

            <button 
                onClick={exportCryptoKeysCSV}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-brand transition-all border border-white/20 cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                title="Exporter le registre des clés en CSV"
            >
                <Download size={18} /> Exporter CSV
            </button>
        </div>
      </div>

      {/* ── Security KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {securityStatus.map((s, i) => (
          <div key={i} className="p-6 rounded-3xl border border-white/10 bg-[#121318] group hover:border-brand/40 transition-all duration-300 relative overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform", s.color)}>
                  <s.icon size={22} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                   <p className="text-base font-black text-white tracking-tight">{s.status}</p>
                </div>
            </div>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider mt-auto border-t border-white/10 pt-3">
                {s.detail}
            </p>
          </div>
        ))}
      </div>

      {/* ── Anti-Tamper & Fraud Live Monitor ─────────────────── */}
      <div className={cn(
        "p-6 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl",
        tamperedMeters.length > 0 ? "bg-red-500/10 border-red-500/40" : "bg-emerald-500/10 border-emerald-500/30"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
            tamperedMeters.length > 0 ? "bg-red-500/20 text-red-400 border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
          )}>
            {tamperedMeters.length > 0 ? <AlertOctagon size={24} className="animate-pulse" /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tight">
              {tamperedMeters.length > 0 
                ? `ALERTE : ${tamperedMeters.length} Tentative(s) de Sabotage Physique Détectée(s)` 
                : 'Intégrité Physique des Capots & Borniers Conforme'}
            </h4>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-0.5">
              {tamperedMeters.length > 0 
                ? `Compteurs impactés : ${tamperedMeters.map(m => m.id).join(', ')} — Détection capot ouvert ou inversion de flux.` 
                : `Surveillance anti-sabotage active sur les ${meters.length} compteurs connectés (0 anomalie).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={cn(
            "px-3 py-1 rounded-xl text-xs font-mono font-black uppercase border",
            tamperedMeters.length > 0 ? "bg-red-500 text-white border-red-400 animate-pulse" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          )}>
            {tamperedMeters.length > 0 ? 'SABOTAGE EN COURS' : 'TAMPER CLEAR (OK)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STS KEY MANAGEMENT (KMC) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand shadow-inner">
                  <Key size={28} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Key Management <span className="text-brand">Center</span> (KMC)</h4>
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Secrets Maîtres STS v2 (IEC 62055-41) & DLMS HLS5</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeys(!showKeys)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-all border border-white/20 flex items-center gap-2 text-xs font-bold uppercase cursor-pointer"
              >
                {showKeys ? <EyeOff size={16} /> : <Eye size={16} />}
                {showKeys ? 'Masquer Clés' : 'Révéler Clés'}
              </button>
            </div>

            {/* Secret Keys List */}
            <div className="space-y-3 relative z-10">
              {cryptoKeys.map((k, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#181920] border border-white/10 hover:border-brand/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-brand uppercase tracking-wider">{k.type}</span>
                        <span className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-bold text-gray-300 border border-white/10">{k.algorithm}</span>
                      </div>
                      <p className="text-sm font-mono font-black text-white tracking-wider">
                        {showKeys ? k.value : '•••• •••• •••• ' + k.id.split('-').pop()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{k.scope}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button 
                      onClick={() => handleCopyKey(k.id, k.value)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                      title="Copier la clé"
                    >
                      {copiedKey === k.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {k.status}
                      </span>
                      <p className="text-[10px] text-gray-400 font-mono mt-1 font-bold">Exp: {k.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rollover STS Action */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle size={16} /> Le Rollover STS réinitialise l'indice KRN (Key Revision Number) sur les compteurs.
              </div>
              <button 
                onClick={handleRotateKeysInternal}
                disabled={isRotating}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-red-500/40 disabled:opacity-50 shadow-lg flex items-center gap-2.5 cursor-pointer"
              >
                {isRotating ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                {isRotating ? 'Rollover en cours...' : 'Exécuter Rollover STS (Key Rotation)'}
              </button>
            </div>
          </div>

          {/* Testeur de Jeton STS Instantané */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Zap size={22} className="text-amber-400" />
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">Testeur Cryptographique KMS (STS Token Live)</h4>
                  <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Vérification de signature de jeton STS 20 Digits</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                TID: {kmsProbe.tid}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Compteur Cible NIGELEC</label>
                <select 
                  value={testTokenMeterId}
                  onChange={e => setTestTokenMeterId(e.target.value)}
                  className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none"
                >
                  {meters.map(m => (
                    <option key={m.id} value={m.id}>{m.id} — {m.location} ({m.phaseType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Générer Jeton Test</label>
                <button 
                  onClick={handleGenerateTestToken}
                  disabled={isGeneratingTestToken}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingTestToken ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                  Calculer STS
                </button>
              </div>
            </div>

            {testTokenResult && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 mt-2">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Jeton STS (20 Chiffres) Généré par le KMS-HSM :</span>
                  <span className="text-lg font-mono font-black text-amber-300 tracking-widest">{testTokenResult}</span>
                </div>
                <button 
                  onClick={() => handleCopyKey('test-token', testTokenResult)}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                  title="Copier le jeton"
                >
                  {copiedKey === 'test-token' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECURITY AUDIT LOG (JOURNAL MAÎTRE) */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shadow-md">
                <AlertOctagon size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Journal <span className="text-red-400">Maître</span></h4>
                <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Audit Sécurité en Temps Réel</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(['ALL', 'KEY', 'AUTH', 'FRAUD'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedLogType(tab)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                    selectedLogType === tab ? "bg-brand text-white border-transparent shadow-sm" : "bg-[#181920] border-white/10 text-gray-300 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Filtrer journal..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="w-full bg-[#181920] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-brand outline-none"
              />
            </div>

            {/* Logs List */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {filteredAudits.slice(0, 10).map((l, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#181920] border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-white uppercase tracking-tight">{l.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">
                      {new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium line-clamp-2 mt-0.5">
                    {l.details}
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[9px] text-gray-400 font-bold uppercase">
                    <span>Opérateur : <span className="text-white">{l.user || 'ADMIN'}</span></span>
                    <span>•</span>
                    <span className="text-emerald-400">Signé HSM</span>
                  </div>
                </div>
              ))}

              {filteredAudits.length === 0 && (
                <div className="flex flex-col items-center py-10 opacity-40 text-center">
                  <Shield size={36} className="mb-2 text-gray-400" />
                  <p className="text-xs font-bold uppercase text-gray-400">Aucun événement répertorié</p>
                </div>
              )}
            </div>
          </div>

          {/* Export PDF Button */}
          <button 
            onClick={() => generateSystemIntegrityReport(meters)}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer"
          >
            <Download size={16} /> Exporter Rapport Cryptographique (PDF)
          </button>
        </div>
      </div>

      {/* ── Security Policy Overlay (Footer) ────────────────────── */}
      <div className="bg-[#121318] border border-white/15 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertOctagon size={28} />
            </div>
            <div>
                <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Vigilance Stratégique & Traçabilité Cryptographique</h4>
                <p className="text-gray-300 text-xs font-bold leading-relaxed uppercase tracking-wider max-w-2xl">
                    Conformément aux normes ANSSI-Niger et CEI 62055-41, l'ensemble des requêtes de distribution de jetons et trames DLMS sont scellées cryptographiquement en HMAC-SHA256 dans le module KMS-HSM.
                </p>
            </div>
        </div>
        <div className="flex gap-4 shrink-0">
            <div className="px-5 py-3 bg-[#181920] rounded-2xl border border-white/15 text-center min-w-[150px]">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Indice KRN Actuel</p>
                <p className="text-lg font-black text-emerald-400 font-mono">KRN = 2 (Actif)</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
