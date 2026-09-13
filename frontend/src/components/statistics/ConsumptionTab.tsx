import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, Download, ChevronRight, ChevronDown, 
  MapPin, User, Cpu, Calendar, Layers,
  ChevronLeft, ArrowUpDown, Filter, Zap, FileText
} from 'lucide-react';
import { useAmi } from '../../context/AmiContext';
import { format } from 'date-fns';
import { generateConsolidatedStatisticsReportPDF } from '../../utils/reports';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface ConsumptionRow {
  zoneName: string;
  userName: string;
  meterId: string;
  aliasName: string;
  yearMonth?: string;
  year?: string;
  totalMonthKwh?: number;
  totalYearKwh?: number;
  days?: Record<number, number>;
  months?: Record<number, number>;
}

export const ConsumptionTab: React.FC = () => {
  const { authFetch, addToast } = useAmi();
  
  // Filters State
  const [selectedZone, setSelectedZone] = useState<string>('NIGER');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'NIGER': true,
    'NIAMEY': true
  });
  const [zoneSearch, setZoneSearch] = useState<string>('');
  const [yearMonth, setYearMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [meterQuery, setMeterQuery] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');

  // Table Data & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<ConsumptionRow[]>([]);
  const [columnTotals, setColumnTotals] = useState<Record<number, number>>({});
  const [daysInMonth, setDaysInMonth] = useState<number>(31);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [goToPageInput, setGoToPageInput] = useState<string>('1');

  // Toggle tree node expansion
  const toggleNode = (node: string) => {
    setExpandedNodes(prev => ({ ...prev, [node]: !prev[node] }));
  };

  // Fetch consumption matrix (Quotidien vs Mensuel)
  const fetchMatrix = async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams({
        mode: reportMode,
        yearMonth,
        year: String(selectedYear),
        zone: selectedZone === 'NIGER' ? '' : selectedZone,
        meterId: meterQuery,
        username: userQuery
      });

      const res = await authFetch(`/api/statistics/consumption-matrix?${qParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      setRows(data.rows || []);
      setColumnTotals(data.columnTotals || {});
      setDaysInMonth(data.daysInMonth || 31);
      setGrandTotal(reportMode === 'monthly' ? (data.totalConsolidatedYearKwh || 0) : (data.totalConsolidatedMonthKwh || 0));
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Fetch consumption matrix error:", err);
      addToast(`Erreur lors du chargement du rapport ${reportMode === 'monthly' ? 'mensuel' : 'quotidien'}: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [reportMode, yearMonth, selectedYear, selectedZone]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (zoneSearch.trim()) {
        const zs = zoneSearch.toLowerCase();
        if (!r.zoneName.toLowerCase().includes(zs) && !r.aliasName.toLowerCase().includes(zs)) return false;
      }
      return true;
    });
  }, [rows, zoneSearch]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  // Export to CSV
  const handleExportCSV = () => {
    if (rows.length === 0) {
      addToast("Aucune donnée à exporter.", "warning");
      return;
    }

    if (reportMode === 'monthly') {
      const headers = ['Nom_Zone', 'Nom_Utilisateur', 'Numero_Compteur', 'Nom_Alias', 'Annee', ...MONTH_NAMES, 'Total_Annee_kWh'];
      const csvRows = rows.map(r => {
        const monthValues = Array.from({ length: 12 }, (_, i) => (r.months?.[i + 1] || 0).toFixed(2));
        return [
          `"${r.zoneName}"`,
          `"${r.userName}"`,
          `"${r.meterId}"`,
          `"${r.aliasName}"`,
          `"${r.year || selectedYear}"`,
          ...monthValues,
          (r.totalYearKwh || 0).toFixed(2)
        ].join(';');
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...csvRows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rapport_consommation_mensuel_${selectedZone}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Exportation du rapport mensuel CSV terminée.", "success");
    } else {
      const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}er`);
      const headers = ['Nom_Zone', 'Nom_Utilisateur', 'Numero_Compteur', 'Nom_Alias', 'Mois', ...dayHeaders, 'Total_Mois_kWh'];

      const csvRows = rows.map(r => {
        const dayValues = Array.from({ length: daysInMonth }, (_, i) => (r.days?.[i + 1] || 0).toFixed(2));
        return [
          `"${r.zoneName}"`,
          `"${r.userName}"`,
          `"${r.meterId}"`,
          `"${r.aliasName}"`,
          `"${r.yearMonth || yearMonth}"`,
          ...dayValues,
          (r.totalMonthKwh || 0).toFixed(2)
        ].join(';');
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...csvRows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `rapport_consommation_quotidien_${selectedZone}_${yearMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast("Exportation du rapport quotidien CSV terminée.", "success");
    }
  };

  // Export to Consolidated PDF Report
  const handleExportPDF = () => {
    if (rows.length === 0) {
      addToast("Aucune donnée pour générer le rapport PDF.", "warning");
      return;
    }
    try {
      generateConsolidatedStatisticsReportPDF({
        periodLabel: reportMode === 'monthly' ? `Exercice Annuel ${selectedYear}` : `Mois de ${yearMonth}`,
        reportMode,
        zone: selectedZone === 'NIGER' ? 'NIGER (National)' : selectedZone,
        rows,
        columnTotals,
        metersCount: rows.length,
        operatorName: 'Direction de la Distribution NIGELEC'
      });
      addToast("Rapport consolidé PDF généré et téléchargé avec succès !", "success");
    } catch (e: any) {
      console.error("PDF Generation error:", e);
      addToast(`Erreur lors de la génération PDF : ${e.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Filters Bar ── */}
      <div className="bg-[#14151a] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          
          {/* Date Picker Switcher based on Report Mode */}
          {reportMode === 'daily' ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-300 whitespace-nowrap">Heure de création</span>
              <input 
                type="month"
                value={yearMonth}
                onChange={e => {
                  setYearMonth(e.target.value);
                  setSelectedYear(parseInt(e.target.value.substring(0, 4), 10));
                }}
                className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-gray-300 whitespace-nowrap">Année d'exercice</span>
              <select
                value={selectedYear}
                onChange={e => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  setYearMonth(`${y}-08`);
                }}
                className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-brand outline-none cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
          )}

          {/* Numéro du compteur */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Numéro du compteur</span>
            <input 
              type="text"
              placeholder="Numéro du compteur"
              value={meterQuery}
              onChange={e => setMeterQuery(e.target.value)}
              className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none w-44 placeholder:text-gray-500"
            />
          </div>

          {/* Nom d'utilisateur */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Nom d'utilisateur</span>
            <input 
              type="text"
              placeholder="Nom d'utilisateur"
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white focus:border-brand outline-none w-40 placeholder:text-gray-500"
            />
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={fetchMatrix}
              className="px-3.5 py-2 bg-[#20222a] hover:bg-white/10 text-white rounded-xl border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Search size={13} className="text-gray-300" /> Rechercher
            </button>
            <button 
              onClick={fetchMatrix}
              className="px-3.5 py-2 bg-[#20222a] hover:bg-white/10 text-white rounded-xl border border-white/15 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : "text-gray-300"} /> Actualiser
            </button>
            <button 
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
            >
              <Download size={13} /> CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
            >
              <FileText size={13} /> Rapport PDF Consolidé
            </button>
          </div>
        </div>

        {/* View Mode Toggle: [RAPPORT QUOTIDIEN] vs [RAPPORT MENSUEL] */}
        <div className="flex justify-end pt-2 border-t border-white/5">
          <div className="inline-flex rounded-xl overflow-hidden border border-white/10 shadow-md">
            <button 
              onClick={() => setReportMode('daily')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                reportMode === 'daily' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                  : 'bg-white text-gray-900 hover:bg-gray-100 font-bold'
              }`}
            >
              RAPPORT QUOTIDIEN
            </button>
            <button 
              onClick={() => setReportMode('monthly')}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                reportMode === 'monthly' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md' 
                  : 'bg-white text-gray-900 hover:bg-gray-100 font-bold'
              }`}
            >
              RAPPORT MENSUEL
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Tree View (Left) + Matrix Table (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Panel: Zone Tree Hierarchy (3 cols) ── */}
        <div className="lg:col-span-3 bg-[#14151a] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="relative">
            <Search size={14} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Zone..."
              value={zoneSearch}
              onChange={e => setZoneSearch(e.target.value)}
              className="w-full bg-[#1c1e26] border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1 text-xs font-bold select-none max-h-[550px] overflow-y-auto custom-scrollbar">
            
            {/* Root: NIGER */}
            <div>
              <div 
                onClick={() => { setSelectedZone('NIGER'); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                  selectedZone === 'NIGER' ? 'bg-brand/20 text-brand font-black' : 'text-gray-200 hover:bg-white/5'
                }`}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleNode('NIGER'); }}
                  className="text-gray-400 hover:text-white"
                >
                  {expandedNodes['NIGER'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <Layers size={14} className="text-brand" />
                <span className="uppercase tracking-wider">NIGER (National)</span>
              </div>

              {/* Sub-regions of NIGER */}
              {expandedNodes['NIGER'] && (
                <div className="ml-4 pl-2 border-l border-white/10 space-y-1 mt-1">
                  
                  {/* NIAMEY & its sub-nodes */}
                  <div>
                    <div 
                      onClick={() => { setSelectedZone('NIAMEY'); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                        selectedZone === 'NIAMEY' ? 'bg-brand/20 text-brand font-black' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleNode('NIAMEY'); }}
                        className="text-gray-400 hover:text-white"
                      >
                        {expandedNodes['NIAMEY'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <MapPin size={12} className="text-cyan-400" />
                      <span>NIAMEY</span>
                    </div>

                    {/* Agence / DCU CUNI under NIAMEY */}
                    {expandedNodes['NIAMEY'] && (
                      <div className="ml-5 pl-2 border-l border-white/10 space-y-1 mt-1">
                        <div 
                          onClick={() => setSelectedZone('CUNI')}
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                            selectedZone === 'CUNI' ? 'bg-brand text-white font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                          <span>CUNI (Direction Centrale)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DOSSO */}
                  <div 
                    onClick={() => setSelectedZone('DOSSO')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                      selectedZone === 'DOSSO' ? 'bg-brand/20 text-brand font-black' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ml-3"></span>
                    <span>DOSSO</span>
                  </div>

                  {['MARADI', 'ZINDER', 'AGADEZ', 'TAHOUA', 'TILLABERI', 'DIFFA'].map(r => (
                    <div 
                      key={r}
                      onClick={() => setSelectedZone(r)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
                        selectedZone === r ? 'bg-brand/20 text-brand font-black' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ml-3"></span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Matrix Table (Daily vs Monthly) ── */}
        <div className="lg:col-span-9 bg-[#14151a] rounded-3xl border border-white/10 shadow-xl overflow-hidden flex flex-col">
          
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-xs font-black uppercase">
                Zone Active : {selectedZone}
              </span>
              <span className="text-xs text-gray-300 font-bold">
                {reportMode === 'monthly' ? (
                  <>Année : <span className="text-amber-300 font-mono font-black">{selectedYear}</span> (Rapport Mensuel)</>
                ) : (
                  <>Mois : <span className="text-white font-mono font-black">{yearMonth}</span> (Rapport Quotidien)</>
                )}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-bold">
              {filteredRows.length} Compteur(s) raccordé(s)
            </div>
          </div>

          {/* ── Scrollable Table ── */}
          <div className="overflow-x-auto custom-scrollbar">
            {reportMode === 'monthly' ? (
              /* ── TABLEAU RAPPORT MENSUEL (12 MOIS) ── */
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-[#1c1e26] border-b border-white/10 text-[11px] font-black text-orange-400 uppercase tracking-wider">
                    <th className="p-3 pl-4 whitespace-nowrap">Nom de la zone ⇅</th>
                    <th className="p-3 whitespace-nowrap">Nom d'utilisateur ⇅</th>
                    <th className="p-3 whitespace-nowrap">Numéro du compteur</th>
                    <th className="p-3 whitespace-nowrap">Nom alias</th>
                    <th className="p-3 whitespace-nowrap">Année</th>
                    {MONTH_NAMES.map((mName, i) => (
                      <th key={i + 1} className="p-2 text-center font-mono min-w-[65px] whitespace-nowrap">
                        {mName}
                      </th>
                    ))}
                    <th className="p-3 text-right bg-white/5 font-mono text-amber-300 whitespace-nowrap">
                      Total Année (kWh)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={18} className="p-12 text-center text-gray-400">
                        Aucune donnée de consommation mensuelle enregistrée pour cette sélection ({selectedZone} · {selectedYear}).
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r) => (
                      <tr key={r.meterId} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-3 pl-4 font-bold text-white uppercase whitespace-nowrap">
                          {r.zoneName}
                        </td>
                        <td className="p-3 font-sans font-bold text-gray-200 whitespace-nowrap">
                          {r.userName}
                        </td>
                        <td className="p-3 font-bold text-cyan-300 whitespace-nowrap">
                          {r.meterId}
                        </td>
                        <td className="p-3 font-sans text-gray-300 whitespace-nowrap">
                          {r.aliasName}
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {r.year || selectedYear}
                        </td>
                        {MONTH_NAMES.map((_, i) => {
                          const mVal = r.months?.[i + 1] || 0;
                          return (
                            <td 
                              key={i + 1} 
                              className="p-2 text-center text-gray-300 font-mono"
                            >
                              {mVal.toFixed(2)}
                            </td>
                          );
                        })}
                        <td className="p-3 text-right font-black text-amber-300 bg-white/5 whitespace-nowrap">
                          {(r.totalYearKwh || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Totals Mensuels */}
                {paginatedRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#1c1e26] border-t-2 border-brand/40 text-xs font-black">
                      <td colSpan={5} className="p-3 pl-4 text-brand uppercase">
                        TOTAL CONSOLIDÉ ANNUEL DE LA ZONE (kWh)
                      </td>
                      {MONTH_NAMES.map((_, i) => {
                        const colSum = columnTotals[i + 1] || 0;
                        return (
                          <td key={i + 1} className="p-2 text-center text-orange-400 font-mono">
                            {colSum.toFixed(2)}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right text-amber-300 font-mono bg-brand/10">
                        {grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            ) : (
              /* ── TABLEAU RAPPORT QUOTIDIEN (31 JOURS) ── */
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-[#1c1e26] border-b border-white/10 text-[11px] font-black text-orange-400 uppercase tracking-wider">
                    <th className="p-3 pl-4 whitespace-nowrap">Nom de la zone ⇅</th>
                    <th className="p-3 whitespace-nowrap">Nom d'utilisateur ⇅</th>
                    <th className="p-3 whitespace-nowrap">Numéro du compteur</th>
                    <th className="p-3 whitespace-nowrap">Nom alias</th>
                    <th className="p-3 whitespace-nowrap">Mois</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i + 1} className="p-2 text-center font-mono min-w-[40px] whitespace-nowrap">
                        {i + 1 === 1 ? '1er' : `${i + 1}e`}
                      </th>
                    ))}
                    <th className="p-3 text-right bg-white/5 font-mono text-amber-300 whitespace-nowrap">
                      Total Mois (kWh)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6 + daysInMonth} className="p-12 text-center text-gray-400">
                        Aucune donnée de consommation journalière enregistrée pour cette sélection ({selectedZone} · {yearMonth}).
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r) => (
                      <tr key={r.meterId} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-3 pl-4 font-bold text-white uppercase whitespace-nowrap">
                          {r.zoneName}
                        </td>
                        <td className="p-3 font-sans font-bold text-gray-200 whitespace-nowrap">
                          {r.userName}
                        </td>
                        <td className="p-3 font-bold text-cyan-300 whitespace-nowrap">
                          {r.meterId}
                        </td>
                        <td className="p-3 font-sans text-gray-300 whitespace-nowrap">
                          {r.aliasName}
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {r.yearMonth}
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayVal = r.days?.[i + 1] || 0;
                          return (
                            <td 
                              key={i + 1} 
                              className="p-2 text-center text-gray-300 font-mono"
                            >
                              {dayVal.toFixed(2)}
                            </td>
                          );
                        })}
                        <td className="p-3 text-right font-black text-amber-300 bg-white/5 whitespace-nowrap">
                          {(r.totalMonthKwh || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Footer Totals Quotidiens */}
                {paginatedRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#1c1e26] border-t-2 border-brand/40 text-xs font-black">
                      <td colSpan={5} className="p-3 pl-4 text-brand uppercase">
                        TOTAL CONSOLIDÉ DU MOIS (kWh)
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const colSum = columnTotals[i + 1] || 0;
                        return (
                          <td key={i + 1} className="p-2 text-center text-orange-400 font-mono">
                            {colSum.toFixed(2)}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right text-amber-300 font-mono bg-brand/10">
                        {grandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>

          {/* ── Table Pagination Footer ── */}
          <div className="p-4 border-t border-white/10 bg-[#181a22] flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-gray-300">
            <div className="flex items-center gap-4">
              <span>Total {filteredRows.length}</span>
              <select 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-[#242630] border border-white/15 rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer"
              >
                <option value={10}>10/page</option>
                <option value={20}>20/page</option>
                <option value={50}>50/page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[#242630] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 rounded-lg bg-brand text-white font-black">
                {currentPage}
              </span>

              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[#242630] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-white"
              >
                <ChevronRight size={16} />
              </button>

              <span className="ml-2">Aller à</span>
              <input 
                type="number"
                min={1}
                max={totalPages}
                value={goToPageInput}
                onChange={e => setGoToPageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const p = parseInt(goToPageInput, 10);
                    if (p >= 1 && p <= totalPages) setCurrentPage(p);
                  }
                }}
                className="w-12 bg-[#242630] border border-white/15 rounded-lg px-2 py-1 text-center text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
