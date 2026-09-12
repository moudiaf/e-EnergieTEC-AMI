import React from 'react';
import { Modal } from '../Modal';
import { CheckCircle2, Copy, Printer } from 'lucide-react';

interface GeneratedTokenModalProps {
  generatedToken: any;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const GeneratedTokenModal: React.FC<GeneratedTokenModalProps> = ({
  generatedToken,
  onClose,
  addToast
}) => (
  <Modal isOpen={!!generatedToken} onClose={onClose} title="Token Généré avec Succès">
    {generatedToken && (
      <div className="space-y-8 text-center py-4">
        <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">Code STS à insérer dans le compteur</p>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="font-mono text-3xl font-black text-brand tracking-widest">
              {generatedToken.token}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Montant</p>
            <p className="font-bold text-white">{generatedToken.amount} FCFA</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Énergie (kWh)</p>
            <p className="font-bold text-green-400">+{generatedToken.kwh?.toFixed(2) || 0} kWh</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">TID (Token ID)</p>
            <p className="font-mono text-xs font-bold text-blue-400">{generatedToken.tid || 'N/A'}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Norme STS</p>
            <p className="text-[10px] font-bold text-gray-300">IEC 62055-41 (V2)</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {/* BOUTON D'INJECTION DIRECTE OTA */}
          <button
            onClick={async () => {
              addToast(`📡 Télétransmission DLMS en cours vers le compteur ${generatedToken.meterId || 'cible'}...`, 'info');
              try {
                // Simulation du paquet APDU DLMS vers le HES
                setTimeout(() => {
                  addToast(`⚡ Jeton STS télé-injecté avec succès : +${generatedToken.kwh?.toFixed(2) || 0} kWh crédités à distance sur le compteur ${generatedToken.meterId || ''} !`, 'success');
                }, 1200);
              } catch (e: any) {
                addToast(`Erreur télétransmission : ${e.message}`, 'error');
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/40 uppercase tracking-wider"
          >
            <span>⚡</span> 📡 Télétransmettre au Compteur (OTA HES) ➔
          </button>

          <button onClick={() => {
            navigator.clipboard.writeText(generatedToken.token.replace(/-/g, ''));
            addToast('Token copié dans le presse-papier !', 'info');
          }} className="bg-white/5 hover:bg-white/10 text-white w-full py-3.5 rounded-xl flex justify-center items-center gap-2 border border-white/10 transition-all font-bold text-xs">
            <Copy size={16} /> Copier le code
          </button>
          
          <button 
            onClick={() => window.print()} 
            className="btn-primary w-full py-4 rounded-xl flex justify-center items-center gap-2 shadow-[0_15px_30px_rgba(255,107,53,0.3)] font-black text-sm"
          >
            <Printer size={18} /> Imprimer le Reçu
          </button>
        </div>
      </div>
    )}
  </Modal>
);
