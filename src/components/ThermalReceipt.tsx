import React from 'react';
import { Token } from '../types';

interface ThermalReceiptProps {
  token: any;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ token }) => (
  <div className="print-only hidden p-8 bg-white text-black font-mono w-[80mm] mx-auto text-sm leading-tight">
    <div className="text-center mb-6 space-y-1">
      <h1 className="text-xl font-bold">NIGELEC - Niger</h1>
      <p className="font-bold">Système e-EnergieTEC</p>
      <div className="border-b border-black border-dashed my-2"></div>
      <p className="text-xs uppercase">Reçu de Recharge STS</p>
      <p className="text-xs">Date: {new Date(token.timestamp).toLocaleString()}</p>
    </div>

    <div className="space-y-1 mb-6 text-xs">
      <div className="flex justify-between">
        <span>Compteur:</span>
        <span className="font-bold">{token.meterId}</span>
      </div>
      <div className="flex justify-between border-t border-black/10 pt-1">
        <span>Montant Versé:</span>
        <span className="font-bold">{token.amount.toLocaleString()} FCFA</span>
      </div>
      <div className="text-[10px] space-y-0.5 mt-2 text-gray-700 italic border-l-2 border-black/20 pl-2">
        <div className="flex justify-between">
          <span>- Dont Redevance ORTN (3F/kWh):</span>
          <span>{(token.taxeORNT || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span>- Dont Red. Municipale (2F/kWh):</span>
          <span>{(token.taxeMunicipale || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span>- Dont Autres Frais/Primes:</span>
          <span>{(token.redevance || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span>- Dont Taxe Habitat:</span>
          <span>{(token.taxeHabitat || 0).toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span>- Dont TVA (19%):</span>
          <span>{(token.tva || 0).toLocaleString()} FCFA</span>
        </div>
      </div>
      <div className="flex justify-between border-t border-black/10 pt-2 mt-2">
        <span className="font-bold">Crédit Énergie:</span>
        <span className="font-black text-lg">{token.kwh?.toFixed(2)} kWh</span>
      </div>
    </div>

    <div className="text-center border-2 border-black p-4 mb-6">
      <p className="text-[10px] uppercase font-bold mb-2">Token STS (Code à saisir)</p>
      <p className="text-2xl font-black tracking-widest">{token.token}</p>
    </div>

    <div className="text-[10px] space-y-1 border-t border-black border-dashed pt-4">
      <p>ID Trans: {token.id}</p>
      <p>SGC: 600600 | KRN: 2 | TI: 1</p>
      <p className="mt-4 text-center font-bold">MERCI POUR VOTRE ACHAT</p>
      <p className="text-center italic">Digitalisant l'énergie au Niger</p>
    </div>
  </div>
);
