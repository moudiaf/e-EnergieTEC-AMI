import React from 'react';
import { Modal } from '../Modal';
import { Customer, Meter, Token } from '../../types';
import { Search, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  customers: Customer[];
  meters: Meter[];
  tokens: Token[];
  setCurrentSection: (section: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  globalSearchQuery,
  setGlobalSearchQuery,
  customers,
  meters,
  tokens,
  setCurrentSection
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Recherche Globale">
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input type="text" placeholder="Rechercher un client, un compteur, un token..." className="input-field w-full pl-10" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} autoFocus />
      </div>
      <div className="max-h-96 overflow-y-auto space-y-4">
        {globalSearchQuery.length > 2 ? (
          <>
            {customers.filter(c => c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || c.id.includes(globalSearchQuery)).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Clients</h4>
                <div className="space-y-2">
                  {customers.filter(c => c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || c.id.includes(globalSearchQuery)).map(c => (
                    <div key={c.id} onClick={() => { setCurrentSection('customers'); onClose(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.id}</div>
                      </div>
                      <ArrowRight size={16} className="text-brand" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {meters.filter(m => m.id.includes(globalSearchQuery) || m.location.toLowerCase().includes(globalSearchQuery.toLowerCase())).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 mt-4">Compteurs</h4>
                <div className="space-y-2">
                  {meters.filter(m => m.id.includes(globalSearchQuery) || m.location.toLowerCase().includes(globalSearchQuery.toLowerCase())).map(m => (
                    <div key={m.id} onClick={() => { setCurrentSection('meters'); onClose(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white font-mono">{m.id}</div>
                        <div className="text-xs text-gray-400">{m.location}</div>
                      </div>
                      <ArrowRight size={16} className="text-brand" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tokens.filter(t => t.token.includes(globalSearchQuery) || t.meterId.includes(globalSearchQuery)).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 mt-4">Tokens</h4>
                <div className="space-y-2">
                  {tokens.filter(t => t.token.includes(globalSearchQuery) || t.meterId.includes(globalSearchQuery)).map(t => (
                    <div key={t.id} onClick={() => { setCurrentSection('tokens'); onClose(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-brand font-mono">{t.token}</div>
                        <div className="text-xs text-gray-400">Compteur: {t.meterId}</div>
                      </div>
                      <ArrowRight size={16} className="text-brand" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {customers.filter(c => c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || c.id.includes(globalSearchQuery)).length === 0 &&
             meters.filter(m => m.id.includes(globalSearchQuery) || m.location.toLowerCase().includes(globalSearchQuery.toLowerCase())).length === 0 &&
             tokens.filter(t => t.token.includes(globalSearchQuery) || t.meterId.includes(globalSearchQuery)).length === 0 && (
              <div className="text-center text-gray-500 py-8">Aucun résultat trouvé</div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">Tapez au moins 3 caractères pour rechercher</div>
        )}
      </div>
    </div>
  </Modal>
);
