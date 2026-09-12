import React from 'react';
import { Modal } from '../Modal';
import { Region } from '../../types';
import { MapPin, User as UserIcon, Phone, Mail, ChevronDown, Shield } from 'lucide-react';

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRegion: Region | null;
  regions: Region[];
  handleSaveRegion: (e: React.FormEvent) => void;
}

const NIGER_REGIONS = [
  "Agadez",
  "Diffa",
  "Dosso",
  "Maradi",
  "Niamey",
  "Tahoua",
  "Tillabéri",
  "Zinder"
];

export const RegionModal: React.FC<RegionModalProps> = ({
  isOpen,
  onClose,
  editingRegion,
  regions,
  handleSaveRegion
}) => {
  const [blazon, setBlazon] = React.useState<string | undefined>(editingRegion?.blazon);

  React.useEffect(() => {
    setBlazon(editingRegion?.blazon);
  }, [editingRegion]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlazon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRegion ? "Modifier la Région NIGELEC" : "Ajouter une Nouvelle Région Opérationnelle"}>
      <form onSubmit={handleSaveRegion} className="space-y-6">
        
        {/* Banner Logo */}
        <div className="flex items-center gap-6 bg-brand/10 border border-brand/20 p-4 rounded-2xl">
          <div className="relative group w-16 h-16 bg-[#181920] rounded-xl border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
            {blazon ? (
              <img src={blazon} alt="Blazon" className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-400 text-[10px] text-center font-bold px-1 uppercase">Blason / Logo</div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImageChange}
            />
            <input type="hidden" name="blazon" value={blazon || ''} />
          </div>
          <div>
            <p className="text-xs font-black text-brand uppercase tracking-widest mb-1">Configuration Territoriale Niger</p>
            <p className="text-xs text-gray-300">Définissez la subdivision administrative et les coordonnées du pôle régional.</p>
          </div>
        </div>

        {/* SECTION 1: Localisation Administrative */}
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
            <MapPin size={14} /> Localisation & Région Supérieure
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                Région Administrative <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select 
                  name="areaName" 
                  defaultValue={editingRegion?.areaName || ''} 
                  className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-[#181920] text-gray-400">Sélectionner une région...</option>
                  {NIGER_REGIONS.map(reg => (
                    <option key={reg} value={reg} className="bg-[#181920] text-white">{reg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
                Région Supérieure
              </label>
              <div className="relative">
                <select 
                  name="superiorRegionId" 
                  defaultValue={editingRegion?.superiorRegionId || ''} 
                  className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#181920] text-gray-300">Catégorie Nationale (Siège)</option>
                  {regions.filter(r => r.id !== editingRegion?.id).map(r => (
                    <option key={r.id} value={r.id} className="bg-[#181920] text-white">{r.areaName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Zone Spécifique / District</label>
              <input 
                name="districtName" 
                defaultValue={editingRegion?.areaName} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
                placeholder="Ex: Niamey Plateau" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Priorité d'Affichage (1-10)</label>
              <input 
                name="label" 
                type="number" 
                min="1" 
                max="10" 
                defaultValue={editingRegion?.label || 10} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
                required 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Responsables & Contact */}
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <UserIcon size={14} /> Responsable Régional & Contacts NIGELEC
          </h4>
          
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              Directeur / Responsable de Zone <span className="text-red-400">*</span>
            </label>
            <input 
              name="principal" 
              defaultValue={editingRegion?.principal} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
              placeholder="Ex: M. Oumarou Sanda (Directeur Régional)" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
                Contact d'Urgence Phone <span className="text-red-400">*</span>
              </label>
              <input 
                name="contact" 
                defaultValue={editingRegion?.contact} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
                placeholder="+227 20 73 XX XX" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
                Email Officiel <span className="text-red-400">*</span>
              </label>
              <input 
                name="email" 
                type="email" 
                defaultValue={editingRegion?.email} 
                className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
                placeholder="dr.niamey@nigelec.ne" 
                required 
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Statut Opérationnel */}
        <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 space-y-3">
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider">Statut Opérationnel du HUB Régional</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="status" 
                value="enabled" 
                defaultChecked={editingRegion?.status !== 'disabled'} 
                className="w-4 h-4 text-emerald-500 bg-black/40 border-white/20 focus:ring-emerald-500" 
              />
              <span className="text-xs font-bold text-emerald-400">Actif (Réseau Connecté)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="status" 
                value="disabled" 
                defaultChecked={editingRegion?.status === 'disabled'} 
                className="w-4 h-4 text-red-500 bg-black/40 border-white/20 focus:ring-red-500" 
              />
              <span className="text-xs font-bold text-red-400">Maintenance / Suspendu</span>
            </label>
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
            {editingRegion ? "Enregistrer les modifications" : "Confirmer la Région"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
