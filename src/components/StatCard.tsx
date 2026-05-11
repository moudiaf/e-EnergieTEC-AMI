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
  <div className="glass-panel p-6 rounded-2xl group hover:border-brand/50 transition-all duration-500">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl bg-opacity-10", color)}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className={cn("text-xs font-bold px-2 py-1 rounded-lg bg-green-500/10 text-green-400 flex items-center gap-1")}>
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-gray-400 text-sm mb-1">{title}</p>
    <h3 className="text-3xl font-bold text-white tracking-tight">
      {value} <span className="text-sm font-normal text-gray-500 uppercase">{unit}</span>
    </h3>
  </div>
);
