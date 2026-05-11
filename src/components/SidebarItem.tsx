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
}

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
      active 
        ? "text-brand shadow-[0_4px_20px_rgba(255,107,53,0.15)]" 
        : "text-gray-400 hover:text-white hover:bg-white/5"
    )}
  >
    {active && (
       <div className="absolute inset-0 bg-gradient-to-r from-brand/10 to-niger-green/5 opacity-100" />
    )}
    <Icon 
      size={20} 
      className={cn(
        "transition-transform duration-300 group-hover:scale-110 relative z-10", 
        active ? "text-brand" : "group-hover:text-white"
      )} 
    />
    <span className={cn("font-medium relative z-10", active && "text-white")}>{label}</span>
    {badge && (
      <span className="ml-auto bg-brand/20 text-brand text-[10px] font-bold px-2 py-0.5 rounded-full relative z-10">
        {badge}
      </span>
    )}
    {active && (
      <>
        <motion.div 
          layoutId="activeTab"
          className="absolute left-0 w-1 h-6 bg-gradient-to-b from-brand to-niger-green rounded-r-full"
        />
        <div className="absolute inset-0 border border-brand/20 rounded-xl" />
      </>
    )}
  </button>
);
