import React, { useState } from 'react';
import { Modal } from '../Modal';
import { User } from '../../types';
import { 
  User as UserIcon, Shield, Lock, Eye, EyeOff, ShieldCheck, Sparkles 
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Modifier l'Opérateur" : "Habiliter un Nouvel Opérateur NIGELEC"}>
      <form onSubmit={handleSaveUser} className="space-y-5 text-white">
        {/* Banner Sous-titre */}
        <div className="flex items-center gap-3 p-3 bg-brand/10 rounded-2xl border border-brand/20">
          <ShieldCheck size={18} className="text-brand shrink-0" />
          <p className="text-xs font-bold text-gray-200 uppercase tracking-wider leading-relaxed">
            {editingUser ? "Mise à jour des droits et identifiants de l'opérateur." : "Habilitation d'un nouvel utilisateur sur la plateforme NIGELEC."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom Complet */}
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
              Nom & Prénom Complet <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                name="name" 
                defaultValue={editingUser?.name} 
                placeholder="Ex: Moustapha Amadou"
                className="w-full bg-[#181920] border border-white/20 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-white placeholder:text-gray-500 focus:outline-none focus:border-brand transition-all" 
                required 
              />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
              Rôle d'Habilitation <span className="text-red-400">*</span>
            </label>
            <select 
              name="role" 
              defaultValue={editingUser?.role || 'vendor'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl py-2.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-brand transition-all cursor-pointer"
            >
              <option value="vendor" className="bg-[#181920] text-purple-400">🔑 Guichetier / Kiosque Vente (VENDOR)</option>
              <option value="tech" className="bg-[#181920] text-blue-400">🔧 Technicien Réseau (TECH)</option>
              <option value="auditor" className="bg-[#181920] text-amber-400">⚖️ Auditeur Régulateur ARSE</option>
              <option value="admin" className="bg-[#181920] text-red-400">🛡️ Administrateur Système (ADMIN)</option>
              <option value="manager" className="bg-[#181920] text-orange-400">👔 Manager / Superviseur</option>
              <option value="customer" className="bg-[#181920] text-gray-300">👤 Abonné Client (CUSTOMER)</option>
            </select>
          </div>
        </div>

        {/* Identifiant Username */}
        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
            Identifiant de Connexion (Username) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold text-sm">@</span>
            <input 
              name="username" 
              defaultValue={editingUser?.username} 
              placeholder="Ex: mamadou123"
              className="w-full bg-[#181920] border border-white/20 rounded-xl py-2.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-brand transition-all font-mono" 
              required 
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
            {editingUser ? "Nouveau Mot de passe (Laissez vide si inchangé)" : "Mot de passe d'Accès *"}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl py-2.5 pl-11 pr-12 text-sm font-bold text-white placeholder:text-gray-500 focus:outline-none focus:border-brand transition-all font-mono" 
              placeholder="••••••••" 
              required={!editingUser} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            🔒 Le mot de passe est chiffré selon la norme forte Bcrypt (10 rounds).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-white/10 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 font-bold text-xs hover:bg-white/10 transition-all uppercase tracking-wider"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {editingUser ? "Enregistrer les modifications" : "Habiliter l'Opérateur"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
