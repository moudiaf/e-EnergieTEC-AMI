import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
  collapsed?: boolean;
}

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge, collapsed = false }: SidebarItemProps) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={cn(
      "w-full flex items-center gap-3.5 px-3.5 py-2.5 2xl:py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden text-left cursor-pointer",
      active 
        ? "text-white font-bold bg-gradient-to-r from-brand/25 via-brand/10 to-transparent border border-brand/40 border-t-brand/50 shadow-[0_4px_25px_rgba(255,107,53,0.2)]" 
        : "text-gray-400 hover:text-white hover:bg-white/[0.04] hover:border-white/10 hover:translate-x-1 border border-transparent"
    )}
  >
    {/* Background Active Glow Pill */}
    {active && (
      <motion.div 
        layoutId="activeNavBackground"
        className="absolute inset-0 bg-gradient-to-r from-brand/15 via-brand/5 to-transparent rounded-2xl z-0"
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
    )}

    {/* Top Specular Glass Highlight Line */}
    {active && (
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none z-10" />
    )}

    {/* Left Active Neon Indicator Line */}
    {active && (
      <motion.div 
        layoutId="activeNavIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-gradient-to-b from-[#ff8c42] via-brand to-[#e5531b] rounded-r-full shadow-[0_0_14px_#ff6b35] z-10"
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />
    )}

    {/* Icon Container with Glow */}
    <div className={cn(
      "relative z-10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0",
      active ? "text-brand" : "text-gray-400 group-hover:text-brand"
    )}>
      <Icon size={20} className={cn("transition-all duration-300", active ? "drop-shadow-[0_0_10px_rgba(255,107,53,0.8)]" : "group-hover:drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]")} />
    </div>

    {/* Label Text - Optimized Ergonomic Typography */}
    {!collapsed && (
      <span className={cn(
        "text-[12px] 2xl:text-[13px] tracking-wide truncate transition-colors duration-200 relative z-10 flex-1",
        active ? "text-white font-extrabold" : "text-gray-400 group-hover:text-white font-medium"
      )}>
        {label}
      </span>
    )}

    {/* Notification Badge */}
    {badge && !collapsed && (
      <span className="ml-auto bg-gradient-to-r from-red-500 to-amber-500 text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse relative z-10">
        {badge}
      </span>
    )}
  </button>
);
