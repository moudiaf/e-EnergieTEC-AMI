import React from 'react';
import { Modal } from '../Modal';
import { Tariff, TariffTier } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

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
  <Modal isOpen={isOpen} onClose={onClose} title={editingTariff ? "Modifier le Tarif" : "Nouveau Tarif"}>
    <form onSubmit={handleSaveTariff} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Nom du Segment</label>
        <input name="name" defaultValue={editingTariff?.name} className="input-field w-full" placeholder="Ex: Domestique" required readOnly={!!editingTariff} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Taux (FCFA/kWh)</label>
        <input name="rate" type="number" step="0.01" defaultValue={editingTariff?.rate} className="input-field w-full" placeholder="75" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Frais Mensuel Fixe (FCFA)</label>
          <input name="fixedMonthlyFee" type="number" step="0.01" defaultValue={editingTariff?.fixedMonthlyFee} className="input-field w-full" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Taux TVA Standard (%)</label>
          <input name="taxRate" type="number" step="0.1" defaultValue={editingTariff?.taxRate || 19} className="input-field w-full" placeholder="19" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Description</label>
        <textarea name="description" defaultValue={editingTariff?.description} className="input-field w-full h-24" placeholder="Description du tarif..." />
      </div>
      <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-6">
        <input
          type="checkbox"
          checked={editingTariff?.isTou || false}
          name="isTou"
          className="w-5 h-5 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500 bg-black/40"
        />
        <div>
          <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Activer Time-of-Use (ToU)</p>
          <p className="text-[10px] text-purple-300/60 font-medium">Applique des tarifs variables selon l'heure de la journée</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-gray-400 uppercase tracking-widest font-black">Structure de Facturation</label>
          <button type="button" onClick={() => setEditingTiers([...editingTiers, { id: Math.random().toString(), minKwh: 0, maxKwh: null, rate: 0, primeFixe: 0, taxeHabitat: 0, redevance: 250 }])} className="text-brand hover:text-brand-light text-[10px] font-black uppercase flex items-center gap-1">
            <Plus size={14} /> Ajouter un palier
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {editingTiers.map((tier, index) => (
            <div key={tier.id} className="p-4 border border-white/5 rounded-2xl space-y-4 relative bg-white/[0.02] group hover:bg-white/[0.04] transition-all">
              <button type="button" onClick={() => setEditingTiers(editingTiers.filter(t => t.id !== tier.id))} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase mb-1">Seuil Min (kWh)</label>
                  <input type="number" value={tier.minKwh} onChange={(e) => {
                    const newTiers = [...editingTiers];
                    newTiers[index].minKwh = parseFloat(e.target.value) || 0;
                    setEditingTiers(newTiers);
                  }} className="input-field w-full text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase mb-1">Seuil Max (kWh)</label>
                  <input type="number" value={tier.maxKwh === null ? '' : tier.maxKwh} onChange={(e) => {
                    const newTiers = [...editingTiers];
                    newTiers[index].maxKwh = e.target.value === '' ? null : parseFloat(e.target.value);
                    setEditingTiers(newTiers);
                  }} placeholder="∞" className="input-field w-full text-sm font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] text-brand font-black uppercase mb-1">Tarif Énergie (F/kWh)</label>
                  <input type="number" step="0.01" value={tier.rate} onChange={(e) => {
                    const newTiers = [...editingTiers];
                    newTiers[index].rate = parseFloat(e.target.value) || 0;
                    setEditingTiers(newTiers);
                  }} className="input-field w-full text-sm font-mono border-brand/20" />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase mb-1">Prime Fixe (FCFA)</label>
                  <input type="number" step="0.01" value={tier.primeFixe} onChange={(e) => {
                    const newTiers = [...editingTiers];
                    newTiers[index].primeFixe = parseFloat(e.target.value) || 0;
                    setEditingTiers(newTiers);
                  }} className="input-field w-full text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] text-red-400 font-black uppercase mb-1">TVA Spécifique (%)</label>
                  <input type="number" step="0.1" value={tier.vatRate} onChange={(e) => {
                    const newTiers = [...editingTiers];
                    newTiers[index].vatRate = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    setEditingTiers(newTiers);
                  }} placeholder={(editingTariff?.taxRate || 19).toString()} className="input-field w-full text-sm font-mono border-red-500/20" />
                </div>
              </div>
            </div>
          ))}
          {editingTiers.length === 0 && (
            <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl text-gray-500 text-[10px] font-black uppercase tracking-widest italic">
              Configuration monôme par défaut
            </div>
          )}
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-3 mt-4">Sauvegarder</button>
    </form>
  </Modal>
);
