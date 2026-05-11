import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[200] space-y-3 pointer-events-none flex flex-col items-end">
    <AnimatePresence mode="popLayout">
      {toasts.map(t => (
        <motion.div
          key={t.id}
          layout
          initial={{ x: 100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className={cn(
            "p-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl pointer-events-auto min-w-[320px] max-w-[400px]",
            t.type === 'success' ? "bg-green-500/10 border-green-500/30 text-green-400" :
            t.type === 'error' ? "bg-red-500/10 border-red-500/30 text-red-400" :
            "bg-blue-500/10 border-blue-500/30 text-blue-400"
          )}
        >
          <div className={cn(
            "p-2.5 rounded-xl shrink-0",
            t.type === 'success' ? "bg-green-500/20 text-green-500" :
            t.type === 'error' ? "bg-red-500/20 text-red-500" :
            "bg-blue-500/20 text-blue-500"
          )}>
            {t.type === 'success' ? <CheckCircle2 size={20} /> :
             t.type === 'error' ? <AlertTriangle size={20} /> :
             <Info size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Notification {t.type}</p>
            <p className="text-sm font-bold leading-tight">{t.message}</p>
          </div>
          <X size={14} className="opacity-20 hover:opacity-100 cursor-pointer transition-opacity" />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
