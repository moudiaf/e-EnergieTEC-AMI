import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FileCode, ExternalLink, ShieldCheck, RefreshCw, 
    Lock, Key, Zap, Globe, Cpu, Terminal, 
    Layers, BookOpen, ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const ApiDocsSection = () => {
  useEffect(() => {
    // Inject Swagger UI via CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: '/swagger.yaml',
          dom_id: '#swagger-ui-container',
          deepLinking: true,
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          layout: "BaseLayout"
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-32"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-brand/20 text-brand text-[8px] font-black uppercase rounded border border-brand/30">Developer Portal</span>
            <span className="flex items-center gap-1 text-[8px] font-bold text-niger-green uppercase tracking-widest">
              <BookOpen size={10} /> Documentation AMI v2.4
            </span>
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter">API <span className="text-brand">Interractive</span></h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Exploration technique des systèmes MDMS, STS & Billing</p>
        </div>
        
        <div className="flex gap-4">
          <a 
            href="/swagger.yaml" 
            target="_blank" 
            className="group relative px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-brand translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
            <FileCode size={18} className="text-brand" />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest relative z-10">Spécification YAML</span>
          </a>
        </div>
      </div>

      {/* ── Guide Authentification Rapid ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AuthCard 
          title="Endpoint Base" 
          value="https://api.nigelec.ne/v2" 
          icon={Globe} 
          color="text-blue-400"
        />
        <AuthCard 
          title="Sécurité" 
          value="Bearer JWT Token" 
          icon={Lock} 
          color="text-niger-green"
        />
        <AuthCard 
          title="Format" 
          value="application/json" 
          icon={Terminal} 
          color="text-brand"
        />
      </div>

      {/* ── Swagger UI Container ────────────────────────────────── */}
      <div className="glass-panel rounded-[2.5rem] border border-white/5 bg-[#121214] shadow-2xl overflow-hidden min-h-[900px] relative">
        <style>{`
          /* Custom Dark Mode Swagger Theme */
          .swagger-ui { background-color: #121214; color: #a0aec0; padding: 20px; font-family: 'Inter', sans-serif !important; }
          .swagger-ui .info .title { color: #fff !important; font-weight: 900 !important; text-transform: uppercase; letter-spacing: -1px; font-size: 24px; }
          .swagger-ui .info p, .swagger-ui .info li { color: #718096 !important; font-size: 13px; }
          .swagger-ui .scheme-container { background: #1a202c !important; box-shadow: none !important; border: 1px solid #2d3748; border-radius: 16px; margin: 20px !important; padding: 15px !important; }
          .swagger-ui select, .swagger-ui input { background: #2d3748 !important; border: 1px border #4a5568 !important; color: #fff !important; border-radius: 8px !important; }
          .swagger-ui .opblock.opblock-get { background: rgba(49, 130, 206, 0.1) !important; border-color: #3182ce !important; border-radius: 12px; }
          .swagger-ui .opblock.opblock-post { background: rgba(56, 161, 105, 0.1) !important; border-color: #38a169 !important; border-radius: 12px; }
          .swagger-ui .opblock.opblock-put { background: rgba(214, 158, 46, 0.1) !important; border-color: #d69e2e !important; border-radius: 12px; }
          .swagger-ui .opblock.opblock-delete { background: rgba(229, 62, 62, 0.1) !important; border-color: #e53e3e !important; border-radius: 12px; }
          .swagger-ui .opblock-tag { border-bottom: 1px solid #2d3748 !important; color: #fff !important; font-weight: 900 !important; text-transform: uppercase; }
          .swagger-ui .opblock .opblock-summary-method { border-radius: 6px !important; font-weight: 900 !important; }
          .swagger-ui .btn.authorize { color: #ff6b35 !important; border-color: #ff6b35 !important; background-color: transparent !important; }
          .swagger-ui .btn.authorize svg { fill: #ff6b35 !important; }
          .swagger-ui section.models { border: 1px solid #2d3748 !important; border-radius: 16px; margin-top: 50px; background: #1a202c !important; }
          .swagger-ui section.models h4 { color: #fff !important; text-transform: uppercase; }
          .swagger-ui .response-col_status { color: #fff !important; font-weight: bold; }
          .swagger-ui .tabli button { color: #fff !important; }
          .swagger-ui .responses-table, .swagger-ui .parameters-table { border-collapse: separate; border-spacing: 0 8px; }
        `}</style>
        
        <div id="swagger-ui-container">
           <div className="flex flex-col items-center justify-center p-32 text-gray-500">
             <div className="relative mb-6">
                <RefreshCw className="animate-spin text-brand" size={40} />
                <div className="absolute inset-0 blur-xl bg-brand opacity-20"></div>
             </div>
             <p className="font-black uppercase text-[10px] tracking-[0.4em]">Chargement des Schémas API NIGELEC...</p>
             <p className="text-[8px] text-gray-700 font-bold mt-4 uppercase">Propulsé par e-EnergieTEC OpenAPI Engine</p>
           </div>
        </div>
      </div>

      {/* ── Note de Sécurité ────────────────────────────────────── */}
      <div className="bg-brand/5 border border-brand/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h4 className="text-white font-black uppercase text-sm mb-2 tracking-tight">Environnement de Production Sécurisé</h4>
          <p className="text-gray-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest max-w-2xl">
            L'accès aux ressources API est strictement réservé aux terminaux agréés. Toutes les requêtes sont journalisées 
            et signées cryptographiquement. Pour toute demande d'accès partenaire, contactez la Direction Informatique.
          </p>
        </div>
        <button className="md:ml-auto px-6 py-3 bg-white/5 hover:bg-brand text-gray-400 hover:text-white rounded-xl border border-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
           Demande de Clés
        </button>
      </div>
    </motion.div>
  );
};

const AuthCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="glass-panel p-6 rounded-[2rem] border border-white/5 bg-bg-dark/40 group hover:border-white/20 transition-all shadow-xl flex items-center gap-6">
    <div className={cn("p-4 rounded-2xl bg-white/5", color)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xs font-black text-white uppercase tracking-tight">{value}</p>
    </div>
  </div>
);
