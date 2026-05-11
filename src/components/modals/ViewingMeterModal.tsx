import React from 'react';
import { Modal } from '../Modal';
import { Meter, Customer } from '../../types';

interface ViewingMeterModalProps {
  viewingMeter: Meter | null;
  onClose: () => void;
  customers: Customer[];
  setCurrentSection: (section: any) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ViewingMeterModal: React.FC<ViewingMeterModalProps> = ({
  viewingMeter,
  onClose,
  customers,
  setCurrentSection,
  addToast
}) => (
  <Modal isOpen={!!viewingMeter} onClose={onClose} title={`Détails Compteur - ${viewingMeter?.id}`}>
    {viewingMeter && (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Localisation</p>
            <p className="font-bold text-sm">{viewingMeter.location}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Coordonnées GPS</p>
            <p className="font-mono text-[10px] text-brand">{viewingMeter.latitude?.toFixed(6) || 'N/A'}, {viewingMeter.longitude?.toFixed(6) || 'N/A'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 col-span-2">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Client Associé</p>
             <p className="font-bold text-sm cursor-pointer hover:text-brand transition-colors" onClick={() => {
               onClose();
               setCurrentSection('customers');
             }}>{customers.find(c => c.id === viewingMeter.customerId)?.name || viewingMeter.customerId}</p>
           </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tension</p>
            <p className="font-black text-xl text-green-400">{viewingMeter.voltage || 230}V</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Puissance</p>
            <p className="font-black text-xl text-brand">{viewingMeter.power || 0}kW</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Crédit</p>
            <p className="font-black text-xl text-white">{viewingMeter.credit?.toFixed(2)} kWh</p>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Actions Rapides</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                onClose();
                setCurrentSection('map');
              }} 
              className="w-full py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
            >
              Visualiser sur la Carte
            </button>
            <div className="flex gap-2">
              <button onClick={() => addToast('Signal envoyé au compteur', 'info')} className="flex-1 py-3 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-[10px] font-bold transition-all border border-brand/20 uppercase tracking-wider">Ping (Test)</button>
              <button onClick={() => addToast('Relais déconnecté à distance', 'error')} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-red-500/20 uppercase tracking-wider">Coupure Relais</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </Modal>
);
