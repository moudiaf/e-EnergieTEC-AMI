import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Activity,
  Radio,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { User as AppUser, Section, Alert } from '../types';
import { SidebarItem } from './SidebarItem';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SectionHeaderProps {
  title: string;
  dotColor: string;
  glowShadow?: string;
  lineGradient: string;
  collapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  dotColor,
  glowShadow = "shadow-[0_0_8px_currentColor]",
  lineGradient,
  collapsed,
  isOpen,
  onToggle,
  badge
}) => {
  if (collapsed) return null;

  return (
    <div className="pt-2.5 pb-0.5 select-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-1 flex items-center justify-between group cursor-pointer text-left rounded-xl hover:bg-white/[0.04] transition-all"
      >
        <div className="flex items-center gap-2 text-[9px] 2xl:text-[9.5px] font-black uppercase tracking-[0.22em] text-gray-400 group-hover:text-white transition-colors">
          <span className={cn("w-1.5 h-1.5 rounded-full transition-transform duration-200 group-hover:scale-125", dotColor, glowShadow)} />
          <span className="truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isOpen && badge && parseInt(badge, 10) > 0 && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {badge}
            </span>
          )}
          <ChevronDown
            size={13}
            className={cn(
              "text-gray-500 group-hover:text-white transition-transform duration-300",
              isOpen ? "rotate-0 text-white" : "-rotate-90 text-gray-500"
            )}
          />
        </div>
      </button>
      <div className={cn("h-px w-full bg-gradient-to-r via-white/5 to-transparent mt-1 mx-3", lineGradient)} />
    </div>
  );
};

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

  // État des sections rétractables (accordéon) avec persistance localStorage
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nigelec_sidebar_sections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Par défaut, les domaines principaux d'exploitation sont ouverts
    return {
      supervision: true,
      metering: true,
      vending: true,
      support: true,
      regulation: false,
      admin: false,
      terrain: true,
      audit: true,
    };
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => {
      const next = { ...prev, [sectionKey]: !prev[sectionKey] };
      try {
        localStorage.setItem('nigelec_sidebar_sections', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Auto-expand : s'assurer que le domaine contenant la section active est toujours ouvert
  useEffect(() => {
    const domainMap: Record<string, string> = {
      dashboard: 'supervision',
      statistics: 'supervision',
      analytics: 'supervision',
      mdms: 'supervision',

      meters: 'metering',
      map: 'metering',
      dcus: 'metering',
      assets: 'metering',

      'sts-prepaid': 'vending',
      vending: 'vending',
      tokens: 'vending',
      payments: 'vending',
      billing: 'vending',

      customers: 'support',
      tickets: 'support',
      alerts: 'support',

      'revenue-assurance': 'regulation',
      audit: 'regulation',
      reports: 'regulation',
      regions: 'regulation',

      tariffs: 'admin',
      users: 'admin',
      security: 'admin',
      'api-docs': 'admin',
      settings: 'admin',
    };

    const parentDomain = domainMap[currentSection];
    if (parentDomain && !openSections[parentDomain]) {
      setOpenSections(prev => {
        const next = { ...prev, [parentDomain]: true };
        try {
          localStorage.setItem('nigelec_sidebar_sections', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  }, [currentSection]);

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
        "fixed lg:static inset-y-0 left-0 bg-gradient-to-b from-[#090e1c]/98 via-[#070b16]/98 to-[#050811]/98 backdrop-blur-3xl border-r border-white/[0.10] z-50 transform transition-all duration-500 ease-in-out flex flex-col justify-between shadow-2xl select-none relative overflow-hidden",
        collapsed ? "w-20" : "w-72 2xl:w-80",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* SCADA Background Ambient Glow & Grid Layer */}
        <div className="absolute inset-0 scada-grid-pattern opacity-15 pointer-events-none" />
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-brand/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Right Edge Specular Reflection */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-brand/40 via-white/10 to-transparent pointer-events-none z-20" />

        <div className="h-full flex flex-col p-5 2xl:p-6 overflow-hidden relative z-10">
          
          {/* Header Branding Section */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/[0.08] relative shrink-0">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setCurrentSection('dashboard')}>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand via-[#e5531b] to-brand/70 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.35)] ring-1 ring-white/20 shrink-0 relative overflow-hidden group-hover:shadow-[0_0_28px_rgba(255,107,53,0.5)] transition-all">
                <div className="absolute top-0 left-2 right-2 h-px bg-white/40 pointer-events-none" />
                <Bolt size={22} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black tracking-tight leading-none text-white uppercase">e-Energie<span className="text-brand">TEC</span></h1>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-niger-green animate-pulse shadow-[0_0_6px_#00A651]"></span>
                    <span className="text-[9px] text-gray-300 font-extrabold uppercase tracking-[0.16em]">NIGELEC 50Hz · AMI v6.5</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button (Desktop FHD / 4K Ergonomics) */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] hover:border-brand/40 text-gray-400 hover:text-white transition-all shadow-sm cursor-pointer"
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
                <SectionHeader
                  title="SUPERVISION & PILOTAGE"
                  dotColor="bg-brand"
                  glowShadow="shadow-[0_0_8px_rgba(255,107,53,0.8)] animate-pulse"
                  lineGradient="from-brand/35"
                  collapsed={collapsed}
                  isOpen={openSections.supervision}
                  onToggle={() => toggleSection('supervision')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.supervision || collapsed) && (
                    <motion.div
                      key="supervision-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={currentSection === 'dashboard'} onClick={() => setCurrentSection('dashboard')} collapsed={collapsed} />
                      <SidebarItem icon={BarChart3} label="Statistiques" active={currentSection === 'statistics'} onClick={() => setCurrentSection('statistics')} collapsed={collapsed} />
                      <SidebarItem icon={TrendingUp} label="Analytique" active={currentSection === 'analytics'} onClick={() => setCurrentSection('analytics')} collapsed={collapsed} />
                      <SidebarItem icon={Database} label="MDMS Bilan Énergie" active={currentSection === 'mdms'} onClick={() => setCurrentSection('mdms')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOMAINE 2: SMART METERING & RÉSEAU SIG */}
                <SectionHeader
                  title="SMART METERING & SIG"
                  dotColor="bg-cyan-400"
                  glowShadow="shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  lineGradient="from-cyan-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.metering}
                  onToggle={() => toggleSection('metering')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.metering || collapsed) && (
                    <motion.div
                      key="metering-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={Microchip} label="Compteurs AMI" active={currentSection === 'meters'} onClick={() => setCurrentSection('meters')} collapsed={collapsed} />
                      <SidebarItem icon={MapPin} label="Carte Réseau SIG" active={currentSection === 'map'} onClick={() => setCurrentSection('map')} collapsed={collapsed} />
                      <SidebarItem icon={Cpu} label="Concentrateurs DCU" active={currentSection === 'dcus'} onClick={() => setCurrentSection('dcus')} collapsed={collapsed} />
                      <SidebarItem icon={Warehouse} label="Gestion Magasin" active={currentSection === 'assets'} onClick={() => setCurrentSection('assets')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOMAINE 3: VENTE STS & MONÉTIQUE */}
                <SectionHeader
                  title="VENTE STS & MONÉTIQUE"
                  dotColor="bg-amber-400"
                  glowShadow="shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  lineGradient="from-amber-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.vending}
                  onToggle={() => toggleSection('vending')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.vending || collapsed) && (
                    <motion.div
                      key="vending-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={Key} label="Guichet Vente & STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} collapsed={collapsed} />
                      <SidebarItem icon={Radio} label="Passerelle HES Autonome" active={currentSection === 'vending'} onClick={() => setCurrentSection('vending')} collapsed={collapsed} />
                      <SidebarItem icon={Tags} label="Historique Ventes" active={currentSection === 'tokens'} onClick={() => setCurrentSection('tokens')} collapsed={collapsed} />
                      <SidebarItem icon={Smartphone} label="Portail Marchand +227" active={currentSection === 'payments'} onClick={() => setCurrentSection('payments')} collapsed={collapsed} />
                      <SidebarItem icon={Receipt} label="Facturation" active={currentSection === 'billing'} onClick={() => setCurrentSection('billing')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOMAINE 4: ABONNÉS & SUPPORT */}
                <SectionHeader
                  title="ABONNÉS & SUPPORT"
                  dotColor="bg-blue-400"
                  glowShadow="shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                  lineGradient="from-blue-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.support}
                  onToggle={() => toggleSection('support')}
                  badge={alerts.filter(a => a.status === 'unread').length.toString()}
                />
                <AnimatePresence initial={false}>
                  {(openSections.support || collapsed) && (
                    <motion.div
                      key="support-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={Users} label="Clients & Abonnés" active={currentSection === 'customers'} onClick={() => setCurrentSection('customers')} collapsed={collapsed} />
                      <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
                      <SidebarItem icon={AlertTriangle} label="Alertes & Fraudes" active={currentSection === 'alerts'} onClick={() => setCurrentSection('alerts')} badge={alerts.filter(a => a.status === 'unread').length.toString()} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOMAINE 5: REGULATION & ASSURANCE REVENUS */}
                <SectionHeader
                  title="RÉGULATION & AUDIT"
                  dotColor="bg-emerald-400"
                  glowShadow="shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  lineGradient="from-emerald-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.regulation}
                  onToggle={() => toggleSection('regulation')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.regulation || collapsed) && (
                    <motion.div
                      key="regulation-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={ShieldCheck} label="Revenue Assurance" active={currentSection === 'revenue-assurance'} onClick={() => setCurrentSection('revenue-assurance')} collapsed={collapsed} />
                      <SidebarItem icon={Shield} label="Journal Audit KMS" active={currentSection === 'audit'} onClick={() => setCurrentSection('audit')} collapsed={collapsed} />
                      <SidebarItem icon={FileText} label="Rapports ARSE" active={currentSection === 'reports'} onClick={() => setCurrentSection('reports')} collapsed={collapsed} />
                      <SidebarItem icon={MapPin} label="Régions NIGELEC" active={currentSection === 'regions'} onClick={() => setCurrentSection('regions')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DOMAINE 6: ADMINISTRATION SYSTÈME */}
                {currentUser?.role === 'admin' && (
                  <>
                    <SectionHeader
                      title="ADMINISTRATION"
                      dotColor="bg-red-400"
                      glowShadow="shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                      lineGradient="from-red-400/35"
                      collapsed={collapsed}
                      isOpen={openSections.admin}
                      onToggle={() => toggleSection('admin')}
                    />
                    <AnimatePresence initial={false}>
                      {(openSections.admin || collapsed) && (
                        <motion.div
                          key="admin-items"
                          initial={collapsed ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden space-y-1 pt-0.5"
                        >
                          <SidebarItem icon={Tags} label="Gestion Tarifs" active={currentSection === 'tariffs'} onClick={() => setCurrentSection('tariffs')} collapsed={collapsed} />
                          <SidebarItem icon={Users} label="Gestion Accès" active={currentSection === 'users'} onClick={() => setCurrentSection('users')} collapsed={collapsed} />
                          <SidebarItem icon={Lock} label="Sécurité & KMS" active={currentSection === 'security'} onClick={() => setCurrentSection('security')} collapsed={collapsed} />
                          <SidebarItem icon={BookOpen} label="Documentation API" active={currentSection === 'api-docs'} onClick={() => setCurrentSection('api-docs')} collapsed={collapsed} />
                          <SidebarItem icon={Settings} label="Paramètres Système" active={currentSection === 'settings'} onClick={() => setCurrentSection('settings')} collapsed={collapsed} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </>
            )}

            {/* VENDOR ROLE */}
            {currentUser?.role === 'vendor' && (
              <>
                <SectionHeader
                  title="VENTE STS & MONÉTIQUE"
                  dotColor="bg-amber-400"
                  glowShadow="shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  lineGradient="from-amber-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.vending}
                  onToggle={() => toggleSection('vending')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.vending || collapsed) && (
                    <motion.div
                      key="vendor-vending-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={Key} label="Guichet Vente & STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} collapsed={collapsed} />
                      <SidebarItem icon={Tags} label="Historique Ventes" active={currentSection === 'tokens'} onClick={() => setCurrentSection('tokens')} collapsed={collapsed} />
                      <SidebarItem icon={Smartphone} label="Portail Marchand +227" active={currentSection === 'payments'} onClick={() => setCurrentSection('payments')} collapsed={collapsed} />
                      <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* TECH ROLE */}
            {currentUser?.role === 'tech' && (
              <>
                <SectionHeader
                  title="MAINTENANCE & TERRAIN"
                  dotColor="bg-cyan-400"
                  glowShadow="shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                  lineGradient="from-cyan-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.terrain}
                  onToggle={() => toggleSection('terrain')}
                  badge={alerts.filter(a => a.status === 'unread').length.toString()}
                />
                <AnimatePresence initial={false}>
                  {(openSections.terrain || collapsed) && (
                    <motion.div
                      key="tech-terrain-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={AlertTriangle} label="Alertes & Fraudes" active={currentSection === 'alerts'} onClick={() => setCurrentSection('alerts')} badge={alerts.filter(a => a.status === 'unread').length.toString()} collapsed={collapsed} />
                      <SidebarItem icon={Microchip} label="Compteurs AMI" active={currentSection === 'meters'} onClick={() => setCurrentSection('meters')} collapsed={collapsed} />
                      <SidebarItem icon={MapPin} label="Carte Réseau SIG" active={currentSection === 'map'} onClick={() => setCurrentSection('map')} collapsed={collapsed} />
                      <SidebarItem icon={Cpu} label="Concentrateurs DCU" active={currentSection === 'dcus'} onClick={() => setCurrentSection('dcus')} collapsed={collapsed} />
                      <SidebarItem icon={Warehouse} label="Gestion Magasin" active={currentSection === 'assets'} onClick={() => setCurrentSection('assets')} collapsed={collapsed} />
                      <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <SectionHeader
                  title="AUDIT & RÉGULATION ARSE"
                  dotColor="bg-emerald-400"
                  glowShadow="shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  lineGradient="from-emerald-400/35"
                  collapsed={collapsed}
                  isOpen={openSections.audit}
                  onToggle={() => toggleSection('audit')}
                />
                <AnimatePresence initial={false}>
                  {(openSections.audit || collapsed) && (
                    <motion.div
                      key="auditor-items"
                      initial={collapsed ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden space-y-1 pt-0.5"
                    >
                      <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={currentSection === 'dashboard'} onClick={() => setCurrentSection('dashboard')} collapsed={collapsed} />
                      <SidebarItem icon={BarChart3} label="Statistiques" active={currentSection === 'statistics'} onClick={() => setCurrentSection('statistics')} collapsed={collapsed} />
                      <SidebarItem icon={FileText} label="Rapports ARSE" active={currentSection === 'reports'} onClick={() => setCurrentSection('reports')} collapsed={collapsed} />
                      <SidebarItem icon={ShieldCheck} label="Revenue Assurance" active={currentSection === 'revenue-assurance'} onClick={() => setCurrentSection('revenue-assurance')} collapsed={collapsed} />
                      <SidebarItem icon={Shield} label="Journal Audit KMS" active={currentSection === 'audit'} onClick={() => setCurrentSection('audit')} collapsed={collapsed} />
                      <SidebarItem icon={TrendingUp} label="Analytique" active={currentSection === 'analytics'} onClick={() => setCurrentSection('analytics')} collapsed={collapsed} />
                      <SidebarItem icon={Database} label="MDMS Analyse" active={currentSection === 'mdms'} onClick={() => setCurrentSection('mdms')} collapsed={collapsed} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </nav>

          {/* Profile & User Status Footer Card */}
          <div className="pt-4 border-t border-white/[0.08] space-y-3 shrink-0 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            <div className="p-3.5 rounded-2xl bg-[#0c1427]/70 border border-white/10 border-t-white/20 shadow-xl backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/25 to-brand/10 border border-brand/40 flex items-center justify-center font-black text-brand uppercase text-sm shadow-[0_0_12px_rgba(255,107,53,0.25)] shrink-0">
                  {currentUser?.name.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs text-white truncate">{currentUser?.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-niger-green animate-pulse shadow-[0_0_6px_#00A651]" />
                      <span className="text-[9px] font-black text-brand uppercase tracking-wider">{currentUser?.role}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              title={collapsed ? "Déconnexion" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/90 border border-red-500/20 hover:border-red-500 transition-all duration-300 font-bold text-xs cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              <LogOut size={16} />
              {!collapsed && <span className="uppercase text-[10px] font-black tracking-widest">Déconnexion</span>}
            </button>

            {/* Copyright & Version Footer */}
            {!collapsed && (
              <div className="pt-2 px-1 text-center select-none border-t border-white/[0.04]">
                <p className="text-[10px] text-gray-500 font-bold tracking-tight">
                  © 2026 e-EnergieTEC (RENTEC AMI)
                </p>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-0.5">
                  Tous droits réservés · v6.5
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
