import React from 'react';
import { Modal } from '../Modal';
import { Meter, Customer, Tariff } from '../../types';

interface MeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMeter: Meter | null;
  customers: Customer[];
  tariffs: Tariff[];
  handleSaveMeter: (e: React.FormEvent) => void;
}

export const MeterModal: React.FC<MeterModalProps> = ({
  isOpen,
  onClose,
  editingMeter,
  customers,
  tariffs,
  handleSaveMeter
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingMeter ? "Modifier Compteur" : "Nouveau Compteur"}>
    <form onSubmit={handleSaveMeter} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">ID Compteur</label>
        <input name="id" defaultValue={editingMeter?.id} className="input-field w-full font-mono" placeholder="541-XXX-XXX" required={!editingMeter} readOnly={!!editingMeter} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Client</label>
        <select name="customerId" defaultValue={editingMeter?.customerId} className="input-field w-full bg-transparent" required>
          <option value="" className="bg-bg-dark">Sélectionner un client...</option>
          {customers.map(c => (
            <option key={c.id} value={c.id} className="bg-bg-dark">{c.name} ({c.id})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Localisation</label>
        <input name="location" defaultValue={editingMeter?.location} className="input-field w-full" required />
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Type</label>
        <select name="type" defaultValue={editingMeter?.type || 'domestic'} className="input-field w-full bg-transparent">
          {tariffs.map(t => (
            <option key={t.id} value={t.id} className="bg-bg-dark">{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 uppercase mb-2">Puissance Souscrite (kW)</label>
        <input name="subscribedPower" type="number" step="0.1" defaultValue={editingMeter?.subscribedPower || 9.0} className="input-field w-full" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Mode de Paiement</label>
          <select name="paymentMode" defaultValue={editingMeter?.paymentMode || 'prepaid'} className="input-field w-full bg-transparent">
            <option value="prepaid" className="bg-bg-dark">Prépayé (STS)</option>
            <option value="postpaid" className="bg-bg-dark">Postpayé</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Protocole</label>
          <select name="protocol" defaultValue={editingMeter?.protocol || 'DLMS/COSEM'} className="input-field w-full bg-transparent text-xs">
            <option value="DLMS/COSEM" className="bg-bg-dark">DLMS/COSEM</option>
            <option value="LoRaWAN" className="bg-bg-dark">LoRaWAN</option>
            <option value="PLC" className="bg-bg-dark">PLC/G3</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Latitude (N)</label>
          <input name="latitude" type="number" step="0.000001" defaultValue={editingMeter?.latitude || 13.512} className="input-field w-full font-mono" placeholder="Ex: 13.512" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-2">Longitude (E)</label>
          <input name="longitude" type="number" step="0.000001" defaultValue={editingMeter?.longitude || 2.125} className="input-field w-full font-mono" placeholder="Ex: 2.125" />
        </div>
      </div>

      <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl space-y-4">
        <h5 className="text-[10px] font-black text-brand uppercase tracking-widest">Options Avancées (Smart Grid)</h5>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
          <div className="flex items-center gap-2">
            <input type="checkbox" name="touEnabled" defaultChecked={editingMeter?.touEnabled} className="w-4 h-4 rounded border-white/10 bg-black/40 text-brand focus:ring-brand" />
            <span className="text-[10px] font-bold text-white uppercase">Activer ToU</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isSolar" defaultChecked={(editingMeter?.solarInjection || 0) > 0} className="w-4 h-4 rounded border-white/10 bg-black/40 text-green-500 focus:ring-green-500" />
            <span className="text-[10px] font-bold text-green-500 uppercase">Micro-Solaire</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] text-gray-500 uppercase mb-1">Injection Solaire (kWh)</label>
            <input name="solarInjection" type="number" step="0.1" defaultValue={editingMeter?.solarInjection || 0} className="input-field w-full text-xs font-mono" />
          </div>
          <div>
            <label className="block text-[9px] text-gray-500 uppercase mb-1">Score Fraude ML (%)</label>
            <input name="mlFraudScore" type="number" step="1" max="100" defaultValue={(editingMeter?.mlFraudScore || 0) * 100} className="input-field w-full text-xs font-mono" />
          </div>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-3 mt-4">Enregistrer</button>
    </form>
  </Modal>
);
