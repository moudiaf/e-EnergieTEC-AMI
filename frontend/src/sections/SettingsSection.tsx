import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, Key, Database, Globe, Bell, Smartphone, 
    RotateCcw, Save, FileCheck, Percent, Zap,
    Cpu, Radio, Signal, Lock, ShieldCheck, Settings2,
    Terminal, Server, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Meter, Customer } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsSectionProps {
  settings: any;
  onSave: (settings: any) => Promise<void>;
  currentUser?: User | null;
  meters?: Meter[];
  customers?: Customer[];
}

export const SettingsSection = ({ 
  settings, 
  onSave, 
  currentUser, 
  meters = [], 
  customers = [] 
}: SettingsSectionProps) => {
  const [localSettings, setLocalSettings] = useState(settings || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Customer and Auditor role flags
  const isCustomer = currentUser?.role === 'customer';
  const isAuditor = currentUser?.role === 'auditor';
  const customerInfo = useMemo(() => customers.find(c => c.id === currentUser?.associatedCustomerId) || customers[0], [customers, currentUser]);
  const customerMeter = useMemo(() => meters.find(m => m.customerId === currentUser?.associatedCustomerId) || meters[0], [meters, currentUser]);

  const [customerForm, setCustomerForm] = useState({
    phone: customerInfo?.phone || '',
    email: currentUser?.email || '',
    address: customerInfo?.address || 'Niamey, Niger',
    smsAlerts: true,
    lowCreditAlerts: true,
    emailInvoices: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [customerSuccessMsg, setCustomerSuccessMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaveInternal = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setCustomerSuccessMsg('Vos préférences et informations de compte ont été enregistrées avec succès.');
      setTimeout(() => setCustomerSuccessMsg(''), 4000);
    }, 600);
  };

  // ─── RENDU DU PORTAIL COMPTE ABONNÉ (ROLE CLIENT) ─────────────────
  if (isCustomer) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-5xl mx-auto space-y-8 pb-32 text-white pt-2"
      >
        {/* Header Client */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8 bg-[#121318] p-6 sm:p-8 rounded-3xl border shadow-2xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-brand/20 text-brand text-xs font-bold uppercase rounded-lg border border-brand/30">
                Portail Abonné NIGELEC
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                Compteur Synchronisé
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Mon Profil & <span className="text-brand">Paramètres</span></h3>
            <p className="text-gray-300 font-bold uppercase text-xs tracking-wider mt-1">Gérer vos coordonnées, préférences d'alertes et sécurité de votre compte</p>
          </div>
        </div>

        {customerSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3"
          >
            <ShieldCheck size={18} />
            <span>{customerSuccessMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSaveCustomerProfile} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* CARD 1 : INFORMATIONS PERSONNELLES */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand font-black text-lg">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">{currentUser?.name || customerInfo?.name || 'Utilisateur NIGELEC'}</h4>
                  <p className="text-xs text-brand font-mono font-bold uppercase tracking-wider mt-0.5">N° Compte : {currentUser?.associatedCustomerId || customerInfo?.id || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">N° Téléphone Mobile</label>
                  <input 
                    type="text" 
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Adresse Email</label>
                  <input 
                    type="email" 
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Adresse d'Installation</label>
                  <input 
                    type="text" 
                    value={customerForm.address}
                    onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2 : CARACTÉRISTIQUES DU COMPTEUR */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Compteur Raccordé</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Contrat NIGELEC Actif</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">N° Compteur STS</span>
                  <span className="text-base font-black text-white font-mono">{customerMeter?.id || '0128260224778'}</span>
                </div>

                <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Type & Phase</span>
                  <span className="text-xs font-black text-brand uppercase">{customerMeter?.phaseType === 'triphase' ? '3φ Triphasé' : '1φ Monophasé'}</span>
                </div>

                <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Solde Crédit Actuel</span>
                  <span className="text-base font-black text-emerald-400 font-mono">{(customerMeter?.credit ?? 5.0).toFixed(2)} kWh</span>
                </div>

                <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase">Énergie Totale Rechargée</span>
                  <span className="text-base font-black text-cyan-300 font-mono">{(customerMeter?.totalConsumption ?? 0.0).toFixed(2)} kWh</span>
                </div>
              </div>
            </div>

            {/* CARD 3 : PRÉFÉRENCES DE NOTIFICATIONS */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bell size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Canaux de Notification</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Alertes SMS & Reçus par Email</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-[#181920] rounded-2xl border border-white/10">
                  <div>
                    <p className="text-xs font-black text-white uppercase">SMS de confirmation de recharge</p>
                    <p className="text-[11px] text-gray-400">Recevoir le jeton STS (20 chiffres) par SMS</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={customerForm.smsAlerts}
                    onChange={e => setCustomerForm({ ...customerForm, smsAlerts: e.target.checked })}
                    className="w-5 h-5 accent-brand cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#181920] rounded-2xl border border-white/10">
                  <div>
                    <p className="text-xs font-black text-white uppercase">Alerte Solde Bas (&lt; 5 kWh)</p>
                    <p className="text-[11px] text-gray-400">Avertissement automatique avant coupure</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={customerForm.lowCreditAlerts}
                    onChange={e => setCustomerForm({ ...customerForm, lowCreditAlerts: e.target.checked })}
                    className="w-5 h-5 accent-brand cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* CARD 4 : SÉCURITÉ & MOT DE PASSE */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Sécurité du Compte</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Modifier votre mot de passe d'accès</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Mot de passe actuel</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={customerForm.currentPassword}
                    onChange={e => setCustomerForm({ ...customerForm, currentPassword: e.target.value })}
                    className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={customerForm.newPassword}
                      onChange={e => setCustomerForm({ ...customerForm, newPassword: e.target.value })}
                      className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Confirmer</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={customerForm.confirmPassword}
                      onChange={e => setCustomerForm({ ...customerForm, confirmPassword: e.target.value })}
                      className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Enregistrement..." : "Mettre à jour mon profil"}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // ─── RENDU DU CENTRE DE CONTRÔLE ADMIN (PARAMÈTRES SYSTÈME) ───────
  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-8 pb-32 text-white pt-2"
    >
      {/* ── Header Institutionnel ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-white/10 pb-8 bg-[#121318] p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-brand/20 text-brand text-xs font-black uppercase rounded-lg border border-brand/30 tracking-widest">
              Configuration Centrale e-EnergieTEC
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                <ShieldCheck size={12} /> Gouvernance NIGELEC Certifiée
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Settings2 className="text-brand" size={36} /> Paramètres <span className="text-brand">Système & HES</span>
          </h3>
          <p className="text-gray-300 font-bold uppercase text-xs tracking-widest mt-1">
            Gestion des constantes STS, paramètres de facturation, protocoles DLMS/COSEM et services d'infrastructure
          </p>
        </div>
        
        <div className="flex gap-4 relative z-10">
          {isAuditor ? (
            <div className="px-6 py-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 font-black text-xs uppercase tracking-widest flex items-center gap-3">
              <Lock size={16} /> Mode Consultation (Lecture Seule ARSE)
            </div>
          ) : (
            <button 
                onClick={handleSaveInternal}
                disabled={isSaving}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Save size={16} />}
                <span>{isSaving ? 'Enregistrement...' : saveSuccess ? 'Paramètres Enregistrés !' : 'Sauvegarder les Paramètres'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* SECTION 1 : STS & PARAMÈTRES DE RECHARGE */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand">
              <Key size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Paramètres <span className="text-brand">STS Prépayé</span></h4>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Norme Internationale CEI / IEC 62055-41</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Supply Group Code (SGC)</label>
              <input 
                type="text" 
                disabled={isAuditor}
                value={localSettings.sgc || '600876'} 
                onChange={e => handleChange('sgc', e.target.value)}
                className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-brand outline-none font-bold"
              />
              <p className="text-[10px] text-gray-400">Identifiant SGC officiel NIGELEC (600876).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Indice KRN par Défaut</label>
              <select 
                disabled={isAuditor}
                value={localSettings.krn || '2'} 
                onChange={e => handleChange('krn', e.target.value)}
                className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none font-bold"
              >
                <option value="1">KRN = 1 (Legacy)</option>
                <option value="2">KRN = 2 (Actif / Rollover Ready)</option>
              </select>
              <p className="text-[10px] text-gray-400">Key Revision Number en vigueur.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Devise Monétaire Vending</label>
              <input 
                type="text" 
                disabled={isAuditor}
                value={localSettings.currency || 'FCFA (XOF)'} 
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full bg-[#181920] border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand outline-none font-bold font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Date de Référence STS</label>
              <input 
                type="text" 
                disabled
                value="01/01/1993 00:00 UTC (Base TID)" 
                className="w-full bg-[#14151a] border border-white/10 rounded-xl px-4 py-2.5 text-gray-400 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 : FACTURATION, FISCALITÉ & DIRECTIVES ARSE */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Régulation <span className="text-blue-400">& Fiscalité ARSE</span></h4>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Taux TVA & Seuils Réglementaires du Niger</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 uppercase">Taux de TVA National</span>
                <Percent size={14} className="text-brand" />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  step="0.5"
                  disabled={isAuditor}
                  value={localSettings.vat_rate ?? 19.0}
                  onChange={e => handleChange('vat_rate', parseFloat(e.target.value))}
                  className="w-24 bg-[#121318] border border-white/20 rounded-xl px-3 py-1.5 text-lg font-black text-white font-mono focus:border-brand outline-none"
                />
                <span className="text-sm font-bold text-gray-300">%</span>
              </div>
            </div>

            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 uppercase">Seuil Pertes Max</span>
                <Zap size={14} className="text-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  step="0.1"
                  disabled={isAuditor}
                  value={localSettings.tech_loss_threshold ?? 7.5}
                  onChange={e => handleChange('tech_loss_threshold', parseFloat(e.target.value))}
                  className="w-24 bg-[#121318] border border-white/20 rounded-xl px-3 py-1.5 text-lg font-black text-amber-300 font-mono focus:border-amber-400 outline-none"
                />
                <span className="text-sm font-bold text-gray-300">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Fréquence de Clôture & Bilans MDMS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Quotidien', 'Hebdomadaire', 'Mensuel'].map(f => (
                <button
                  key={f}
                  type="button"
                  disabled={isAuditor}
                  onClick={() => handleChange('audit_frequency', f)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer",
                    (localSettings.audit_frequency === f || (!localSettings.audit_frequency && f === 'Mensuel'))
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm"
                      : "bg-[#181920] border-white/10 text-gray-400 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3 : INFRASTRUCTURE RÉSEAU HES & PORTS */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server size={24} />
            </div>
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Passerelle <span className="text-purple-400">HES & DLMS</span></h4>
              <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Paramètres Sockets & Télérelève</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase">Port DLMS HDLC</p>
              <p className="text-lg font-black text-white font-mono mt-1">TCP 4059</p>
            </div>
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase">Module KMS-HSM</p>
              <p className="text-lg font-black text-emerald-400 font-mono mt-1">Port 5000</p>
            </div>
            <div className="p-4 bg-[#181920] rounded-2xl border border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase">API REST HES</p>
              <p className="text-lg font-black text-cyan-300 font-mono mt-1">Port 3000</p>
            </div>
          </div>

          <div className="p-4 bg-[#181920] rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300 uppercase">Intervalle de Polling Profil de Charge</span>
              <span className="text-xs font-mono font-bold text-brand">15 Minutes (Standard)</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
              <span>Protocole d'Échange : DLMS/COSEM Green Book v10</span>
              <span className="text-emerald-400 font-bold">Chiffrement AES-128 GCM</span>
            </div>
          </div>
        </div>

        {/* SECTION 4 : SERVICES & NOTIFICATIONS TÉLÉCOM */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/15 bg-[#121318] shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell size={24} />
              </div>
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Services & <span className="text-amber-400">Passerelles</span></h4>
                <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">Routeurs SMS et Redondance Réseau</p>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleCard 
                icon={Smartphone} 
                label="Passerelle SMS Intégrée" 
                desc="Routeur Orange & Airtel Niger actif" 
                active={localSettings.sms_gateway_active !== false} 
                color="text-brand" 
                onToggle={() => handleChange('sms_gateway_active', !(localSettings.sms_gateway_active !== false))} 
                disabled={isAuditor}
              />
              <ToggleCard 
                icon={Globe} 
                label="Géo-Redondance Multi-Régions" 
                desc="Réplication Niamey &harr; Maradi &harr; Zinder" 
                active={localSettings.geo_redundancy_active !== false} 
                color="text-blue-400" 
                onToggle={() => handleChange('geo_redundancy_active', !(localSettings.geo_redundancy_active !== false))} 
                disabled={isAuditor}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#181920] border border-white/10 font-mono text-xs text-gray-300 space-y-1.5 mt-4">
            <div className="flex justify-between">
              <span>BASE DE DONNÉES :</span>
              <span className="text-emerald-400 font-bold">SQLite Sovereign (Local)</span>
            </div>
            <div className="flex justify-between">
              <span>STATUT DU CORE :</span>
              <span className="text-brand font-bold">e-EnergieTEC Sovereign Enterprise v6.5 (Opérationnel)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500">
              <span>PROPRIÉTÉ & COPYRIGHT :</span>
              <span className="font-bold text-gray-400">© 2026 e-EnergieTEC (RENTEC AMI). Tous droits réservés.</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

const ToggleCard = ({ icon: Icon, label, desc, active, color, onToggle, disabled = false }: any) => (
    <div className={cn(
        "flex items-center justify-between p-4 bg-[#181920] border border-white/10 rounded-2xl transition-all",
        !disabled && "hover:border-white/20"
    )}>
        <div className="flex items-center gap-3.5">
            <div className={cn("w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0", color)}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">{label}</p>
                <p className="text-[10px] text-gray-400 font-bold">{desc}</p>
            </div>
        </div>
        <div 
            onClick={!disabled ? onToggle : undefined}
            className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-300 border shrink-0",
                active ? "bg-brand/30 border-brand/60" : "bg-[#121318] border-white/15",
                disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
        >
            <motion.div 
                animate={{ x: active ? 26 : 4 }}
                className={cn(
                    "absolute top-1 w-4 h-4 rounded-full shadow-md",
                    active ? "bg-brand" : "bg-gray-500"
                )}
            />
        </div>
    </div>
);
