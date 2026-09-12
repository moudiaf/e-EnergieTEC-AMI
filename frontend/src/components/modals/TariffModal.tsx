import React from 'react';
import { Modal } from '../Modal';
import { Tariff, TariffTier } from '../../types';
import { Plus, Trash2, Tag, Percent } from 'lucide-react';

interface TariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTariff: Tariff | null;
  editingTiers: TariffTier[];
  setEditingTiers: (tiers: TariffTier[]) => void;
  handleSaveTariff: (e: React.FormEvent) => void;
}

export const TariffModal: React.FC<TariffModalProps> = ({
  isOpen,
  onClose,
  editingTariff,
  editingTiers,
  setEditingTiers,
  handleSaveTariff
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingTariff ? "Modifier la Grille Tarifaire NIGELEC" : "Créer une Nouvelle Grille Tarifaire"}>
    <form onSubmit={handleSaveTariff} className="space-y-6">
      
      {/* SECTION 1: Paramètres Généraux */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <Tag size={14} /> Nom du Segment & Taux Réglementaire
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              Nom du Segment <span className="text-red-400">*</span>
            </label>
            <input 
              name="name" 
              defaultValue={editingTariff?.name} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none" 
              placeholder="Ex: Domestique BT (BT-D)" 
              required 
              readOnly={!!editingTariff} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">
              Taux Moyen / Référence (FCFA/kWh) <span className="text-red-400">*</span>
            </label>
            <input 
              name="rate" 
              type="number" 
              step="0.01" 
              defaultValue={editingTariff?.rate} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:border-brand outline-none" 
              placeholder="Ex: 75.00" 
              required 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Frais Mensuel Fixe (FCFA)</label>
            <input 
              name="fixedMonthlyFee" 
              type="number" 
              step="0.01" 
              defaultValue={editingTariff?.fixedMonthlyFee} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:border-brand outline-none" 
              placeholder="Ex: 500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Taux TVA Standard (%)</label>
            <input 
              name="taxRate" 
              type="number" 
              step="0.1" 
              defaultValue={editingTariff?.taxRate || 19} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:border-brand outline-none" 
              placeholder="19" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1.5">Description Réglementaire</label>
          <textarea 
            name="description" 
            defaultValue={editingTariff?.description} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm h-20 focus:border-brand outline-none" 
            placeholder="Grille tarifaire officielle arrêtée par l'ARSE..." 
          />
        </div>
      </div>

      {/* SECTION 2: TOU Option */}
      <div className="flex items-center gap-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
        <input
          type="checkbox"
          defaultChecked={editingTariff?.isTou || false}
          name="isTou"
          className="w-5 h-5 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500 bg-black/40 cursor-pointer"
        />
        <div>
          <p className="text-xs font-black text-purple-300 uppercase tracking-wider">Activer le Moteur Horaires Pleines / Creuses (ToU)</p>
          <p className="text-[10px] text-purple-200/70 font-medium">Applique une différenciation tarifaire dynamique selon la plage horaire du compteur DLMS.</p>
        </div>
      </div>

      {/* SECTION 3: Paliers de Facturation */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs text-amber-400 font-black uppercase tracking-widest flex items-center gap-2">
            <Percent size={14} /> Paliers & Tranches de Consommation Progressive
          </label>
          <button 
            type="button" 
            onClick={() => setEditingTiers([...editingTiers, { id: Math.random().toString(), minKwh: 0, maxKwh: null, rate: 0, primeFixe: 0, taxeHabitat: 0, redevance: 250 }])} 
            className="text-brand hover:text-amber-400 text-xs font-bold uppercase flex items-center gap-1 bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-lg border border-brand/30 transition-all"
          >
            <Plus size={14} /> Ajouter une tranche
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {editingTiers.map((tier, index) => (
            <div key={tier.id} className="p-4 border border-white/15 rounded-xl space-y-3 relative bg-[#181920]">
              <button 
                type="button" 
                onClick={() => setEditingTiers(editingTiers.filter(t => t.id !== tier.id))} 
                className="absolute top-3 right-3 text-gray-400 hover:text-red-400 transition-colors p-1"
                title="Supprimer la tranche"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-300 font-bold uppercase mb-1">Seuil Min (kWh)</label>
                  <input 
                    type="number" 
                    value={tier.minKwh} 
                    onChange={(e) => {
                      const newTiers = [...editingTiers];
                      newTiers[index].minKwh = parseFloat(e.target.value) || 0;
                      setEditingTiers(newTiers);
                    }} 
                    className="w-full bg-[#121318] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 font-bold uppercase mb-1">Seuil Max (kWh)</label>
                  <input 
                    type="number" 
                    value={tier.maxKwh === null ? '' : tier.maxKwh} 
                    onChange={(e) => {
                      const newTiers = [...editingTiers];
                      newTiers[index].maxKwh = e.target.value === '' ? null : parseFloat(e.target.value);
                      setEditingTiers(newTiers);
                    }} 
                    placeholder="Illimité (∞)" 
                    className="w-full bg-[#121318] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-brand font-bold uppercase mb-1">Tarif (FCFA/kWh)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={tier.rate} 
                    onChange={(e) => {
                      const newTiers = [...editingTiers];
                      newTiers[index].rate = parseFloat(e.target.value) || 0;
                      setEditingTiers(newTiers);
                    }} 
                    className="w-full bg-[#121318] border border-brand/40 rounded-lg px-3 py-1.5 text-white text-sm font-mono font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-300 font-bold uppercase mb-1">Prime Fixe (FCFA)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={tier.primeFixe} 
                    onChange={(e) => {
                      const newTiers = [...editingTiers];
                      newTiers[index].primeFixe = parseFloat(e.target.value) || 0;
                      setEditingTiers(newTiers);
                    }} 
                    className="w-full bg-[#121318] border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-red-300 font-bold uppercase mb-1">TVA (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={tier.vatRate} 
                    onChange={(e) => {
                      const newTiers = [...editingTiers];
                      newTiers[index].vatRate = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setEditingTiers(newTiers);
                    }} 
                    placeholder={(editingTariff?.taxRate || 19).toString()} 
                    className="w-full bg-[#121318] border border-red-500/30 rounded-lg px-3 py-1.5 text-white text-sm font-mono" 
                  />
                </div>
              </div>
            </div>
          ))}

          {editingTiers.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/15 rounded-xl text-gray-400 text-xs font-bold uppercase tracking-widest italic">
              Tarification monôme par défaut (Sans tranches progressives)
            </div>
          )}
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
          {editingTariff ? "Enregistrer les modifications" : "Créer la Grille Tarifaire"}
        </button>
      </div>
    </form>
  </Modal>
);
