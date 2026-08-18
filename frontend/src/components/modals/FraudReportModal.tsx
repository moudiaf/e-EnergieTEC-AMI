import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer, ShieldCheck, FileText, Download, Gavel } from 'lucide-react';

interface FraudReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fraudData: any;
}

export const FraudReportModal: React.FC<FraudReportModalProps> = ({ isOpen, onClose, fraudData }) => {
  if (!isOpen || !fraudData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl print:p-0 print:bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white text-gray-900 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
      >
        {/* Header - Non-printable controls */}
        <div className="p-6 bg-gray-50 border-b flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <Gavel size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-gray-900">Générateur de Rapport Juridique</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dossier de Preuve Numérique · NIGELEC AMI</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
              <Printer size={16} /> Imprimer / PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"><X size={20}/></button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-12 overflow-y-auto bg-white print:overflow-visible">
          {/* Official Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-gray-900">NIGELEC</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Société Nigérienne d'Electricité</p>
              <p className="text-[10px] text-gray-500">Direction de la Distribution · Division Revenue Assurance</p>
            </div>
            <div className="text-right">
              <div className="inline-block p-2 border-2 border-red-600 text-red-600 font-black text-sm uppercase mb-2">
                Document Confidentiel
              </div>
              <p className="text-[10px] text-gray-500 font-mono">REF: AMI-RA-{new Date().getFullYear()}-{Math.floor(Math.random()*10000)}</p>
              <p className="text-[10px] text-gray-500 font-mono">DATE: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-center uppercase tracking-[0.2em] mb-12 border-y py-4 border-gray-100">
            Procès-Verbal de Constat d'Anomalie Numérique
          </h2>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-widest text-blue-600 border-b pb-2">Identification du Point de Livraison</h4>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Numéro de Compteur:</span>
                  <span className="text-sm font-black">{fraudData.id || fraudData.meterId}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Localisation:</span>
                  <span className="text-sm font-bold text-gray-800">{fraudData.location || 'Talladjé, Niamey'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 py-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Type d'Abonnement:</span>
                  <span className="text-sm font-bold text-gray-800">Domestique (DP)</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-widest text-red-600 border-b pb-2">Synthèse de l'Anomalie</h4>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-black text-red-800 uppercase mb-1">Type de Fraude Détectée:</p>
                <p className="text-sm font-bold text-red-600">{fraudData.reason || "Suspicion de Bypass Total (Shunt)"}</p>
                <div className="mt-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-red-600" />
                  <span className="text-[10px] font-black text-red-800 uppercase">Indice de Confiance IA: 98.4%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-500 border-b pb-2">Éléments de Preuve Techniques</h4>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-sm text-gray-700 leading-relaxed">
              "L'analyse des profils de charge synchronisés montre une discordance majeure entre le courant mesuré au niveau du compteur (8.4A) et l'énergie incrémentée (0.02 kWh) sur une période de 24 heures. Ce comportement est caractéristique d'un shunt physique partiel évitant les bobines de mesure."
            </div>
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-[32px] flex justify-between items-center mb-12">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Préjudice Financier Estimé (6 mois)</p>
              <p className="text-3xl font-black text-white">{((fraudData.loss || 500000)).toLocaleString()} <span className="text-sm font-bold text-gray-400">FCFA</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base de Calcul</p>
              <p className="text-xs font-bold italic">Régularisation forfaitaire selon Code de l'Électricité</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-20">
            <div className="text-center space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-500">Le Responsable Revenue Assurance</p>
              <div className="h-20 flex items-center justify-center grayscale opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch%27s_Signature.png" alt="Signature" className="h-full object-contain" />
              </div>
              <p className="text-xs font-bold text-gray-900">M. Abdoulaye Moussa</p>
            </div>
            <div className="text-center space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-500">Cachet du Système AMI (Digital Seal)</p>
              <div className="w-24 h-24 border-4 border-gray-200 rounded-full mx-auto flex items-center justify-center flex-col opacity-30">
                <ShieldCheck size={40} />
                <span className="text-[8px] font-black uppercase mt-1">VERIFIED</span>
              </div>
              <p className="text-[8px] text-gray-400 font-mono break-all">HASH: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-[9px] text-gray-400">Ce document est généré automatiquement par le système e-EnergieTEC AMI. Il constitue un élément de preuve numérique conformément à la législation en vigueur sur les transactions électroniques au Niger.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
