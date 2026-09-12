import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileCode, ExternalLink, ShieldCheck, RefreshCw, 
    Lock, Key, Zap, Globe, Cpu, Terminal, 
    Layers, BookOpen, ChevronRight, Server, Play,
    Copy, Check, Code2, Database, Send, Radio, Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface EndpointDefinition {
    id: string;
    category: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    summary: string;
    description: string;
    defaultBody?: string;
    authRequired: boolean;
}

const API_ENDPOINTS: EndpointDefinition[] = [
    {
        id: 'auth-login',
        category: 'Authentification',
        method: 'POST',
        path: '/api/login',
        summary: 'Authentification Opérateur & JWT',
        description: 'Génère un jeton JWT Bearer sécurisé pour accéder aux fonctions HES & STS NIGELEC.',
        defaultBody: JSON.stringify({ username: 'admin', password: 'admin123' }, null, 2),
        authRequired: false
    },
    {
        id: 'meters-list',
        category: 'Compteurs AMI',
        method: 'GET',
        path: '/api/meters',
        summary: 'Registre des compteurs connectés',
        description: 'Récupère les compteurs physiques avec index, solde crédit, statut GPRS et tension nominale.',
        authRequired: true
    },
    {
        id: 'sts-generate',
        category: 'Distribution STS',
        method: 'POST',
        path: '/api/sts/generate',
        summary: 'Émission de Jeton STS (20 Chiffres)',
        description: 'Génère un jeton de recharge électrique prépayé standard CEI 62055-41.',
        defaultBody: JSON.stringify({
            meterId: '0128260224778',
            amount: 5000,
            operator: 'Guichet Agence Niamey',
            paymentMethod: 'CASH'
        }, null, 2),
        authRequired: true
    },
    {
        id: 'kms-token',
        category: 'Module KMS-HSM',
        method: 'POST',
        path: '/api/kms/generate-token',
        summary: 'Calcul Cryptographique KMS (Port 5000)',
        description: 'Calcule un jeton STS avec signature HMAC AES-128 et dérivation SGC 600876.',
        defaultBody: JSON.stringify({
            meterId: '0128260224786',
            amount: 10,
            type: '0',
            krn: '2',
            ti: '1'
        }, null, 2),
        authRequired: true
    },
    {
        id: 'tariffs-list',
        category: 'Tarification NIGELEC',
        method: 'GET',
        path: '/api/tariffs',
        summary: 'Grille tarifaire officielle',
        description: 'Liste les 6 segments tarifaires NIGELEC (BT-D, BT-P, TS, MT-G, HT, EP) avec tranches.',
        authRequired: true
    },
    {
        id: 'hes-decode',
        category: 'Passerelle HES / DLMS',
        method: 'POST',
        path: '/api/hes/decode',
        summary: 'Décodage de Trame DLMS/COSEM HDLC',
        description: 'Traduit une trame brute hexadécimale en objets OBIS (Tension, Courant, Index).',
        defaultBody: JSON.stringify({
            frame: '7EA01F000200230353B984E6E600C401C100010000600100FF02011200007E'
        }, null, 2),
        authRequired: true
    },
    {
        id: 'invoices-list',
        category: 'Facturation & MDMS',
        method: 'GET',
        path: '/api/invoices',
        summary: 'Journal des factures et bilans mensuels',
        description: 'Récupère les relevés certifiés MDMS et historiques de facturation institutionnelle.',
        authRequired: true
    },
    {
        id: 'audits-list',
        category: 'Sécurité & Audit',
        method: 'GET',
        path: '/api/audits',
        summary: 'Journal de traçabilité SHA-256',
        description: 'Consulte les logs immuables de sécurité et de délivrance de jetons STS.',
        authRequired: true
    }
];

