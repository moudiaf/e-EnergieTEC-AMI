import React, { useState } from 'react';
import { Modal } from '../Modal';
import { User } from '../../types';
import { 
  User as UserIcon, Shield, Key, Server, UserCheck, 
  Lock, Eye, EyeOff, ShieldCheck, Mail, Sparkles 
} from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  handleSaveUser: (e: React.FormEvent) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ 
  isOpen, 
  onClose, 
  editingUser, 
  handleSaveUser 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Modifier l'Opérateur" : "Nouvel Opérateur"}>
      <form onSubmit={handleSaveUser} className="space-y-5 text-white pt-2">
        {/* Banner Sous-titre */}
        <div className="flex items-center gap-3 p-3 bg-brand/10 rounded-2xl border border-brand/20">
          <ShieldCheck size={18} className="text-brand shrink-0" />
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider leading-relaxed">
            {editingUser ? "Mise à jour des droits et identifiants de l'opérateur." : "Habilitation d'un nouvel utilisateur sur la plateforme NIGELEC."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom Complet */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Nom Complet *
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                name="name" 
                defaultValue={editingUser?.name} 
                placeholder="ex: Moustapha Amadou"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-brand transition-all" 
                required 
              />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Rôle d'Habilitation *
            </label>
            <select 
              name="role" 
              defaultValue={editingUser?.role || 'vendor'} 
              className="w-full bg-[#161619] border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer"
            >
              <option value="vendor" className="bg-[#121214] text-purple-400">🔑 Guichetier / Kiosque Vente (VENDOR)</option>
              <option value="tech" className="bg-[#121214] text-blue-400">🔧 Technicien Réseau (TECH)</option>
              <option value="auditor" className="bg-[#121214] text-amber-400">⚖️ Auditeur Régulateur ARSE</option>
              <option value="admin" className="bg-[#121214] text-red-400">🛡️ Administrateur Système (ADMIN)</option>
              <option value="manager" className="bg-[#121214] text-brand">👔 Manager / Superviseur</option>
              <option value="customer" className="bg-[#121214] text-gray-300">👤 Abonné Client (CUSTOMER)</option>
            </select>
          </div>
        </div>

        {/* Identifiant Username */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Identifiant de Connexion (Username) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold text-xs">@</span>
            <input 
              name="username" 
              defaultValue={editingUser?.username} 
              placeholder="ex: mamadou123"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-brand transition-all font-mono" 
              required 
            />
          </div>
        </div>

        {/* Mot de passe (pour création ou réinitialisation) */}
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            {editingUser ? "Nouveau Mot de passe (Laissez vide pour conserver)" : "Mot de passe d'Accès *"}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-12 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-brand transition-all font-mono" 
              placeholder="••••••••" 
              required={!editingUser} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[9px] text-gray-500 mt-1.5 font-semibold">
            🔒 Le mot de passe sera sécurisé par chiffrement Bcrypt.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/5 transition-all uppercase tracking-wider"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3.5 bg-brand hover:bg-brand-light text-white font-black text-xs rounded-2xl shadow-[0_10px_25px_rgba(255,107,53,0.3)] transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {editingUser ? "Enregistrer les modifications" : "Créer l'Opérateur"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
