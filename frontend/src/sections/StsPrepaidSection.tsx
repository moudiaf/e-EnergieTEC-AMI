import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Search, Zap, Receipt, Smartphone, Wallet, Building2, Banknote, HelpCircle, ChevronRight, CheckCircle2, Key } from 'lucide-react';
import { Meter, User, Customer } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Mapping des types NIGELEC ────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  social:           'Tarif Social',
  domestic:         'Tarif Domestique BT',
  commercial:       'Professionnel BT',
  industrial:       'Industriel / MT',
  haute_tension:    'Haute Tension (HT)',
  eclairage_public: 'Éclairage Public',
};

interface StsPrepaidSectionProps {
  currentUser: User | null;
  selectedMeterId: string;
  setSelectedMeterId: (id: string) => void;
  rechargeAmount: number;
  setRechargeAmount: (amount: number) => void;
  selectedChannel: 'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY';
  setSelectedChannel: (channel: 'Orange' | 'Airtel' | 'NITA' | 'AMANA' | 'CASH' | 'AGENCY') => void;
  meters: Meter[];
  customers: Customer[];
  handleGenerateToken: (type: string) => void;
  calculateRechargeDetails: (amount: number, meterId: string) => any;
  isGeneratingToken?: boolean;
  onSwitchToPostpaid?: () => void;
}

