import React from 'react';
import { Layers, Activity, Cpu, MapPin, Zap, ShieldAlert } from 'lucide-react';
import { Modal } from '../Modal';
import { Meter, Customer, Tariff } from '../../types';

interface MeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMeter: Meter | null;
  customers: Customer[];
  tariffs: Tariff[];
  meters: Meter[];
  handleSaveMeter: (e: React.FormEvent) => void;
}

export const MeterModal: React.FC<MeterModalProps> = ({
  isOpen,
  onClose,
  editingMeter,
  customers,
  tariffs,
  meters,
  handleSaveMeter
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingMeter ? "Modifier le Compteur" : "Ajouter un Nouveau Compteur"}>
    <form onSubmit={handleSaveMeter} className="space-y-6">
      
      {/* SECTION 1: Informations Générales */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <Cpu size={14} /> Informations Compteur & Client
        </h4>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
            ID / Numéro de Compteur <span className="text-red-400">*</span>
          </label>
          <input 
            name="id" 
            defaultValue={editingMeter?.id} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
            placeholder="Ex: 0128244416904 ou 541-XXX-XXX" 
            required={!editingMeter} 
            readOnly={!!editingMeter} 
          />
          <p className="text-[10px] text-gray-400 mt-1">Identifiant unique gravé sur le capot physique du compteur.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
            Abonné / Client Assigné <span className="text-red-400">*</span>
          </label>
          <select 
            name="customerId" 
            defaultValue={editingMeter?.customerId} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
            required
          >
            <option value="" className="bg-[#181920] text-gray-400">-- Sélectionner un abonné NIGELEC --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id} className="bg-[#181920] text-white">
                {c.name} ({c.id}) — {c.region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">
            Adresse / Localisation d'Installation <span className="text-red-400">*</span>
          </label>
          <input 
            name="location" 
            defaultValue={editingMeter?.location} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
            placeholder="Ex: Niamey, Quartier Nouveau Marché, Rue NM-14"
            required 
          />
        </div>
      </div>

      {/* SECTION 2: Spécifications Électriques */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} /> Caractéristiques Électriques & Raccordement
        </h4>

        <div>
          <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Grille Tarifaire NIGELEC</label>
          <select 
            name="type" 
            defaultValue={editingMeter?.type || 'domestic'} 
            className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
          >
            {tariffs.map(t => (
              <option key={t.id} value={t.id} className="bg-[#181920] text-white">{t.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Puissance Souscrite (kW)</label>
            <input 
              name="subscribedPower" 
              type="number" 
              step="0.1" 
              defaultValue={editingMeter?.subscribedPower || 9.0} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Type de Phase</label>
            <select 
              name="phaseType" 
              defaultValue={editingMeter?.phaseType || 'monophase'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
            >
              <option value="monophase" className="bg-[#181920] text-white">Monophasé (1φ — 230V)</option>
              <option value="triphase" className="bg-[#181920] text-white">Triphasé (3φ — 400V)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Mode de Paiement</label>
            <select 
              name="paymentMode" 
              defaultValue={editingMeter?.paymentMode || 'prepaid'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
            >
              <option value="prepaid" className="bg-[#181920] text-white">Prépayé (STS 20-digits)</option>
              <option value="postpaid" className="bg-[#181920] text-white">Postpayé (Facturation Mensuelle)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Protocole HES</label>
            <select 
              name="protocol" 
              defaultValue={editingMeter?.protocol || 'DLMS/COSEM'} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
            >
              <option value="DLMS/COSEM" className="bg-[#181920] text-white">DLMS / COSEM (TCP 4059)</option>
              <option value="LoRaWAN" className="bg-[#181920] text-white">LoRaWAN RF</option>
              <option value="PLC" className="bg-[#181920] text-white">PLC / G3-PLC</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Solde Crédit Actuel (kWh)</label>
            <input 
              name="credit" 
              type="number" 
              step="0.01" 
              defaultValue={editingMeter?.credit ?? 0} 
              className="w-full bg-[#181920] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-emerald-400 font-mono text-sm focus:border-emerald-400 outline-none transition-all font-bold" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cyan-400 uppercase mb-1.5">Énergie Consommée Totale (kWh)</label>
            <input 
              name="totalConsumption" 
              type="number" 
              step="0.01" 
              defaultValue={editingMeter?.totalConsumption ?? 0} 
              className="w-full bg-[#181920] border border-cyan-500/30 rounded-xl px-4 py-2.5 text-cyan-300 font-mono text-sm focus:border-cyan-400 outline-none transition-all font-bold" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Coordonnées Cartographiques SIG */}
      <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-4">
        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} /> Cartographie & Géolocalisation SIG
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Latitude (Nord)</label>
            <input 
              name="latitude" 
              type="number" 
              step="0.000001" 
              defaultValue={editingMeter?.latitude || 13.512} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
              placeholder="Ex: 13.512000" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Longitude (Est)</label>
            <input 
              name="longitude" 
              type="number" 
              step="0.000001" 
              defaultValue={editingMeter?.longitude || 2.125} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all" 
              placeholder="Ex: 2.125000" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Traçabilité & Lot de Production */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-4">
        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <Layers size={14} /> Traçabilité Industrielle (Lots NIGELEC)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">
              Lot d'Arrivage / Batch
            </label>
            <input 
              name="batchId" 
              list="existing-batches"
              defaultValue={editingMeter?.batchId || 'BATCH-2026-NIG-01'} 
              className="w-full bg-[#141d2e] border border-blue-500/30 rounded-xl px-4 py-2.5 text-blue-300 font-bold text-sm focus:border-blue-400 outline-none transition-all" 
              placeholder="Ex: BATCH-2026-NIG-01" 
            />
            <datalist id="existing-batches">
              {Array.from(new Set(meters.map(m => m.batchId).filter(Boolean))).map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {editingMeter?.batchId && (
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase">
                <Activity size={10} /> {meters.filter(m => m.batchId === editingMeter.batchId).length} compteurs associés dans ce lot
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">
              Date d'Intégration NIGELEC
            </label>
            <input 
              name="registeredAt" 
              type="date" 
              defaultValue={editingMeter?.registeredAt ? editingMeter.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0]} 
              className="w-full bg-[#141d2e] border border-blue-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-400 outline-none transition-all" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Options Avancées Smart Grid */}
      <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl space-y-4">
        <h4 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} /> Options Avancées (Smart Grid & IA)
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#181920] border border-white/10 cursor-pointer hover:border-brand/50 transition-all">
            <input 
              type="checkbox" 
              name="touEnabled" 
              defaultChecked={editingMeter?.touEnabled} 
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-brand focus:ring-brand" 
            />
            <span className="text-xs font-bold text-white uppercase">Activer TOU (Tarif Horaires)</span>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#181920] border border-white/10 cursor-pointer hover:border-green-500/50 transition-all">
            <input 
              type="checkbox" 
              name="isSolar" 
              defaultChecked={(editingMeter?.solarInjection || 0) > 0} 
              className="w-4 h-4 rounded border-white/20 bg-black/40 text-green-500 focus:ring-green-500" 
            />
            <span className="text-xs font-bold text-green-400 uppercase">Micro-Solaire Autonome</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Injection Solaire (kWh)</label>
            <input 
              name="solarInjection" 
              type="number" 
              step="0.1" 
              defaultValue={editingMeter?.solarInjection || 0} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-200 uppercase mb-1.5">Score Fraude ML IA (%)</label>
            <input 
              name="mlFraudScore" 
              type="number" 
              step="1" 
              max="100" 
              defaultValue={(editingMeter?.mlFraudScore || 0) * 100} 
              className="w-full bg-[#181920] border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none" 
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTION STICKY */}
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
          {editingMeter ? "Enregistrer les modifications" : "Créer le Compteur"}
        </button>
      </div>
    </form>
  </Modal>
);
