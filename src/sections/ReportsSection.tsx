import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertTriangle, Coins, ChevronRight, 
  FileText, Download, Briefcase, Zap, History, Globe, Lock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReportsSectionProps {
  generateRegulatoryReport: () => void;
  onGenerateEnergyLoss: () => void;
  onGenerateFraudAudit: () => void;
  onGenerateMobileMoney: () => void;
  onGenerateSystemIntegrity: () => void;
}

export const ReportsSection = ({ 
  generateRegulatoryReport,
  onGenerateEnergyLoss,
  onGenerateFraudAudit,
  onGenerateMobileMoney,
  onGenerateSystemIntegrity
}: ReportsSectionProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    key="reports" 
    className="space-y-8 pb-20"
  >
    {/* ── Header Institutionnel ────────────────────────────────── */}
    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 bg-gradient-to-br from-bg-dark/80 to-bg-dark/20 p-10 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-niger-green/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20">
            <Shield className="text-brand" size={24} />
          </div>
          <span className="text-[10px] font-black text-brand uppercase tracking-[0.4em]">Sûreté Nationale & Souveraineté Digitale</span>
        </div>
        <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Centre de <span className="text-brand">Certification</span></h3>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 max-w-xl leading-relaxed">
          Génération de documents haute-fidélité pour l'Autorité de Régulation du Secteur de l'Énergie (ARSE) et la Direction Générale de la NIGELEC.
        </p>
      </div>

      <div className="relative z-10">
        <button 
          onClick={generateRegulatoryReport} 
          className="group px-8 py-5 bg-brand hover:bg-brand-light text-white rounded-[2rem] flex items-center gap-4 font-black text-xs uppercase tracking-widest shadow-[0_20px_50px_rgba(255,107,53,0.3)] transition-all hover:-translate-y-1 active:translate-y-0"
        >
           <FileText size={22} className="group-hover:rotate-12 transition-transform" /> 
           <span>Rapport Maître (Audit ARSE)</span>
           <div className="ml-2 px-2 py-0.5 bg-white/20 rounded-lg text-[8px]">PDF 4.2 MB</div>
        </button>
      </div>
    </div>

    {/* ── KPIs de Conformité ───────────────────────────────────── */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ReportStat label="Conformité STS 2.0" value="100%" sub="SGC 600451 Certifié" color="text-green-500" icon={Lock} />
      <ReportStat label="Pertes (Non-Tech)" value="7.8%" sub="Seuil National < 12%" color="text-brand" icon={Zap} />
      <ReportStat label="Disponibilité AMI" value="99.9%" sub="Uptime Temps Réel" color="text-blue-400" icon={Globe} />
      <ReportStat label="Intégrité NIS" value="Validée" sub="Proof of Continuity" color="text-purple-400" icon={Shield} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Grille des Rapports ─────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={14} className="text-brand" /> Rapports Opérationnels & Financiers
          </h4>
          <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-3 py-1 rounded-full uppercase">Période : Avril 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard 
            icon={Briefcase} 
            title="Bilan Énergétique" 
            desc="Calcul des pertes HT/BT et Revenue Assurance."
            action={onGenerateEnergyLoss} 
            color="text-green-500" 
            bg="bg-green-500/10"
          />
          <ReportCard 
            icon={AlertTriangle} 
            title="Registre Fraudes" 
            desc="Journal consolidé des anomalies bypass & sabotage."
            action={onGenerateFraudAudit} 
            color="text-red-500" 
            bg="bg-red-500/10"
          />
          <ReportCard 
            icon={Coins} 
            title="Réconciliation MM" 
            desc="Corrélation Orange/Airtel Money et jetons vente."
            action={onGenerateMobileMoney} 
            color="text-brand" 
            bg="bg-brand/10"
          />
          <ReportCard 
            icon={Shield} 
            title="Intégrité Système" 
            desc="Audit de sécurité des clés STS et certificats HSM."
            action={onGenerateSystemIntegrity} 
            color="text-blue-500" 
            bg="bg-blue-500/10"
          />
        </div>
      </div>

      {/* ── Certification & Sceau ────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-8 rounded-[3rem] border border-white/5 bg-gradient-to-br from-brand/10 via-transparent to-transparent flex-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl pointer-events-none"></div>
          
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
             <CheckCircle2 size={14} className="text-brand" /> Attestation Digitale
          </h4>
          
          <div className="p-8 rounded-[2rem] bg-bg-dark/50 border border-dashed border-white/10 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full"></div>
              <Shield className="relative z-10 text-brand" size={56} />
            </div>
            
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-2">Sceau Électronique Certifié</p>
              <div className="bg-black/40 px-3 py-1 rounded-lg border border-white/5 mt-2">
                <code className="text-[9px] text-gray-500 font-mono break-all leading-none">NIG-SHA256-8F2D...E4A3_CERT</code>
              </div>
            </div>

            <div className="w-full space-y-4 pt-4">
               <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Dernier Audit IA</span>
                 <span className="text-[10px] font-black text-white px-2 py-0.5 bg-green-500/20 text-green-500 rounded uppercase">Aujourd'hui</span>
               </div>
               <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Version Core API</span>
                 <span className="text-[10px] font-black text-brand uppercase">v4.4.2-PRO</span>
               </div>
            </div>

            <button className="w-full group py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all">
              <Download size={16} className="text-gray-500 group-hover:text-brand" />
              <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-white">Télécharger Certificat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── Sous-Composants ──────────────────────────────────────────────

const ReportStat = ({ label, value, sub, color, icon: Icon }: any) => (
  <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-bg-dark/40 relative overflow-hidden group hover:border-brand/30 transition-all">
    <div className={cn("absolute bottom-[-20%] right-[-10%] opacity-5 transition-transform group-hover:scale-125", color)}>
      <Icon size={80} />
    </div>
    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 leading-none">{label}</p>
    <div className={cn("text-3xl font-black mb-1", color)}>{value}</div>
    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{sub}</p>
  </div>
);

const ReportCard = ({ icon: Icon, title, desc, action, color, bg }: any) => (
  <button 
    onClick={action}
    className="flex items-center gap-6 p-6 rounded-[2rem] bg-bg-dark/40 border border-white/5 hover:border-brand/30 transition-all group text-left relative overflow-hidden shadow-lg"
  >
    <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", bg, color)}>
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <p className="font-black text-white text-sm mb-1 group-hover:text-brand transition-colors uppercase tracking-tight">{title}</p>
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide leading-relaxed line-clamp-2">{desc}</p>
    </div>
    <div className="p-2 rounded-lg bg-white/5 text-gray-600 transition-all group-hover:bg-brand group-hover:text-white">
      <ChevronRight size={18} />
    </div>
  </button>
);

