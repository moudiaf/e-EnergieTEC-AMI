import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bolt, User, Lock, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  isLoggedIn: boolean;
  handleLogin: (e: React.FormEvent) => void;
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  captcha: string;
  captchaInput: string;
  setCaptchaInput: (val: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isLoggedIn,
  handleLogin,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  captcha,
  captchaInput,
  setCaptchaInput
}) => (
  <AnimatePresence>
    {!isLoggedIn && (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-bg-dark flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#ff6b35] to-[#00A651] mb-6 shadow-[0_15px_60px_rgba(255,107,53,0.4)]">
                <Bolt className="text-white" size={48} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">e-EnergieTEC</h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[#ff6b35]"></div>
                <p className="text-[#ff6b35] font-black text-[10px] uppercase tracking-[0.4em]">Smart Grid National</p>
                <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[#00A651]"></div>
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-60">République du Niger • NIGELEC DISI</p>
            </div>
            
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden backdrop-blur-2xl border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Utilisateur</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
                    <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="input-field w-full pl-12 h-14" placeholder="Identifiant" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
                    <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="input-field w-full pl-12 h-14" placeholder="••••••••" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Captcha: <span className="text-brand font-mono font-black border border-brand/30 px-2 py-0.5 rounded italic ml-2">{captcha}</span></label>
                    <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} className="input-field w-full h-12 text-center font-black tracking-[0.5em] uppercase text-brand" placeholder="CODE" required />
                  </div>
                  <button type="submit" className="btn-primary w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 group shadow-[0_10px_30px_rgba(255,107,53,0.3)]">
                    Login <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
            <p className="mt-8 text-center text-xs text-gray-600 font-bold uppercase tracking-widest">© 2026 e-EnergieTEC Niger. Version 2.0.4-Gold</p>
          </div>
       </motion.div>
    )}
  </AnimatePresence>
);
