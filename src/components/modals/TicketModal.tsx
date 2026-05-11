import React from 'react';
import { Modal } from '../Modal';
import { Ticket, User } from '../../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTicket: Ticket | null;
  currentUser: User | null;
  users: User[];
  handleSaveTicket: (e: React.FormEvent) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  editingTicket,
  currentUser,
  users,
  handleSaveTicket
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingTicket ? 'Modifier Ticket' : 'Nouveau Ticket Support'}>
    <form onSubmit={handleSaveTicket} className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Sujet de l'incident</label>
        <input type="text" name="subject" defaultValue={editingTicket?.subject} className="input-field w-full h-12" placeholder="Ex: Panne de secteur ou Problème recharge" required />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Priorité</label>
          <select name="priority" defaultValue={editingTicket?.priority || 'Normale'} className="input-field w-full h-12 bg-bg-dark">
            <option value="Basse">Basse</option>
            <option value="Normale">Normale</option>
            <option value="Haute">Haute</option>
            <option value="Critique">Critique</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Catégorie</label>
          <select name="category" defaultValue={editingTicket?.category || 'Technique'} className="input-field w-full h-12 bg-bg-dark">
            <option value="Technique">Technique</option>
            <option value="Facturation">Facturation</option>
            <option value="Installation">Installation</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Description détaillée</label>
        <textarea name="description" defaultValue={editingTicket?.description} className="input-field w-full h-32 py-4 resize-none" placeholder="Décrivez le problème..." required></textarea>
      </div>

      {currentUser?.role === 'admin' && (
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Statut & Assignation</label>
          <div className="grid grid-cols-2 gap-4">
            <select name="status" defaultValue={editingTicket?.status || 'Nouveau'} className="input-field w-full h-12 bg-bg-dark">
              <option value="Nouveau">Nouveau</option>
              <option value="Ouvert">Ouvert</option>
              <option value="En attente">En attente</option>
              <option value="Résolu">Résolu</option>
              <option value="Fermé">Fermé</option>
            </select>
            <select name="assignedTo" defaultValue={editingTicket?.assignedTo} className="input-field w-full h-12 bg-bg-dark">
               <option value="">Non assigné</option>
               {users.filter(u => u.role === 'tech' || u.role === 'admin').map(u => (
                 <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
               ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all">Annuler</button>
        <button type="submit" className="flex-1 btn-primary h-12 rounded-xl font-bold shadow-lg shadow-brand/20">Sauvegarder</button>
      </div>
    </form>
  </Modal>
);
