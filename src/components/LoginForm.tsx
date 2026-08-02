import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bolt, User, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginFormProps {
  isLoggedIn: boolean;
  isLoading?: boolean;
  handleLogin: (e: React.FormEvent) => void;
  onForgotPassword?: () => void;
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
  isLoading = false,
  handleLogin,
  onForgotPassword,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  captcha,
  captchaInput,
  setCaptchaInput
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
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
                      <input 
                        type="text" 
                        value={loginUsername} 
                        onChange={(e) => setLoginUsername(e.target.value)} 
                        className="input-field w-full pl-12 h-14 disabled:opacity-50 disabled:cursor-not-allowed" 
                        placeholder="Identifiant" 
                        required 
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Mot de passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        className="input-field w-full pl-12 pr-12 h-14 disabled:opacity-50 disabled:cursor-not-allowed" 
                        placeholder="••••••••" 
                        required 
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none p-1 rounded-lg hover:bg-white/10"
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Captcha: <span className="text-brand font-mono font-black border border-brand/30 px-2 py-0.5 rounded italic ml-2">{captcha}</span></label>
                      <input 
                        type="text" 
                        value={captchaInput} 
                        onChange={(e) => setCaptchaInput(e.target.value)} 
                        className="input-field w-full h-12 text-center font-black tracking-[0.5em] uppercase text-brand disabled:opacity-50 disabled:cursor-not-allowed" 
                        placeholder="CODE" 
                        required 
                        disabled={isLoading}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="btn-primary w-full h-14 rounded-2xl font-black text-base leading-tight flex items-center justify-center gap-2 group shadow-[0_10px_30px_rgba(255,107,53,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Connexion...</span>
                        </>
                      ) : (
                        <>
                          <span>Se connecter</span>
                          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                        </>
                      )}
                    </button>
                  </div>

                  {onForgotPassword && (
                    <div className="text-center pt-3 border-t border-white/5 space-y-2">
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-[#ff6b35] font-black text-xs uppercase tracking-[0.25em] hover:underline hover:text-white transition-colors cursor-pointer"
                        disabled={isLoading}
                      >
                        MOT DE PASSE OUBLIÉ ?
                      </button>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono pt-1">
                        <span className="uppercase text-[9px] font-bold text-gray-600">Comptes Démo :</span>
                        <button type="button" onClick={() => { setLoginUsername('admin'); setLoginPassword('admin'); }} className="hover:text-brand underline cursor-pointer transition-colors" disabled={isLoading}>admin</button>
                        <span>•</span>
                        <button type="button" onClick={() => { setLoginUsername('vendor'); setLoginPassword('vendor'); }} className="hover:text-brand underline cursor-pointer transition-colors" disabled={isLoading}>vendor</button>
                        <span>•</span>
                        <button type="button" onClick={() => { setLoginUsername('tech'); setLoginPassword('tech'); }} className="hover:text-brand underline cursor-pointer transition-colors" disabled={isLoading}>tech</button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <p className="mt-8 text-center text-xs text-gray-600 font-bold uppercase tracking-widest">© 2026 e-EnergieTEC Niger. Version 2.0.4-Gold</p>
            </div>
         </motion.div>
      )}
    </AnimatePresence>
  );
};

