import React from 'react';
import { User, Mail, Phone, MapPin, ShieldCheck, Folder } from 'lucide-react';
import { Modal } from '../Modal';
import { Customer, Tariff, Region } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  tariffs: Tariff[];
  regions: Region[];
  handleSaveCustomer: (e: React.FormEvent) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  editingCustomer,
  tariffs,
  regions,
  handleSaveCustomer
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingCustomer ? "Modifier la Fiche Abonné" : "Créer un Nouvel Abonné NIGELEC"}>
    <form onSubmit={handleSaveCustomer} className="space-y-6">
      
      {/* SECTION 1: Identité Abonné */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <User size={14} /> Identité & Type d'Abonnement
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
              Nom & Prénom / Raison Sociale <span className="text-red-400">*</span>
            </label>
            <input 
              name="name" 
              defaultValue={editingCustomer?.name} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all" 
              placeholder="Ex: Moussa Abdoulaye"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Catégorie Tarifaire</label>
            <select 
              name="type" 
              defaultValue={editingCustomer?.type || 'domestic'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all"
            >
              {tariffs.map((t: Tariff) => (
                <option key={t.id} value={t.id} className="bg-[#181920] text-white">{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
              Adresse Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input 
                name="email" 
                type="email" 
                defaultValue={editingCustomer?.email} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all" 
                placeholder="client@nigelec.ne"
                required 
              />
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
              Numéro de Téléphone (SMS Jeton) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input 
                name="phone" 
                defaultValue={editingCustomer?.phone} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm font-mono focus:border-brand outline-none transition-all" 
                placeholder="+227 90 XX XX XX"
                required 
              />
              <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Adresse physique & Région */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} /> Adresse & Rattachement Régional
        </h4>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Adresse Complète Domicile</label>
          <textarea 
            name="address" 
            defaultValue={editingCustomer?.address} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm h-20 focus:border-brand outline-none transition-all" 
            placeholder="Ex: Rue YN-45, Porte 12, Yantala Haut, Niamey"
            required 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Zone Régionale NIGELEC</label>
            <select 
              name="regionId" 
              defaultValue={editingCustomer?.regionId || ''} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all"
            >
              <option value="" className="bg-[#181920] text-gray-400">Non assignée</option>
              {regions.map(r => (
                <option key={r.id} value={r.id} className="bg-[#181920] text-white">{r.areaName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Quartier / Secteur</label>
            <input 
              name="address_area" 
              defaultValue={editingCustomer?.address?.split(',')[0]} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all" 
              placeholder="Ex: Yantala / Plateau" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Dossier & Statut */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Folder size={14} /> Dossier & Statut du Compte
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Numéro de Dossier Client</label>
            <input 
              name="file_number" 
              defaultValue={editingCustomer?.id ? `DOS-${editingCustomer.id}` : ''} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-brand font-mono font-bold text-sm focus:border-brand outline-none transition-all" 
              placeholder="Ex: DOS-CUST-9821" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Statut du Compte</label>
            <select 
              name="status" 
              defaultValue={editingCustomer?.status || 'active'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none transition-all"
            >
              <option value="active" className="bg-[#181920] text-emerald-400">Actif (Alimenté)</option>
              <option value="inactive" className="bg-[#181920] text-amber-400">Inactif</option>
              <option value="suspended" className="bg-[#181920] text-red-400">Suspendu (Impayé / Contentieux)</option>
            </select>
          </div>
        </div>
      </div>

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
          {editingCustomer ? "Enregistrer les modifications" : "Créer la Fiche Client"}
        </button>
      </div>
    </form>
  </Modal>
);
