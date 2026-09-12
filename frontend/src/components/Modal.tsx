import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#121318] border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden z-10 my-auto"
        >
          {/* Header Sticky */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 bg-white/[0.03] shrink-0">
            <h3 className="text-lg md:text-xl font-black text-white tracking-wide">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              title="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
