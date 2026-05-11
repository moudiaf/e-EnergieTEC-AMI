import React from 'react';
import { Modal } from '../Modal';
import { DCU, Region } from '../../types';

interface DcuModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDcu: DCU | null;
  regions: Region[];
  handleSaveDcu: (e: React.FormEvent) => void;
}

export const DcuModal: React.FC<DcuModalProps> = ({
  isOpen,
  onClose,
  editingDcu,
  regions,
  handleSaveDcu
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingDcu ? "Modifier le DCU" : "Nouveau DCU"}>
    <form onSubmit={handleSaveDcu} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">ID Technique</label>
          <input name="id" defaultValue={editingDcu?.id} placeholder="Ex: DCU-Nord-05" className="input-field w-full" disabled={!!editingDcu} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Nom Usuel</label>
          <input name="name" defaultValue={editingDcu?.name} placeholder="Nom" className="input-field w-full" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Adresse IP</label>
          <input name="ipAddress" defaultValue={editingDcu?.ipAddress} placeholder="10.0.1.X" className="input-field w-full" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">MAC Address</label>
          <input name="macAddress" defaultValue={editingDcu?.macAddress} placeholder="00:00:00:00:00:00" className="input-field w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Firmware</label>
          <input name="firmware" defaultValue={editingDcu?.firmware || 'v1.0'} className="input-field w-full" />
        </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Type de Modem</label>
          <select name="modemType" defaultValue={editingDcu?.modemType || 'GPRS'} className="input-field w-full bg-transparent">
            <option value="GPRS" className="bg-bg-dark">GPRS</option>
            <option value="3G" className="bg-bg-dark">3G</option>
            <option value="4G" className="bg-bg-dark">4G</option>
            <option value="LTE-M" className="bg-bg-dark">LTE-M</option>
            <option value="Ethernet" className="bg-bg-dark">Ethernet</option>
            <option value="PLC-G3" className="bg-bg-dark">PLC-G3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Force du Signal (0-100)</label>
          <input name="signalStrength" type="number" defaultValue={editingDcu?.signalStrength || 80} className="input-field w-full" />
        </div>
      </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Latitude</label>
            <input name="latitude" type="number" step="0.000001" defaultValue={editingDcu?.latitude} placeholder="Ex: 13.52" className="input-field w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Longitude</label>
            <input name="longitude" type="number" step="0.000001" defaultValue={editingDcu?.longitude} placeholder="Ex: 2.11" className="input-field w-full font-mono" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Statut</label>
          <select name="status" defaultValue={editingDcu?.status || 'active'} className="input-field w-full bg-transparent">
            <option value="active" className="bg-bg-dark">Actif</option>
            <option value="offline" className="bg-bg-dark">Hors Ligne</option>
            <option value="error" className="bg-bg-dark">Erreur</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Région Assignée</label>
        <select name="regionId" defaultValue={editingDcu?.regionId || ''} className="input-field w-full bg-transparent">
          <option value="" className="bg-bg-dark">-- Sélectionner --</option>
          {regions.map(r => (
            <option key={r.id} value={r.id} className="bg-bg-dark">{r.areaName}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all">Annuler</button>
        <button type="submit" className="flex-1 btn-primary h-12 rounded-xl font-bold shadow-lg shadow-brand/20">Sauvegarder</button>
      </div>
    </form>
  </Modal>
);
