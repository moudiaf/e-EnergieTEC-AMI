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
        ? "text-white font-bold bg-gradient-to-r from-brand/20 via-brand/10 to-transparent border border-brand/30 shadow-[0_0_25px_rgba(255,107,53,0.15)]" 
        : "text-gray-300 hover:text-white hover:bg-white/[0.05] border border-transparent"
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

    {/* Left Active Neon Indicator Line */}
    {active && (
      <motion.div 
        layoutId="activeNavIndicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-brand to-[#ff8c42] rounded-r-full shadow-[0_0_12px_#ff6b35] z-10"
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />
    )}

    {/* Icon Container with Glow */}
    <div className={cn(
      "relative z-10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0",
      active ? "text-brand" : "text-gray-400 group-hover:text-white"
    )}>
      <Icon size={20} className={cn("transition-all duration-300", active && "drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]")} />
    </div>

    {/* Label Text - Optimized Ergonomic Typography (12px / 13.5px) */}
    {!collapsed && (
      <span className={cn(
        "text-[12px] 2xl:text-[13.5px] font-semibold tracking-wide truncate transition-colors duration-200 relative z-10 flex-1",
        active ? "text-white font-extrabold" : "text-gray-300 group-hover:text-white"
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
