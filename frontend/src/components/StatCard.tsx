import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

export const StatCard = ({ title, value, unit, icon: Icon, trend, color }: StatCardProps) => (
  <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
    {/* Micro-lueur volumétrique d'angle coordonnée à la couleur de la carte */}
    <div className={cn("absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity", color)} />
    
    {/* Liseré supérieur réfléchissant façon verre trempé */}
    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl bg-opacity-15 backdrop-blur-md shadow-inner border border-white/5", color)}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 backdrop-blur-sm")}>
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-white tracking-tight">
        {value} <span className="text-sm font-normal text-gray-400 uppercase tracking-normal">{unit}</span>
      </h3>
    </div>
  </div>
);
