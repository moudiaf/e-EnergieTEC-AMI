import React from 'react';
import { Modal } from '../Modal';
import { User } from '../../types';

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
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}>
    <form onSubmit={handleSaveUser} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Nom Complet</label>
          <input name="name" defaultValue={editingUser?.name} className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Rôle</label>
          <select name="role" defaultValue={editingUser?.role || 'vendor'} className="input-field w-full bg-transparent">
            <option value="vendor" className="bg-bg-dark">Vendeur STS (Marchand)</option>
            <option value="manager" className="bg-bg-dark">Manager / Superviseur</option>
            <option value="admin" className="bg-bg-dark">Administrateur Système</option>
            <option value="tech" className="bg-bg-dark">Technicien Terrain</option>
            <option value="billing" className="bg-bg-dark">Agent Facturation</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Identifiant (Username)</label>
        <input name="username" defaultValue={editingUser?.username} className="input-field w-full" required />
      </div>
      {!editingUser && (
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Mot de passe</label>
          <input name="password" type="password" className="input-field w-full" placeholder="••••••••" required />
        </div>
      )}
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all">Annuler</button>
        <button type="submit" className="flex-1 btn-primary h-12 rounded-xl font-bold">Sauvegarder</button>
      </div>
    </form>
  </Modal>
);
