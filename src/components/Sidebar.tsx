import React, { useState } from 'react';
import {
  Bolt,
  LayoutDashboard,
  Microchip,
  Users,
  Key,
  Tags,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Shield,
  Lock,
  Headset,
  Smartphone,
  Database,
  Warehouse,
  ShieldCheck,
  Cpu,
  Receipt,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Activity,
  Radio,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { User as AppUser, Section, Alert } from '../types';
import { SidebarItem } from './SidebarItem';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentUser: AppUser | null;
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  alerts: Alert[];
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentSection,
  setCurrentSection,
  sidebarOpen,
  setSidebarOpen,
  alerts,
  handleLogout
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Industrial Futuristic Sidebar Container */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 bg-[#070709]/95 backdrop-blur-3xl border-r border-white/[0.08] z-50 transform transition-all duration-500 ease-in-out flex flex-col justify-between shadow-2xl select-none",
        collapsed ? "w-20" : "w-72 2xl:w-80",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col p-5 2xl:p-6 overflow-hidden">
          
          {/* Header Branding Section */}
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.06] relative shrink-0">
            <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setCurrentSection('dashboard')}>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand via-[#e5531b] to-brand/70 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.35)] ring-1 ring-white/20 shrink-0">
                <Bolt size={22} className="text-white drop-shadow-md" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black tracking-tight leading-none text-white uppercase">e-Energie<span className="text-brand">TEC</span></h1>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    <span className="text-[9.5px] text-brand font-black uppercase tracking-[0.2em]">NIGELEC 50Hz · AMI v6.5</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button (Desktop FHD / 4K Ergonomics) */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-white transition-all shadow-inner cursor-pointer"
              title={collapsed ? "Développer le menu" : "Réduire le menu"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Items List Organized by Business Domains (Domaines Métier) */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 pb-6">
            
            {/* ADMIN / MANAGER ROLES — ORGANIZED BY DOMAINES MÉTIER */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <>
                {/* DOMAINE 1: SUPERVISION & PILOTAGE */}
                {!collapsed && (
                  <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-2 pb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> SUPERVISION & PILOTAGE
                  </div>
                )}
                <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={currentSection === 'dashboard'} onClick={() => setCurrentSection('dashboard')} collapsed={collapsed} />
                <SidebarItem icon={TrendingUp} label="Analytique" active={currentSection === 'analytics'} onClick={() => setCurrentSection('analytics')} collapsed={collapsed} />
                <SidebarItem icon={Database} label="MDMS Bilan Énergie" active={currentSection === 'mdms'} onClick={() => setCurrentSection('mdms')} collapsed={collapsed} />

                {/* DOMAINE 2: SMART METERING & RÉSEAU SIG */}
                {!collapsed && (
                  <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-4 pb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> SMART METERING & SIG
                  </div>
                )}
                <SidebarItem icon={Microchip} label="Compteurs AMI" active={currentSection === 'meters'} onClick={() => setCurrentSection('meters')} collapsed={collapsed} />
                <SidebarItem icon={MapPin} label="Carte Réseau SIG" active={currentSection === 'map'} onClick={() => setCurrentSection('map')} collapsed={collapsed} />
                <SidebarItem icon={Cpu} label="Concentrateurs DCU" active={currentSection === 'dcus'} onClick={() => setCurrentSection('dcus')} collapsed={collapsed} />
                <SidebarItem icon={Warehouse} label="Gestion Magasin" active={currentSection === 'assets'} onClick={() => setCurrentSection('assets')} collapsed={collapsed} />

                {/* DOMAINE 3: VENTE STS & MONÉTIQUE */}
                {!collapsed && (
                  <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-4 pb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> VENTE STS & MONÉTIQUE
                  </div>
                )}
                <SidebarItem icon={Key} label="Guichet Recharge STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} collapsed={collapsed} />
                <SidebarItem icon={Tags} label="Historique Ventes" active={currentSection === 'tokens'} onClick={() => setCurrentSection('tokens')} collapsed={collapsed} />
                <SidebarItem icon={Smartphone} label="Portail Marchand +227" active={currentSection === 'payments'} onClick={() => setCurrentSection('payments')} collapsed={collapsed} />
                <SidebarItem icon={Receipt} label="Facturation" active={currentSection === 'billing'} onClick={() => setCurrentSection('billing')} collapsed={collapsed} />

                {/* DOMAINE 4: ABONNÉS & SUPPORT */}
                {!collapsed && (
                  <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-4 pb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> ABONNÉS & SUPPORT
                  </div>
                )}
                <SidebarItem icon={Users} label="Clients & Abonnés" active={currentSection === 'customers'} onClick={() => setCurrentSection('customers')} collapsed={collapsed} />
                <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
                <SidebarItem icon={AlertTriangle} label="Alertes & Fraudes" active={currentSection === 'alerts'} onClick={() => setCurrentSection('alerts')} badge={alerts.filter(a => a.status === 'unread').length.toString()} collapsed={collapsed} />

                {/* DOMAINE 5: REGULATION & ASSURANCE REVENUS */}
                {!collapsed && (
                  <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-4 pb-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> RÉGULATION & AUDIT
                  </div>
                )}
                <SidebarItem icon={ShieldCheck} label="Revenue Assurance" active={currentSection === 'revenue-assurance'} onClick={() => setCurrentSection('revenue-assurance')} collapsed={collapsed} />
                <SidebarItem icon={Shield} label="Journal Audit KMS" active={currentSection === 'audit'} onClick={() => setCurrentSection('audit')} collapsed={collapsed} />
                <SidebarItem icon={FileText} label="Rapports ARSE" active={currentSection === 'reports'} onClick={() => setCurrentSection('reports')} collapsed={collapsed} />
                <SidebarItem icon={MapPin} label="Régions NIGELEC" active={currentSection === 'regions'} onClick={() => setCurrentSection('regions')} collapsed={collapsed} />

                {/* DOMAINE 6: ADMINISTRATION SYSTÈME */}
                {currentUser?.role === 'admin' && (
                  <>
                    {!collapsed && (
                      <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-4 pb-1 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> ADMINISTRATION
                      </div>
                    )}
                    <SidebarItem icon={Tags} label="Gestion Tarifs" active={currentSection === 'tariffs'} onClick={() => setCurrentSection('tariffs')} collapsed={collapsed} />
                    <SidebarItem icon={Users} label="Gestion Accès" active={currentSection === 'users'} onClick={() => setCurrentSection('users')} collapsed={collapsed} />
                    <SidebarItem icon={Lock} label="Sécurité & KMS" active={currentSection === 'security'} onClick={() => setCurrentSection('security')} collapsed={collapsed} />
                    <SidebarItem icon={BookOpen} label="Documentation API" active={currentSection === 'api-docs'} onClick={() => setCurrentSection('api-docs')} collapsed={collapsed} />
                    <SidebarItem icon={Settings} label="Paramètres Système" active={currentSection === 'settings'} onClick={() => setCurrentSection('settings')} collapsed={collapsed} />
                  </>
                )}
              </>
            )}

            {/* VENDOR ROLE */}
            {currentUser?.role === 'vendor' && (
              <>
                {!collapsed && <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-2 pb-1">VENTE STS & MONÉTIQUE</div>}
                <SidebarItem icon={Key} label="Guichet Recharge STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} collapsed={collapsed} />
                <SidebarItem icon={Tags} label="Historique Ventes" active={currentSection === 'tokens'} onClick={() => setCurrentSection('tokens')} collapsed={collapsed} />
                <SidebarItem icon={Smartphone} label="Portail Marchand +227" active={currentSection === 'payments'} onClick={() => setCurrentSection('payments')} collapsed={collapsed} />
                <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
              </>
            )}

            {/* TECH ROLE */}
            {currentUser?.role === 'tech' && (
              <>
                {!collapsed && <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-2 pb-1">MAINTENANCE & TERRAIN</div>}
                <SidebarItem icon={AlertTriangle} label="Alertes & Fraudes" active={currentSection === 'alerts'} onClick={() => setCurrentSection('alerts')} badge={alerts.filter(a => a.status === 'unread').length.toString()} collapsed={collapsed} />
                <SidebarItem icon={Microchip} label="Compteurs AMI" active={currentSection === 'meters'} onClick={() => setCurrentSection('meters')} collapsed={collapsed} />
                <SidebarItem icon={MapPin} label="Carte Réseau SIG" active={currentSection === 'map'} onClick={() => setCurrentSection('map')} collapsed={collapsed} />
                <SidebarItem icon={Cpu} label="Concentrateurs DCU" active={currentSection === 'dcus'} onClick={() => setCurrentSection('dcus')} collapsed={collapsed} />
                <SidebarItem icon={Warehouse} label="Gestion Magasin" active={currentSection === 'assets'} onClick={() => setCurrentSection('assets')} collapsed={collapsed} />
                <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
              </>
            )}

            {/* CUSTOMER ROLE */}
            {currentUser?.role === 'customer' && (
              <>
                <SidebarItem icon={LayoutDashboard} label="Mon Compteur" active={currentSection === 'customer-dashboard'} onClick={() => setCurrentSection('customer-dashboard')} collapsed={collapsed} />
                <SidebarItem icon={Key} label="Acheter Unités STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} collapsed={collapsed} />
                <SidebarItem icon={Receipt} label="Mes Factures" active={currentSection === 'billing'} onClick={() => setCurrentSection('billing')} collapsed={collapsed} />
                <SidebarItem icon={Headset} label="Support Client" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
              </>
            )}

            {/* AUDITOR ROLE */}
            {currentUser?.role === 'auditor' && (
              <>
                {!collapsed && <div className="text-[10px] 2xl:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-3.5 pt-2 pb-1">AUDIT & RÉGULATION ARSE</div>}
                <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={currentSection === 'dashboard'} onClick={() => setCurrentSection('dashboard')} collapsed={collapsed} />
                <SidebarItem icon={FileText} label="Rapports ARSE" active={currentSection === 'reports'} onClick={() => setCurrentSection('reports')} collapsed={collapsed} />
                <SidebarItem icon={ShieldCheck} label="Revenue Assurance" active={currentSection === 'revenue-assurance'} onClick={() => setCurrentSection('revenue-assurance')} collapsed={collapsed} />
                <SidebarItem icon={Shield} label="Journal Audit KMS" active={currentSection === 'audit'} onClick={() => setCurrentSection('audit')} collapsed={collapsed} />
                <SidebarItem icon={TrendingUp} label="Analytique" active={currentSection === 'analytics'} onClick={() => setCurrentSection('analytics')} collapsed={collapsed} />
                <SidebarItem icon={Database} label="MDMS Analyse" active={currentSection === 'mdms'} onClick={() => setCurrentSection('mdms')} collapsed={collapsed} />
              </>
            )}
          </nav>

          {/* Profile & User Status Footer Card */}
          <div className="pt-4 border-t border-white/[0.08] space-y-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-2xl backdrop-blur-xl relative overflow-hidden group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-white/5 border border-brand/30 flex items-center justify-center font-black text-brand uppercase text-sm shadow-md shrink-0">
                  {currentUser?.name.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs text-white truncate">{currentUser?.name}</p>
                    <p className="text-[9px] font-black text-brand uppercase tracking-wider mt-0.5">{currentUser?.role}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              title={collapsed ? "Déconnexion" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 transition-all duration-300 font-bold text-xs cursor-pointer shadow-lg",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              <LogOut size={16} />
              {!collapsed && <span className="uppercase text-[10px] font-black tracking-widest">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
