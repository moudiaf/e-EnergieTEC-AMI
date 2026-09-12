import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Search, RefreshCw, Download, Calendar, Activity, Zap, TrendingUp, Info, FileText } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';
import { format } from 'date-fns';
import { generateConsolidatedStatisticsReportPDF } from '../../utils/reports';

export const AnalysisTab: React.FC = () => {
  const { authFetch, addToast, meters } = useAmi();

  // Filters State
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');
  const [yearMonth, setYearMonth] = useState<string>(() => format(new Date(), 'yyyy-MM')); // e.g. '2026-08'
  const [year, setYear] = useState<string>(() => format(new Date(), 'yyyy')); // e.g. '2026'
  const [selectedMeterId, setSelectedMeterId] = useState<string>(() => meters[0]?.id || '0128260224778');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Sync default meter when meters load
  useEffect(() => {
    if (meters.length > 0 && !meters.some(m => m.id === selectedMeterId)) {
      setSelectedMeterId(meters[0].id);
    }
  }, [meters]);

  // Fetch Analysis series from backend
  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams({
        meterId: selectedMeterId,
        mode: reportMode,
        yearMonth,
        year
      });

      const res = await authFetch(`/api/statistics/meter-analysis?${qParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSeriesData(data.series || []);
    } catch (err: any) {
      console.error("Fetch analysis error:", err);
      addToast(`Erreur de chargement de l'analyse : ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [reportMode, yearMonth, year, selectedMeterId]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (reportMode === 'daily') {
      return seriesData.map(item => ({
        name: item.dateLabel,
        'Ce mois': item.thisMonthKwh,
        'Le mois dernier': item.lastMonthKwh,
        'YoY': item.yoyRatioPct
      }));
    } else {
      return seriesData.map(item => ({
        name: item.monthName,
        'Cette année': item.thisYearKwh,
        'L\'année dernière': item.lastYearKwh,
        'YoY': item.yoyRatioPct
      }));
    }
  }, [seriesData, reportMode]);

  // Custom Chart Tooltip strictly matching reference screenshot
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1c1e26]/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
          <p className="font-bold text-white border-b border-white/10 pb-1 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300 font-sans">{entry.name}:</span>
              <span className="font-bold text-white">
                {entry.value} {entry.name === 'YoY' ? '%' : 'kWh'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Top Filters Bar (Matching Screenshot) ── */}
      <div className="bg-[#14151a] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          
          {/* Heure de création */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Heure de création</span>
            {reportMode === 'daily' ? (
              <input 
                type="month"
                value={yearMonth}
                onChange={e => setYearMonth(e.target.value)}
                className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none"
              />
            ) : (
              <input 
                type="number"
                min="2020"
                max="2030"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none w-28"
              />
            )}
          </div>

          {/* Numéro du compteur */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Numéro du compteur</span>
            <div className="relative">
              <input 
                type="text"
                value={selectedMeterId}
                onChange={e => setSelectedMeterId(e.target.value)}
                className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none w-48"
              />
            </div>
            
            {/* Quick dropdown for existing meters */}
            <select
              value={selectedMeterId}
              onChange={e => setSelectedMeterId(e.target.value)}
              className="bg-[#1c1e26] border border-white/15 rounded-xl px-2.5 py-2 text-xs font-mono text-cyan-300 outline-none cursor-pointer"
            >
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} ({m.phaseType === 'triphase' ? '3φ' : '1φ'})
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Rechercher */}
          <button 
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-[#20222a] hover:bg-white/10 text-white rounded-xl border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
          >
            <Search size={13} className="text-gray-300" /> Rechercher
          </button>

          {/* Bouton Export PDF */}
          <button 
            onClick={() => {
              if (seriesData.length === 0) {
                addToast("Aucune donnée analytique à exporter.", "warning");
                return;
              }
              try {
                generateConsolidatedStatisticsReportPDF({
                  periodLabel: reportMode === 'monthly' ? `Exercice Annuel ${year}` : `Mois de ${yearMonth}`,
                  reportMode,
                  zone: `Compteur ${selectedMeterId}`,
                  rows: [],
                  columnTotals: {},
                  analysisSeries: seriesData,
                  metersCount: 1,
                  operatorName: 'Division Analyse & Diagnostic NIGELEC'
                });
                addToast("Rapport d'analyse PDF généré avec succès !", "success");
              } catch (e: any) {
                addToast(`Erreur export PDF : ${e.message}`, "error");
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
          >
            <FileText size={13} /> Rapport PDF
          </button>

          {/* Mode Switcher Buttons */}
          <div className="ml-auto inline-flex rounded-xl overflow-hidden border border-white/10 shadow-md">
            <button 
              onClick={() => setReportMode('daily')}
              className={`px-5 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                reportMode === 'daily' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              Rapport quotidien
            </button>
            <button 
              onClick={() => setReportMode('monthly')}
              className={`px-5 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                reportMode === 'monthly' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              Rapport mensuel
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive Recharts Dual-Axis Chart (Matching Images 1, 4, 5) ── */}
      <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-2xl relative">
        
        {/* Custom Legend */}
        <div className="flex items-center gap-6 mb-4 text-xs font-bold">
          {reportMode === 'daily' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#38bdf8]"></span>
                <span className="text-gray-200">Ce mois</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#22c55e]"></span>
                <span className="text-gray-200">Le mois dernier</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
                <span className="text-gray-200">YoY (Ratio %)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#38bdf8]"></span>
                <span className="text-gray-200">Cette année ({year})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#22c55e]"></span>
                <span className="text-gray-200">L'année dernière ({Number(year) - 1})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
                <span className="text-gray-200">YoY (Ratio %)</span>
              </div>
            </>
          )}
        </div>

        {/* Chart Container */}
        <div className="h-[340px] w-full min-w-0" style={{ minWidth: 0 }}>
          <ResponsiveContainer width="100%" height={340} minWidth={0} debounce={50}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3d" vertical={false} />
              
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                interval={0}
              />
              
              {/* Left Axis: Energy (kWh) */}
              <YAxis 
                yAxisId="left" 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 'auto']}
              />
              
              {/* Right Axis: YoY Ratio (%) */}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#f97316"
                tick={{ fill: '#f97316', fontSize: 11 }}
                unit="%"
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Bars and Line according to mode */}
              {reportMode === 'daily' ? (
                <>
                  <Bar yAxisId="left" dataKey="Ce mois" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar yAxisId="left" dataKey="Le mois dernier" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Line yAxisId="right" type="monotone" dataKey="YoY" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </>
              ) : (
                <>
                  <Bar yAxisId="left" dataKey="Cette année" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar yAxisId="left" dataKey="L'année dernière" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="YoY" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Analytical Synchronized Table (Strictly matching Images 1, 2, 4, 5) ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Table Title Banner */}
        <div className="p-4 bg-[#1c1e26] border-b border-white/10 text-center">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            Rapport d'analyse de la consommation d'énergie
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-xs font-black text-orange-400 uppercase">
                <th className="p-3.5 pl-6">{reportMode === 'daily' ? 'Date' : 'Mois'}</th>
                <th className="p-3.5 text-center">Taux (%)</th>
                <th className="p-3.5 text-center">
                  {reportMode === 'daily' ? 'Ce mois (kWh)' : 'Cette année (kWh)'}
                </th>
                <th className="p-3.5 pr-6 text-center">
                  {reportMode === 'daily' ? 'Le mois dernier (kWh)' : "L'année dernière (kWh)"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {seriesData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Aucune donnée analytique disponible.
                  </td>
                </tr>
              ) : (
                seriesData.map((item, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  const label = reportMode === 'daily' ? item.dateLabel : item.monthName;
                  const currentVal = reportMode === 'daily' ? item.thisMonthKwh : item.thisYearKwh;
                  const prevVal = reportMode === 'daily' ? item.lastMonthKwh : item.lastYearKwh;

                  return (
                    <tr 
                      key={idx}
                      onClick={() => setSelectedRowIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-[#3b2d20] border-l-4 border-brand text-white font-bold' 
                          : 'hover:bg-white/[0.03] text-gray-300'
                      }`}
                    >
                      <td className="p-3 pl-6 font-bold text-white">{label}</td>
                      <td className="p-3 text-center font-bold text-orange-400">{item.yoyRatioPct}%</td>
                      <td className="p-3 text-center text-cyan-300 font-bold">{currentVal.toFixed(2)}</td>
                      <td className="p-3 pr-6 text-center text-emerald-400 font-bold">{prevVal.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
