import React from 'react';
import {
  Bolt,
  LayoutDashboard,
  Coins,
  Microchip,
  Users,
  Key,
  Tags,
  PieChart,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  ArrowRight,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Printer,
  MessageSquare,
  Mail,
  CheckCircle2,
  Cpu,
  Edit,
  Trash2,
  Info,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Edit2,
  RefreshCw,
  Receipt,
  Headset,
  Smartphone,
  Database,
  Warehouse,
  ShieldCheck
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
  return (
    <>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-72 bg-[#050505]/90 backdrop-blur-3xl border-r border-white/[0.05] z-50 transform transition-transform duration-500 ease-spring lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2 transition-transform hover:scale-105">
            <div className="p-2.5 rounded-xl bg-gradient-to-b from-brand to-[#d44815] shadow-[0_0_20px_rgba(255,107,53,0.3)] ring-1 ring-white/10">
              <Bolt size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-white">e-EnergieTEC</h1>
              <p className="text-[10px] text-brand font-bold uppercase tracking-[0.2em] mt-1">Smart Metering</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
            {currentUser?.role !== 'customer' && (
              <>
                <div className="py-2"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Principal</div></div>
                <SidebarItem icon={LayoutDashboard} label="Tableau de bord" active={currentSection === 'dashboard'} onClick={() => setCurrentSection('dashboard')} />
                <SidebarItem icon={TrendingUp} label="Analytique" active={currentSection === 'analytics'} onClick={() => setCurrentSection('analytics')} />
                <SidebarItem icon={Microchip} label="Compteurs AMI" active={currentSection === 'meters'} onClick={() => setCurrentSection('meters')} />
                <SidebarItem icon={Users} label="Clients & Abonnés" active={currentSection === 'customers'} onClick={() => setCurrentSection('customers')} />

                <div className="py-2"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Opérations STS</div></div>
                <SidebarItem icon={Key} label="Recharge STS" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} />
                <SidebarItem icon={Tags} label="Historique Ventes" active={currentSection === 'tokens'} onClick={() => setCurrentSection('tokens')} />
                <SidebarItem icon={Smartphone} label="Portail Marchand" active={currentSection === 'payments'} onClick={() => setCurrentSection('payments')} />
                <SidebarItem icon={Receipt} label="Facturation" active={currentSection === 'billing'} onClick={() => setCurrentSection('billing')} />

                <div className="py-2"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Technique</div></div>
                <SidebarItem icon={MapPin} label="Carte Réseau" active={currentSection === 'map'} onClick={() => setCurrentSection('map')} />
                <SidebarItem icon={Headset} label="Tickets Support" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} />
                <SidebarItem icon={AlertTriangle} label="Alertes & Fraudes" active={currentSection === 'alerts'} onClick={() => setCurrentSection('alerts')} badge={alerts.filter(a => a.status === 'unread').length.toString()} />
                <SidebarItem icon={Database} label="MDMS Analyse" active={currentSection === 'mdms'} onClick={() => setCurrentSection('mdms')} />
                <SidebarItem icon={FileText} label="Rapports Réglementaires" active={currentSection === 'reports'} onClick={() => setCurrentSection('reports')} />
                <SidebarItem icon={Warehouse} label="Gestion du Magasin" active={currentSection === 'assets'} onClick={() => setCurrentSection('assets')} />
                <SidebarItem icon={Cpu} label="Concentrateurs DCU" active={currentSection === 'dcus'} onClick={() => setCurrentSection('dcus')} />
                <SidebarItem icon={FileText} label="Documentation API" active={currentSection === 'api-docs'} onClick={() => setCurrentSection('api-docs')} />

                {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                  <>
                    <div className="py-2"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Supervision & Audit</div></div>
                    <SidebarItem icon={ShieldCheck} label="Revenue Assurance" active={currentSection === 'revenue-assurance'} onClick={() => setCurrentSection('revenue-assurance')} />
                    <SidebarItem icon={Shield} label="Journal d'Audit" active={currentSection === 'audit'} onClick={() => setCurrentSection('audit')} />
                    <SidebarItem icon={MapPin} label="Régions" active={currentSection === 'regions'} onClick={() => setCurrentSection('regions')} />
                  </>
                )}

                {currentUser?.role === 'admin' && (
                  <>
                    <div className="py-2"><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4">Administration Système</div></div>
                    <SidebarItem icon={Tags} label="Gestion des Tarifs" active={currentSection === 'tariffs'} onClick={() => setCurrentSection('tariffs')} />
                    <SidebarItem icon={Users} label="Gestion des Accès" active={currentSection === 'users'} onClick={() => setCurrentSection('users')} />
                    <SidebarItem icon={Lock} label="Sécurité & Chiffrement" active={currentSection === 'security'} onClick={() => setCurrentSection('security')} />
                    <SidebarItem icon={Settings} label="Paramètres" active={currentSection === 'settings'} onClick={() => setCurrentSection('settings')} />
                  </>
                )}
              </>
            )}
            {currentUser?.role === 'customer' && (
              <>
                <SidebarItem icon={LayoutDashboard} label="Mon Compteur" active={currentSection === 'customer-dashboard'} onClick={() => setCurrentSection('customer-dashboard')} />
                <SidebarItem icon={Key} label="Acheter Unités" active={currentSection === 'sts-prepaid'} onClick={() => setCurrentSection('sts-prepaid')} />
                <SidebarItem icon={Receipt} label="Mes Factures" active={currentSection === 'billing'} onClick={() => setCurrentSection('billing')} />
                <SidebarItem icon={Headset} label="Support Client" active={currentSection === 'tickets'} onClick={() => setCurrentSection('tickets')} />
              </>
            )}
          </nav>

          <div className="pt-6 border-t border-white/[0.05]">
            <div className="glass-panel p-4 rounded-xl mb-4 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-white uppercase border border-white/10">{currentUser?.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-brand font-black uppercase tracking-wider">{currentUser?.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
