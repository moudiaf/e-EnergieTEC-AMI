import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bolt, User, Lock, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

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
         <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           exit={{ opacity: 0 }} 
           className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
         >
            {/* Arrière-plan Photographie Industrielle NIGELEC Haute Tension */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
              <img 
                src="/nigelec-sunset-grid.jpg" 
                alt="Infrastructures Haute Tension NIGELEC au coucher de soleil" 
                className="w-full h-full object-cover object-center scale-105 filter brightness-[0.85] contrast-[1.05]"
              />
              {/* Vignette Dégradée Sombre & Flou de Profondeur pour Lisibilité Parfaite */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/75 to-slate-950/80" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/45 to-black/85" />
            </div>

            {/* Conteneur Principal Formulaire */}
            <div className="w-full max-w-md py-6 my-auto relative z-10">
              {/* En-tête Institutionnel */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#ff6b35] via-[#ff8c5a] to-[#00A651] mb-3.5 shadow-[0_15px_50px_rgba(255,107,53,0.5)] border border-white/20 relative group">
                  <Bolt className="text-white drop-shadow-lg group-hover:scale-110 transition-transform" size={42} />
                  <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-br from-[#ff6b35] to-[#00A651] opacity-30 blur-sm pointer-events-none" />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-1.5 uppercase drop-shadow-md">
                  e-EnergieTEC
                </h1>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-[#ff6b35]"></div>
                  <p className="text-[#ff6b35] font-black text-[10px] uppercase tracking-[0.4em] drop-shadow-sm">
                    Smart Grid National
                  </p>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-[#00A651]"></div>
                </div>
              </div>
              
              {/* Carte Glassmorphism de Luxe */}
              <div className="relative overflow-hidden rounded-[32px] backdrop-blur-2xl bg-slate-950/70 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 sm:p-8">
                {/* Liseré Supérieur Bicolore Niger (Orange NIGELEC - Vert Niger) */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff6b35] via-white/40 to-[#00A651]" />

                {/* Lueurs d'Ambiance Intérieures */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ff6b35]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00A651]/15 rounded-full blur-3xl pointer-events-none" />

                <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                  {/* Champ Utilisateur */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-2 ml-1">
                      Identifiant
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff6b35] transition-colors" size={18} />
                      <input 
                        type="text" 
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="admin, vendor ou tech" 
                        required
                        disabled={isLoading}
                        className="w-full bg-slate-900/65 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/60 focus:bg-slate-900/90 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Champ Mot de Passe */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-2 ml-1">
                      Mot de passe
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff6b35] transition-colors" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••" 
                        required
                        disabled={isLoading}
                        className="w-full bg-slate-900/65 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/60 focus:bg-slate-900/90 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Champ Captcha Dédié */}
                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                        Code de Sécurité (Captcha)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[#ff6b35] tracking-widest bg-[#ff6b35]/15 border border-[#ff6b35]/35 px-2.5 py-0.5 rounded-lg text-xs select-none shadow-sm">
                          {captcha}
                        </span>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Tapez le code ci-dessus" 
                      required
                      maxLength={4}
                      disabled={isLoading}
                      className="w-full bg-slate-900/65 border border-white/10 rounded-2xl py-3 px-4 text-white text-center font-mono font-bold tracking-[0.3em] text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b35]/60 focus:bg-slate-900/90 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all uppercase shadow-inner"
                    />
                  </div>

                  {/* Bouton de Connexion Pleine Largeur Imposant */}
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#ff6b35] via-[#ff7e47] to-[#ff945e] hover:from-[#ff7942] hover:to-[#ffa06e] text-white font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-[0_10px_35px_rgba(255,107,53,0.35)] hover:shadow-[0_15px_45px_rgba(255,107,53,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 border border-white/15"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} className="opacity-85" />
                          <span>Se Connecter</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Section Profils Démo & Réinitialisation */}
                  <div className="text-center pt-3 border-t border-white/10 space-y-2.5">
                    {onForgotPassword && (
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-[#ff6b35] font-black text-[11px] uppercase tracking-[0.2em] hover:underline hover:text-white transition-colors cursor-pointer"
                        disabled={isLoading}
                      >
                        Mot de passe oublié ?
                      </button>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Rôles Démonstration :
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          type="button" 
                          onClick={() => { setLoginUsername('admin'); setLoginPassword('admin123'); }} 
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#ff6b35]/20 border border-white/10 hover:border-[#ff6b35]/40 text-gray-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm" 
                          disabled={isLoading}
                          title="Connectez-vous en tant qu'Administrateur National"
                        >
                          <span>👑</span>
                          <span>Admin</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setLoginUsername('vendor'); setLoginPassword('vendor123'); }} 
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#ff6b35]/20 border border-white/10 hover:border-[#ff6b35]/40 text-gray-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm" 
                          disabled={isLoading}
                          title="Connectez-vous en tant que Guichetier / Vendeur STS"
                        >
                          <span>🏪</span>
                          <span>Guichet</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setLoginUsername('tech'); setLoginPassword('tech123'); }} 
                          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-[#ff6b35]/20 border border-white/10 hover:border-[#ff6b35]/40 text-gray-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm" 
                          disabled={isLoading}
                          title="Connectez-vous en tant que Technicien Réseau"
                        >
                          <span>🔧</span>
                          <span>Réseau</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Copyright Institutionnel */}
                  <div className="pt-3 border-t border-white/10 text-center select-none">
                    <p className="text-[11px] text-gray-300 font-bold tracking-tight">
                      © 2026 e-EnergieTEC (RENTEC AMI)
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                      Tous droits réservés · v6.5 Enterprise
                    </p>
                  </div>
                </form>
              </div>
            </div>
         </motion.div>
      )}
    </AnimatePresence>
  );
};
