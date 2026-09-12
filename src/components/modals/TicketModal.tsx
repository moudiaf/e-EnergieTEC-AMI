import React from 'react';
import { Modal } from '../Modal';
import { Ticket, User } from '../../types';
import { Headset, AlertCircle, Cpu, UserCheck } from 'lucide-react';

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
  <Modal isOpen={isOpen} onClose={onClose} title={editingTicket ? 'Modifier le Ticket Support' : 'Ouvrir un Ticket d\'Intervention Support'}>
    <form onSubmit={handleSaveTicket} className="space-y-6">
      
      {/* SECTION 1: Incident & Compteur */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <Headset size={14} /> Sujet & Compteur Concerné
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              Sujet de l'Incident <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              name="subject" 
              defaultValue={editingTicket?.subject} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
              placeholder="Ex: Panne d'affichage / Coupure secteur" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              ID Compteur Concerné
            </label>
            <input 
              type="text" 
              name="meterId" 
              defaultValue={editingTicket?.meterId} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
              placeholder="0128244416904 ou 541-XXX-XXX" 
            />
            <input type="hidden" name="customerId" defaultValue={editingTicket?.customerId || currentUser?.associatedCustomerId || 'admin'} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Niveau de Priorité</label>
            <select 
              name="priority" 
              defaultValue={editingTicket?.priority || 'Normale'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
            >
              <option value="Basse" className="bg-[#181920] text-gray-300">Basse (Simple information)</option>
              <option value="Normale" className="bg-[#181920] text-blue-400">Normale (Support standard)</option>
              <option value="Haute" className="bg-[#181920] text-amber-400">Haute (Intervention requise)</option>
              <option value="Critique" className="bg-[#181920] text-red-400">Critique (Délestage / Urgence)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Catégorie</label>
            <select 
              name="category" 
              defaultValue={editingTicket?.category || 'Technique'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
            >
              <option value="Technique" className="bg-[#181920] text-white">Technique / Relais / Horloge</option>
              <option value="Facturation" className="bg-[#181920] text-white">Facturation & STS Prepayment</option>
              <option value="Installation" className="bg-[#181920] text-white">Installation & Raccordement</option>
              <option value="Autre" className="bg-[#181920] text-white">Autre demande</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Description */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
          Description Complète du Incidents & Constat Terrain <span className="text-red-400">*</span>
        </label>
        <textarea 
          name="description" 
          defaultValue={editingTicket?.description} 
          className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-3 text-white text-sm h-32 focus:border-brand outline-none resize-none" 
          placeholder="Renseignez les détails du problème constaté..." 
          required 
        />
      </div>

      {/* SECTION 3: Admin & Technicien Assigné */}
      {currentUser?.role === 'admin' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <UserCheck size={14} /> Traitement & Technicien Assigné
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Statut du Ticket</label>
              <select 
                name="status" 
                defaultValue={editingTicket?.status || 'Nouveau'} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
              >
                <option value="Nouveau" className="bg-[#181920] text-blue-400">Nouveau (En attente)</option>
                <option value="Ouvert" className="bg-[#181920] text-amber-400">Ouvert (Pris en charge)</option>
                <option value="En attente" className="bg-[#181920] text-purple-400">En attente pièce / SAV</option>
                <option value="Résolu" className="bg-[#181920] text-emerald-400">Résolu (Intervention validée)</option>
                <option value="Fermé" className="bg-[#181920] text-gray-400">Fermé (Clôturé)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Technicien NIGELEC Assigné</label>
              <select 
                name="assignedTo" 
                defaultValue={editingTicket?.assignedTo} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
              >
                <option value="" className="bg-[#181920] text-gray-400">-- Non assigné --</option>
                {(Array.isArray(users) ? users : []).filter(u => u.role === 'tech' || u.role === 'admin').map(u => (
                  <option key={u.id} value={u.name} className="bg-[#181920] text-white">{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 transition-colors"
        >
          Annuler
        </button>
        <button 
          type="submit" 
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all"
        >
          {editingTicket ? "Enregistrer les modifications" : "Créer le Ticket Support"}
        </button>
      </div>
    </form>
  </Modal>
);
