import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoice: Invoice | null;
  handlePayInvoice: (e: React.FormEvent) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedInvoice,
  handlePayInvoice
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [operator, setOperator] = useState('Orange');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !selectedInvoice) return null;

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call to initiate payment
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleConfirmOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      // Wait a bit then trigger the actual parent handler
      setTimeout(() => {
        handlePayInvoice(e);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-bg-dark/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="glass-panel w-full max-w-md p-0 rounded-[32px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden bg-bg-dark"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white z-50 transition-colors"><X size={24}/></button>
        
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-brand/10 flex items-center justify-center text-brand mx-auto mb-6 relative group">
                    <div className="absolute inset-0 bg-brand/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                    <Smartphone size={40} className="relative z-10" />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Paiement Mobile Money</h4>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">NIGELEC GATEWAY • NIGER HUB</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col items-center">
                  <p className="text-[10px] text-gray-600 font-medium">Incluant 19% TVA Niger</p>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Montant à régler</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{selectedInvoice.totalTTC.toLocaleString()}</span>
                    <span className="text-sm font-bold text-brand uppercase">FCFA</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitDetails} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Opérateur préféré</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Orange', color: 'bg-orange-600' },
                        { id: 'Airtel', color: 'bg-red-600' },
                        { id: 'NITA', color: 'bg-blue-600' },
                        { id: 'AMANA', color: 'bg-green-600' }
                      ].map(op => (
                        <label key={op.id} className="cursor-pointer group">
                          <input type="radio" name="operator" value={op.id} className="peer hidden" checked={operator === op.id} onChange={() => setOperator(op.id)} />
                          <div className={cn(
                            "py-4 rounded-2xl border-2 border-white/5 bg-white/5 flex items-center justify-center gap-3 font-black text-sm transition-all",
                            "peer-checked:border-brand peer-checked:bg-brand/10 peer-checked:text-white group-hover:border-white/10"
                          )}>
                            <div className={cn("w-3 h-3 rounded-full", op.color)}></div>
                            {op.id}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Numéro de téléphone</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-gray-400 font-black text-lg">+227</span>
                        <div className="w-px h-6 bg-white/10"></div>
                      </div>
                      <input 
                        type="tel" 
                        name="phone" 
                        placeholder="9x xx xx xx" 
                        className="w-full h-16 bg-white/5 border-2 border-white/5 rounded-2xl font-black text-xl text-white pl-24 focus:outline-none focus:border-brand transition-all"
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full h-16 bg-brand hover:bg-brand-light text-white rounded-2xl font-black text-lg shadow-[0_16px_32px_rgba(255,107,53,0.3)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Initier le paiement <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-6 relative group">
                    <ShieldCheck size={40} className="relative z-10" />
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Vérification SMS</h4>
                  <p className="text-gray-500 text-sm font-medium mt-2">Un code de validation OTP a été envoyé au numéro +227 9x xx xx xx via <span className="text-white font-bold">{operator}</span>.</p>
                </div>

                <form onSubmit={handleConfirmOTP} className="space-y-8">
                  <div className="flex justify-between gap-4">
                    {[1,2,3,4].map(i => (
                      <input 
                        key={i}
                        type="text" 
                        maxLength={1}
                        className="w-full h-20 bg-white/5 border-2 border-white/10 rounded-2x; text-center text-3xl font-black text-brand focus:outline-none focus:border-brand transition-all"
                        required 
                        autoFocus={i === 1}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <button type="button" className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-brand transition-colors">Renvoyer le code (45s)</button>
                  </div>

                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full h-16 bg-white text-bg-dark hover:bg-gray-200 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin text-brand" /> : "Vérifier & Payer"}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-6">
                <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-bounce">
                  <CheckCircle2 size={56} />
                </div>
                <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Paiement Réussi</h4>
                <p className="text-gray-500 font-medium">Votre facture a été réglée avec succès. La transaction est en cours de validation finale.</p>
                <div className="pt-8">
                  <Loader2 className="animate-spin text-brand mx-auto" />
                  <p className="text-[10px] font-black text-gray-500 uppercase mt-4 tracking-widest">Génération du reçu STS...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
