import React from 'react';
import { Modal } from '../Modal';
import { DCU, Region } from '../../types';
import { Server, Wifi, MapPin, Cpu } from 'lucide-react';

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
  <Modal isOpen={isOpen} onClose={onClose} title={editingDcu ? "Modifier le Concentrateur DCU" : "Ajouter un NOUVEAU Concentrateur DCU"}>
    <form onSubmit={handleSaveDcu} className="space-y-6">
      
      {/* SECTION 1: Identité Technique */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <Server size={14} /> Identité & Nom Technique
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">ID Technique DCU</label>
            <input 
              name="id" 
              defaultValue={editingDcu?.id} 
              placeholder="Ex: DCU-NIG-05" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
              disabled={!!editingDcu} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              Nom / Libellé Poste <span className="text-red-400">*</span>
            </label>
            <input 
              name="name" 
              defaultValue={editingDcu?.name} 
              placeholder="Ex: Concentrateur Niamey Nord" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Adresse IP HES</label>
            <input 
              name="ipAddress" 
              defaultValue={editingDcu?.ipAddress} 
              placeholder="10.0.1.X" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Adresse MAC</label>
            <input 
              name="macAddress" 
              defaultValue={editingDcu?.macAddress} 
              placeholder="00:1A:2B:3C:4D:5E" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Télécommunication & Hardware */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Wifi size={14} /> Réseau GSM, Modem & Firmware
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Type de Modem</label>
            <select 
              name="modemType" 
              defaultValue={editingDcu?.modemType || 'GPRS'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
            >
              <option value="GPRS" className="bg-[#181920] text-white">GPRS / GSM</option>
              <option value="3G" className="bg-[#181920] text-white">3G HSPA</option>
              <option value="4G" className="bg-[#181920] text-white">4G LTE Cellular</option>
              <option value="LTE-M" className="bg-[#181920] text-white">LTE-M / NB-IoT</option>
              <option value="Ethernet" className="bg-[#181920] text-white">Ethernet Filaire</option>
              <option value="PLC-G3" className="bg-[#181920] text-white">PLC-G3 Courant Porteur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Version Firmware</label>
            <input 
              name="firmware" 
              defaultValue={editingDcu?.firmware || 'v1.0.4'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Force du Signal (0 - 100%)</label>
            <input 
              name="signalStrength" 
              type="number" 
              defaultValue={editingDcu?.signalStrength || 85} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Statut Opérationnel</label>
            <select 
              name="status" 
              defaultValue={editingDcu?.status || 'active'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
            >
              <option value="active" className="bg-[#181920] text-emerald-400">Actif (Connecté HES)</option>
              <option value="offline" className="bg-[#181920] text-amber-400">Hors Ligne</option>
              <option value="error" className="bg-[#181920] text-red-400">En Erreur / Alarme</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Localisation & Région */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} /> Géolocalisation & Région NIGELEC
        </h4>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Région NIGELEC Rattachée</label>
          <select 
            name="regionId" 
            defaultValue={editingDcu?.regionId || ''} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
          >
            <option value="" className="bg-[#181920] text-gray-400">-- Sélectionner une région --</option>
            {regions.map(r => (
              <option key={r.id} value={r.id} className="bg-[#181920] text-white">{r.areaName}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Latitude (N)</label>
            <input 
              name="latitude" 
              type="number" 
              step="0.000001" 
              defaultValue={editingDcu?.latitude} 
              placeholder="Ex: 13.520000" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Longitude (E)</label>
            <input 
              name="longitude" 
              type="number" 
              step="0.000001" 
              defaultValue={editingDcu?.longitude} 
              placeholder="Ex: 2.110000" 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
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
          {editingDcu ? "Enregistrer les modifications" : "Enregistrer le DCU"}
        </button>
      </div>
    </form>
  </Modal>
);