export const StsPrepaidSection = ({
  currentUser,
  selectedMeterId,
  setSelectedMeterId,
  rechargeAmount,
  setRechargeAmount,
  selectedChannel,
  setSelectedChannel,
  meters,
  customers,
  handleGenerateToken,
  calculateRechargeDetails,
  isGeneratingToken = false,
  onSwitchToPostpaid
}: StsPrepaidSectionProps) => {
  const [meterSearch, setMeterSearch] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [tokenType, setTokenType] = useState<'recharge' | 'key-change' | 'clear-credit' | 'clear-tamper'>('recharge');

  const isCustomer = currentUser?.role === 'customer';
  const showTypeSelector = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'tech';

  // 1. Filtrer les compteurs appartenant uniquement à ce client si c'est un abonné final
  const allowedMeters = useMemo(() => {
    if (isCustomer) {
      return meters.filter(m => m.customerId === currentUser?.associatedCustomerId);
    }
    return meters;
  }, [meters, isCustomer, currentUser]);

  // Si c'est un client et qu'aucun compteur n'est sélectionné, on pré-sélectionne le sien
  React.useEffect(() => {
    if (isCustomer && !selectedMeterId && allowedMeters.length > 0) {
      setSelectedMeterId(allowedMeters[0].id);
    }
  }, [isCustomer, selectedMeterId, allowedMeters, setSelectedMeterId]);

  // Si c'est un client et que le canal de paiement est réglé sur Espèces/Agence (ce qui est interdit), on le force sur Orange
  React.useEffect(() => {
    if (isCustomer && (selectedChannel === 'CASH' || selectedChannel === 'AGENCY')) {
      setSelectedChannel('Orange');
    }
  }, [isCustomer, selectedChannel, setSelectedChannel]);

  // Recherche filtrée des compteurs
  const filteredMeters = useMemo(() => {
    if (!meterSearch.trim()) return allowedMeters.slice(0, 5);
    const q = meterSearch.toLowerCase();
    return allowedMeters.filter(m => {
      const customer = customers.find(c => c.id === m.customerId);
      const customerName = customer?.name || '';
      return (
        m.id.toLowerCase().includes(q) || 
        m.location.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    }).slice(0, 10);
  }, [allowedMeters, meterSearch, customers]);

  const selectedMeter = useMemo(() => 
    allowedMeters.find(m => m.id === selectedMeterId), 
  [allowedMeters, selectedMeterId]);

  const selectedMeterCustomer = useMemo(() => {
    if (!selectedMeter) return null;
    return customers.find(c => c.id === selectedMeter.customerId);
  }, [selectedMeter, customers]);

  const details = calculateRechargeDetails(rechargeAmount, selectedMeterId);

  // Filtrer les canaux : les clients ne peuvent pas acheter en "Espèces" (CASH) ou "Agence" (AGENCY) directement chez eux
  const channels = useMemo(() => {
    const list = [
      { id: 'CASH',   name: 'Espèces',    icon: Banknote,   color: 'bg-green-600' },
      { id: 'Orange', name: 'Orange',     icon: Smartphone, color: 'bg-orange-600' },
      { id: 'Airtel', name: 'Airtel',     icon: Smartphone, color: 'bg-red-600' },
      { id: 'NITA',   name: 'NITA',       icon: Wallet,     color: 'bg-blue-600' },
      { id: 'AMANA',  name: 'AMANA',      icon: Building2,  color: 'bg-purple-600' },
      { id: 'AGENCY', name: 'Agence',     icon: Building2,  color: 'bg-brand' },
    ];
    if (isCustomer) {
      return list.filter(ch => ch.id !== 'CASH' && ch.id !== 'AGENCY');
    }
    return list;
  }, [isCustomer]);

  return (
    <motion.div 
      key="sts" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* En-tête Dynamique */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Recharge STS NIGELEC</h3>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Génération de Token Standard · Conformité CEI 62055-41</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold shadow-lg">Prépayé (STS)</button>
          <button 
            onClick={onSwitchToPostpaid}
            className="px-4 py-2 text-gray-500 rounded-xl text-xs font-bold hover:text-white hover:bg-white/5 transition-all"
          >
            Post-payé (Facturé)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche : Paramètres */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8">
            {/* 1. Sélection du Compteur */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Search size={14} className="text-brand" /> 1. Identifier le Compteur
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Rechercher par N° Compteur, Client ou Lieu..."
                  value={meterSearch}
                  onChange={(e) => setMeterSearch(e.target.value)}
                  className="input-field w-full h-14 pl-12 font-bold"
                />
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                
                {meterSearch && !selectedMeterId && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                    {filteredMeters.length > 0 ? filteredMeters.map(m => {
                      const customer = customers.find(c => c.id === m.customerId);
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedMeterId(m.id); setMeterSearch(''); }}
                          className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-xs">{m.type.charAt(0).toUpperCase()}</div>
                          <div className="text-left flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-black text-white">{m.id}</p>
                              {customer && (
                                <p className="text-xs text-brand font-black tracking-wide">{customer.name}</p>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold">{m.location}</p>
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="p-4 text-center text-gray-500 text-xs">Aucun compteur trouvé</div>
                    )}
                  </div>
                )}
              </div>

              {selectedMeter && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-brand/10 rounded-2xl border border-brand/20"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 animate-pulse">
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-brand uppercase tracking-widest">{TYPE_LABELS[selectedMeter.type]}</p>
                      <h4 className="text-xl font-black text-white">{selectedMeter.id}</h4>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {selectedMeterCustomer && (
                          <p className="text-xs text-brand font-black uppercase tracking-wider">{selectedMeterCustomer.name}</p>
                        )}
                        <p className="text-[10px] text-gray-400 font-bold">{selectedMeter.location}</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMeterId('')}
                    className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                  >
                    Changer
                  </button>
                </motion.div>
              )}
            </div>

            {/* Type de Jeton (uniquement pour Admins / Managers / Techniciens) */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'tech') && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Key size={14} className="text-brand" /> 2. Type de Jeton STS
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'recharge', name: 'Recharge Crédit' },
                    { id: 'key-change', name: 'Changement Clé' },
                    { id: 'clear-credit', name: 'Mise à Zéro' },
                    { id: 'clear-tamper', name: 'Effacer Alarme' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTokenType(t.id as any);
                        if (t.id !== 'recharge') {
                          setRechargeAmount(0);
                        }
                      }}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        tokenType === t.id
                          ? "bg-brand/20 border-brand text-white shadow-lg"
                          : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Canal de Vente (Uniquement pour Recharge) */}
            {tokenType === 'recharge' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={14} className="text-brand" /> {showTypeSelector ? "3. Canal de Vente" : "2. Canal de Vente"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 group relative overflow-hidden",
                        selectedChannel === ch.id 
                          ? "bg-brand/20 border-brand shadow-[0_10px_20px_rgba(255,107,53,0.2)]" 
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <ch.icon className={cn("w-5 h-5", selectedChannel === ch.id ? "text-brand" : "text-gray-400 group-hover:text-white")} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">{ch.name}</span>
                      {selectedChannel === ch.id && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 size={10} className="text-brand" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {(selectedChannel === 'Orange' || selectedChannel === 'Airtel' || selectedChannel === 'NITA' || selectedChannel === 'AMANA') && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Smartphone size={12} className="text-brand" /> Numéro de Téléphone Payeur {selectedChannel} (Niger +227)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono font-bold text-xs">+227</span>
                      <input 
                        type="tel"
                        placeholder="90 12 34 56"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-16 pr-4 text-xs font-mono font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-brand transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 font-medium italic flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-brand shrink-0" />
                      Une requête de confirmation Push USSD sera envoyée sur ce numéro pour autoriser le prélèvement.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* 4. Montant (Uniquement pour Recharge) */}
            {tokenType === 'recharge' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Coins size={14} className="text-brand" /> {showTypeSelector ? "4. Montant de la Transaction" : "3. Montant de la Transaction"}
                </label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={rechargeAmount || ''}
                    onChange={(e) => setRechargeAmount(Number(e.target.value))}
                    className="w-full bg-white/5 border-2 border-white/5 focus:border-brand rounded-3xl h-24 text-5xl font-black text-center text-white transition-all focus:bg-brand/5 outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-600 group-focus-within:text-brand">FCFA</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[1000, 2000, 5000, 10000, 20000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setRechargeAmount(amt)}
                      className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-white border border-white/5 transition-all active:scale-95"
                    >
                      {amt.toLocaleString()} FCFA
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={isGeneratingToken || !selectedMeterId || (tokenType === 'recharge' && !rechargeAmount)}
            onClick={() => handleGenerateToken(tokenType)}
            className={cn(
              "w-full h-20 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 transition-all",
              isGeneratingToken || !selectedMeterId || (tokenType === 'recharge' && !rechargeAmount)
                ? "bg-gray-800 text-gray-600 grayscale cursor-not-allowed"
                : "bg-brand text-white shadow-[0_20px_40px_rgba(255,107,53,0.3)] hover:translate-y-[-4px] active:scale-95"
            )}
          >
            {isGeneratingToken ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                GÉNÉRATION EN COURS...
              </span>
            ) : (
              <>
                <Receipt /> {
                  isCustomer 
                    ? "PAYER & CHARGER MON COMPTEUR" 
                    : tokenType === 'recharge'
                      ? "GÉNÉRER LE TOKEN STS"
                      : `GÉNÉRER LE TOKEN ${tokenType.toUpperCase().replace('-', ' ')}`
                }
              </>
            )}
          </button>
        </div>

        {/* Colonne Droite : Simulation & Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pl-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {tokenType === 'recharge' ? "Facturation Détaillée (NIGELEC)" : "Fiche Technique de Maintenance"}
            </h4>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>

          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8 bg-gradient-to-br from-brand/5 to-transparent">
            {/* Résumé Énergie / Type de Jeton */}
            {tokenType === 'recharge' ? (
              <div className="text-center space-y-2 py-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Volume Énergie Net</p>
                <div className="flex items-center justify-center gap-3">
                  <Zap size={32} className="text-brand" />
                  <h5 className="text-5xl font-black text-white tracking-tighter">
                    {details.kwh.toFixed(2)}
                    <span className="text-2xl text-gray-500 ml-2">kWh</span>
                  </h5>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2 py-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Type de Jeton Technique</p>
                <div className="flex items-center justify-center gap-3">
                  <Key size={32} className="text-blue-400 animate-pulse" />
                  <h5 className="text-lg font-black text-white tracking-tight uppercase">
                    {tokenType === 'key-change' ? "Changement de Clé" :
                     tokenType === 'clear-credit' ? "Mise à Zéro (Clear)" : "Effacement Alarme"}
                  </h5>
                </div>
              </div>
            )}

            {/* Détail Fiscal / Info Maintenance */}
            {tokenType === 'recharge' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    <ChevronRight size={10} className="text-brand group-hover:translate-x-1 transition-transform" />
                    Base Tarifaire HT
                  </span>
                  <span className="text-xs font-black text-white">{details.rate.toFixed(2)} F/kWh</span>
                </div>
                
                <div className="h-[1px] bg-white/5 italic"></div>

                <div className="space-y-3">
                  {[
                    { label: 'Taxe Habitat (mensuel)', val: details.taxe, color: 'text-orange-400' },
                    { label: 'Prime Fixe + EP', val: details.redevance, color: 'text-orange-400' },
                    { label: 'Redevance ORTN (3F/kWh)', val: details.taxeORNT, color: 'text-blue-400' },
                    { label: 'Redevance Mun. (2F/kWh)', val: details.taxeMunicipale, color: 'text-yellow-400' },
                    { label: 'TVA Nigelec (19%)', val: details.tva, color: 'text-red-400' },
                  ].map((fee, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-gray-400 uppercase">{fee.label}</span>
                      <span className={cn("text-xs font-black", fee.color)}>{Math.round(fee.val).toLocaleString()} F</span>
                    </div>
                  ))}
                </div>

                <div className="h-[1px] bg-white/10 mt-4"></div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Net Énergie (HT)</span>
                  <span className="text-lg font-black text-brand">{(rechargeAmount - details.taxe - details.redevance - details.taxeORNT - details.taxeMunicipale - details.tva).toLocaleString()} F</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-gray-400 leading-relaxed font-medium">
                <p className="uppercase text-[10px] text-blue-400 font-black">Description Fonctionnelle :</p>
                {tokenType === 'key-change' && (
                  <p>Permet la rotation de clé du module de sécurité local du compteur (changement des clés maîtres KMS et index d'algorithme du groupe de tarification SGC).</p>
                )}
                {tokenType === 'clear-credit' && (
                  <p>Réinitialise instantanément le solde de crédit du compteur à 0.00 kWh. Utilisé pour les purges de crédit lors d'un déménagement client.</p>
                )}
                {tokenType === 'clear-tamper' && (
                  <p>Efface la mémoire d'alarme du coffret du compteur (Bypass, ouverture capot). Rétablit la fermeture du contacteur interne pour rétablir le courant.</p>
                )}
                <div className="h-[1px] bg-white/5 mt-4"></div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white">
                  <span>Frais de Vente</span>
                  <span className="text-green-500">Gratuit (0 FCFA)</span>
                </div>
              </div>
            )}

            {/* Warning / Notes */}
            <div className="p-4 bg-white/5 rounded-2xl flex gap-3 items-start">
              <HelpCircle size={16} className="text-gray-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-gray-500 leading-relaxed italic">
                {tokenType === 'recharge' 
                  ? "Ce calcul inclut les prélèvements institutionnels (Arreté ARSE/NIGELEC 2024). Les redevances ORTN et Municipales sont calculées proportionnellement au kWh livré."
                  : "L'émission de jetons d'ingénierie et de maintenance est soumise à un enregistrement strict dans le journal d'audit cryptographique du KMS."
                }
              </p>
            </div>
          </div>

          {/* Badge de Conformité */}
          <div className="flex items-center gap-3 px-6 py-4 bg-green-500/5 border border-green-500/10 rounded-2xl">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">
              {tokenType === 'recharge' ? "Moteur de calcul conforme NIGELEC 2024" : "Jeton STS crypté conforme standard CEI"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
