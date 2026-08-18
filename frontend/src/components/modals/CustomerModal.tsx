import React from 'react';
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
  <Modal isOpen={isOpen} onClose={onClose} title={editingCustomer ? "Modifier Client" : "Nouveau Client"}>
    <form onSubmit={handleSaveCustomer} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Nom Complet</label>
          <input name="name" defaultValue={editingCustomer?.name} className="input-field w-full" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Type</label>
          <select name="type" defaultValue={editingCustomer?.type || 'domestic'} className="input-field w-full bg-transparent">
            {tariffs.map((t: Tariff) => (
              <option key={t.id} value={t.id} className="bg-bg-dark">{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Email</label>
        <input name="email" type="email" defaultValue={editingCustomer?.email} className="input-field w-full" required />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Téléphone</label>
        <input name="phone" defaultValue={editingCustomer?.phone} className="input-field w-full" required />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Adresse</label>
        <textarea name="address" defaultValue={editingCustomer?.address} className="input-field w-full h-20" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Zone / Agence</label>
          <select name="regionId" defaultValue={editingCustomer?.regionId || ''} className="input-field w-full bg-transparent">
            <option value="" className="bg-bg-dark">Non assignée</option>
            {regions.map(r => (
              <option key={r.id} value={r.id} className="bg-bg-dark">{r.areaName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Quartier / Secteur</label>
          <input name="address_area" defaultValue={editingCustomer?.address?.split(',')[0]} className="input-field w-full" placeholder="Ex: Yantala" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Numéro de Dossier</label>
          <input name="file_number" defaultValue={editingCustomer?.id ? `DOS-${editingCustomer.id}` : ''} className="input-field w-full font-mono text-brand" placeholder="DOS-XXXX-2026" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Statut du Compte</label>
          <select name="status" defaultValue={editingCustomer?.status || 'active'} className="input-field w-full bg-transparent">
            <option value="active" className="bg-bg-dark">Actif</option>
            <option value="inactive" className="bg-bg-dark">Inactif</option>
            <option value="suspended" className="bg-bg-dark">Suspendu</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-3 mt-4">Enregistrer</button>
    </form>
  </Modal>
);
