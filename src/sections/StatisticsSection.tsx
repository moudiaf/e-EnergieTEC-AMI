import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, DollarSign, Layers, Key, 
  FileText, Clock, Zap, Radio, ChevronRight, Download
} from 'lucide-react';
import { useAmi } from '../context/AmiContext';
import { ConsumptionTab } from '../components/statistics/ConsumptionTab';
import { AnalysisTab } from '../components/statistics/AnalysisTab';
import { FinancialTab } from '../components/statistics/FinancialTab';
import { StsTestTokenTab } from '../components/statistics/StsTestTokenTab';
import { EventLogsTab } from '../components/statistics/EventLogsTab';
import { SystemTasksTab } from '../components/statistics/SystemTasksTab';
import { LoadControlTab } from '../components/statistics/LoadControlTab';
import { ObisTab } from '../components/statistics/ObisTab';
import { generateConsolidatedStatisticsReportPDF } from '../utils/reports';

export const StatisticsSection: React.FC = () => {
  const { authFetch, addToast, meters } = useAmi();
  const [activeTab, setActiveTab] = useState<string>('consumption');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Complete suite of tabs matching the reference system workspace (Images 3, 4, 5)
  const TABS = [
    { id: 'consumption', label: 'Consommation', icon: Layers },
    { id: 'analysis', label: 'Analyse', icon: TrendingUp },
    { id: 'financial', label: 'Financier', icon: DollarSign },
    { id: 'sts-test', label: 'Token de test STS', icon: Key },
    { id: 'events', label: 'Enregistrement', icon: FileText },
    { id: 'tasks', label: 'Tâche Du Système', icon: Clock },
    { id: 'load-control', label: 'Contrôle De Charge', icon: Zap },
    { id: 'obis', label: 'OBIS', icon: Radio },
  ];

  const handleDownloadMasterPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      // Récupérer la matrice mensuelle nationale et le bilan financier
      const [resMatrix, resFin] = await Promise.all([
        authFetch('/api/statistics/consumption-matrix?mode=monthly&year=2026'),
        authFetch('/api/statistics/financial-summary?yearMonth=2026-08&regionId=ALL')
      ]);

      const dataMatrix = await resMatrix.json();
      const dataFin = await resFin.json();

      generateConsolidatedStatisticsReportPDF({
        periodLabel: 'Exercice Annuel 2026 / Clôture Mensuelle',
        reportMode: 'monthly',
        zone: 'NIGER (Territoire National)',
        rows: dataMatrix.rows || [],
        columnTotals: dataMatrix.columnTotals || {},
        financialSummary: dataFin,
        metersCount: meters.length || 2,
        operatorName: 'Direction Générale NIGELEC & HES Sovereign'
      });

      addToast("Grand Rapport National Consolidé PDF généré avec succès !", "success");
    } catch (e: any) {
      console.error("Master PDF error:", e);
      addToast(`Erreur lors de la génération du rapport national : ${e.message}`, "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 text-white"
    >
      {/* ── Top Bar: Navigation Tabs + Master PDF Action ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Horizontal Tab Bar */}
        <div className="bg-[#101116] rounded-2xl border border-white/10 p-1.5 shadow-xl flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 min-w-[300px]">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg border border-orange-400/40' 
                    : 'bg-[#181a22] text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Master PDF Export Button */}
        <button
          onClick={handleDownloadMasterPDF}
          disabled={isGeneratingPdf}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl border border-emerald-400/40 shadow-xl flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <FileText size={15} className={isGeneratingPdf ? "animate-spin text-white" : "text-emerald-200"} />
          <span>{isGeneratingPdf ? "Génération PDF..." : "📄 Rapport Consolidé National (PDF)"}</span>
        </button>
      </div>

      {/* ── Active Tab Component Rendering ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'consumption' && <ConsumptionTab />}
          {activeTab === 'analysis' && <AnalysisTab />}
          {activeTab === 'financial' && <FinancialTab />}
          {activeTab === 'sts-test' && <StsTestTokenTab />}
          {activeTab === 'events' && <EventLogsTab />}
          {activeTab === 'tasks' && <SystemTasksTab />}
          {activeTab === 'load-control' && <LoadControlTab />}
          {activeTab === 'obis' && <ObisTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
