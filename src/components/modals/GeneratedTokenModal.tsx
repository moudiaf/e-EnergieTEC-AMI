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
        </div>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => {
            navigator.clipboard.writeText(generatedToken.token.replace(/-/g, ''));
            addToast('Token copié dans le presse-papier !', 'info');
          }} className="bg-white/5 hover:bg-white/10 text-white w-full py-4 rounded-xl flex justify-center items-center gap-2 border border-white/10 transition-all font-bold">
            <Copy size={18} /> Copier le code
          </button>
          
          <button 
            onClick={() => window.print()} 
            className="btn-primary w-full py-5 rounded-xl flex justify-center items-center gap-3 shadow-[0_15px_30px_rgba(255,107,53,0.3)] font-black text-lg"
          >
            <Printer size={20} /> Imprimer le Reçu
          </button>
        </div>
      </div>
    )}
  </Modal>
);