export const ApiDocsSection = () => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'SWAGGER'>('CONSOLE');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDefinition>(API_ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(API_ENDPOINTS[0].defaultBody || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [codeLang, setCodeLang] = useState<'curl' | 'javascript' | 'python'>('curl');

  // Update request body when endpoint selection changes
  useEffect(() => {
    setRequestBody(selectedEndpoint.defaultBody || '');
    setResponseData(null);
    setResponseStatus(null);
    setResponseLatency(null);
  }, [selectedEndpoint]);

  // Execute Live API Request
  const handleExecuteRequest = async () => {
    setIsLoading(true);
    const t0 = performance.now();
    try {
      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (selectedEndpoint.authRequired && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers
      };

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const t1 = performance.now();
      setResponseLatency(Math.round(t1 - t0));
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({ message: 'Réponse reçue' }));
      setResponseData(json);

      // Auto save token if login was executed
      if (selectedEndpoint.path === '/api/login' && json.token) {
        localStorage.setItem('token', json.token);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Échec de connexion au serveur API' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Generate Code Snippet
  const getSnippet = () => {
    const url = `http://localhost:3000${selectedEndpoint.path}`;
    if (codeLang === 'curl') {
      if (selectedEndpoint.method === 'GET') {
        return `curl -X GET "${url}" \\
  -H "Authorization: Bearer <TOKEN>"`;
      }
      return `curl -X ${selectedEndpoint.method} "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -d '${requestBody.replace(/\n/g, '')}'`;
    }

    if (codeLang === 'javascript') {
      return `const response = await fetch("${url}", {
  method: "${selectedEndpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <TOKEN>"
  }${selectedEndpoint.method !== 'GET' ? `,\n  body: JSON.stringify(${requestBody})` : ''}
});
const data = await response.json();
console.log(data);`;
    }

    if (codeLang === 'python') {
      return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer <TOKEN>",
    "Content-Type": "application/json"
}
${selectedEndpoint.method !== 'GET' ? `payload = ${requestBody}\nresponse = requests.${selectedEndpoint.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.get(url, headers=headers)`}

print(response.status_code)
print(response.json())`;
    }

    return '';
  };

  // Inject Swagger UI if in Swagger tab
  useEffect(() => {
    if (activeTab !== 'SWAGGER') return;
    const linkId = 'swagger-ui-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
      document.head.appendChild(link);
    }

    const scriptId = 'swagger-ui-js';
    const initSwagger = () => {
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

    if (!(window as any).SwaggerUIBundle) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
      script.async = true;
      script.onload = initSwagger;
      document.body.appendChild(script);
    } else {
      initSwagger();
    }
  }, [activeTab]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-32 pt-2 text-white"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8 bg-[#121318] p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded-lg border border-brand/30">
              NIGELEC Developer Portal
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <BookOpen size={14} /> REST API v2.5 (OpenAPI 3.0)
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Terminal className="text-brand" size={36} /> Documentation <span className="text-brand">& Console API</span>
          </h3>
          <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">
            Interfaçage souverain des systèmes MDMS, Guichet STS, Passerelle HES & Cryptographie KMS
          </p>
        </div>
        
        {/* Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="bg-[#181920] p-1.5 rounded-2xl border border-white/15 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('CONSOLE')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'CONSOLE' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md" : "text-gray-400 hover:text-white"
              )}
            >
              <Code2 size={14} /> Console Interactive
            </button>
            <button
              onClick={() => setActiveTab('SWAGGER')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'SWAGGER' ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md" : "text-gray-400 hover:text-white"
              )}
            >
              <FileCode size={14} /> Spécification Swagger
            </button>
          </div>

          <a 
            href="/swagger.yaml" 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <FileCode size={16} className="text-brand" />
            <span>Télécharger YAML</span>
            <ExternalLink size={12} className="text-gray-400" />
          </a>
        </div>
      </div>

      {/* ── Guide Authentification Rapide ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AuthCard 
          title="Endpoint Base (REST)" 
          value="http://localhost:3000/api" 
          sub="Portail HES Local NIGELEC"
          icon={Globe} 
          color="text-blue-400"
          bg="bg-blue-500/10 border-blue-500/30"
        />
        <AuthCard 
          title="Authentification Sécurisée" 
          value="Bearer JWT Token" 
          sub="Header: Authorization"
          icon={Lock} 
          color="text-emerald-400"
          bg="bg-emerald-500/10 border-emerald-500/30"
        />
        <AuthCard 
          title="Module Sécurité KMS" 
          value="Port 5000 (HSM Direct)" 
          sub="Algorithme: STS-V2-AES-128"
          icon={Key} 
          color="text-amber-400"
          bg="bg-amber-500/10 border-amber-500/30"
        />
      </div>

      {/* ── VUE 1 : CONSOLE DE TEST INTERACTIVE ───────────────────── */}
      {activeTab === 'CONSOLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Menu des Endpoints (4 Colonnes) */}
          <div className="lg:col-span-4 bg-[#121318] p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-brand" /> Endpoints Disponibles ({API_ENDPOINTS.length})
              </h4>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {API_ENDPOINTS.map(ep => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5",
                      isSelected ? "bg-brand/20 border-brand/40 shadow-lg" : "bg-[#181920] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono border",
                        ep.method === 'GET' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                        ep.method === 'POST' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                        ep.method === 'PUT' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"
                      )}>
                        {ep.method}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{ep.category}</span>
                    </div>
                    <p className="text-xs font-black text-white font-mono truncate">{ep.path}</p>
                    <p className="text-[11px] text-gray-300 line-clamp-1">{ep.summary}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testeur de Requête & Visualiseur de Réponse (8 Colonnes) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Panneau de Requête */}
            <div className="bg-[#121318] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono border",
                      selectedEndpoint.method === 'GET' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    )}>
                      {selectedEndpoint.method}
                    </span>
                    <span className="text-base font-black text-white font-mono">{selectedEndpoint.path}</span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium">{selectedEndpoint.description}</p>
                </div>

                <button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  Exécuter Requête
                </button>
              </div>

              {/* Corps de la Requête (si applicable) */}
              {selectedEndpoint.method !== 'GET' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Corps de Requête (JSON Payload)
                    </label>
                    <button 
                      onClick={() => setRequestBody(selectedEndpoint.defaultBody || '{}')}
                      className="text-[10px] text-brand hover:underline font-bold uppercase cursor-pointer"
                    >
                      Réinitialiser Payload
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={e => setRequestBody(e.target.value)}
                    className="w-full bg-[#181920] border border-white/15 rounded-2xl p-4 text-xs font-mono text-cyan-300 focus:border-brand outline-none custom-scrollbar"
                  />
                </div>
              )}

              {/* Panneau de Réponse */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Réponse Serveur en Direct
                    </label>
                    {responseStatus !== null && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
                        responseStatus >= 200 && responseStatus < 300 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"
                      )}>
                        HTTP {responseStatus}
                      </span>
                    )}
                    {responseLatency !== null && (
                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                        {responseLatency} ms
                      </span>
                    )}
                  </div>

                  {responseData && (
                    <button
                      onClick={() => handleCopy(JSON.stringify(responseData, null, 2), 'response')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/10 flex items-center gap-1.5 text-[10px] font-bold uppercase cursor-pointer"
                    >
                      {copiedType === 'response' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      Copier JSON
                    </button>
                  )}
                </div>

                <div className="bg-[#181920] border border-white/15 rounded-2xl p-4 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar">
                  {responseData ? (
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(responseData, null, 2)}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40 text-center">
                      <Send size={28} className="mb-2 text-gray-400" />
                      <p className="text-xs font-bold uppercase text-gray-400">Cliquez sur « Exécuter Requête » pour tester en direct</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Générateur d'Extraits de Code (cURL, JS, Python) */}
            <div className="bg-[#121318] p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Code2 size={14} className="text-brand" /> Intégration Développeur & SDK
                </h4>
                
                <div className="flex items-center gap-2">
                  {(['curl', 'javascript', 'python'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                        codeLang === lang ? "bg-brand text-white border-transparent shadow-sm" : "bg-[#181920] border-white/10 text-gray-400 hover:text-white"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                  <button
                    onClick={() => handleCopy(getSnippet(), 'snippet')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all ml-2 cursor-pointer"
                    title="Copier le code"
                  >
                    {copiedType === 'snippet' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="bg-[#181920] border border-white/15 rounded-2xl p-4 overflow-x-auto custom-scrollbar">
                <pre className="text-xs font-mono text-cyan-300 whitespace-pre">
                  {getSnippet()}
                </pre>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── VUE 2 : SWAGGER UI CONTAINER ────────────────────────── */}
      {activeTab === 'SWAGGER' && (
        <div className="bg-[#121318] rounded-3xl border border-white/15 shadow-2xl overflow-hidden min-h-[900px] relative">
          <style>{`
            .swagger-ui { background-color: #121318 !important; color: #e2e8f0 !important; padding: 24px; font-family: 'Inter', system-ui, sans-serif !important; }
            .swagger-ui .info { margin: 20px 0 !important; }
            .swagger-ui .info .title { color: #ffffff !important; font-weight: 900 !important; text-transform: uppercase; letter-spacing: -0.5px; font-size: 28px !important; display: flex !important; align-items: center !important; flex-wrap: wrap !important; gap: 12px !important; }
            .swagger-ui .info .title small.version-stamp { background: #ff6b35 !important; color: #ffffff !important; font-size: 11px !important; font-weight: 800 !important; border-radius: 8px !important; padding: 3px 8px !important; position: static !important; }
            .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td { color: #cbd5e1 !important; font-size: 13px !important; font-weight: 600 !important; line-height: 1.6 !important; }
            .swagger-ui .info h3 { color: #f97316 !important; font-weight: 800 !important; font-size: 16px !important; margin-top: 15px !important; }
            .swagger-ui .info a { color: #60a5fa !important; font-weight: bold !important; text-decoration: underline !important; }
            
            .swagger-ui .scheme-container { background: #181920 !important; box-shadow: none !important; border: 1px solid rgba(255,255,255,0.15) !important; border-radius: 20px !important; margin: 20px 0 !important; padding: 20px !important; }
            .swagger-ui .schemes-title { color: #ffffff !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 12px !important; }
            .swagger-ui select { background: #121318 !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #ffffff !important; border-radius: 12px !important; font-weight: bold !important; padding: 8px 12px !important; }
            .swagger-ui input[type=text] { background: #121318 !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #ffffff !important; border-radius: 12px !important; font-weight: bold !important; }
            
            .swagger-ui .opblock-tag { border-bottom: 1px solid rgba(255,255,255,0.15) !important; color: #ffffff !important; font-weight: 900 !important; text-transform: uppercase !important; font-size: 18px !important; padding: 15px 0 !important; }
            .swagger-ui .opblock-tag small { color: #94a3b8 !important; font-weight: 600 !important; }
            
            .swagger-ui .opblock { border-radius: 16px !important; margin-bottom: 12px !important; border: 1px solid rgba(255,255,255,0.15) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important; }
            .swagger-ui .opblock.opblock-get { background: rgba(59, 130, 246, 0.12) !important; border-color: rgba(59, 130, 246, 0.4) !important; }
            .swagger-ui .opblock.opblock-post { background: rgba(16, 185, 129, 0.12) !important; border-color: rgba(16, 185, 129, 0.4) !important; }
            .swagger-ui .opblock.opblock-put { background: rgba(245, 158, 11, 0.12) !important; border-color: rgba(245, 158, 11, 0.4) !important; }
            .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.12) !important; border-color: rgba(239, 68, 68, 0.4) !important; }
            
            .swagger-ui .opblock .opblock-summary-method { border-radius: 8px !important; font-weight: 900 !important; text-shadow: none !important; font-size: 12px !important; padding: 6px 14px !important; }
            .swagger-ui .opblock .opblock-summary-path { color: #ffffff !important; font-weight: 800 !important; font-family: monospace !important; font-size: 14px !important; }
            .swagger-ui .opblock .opblock-summary-description { color: #cbd5e1 !important; font-weight: 600 !important; font-size: 12px !important; }
            
            .swagger-ui .btn.authorize { color: #f97316 !important; border: 2px solid #f97316 !important; background-color: rgba(249,115,22,0.1) !important; font-weight: 900 !important; border-radius: 12px !important; text-transform: uppercase !important; font-size: 12px !important; }
            .swagger-ui .btn.authorize svg { fill: #f97316 !important; }
            .swagger-ui .btn.authorize:hover { background-color: #f97316 !important; color: #ffffff !important; }
            .swagger-ui .btn.authorize:hover svg { fill: #ffffff !important; }
          `}</style>
          
          <div id="swagger-ui-container">
             <div className="flex flex-col items-center justify-center p-32 text-gray-300">
               <div className="relative mb-6">
                  <RefreshCw className="animate-spin text-brand" size={44} />
                  <div className="absolute inset-0 blur-xl bg-brand opacity-25"></div>
               </div>
               <p className="font-bold uppercase text-xs tracking-widest text-white">Chargement de la Spécification OpenAPI NIGELEC...</p>
               <p className="text-xs text-gray-400 font-bold mt-2 uppercase">Propulsé par e-EnergieTEC OpenAPI v3.0 Engine</p>
             </div>
          </div>
        </div>
      )}

      {/* ── Note de Sécurité ────────────────────────────────────── */}
      <div className="bg-[#121318] border border-brand/40 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shrink-0">
          <ShieldCheck size={30} />
        </div>
        <div>
          <h4 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Environnement d'API de Production Sécurisé</h4>
          <p className="text-gray-300 text-xs font-bold leading-relaxed uppercase tracking-wider max-w-2xl">
            L'accès aux ressources API est strictement réservé aux terminaux et agents agréés. Toutes les requêtes sont journalisées 
            et signées cryptographiquement (SHA256). Pour toute intégration ERP ou Mobile Money, contactez la Direction Informatique NIGELEC.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const AuthCard = ({ title, value, sub, icon: Icon, color, bg }: any) => (
  <div className={cn("bg-[#121318] p-6 rounded-3xl border group hover:border-brand/40 transition-all shadow-xl flex items-center gap-5", bg)}>
    <div className={cn("p-3.5 rounded-2xl border border-white/10 shrink-0", color)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-0.5">{title}</p>
      <p className="text-sm font-black text-white font-mono uppercase tracking-tight">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{sub}</p>}
    </div>
  </div>
);
