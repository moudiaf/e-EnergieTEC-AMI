import React from 'react';
import { Modal } from '../Modal';
import { Region } from '../../types';
import { MapPin, User as UserIcon, Phone, Mail, ChevronDown } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={onClose} title={editingRegion ? "Modifier la Région NIGELEC" : "Nouvelle Région Opérationnelle"}>
      <form onSubmit={handleSaveRegion} className="space-y-6">
        <div className="flex items-center gap-6 bg-brand/5 border border-brand/20 p-4 rounded-2xl mb-4">
          <div className="relative group w-16 h-16 bg-black/40 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {blazon ? (
              <img src={blazon} alt="Blazon" className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-500 text-[10px] text-center font-bold px-1 uppercase">Blason / Logo</div>
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
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">Configuration Territoriale Niger</p>
            <p className="text-xs text-gray-400">Définissez une nouvelle subdivision administrative pour le déploiement du réseau AMI.</p>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <MapPin size={12} className="text-brand" />
            Région Administrative
          </label>
          <div className="relative">
            <select 
              name="areaName" 
              defaultValue={editingRegion?.areaName || ''} 
              className="input-field w-full appearance-none pr-10"
              required
            >
              <option value="" disabled>Sélectionner une région...</option>
              {NIGER_REGIONS.map(reg => (
                <option key={reg} value={reg} className="bg-bg-dark">{reg}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ChevronDown size={12} className="text-brand" />
            Région Supérieure
          </label>
          <div className="relative">
            <select 
              name="superiorRegionId" 
              defaultValue={editingRegion?.superiorRegionId || ''} 
              className="input-field w-full appearance-none pr-10"
            >
              <option value="" className="bg-bg-dark">Catégorie Nationale (Siège)</option>
              {regions.filter(r => r.id !== editingRegion?.id).map(r => (
                <option key={r.id} value={r.id} className="bg-bg-dark">{r.areaName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Zone Spécifique / District</label>
          <input name="districtName" defaultValue={editingRegion?.areaName} className="input-field w-full" placeholder="Ex: Niamey Plateau" />
          <p className="text-[8px] text-gray-600 mt-1 uppercase italic">Optionnel: Pour subdiviser une région</p>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Priorité d'Affichage (1-10)</label>
          <input name="label" type="number" min="1" max="10" defaultValue={editingRegion?.label || 10} className="input-field w-full" required />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-2">Coordination Régionale</h4>
        
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <UserIcon size={12} className="text-brand" />
            Responsable de Zone
          </label>
          <input name="principal" defaultValue={editingRegion?.principal} className="input-field w-full" placeholder="Ex: Directeur Régional NIGELEC" required />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Phone size={12} className="text-brand" />
              Contact d'Urgence
            </label>
            <input name="contact" defaultValue={editingRegion?.contact} className="input-field w-full" placeholder="+227 -- -- -- --" required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Mail size={12} className="text-brand" />
              Email Officiel
            </label>
            <input name="email" type="email" defaultValue={editingRegion?.email} className="input-field w-full" placeholder="region@nigelec.ne" required />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Statut Opérationnel du HUB</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="radio" name="status" value="enabled" defaultChecked={editingRegion?.status !== 'disabled'} className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-full checked:border-brand transition-all" />
              <div className="absolute w-2.5 h-2.5 bg-brand rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Actif</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="radio" name="status" value="disabled" defaultChecked={editingRegion?.status === 'disabled'} className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-full checked:border-red-500 transition-all" />
              <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">Maintenance / Suspendu</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onClose} className="flex-1 h-14 rounded-2xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest">Annuler</button>
        <button type="submit" className="flex-1 btn-primary h-14 rounded-2xl font-black shadow-[0_10px_30px_rgba(255,107,53,0.3)] uppercase text-[10px] tracking-widest">Confirmer la Région</button>
      </div>
    </form>
  </Modal>
  );
};
