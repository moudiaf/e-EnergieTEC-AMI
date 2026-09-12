import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Coins, TrendingUp, ShieldCheck, Download, 
  Smartphone, CreditCard, PieChart as PieIcon, BarChart3,
  Search, RefreshCw, FileText, CheckCircle2
} from 'lucide-react';
import { useAmi } from '../../context/AmiContext';
import { format } from 'date-fns';
import { generateConsolidatedStatisticsReportPDF } from '../../utils/reports';

export const FinancialTab: React.FC = () => {
  const { authFetch, addToast, regions } = useAmi();
  const [yearMonth, setYearMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchFinancials = async () => {
    setIsLoading(true);
    try {
      const qParams = new URLSearchParams({
        yearMonth,
        regionId: selectedRegion
      });

      const res = await authFetch(`/api/statistics/financial-summary?${qParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Fetch financials error:", err);
      addToast(`Erreur de chargement financier : ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [yearMonth, selectedRegion]);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Categorie', 'Designation', 'Montant_FCFA', 'Volume_kWh'];
    const rows = [
      ['KPI', 'Chiffre_Affaires_Total', data.totalRevenueFcfa, data.totalKwhVended],
      ['KPI', 'Prix_Moyen_kWh', data.avgPricePerKwh, '-'],
      ['Fiscalite', 'Part_Energie_HT', data.taxBreakdown?.partEnergieHT || 0, '-'],
      ['Fiscalite', 'TVA_19_Pct', data.taxBreakdown?.montantTVA || 0, '-'],
      ['Fiscalite', 'Taxe_ORTN', data.taxBreakdown?.taxeORTN || 0, '-'],
      ['Fiscalite', 'Taxe_Habitat', data.taxBreakdown?.taxeHabitat || 0, '-']
    ];

    (data.operators || []).forEach((op: any) => {
      rows.push(['Canal_Paiement', op.name, op.amount, op.count]);
    });

    (data.tariffs || []).forEach((tf: any) => {
      rows.push(['Segment_Tarifaire', tf.name, tf.amount, tf.kwh]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bilan_financier_nigelec_${yearMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exportation financière CSV réussie.", "success");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Filters Bar ── */}
      <div className="bg-[#14151a] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          
          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Période d'Analyse</span>
            <input 
              type="month"
              value={yearMonth}
              onChange={e => setYearMonth(e.target.value)}
              className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:border-brand outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-300 whitespace-nowrap">Direction Régionale</span>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="bg-[#242630] border border-white/15 rounded-xl px-3 py-2 text-white outline-none cursor-pointer uppercase"
            >
              <option value="ALL">🌐 Toutes les Régions (National)</option>
              <option value="NIAMEY">📍 Niamey (Capitale)</option>
              <option value="AGADEZ">📍 Agadez (Nord)</option>
              <option value="MARADI">📍 Maradi (Sud)</option>
              <option value="ZINDER">📍 Zinder (Est)</option>
              <option value="TAHOUA">📍 Tahoua (Centre)</option>
              <option value="TILLABERI">📍 Tillabéri (Ouest)</option>
              <option value="DOSSO">📍 Dosso (Sud-Ouest)</option>
              <option value="DIFFA">📍 Diffa (Extrême-Est)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={fetchFinancials}
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
              onClick={() => {
                if (!data) return;
                try {
                  generateConsolidatedStatisticsReportPDF({
                    periodLabel: `Mois de ${yearMonth}`,
                    reportMode: 'monthly',
                    zone: selectedRegion === 'ALL' ? 'NIGER (National)' : selectedRegion,
                    rows: [],
                    columnTotals: {},
                    financialSummary: data,
                    metersCount: 2,
                    operatorName: 'Direction Financière NIGELEC'
                  });
                  addToast("Bilan financier officiel PDF généré avec succès !", "success");
                } catch (e: any) {
                  addToast(`Erreur génération PDF : ${e.message}`, "error");
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-lg"
            >
              <FileText size={13} /> Bilan Financier PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Chiffre d'Affaires Total</span>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Coins size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono">
            {(data?.totalRevenueFcfa || 0).toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-sans">FCFA</span>
          </p>
          <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> Recettes STS Consolidées
          </p>
        </div>

        <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Énergie Vendue (kWh)</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-cyan-300 font-mono">
            {(data?.totalKwhVended || 0).toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-sans">kWh</span>
          </p>
          <p className="text-xs text-gray-400 font-bold mt-1">Crédit Émis par Jetons STS</p>
        </div>

        <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Prix Moyen Effectif</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono">
            {data?.avgPricePerKwh || 98} <span className="text-sm text-gray-400 font-sans">FCFA/kWh</span>
          </p>
          <p className="text-xs text-gray-400 font-bold mt-1">Rendement Économique Moyen</p>
        </div>

        <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">TVA & Taxes Collectées</span>
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-300 font-mono">
            {((data?.taxBreakdown?.montantTVA || 0) + (data?.taxBreakdown?.taxeORTN || 0)).toLocaleString('fr-FR')} <span className="text-sm text-gray-400 font-sans">FCFA</span>
          </p>
          <p className="text-xs text-gray-400 font-bold mt-1">TVA 19% + Taxe ORTN NIGER</p>
        </div>
      </div>

      {/* ── 2 Main Analytical Panels: Tax Waterfall & Payment Operators ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Cascade Fiscale NIGELEC (7 cols) */}
        <div className="lg:col-span-7 bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <FileText size={18} className="text-brand" /> Décomposition Fiscale & Réglementaire (NIGELEC)
            </h4>
            <span className="px-2.5 py-1 rounded bg-white/5 text-gray-300 text-xs font-mono font-bold">
              Grille Officielle 2024
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Part Énergie Pure Hors Taxes (HT)', val: data?.taxBreakdown?.partEnergieHT || 0, desc: 'Revenu d\'exploitation net', color: 'text-white' },
              { label: 'TVA Nationale (19%)', val: data?.taxBreakdown?.montantTVA || 0, desc: 'Reversement Direction Générale des Impôts', color: 'text-purple-300' },
              { label: 'Taxe Audiovisuelle ORTN (3 FCFA / kWh)', val: data?.taxBreakdown?.taxeORTN || 0, desc: 'Redevance Télévision Nationale', color: 'text-amber-300' },
              { label: 'Taxe Municipale d\'Habitat (200 F / quittance)', val: data?.taxBreakdown?.taxeHabitat || 0, desc: 'Collectivités Territoriales du Niger', color: 'text-cyan-300' },
              { label: 'Prime Fixe d\'Entretien Réseau & Compteur', val: data?.taxBreakdown?.primeFixeTotale || 0, desc: 'Quote-part d\'infrastructure mensuelle', color: 'text-emerald-400' },
            ].map((row, idx) => (
              <div key={idx} className="p-3.5 bg-[#1c1e26] rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-200">{row.label}</p>
                  <p className="text-[10px] text-gray-400">{row.desc}</p>
                </div>
                <span className={`text-base font-mono font-black ${row.color}`}>
                  {row.val.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Réconciliation Multi-Canaux Mobile Money (+227) (5 cols) */}
        <div className="lg:col-span-5 bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Smartphone size={18} className="text-emerald-400" /> Canaux d'Encaissement (+227)
            </h4>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
              Mobile Money
            </span>
          </div>

          <div className="space-y-3">
            {(data?.operators || []).map((op: any) => (
              <div key={op.name} className="p-3.5 bg-[#1c1e26] rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-brand">
                    {op.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{op.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{op.count} transaction(s)</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-sm font-black text-white">{op.amount.toLocaleString('fr-FR')} FCFA</p>
                  <span className="text-[10px] font-bold text-emerald-400">{op.percentage}% du total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Segment Breakdown Table (6 Segments NIGELEC) ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 bg-[#1c1e26] border-b border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Répartition par Segment Tarifaire NIGELEC
            </h4>
            <p className="text-xs text-gray-400">Ventilation de l'énergie et des recettes par catégorie d'abonnés</p>
          </div>
          <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-xs font-black uppercase">
            6 Catégories Homologuées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-xs font-black text-orange-400 uppercase">
                <th className="p-3.5 pl-6">Code Segment</th>
                <th className="p-3.5">Désignation Segment</th>
                <th className="p-3.5 text-center">Transactions STS</th>
                <th className="p-3.5 text-right">Volume Vendu (kWh)</th>
                <th className="p-3.5 pr-6 text-right">Chiffre d'Affaires (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {[
                { code: 'TS', name: 'Tarif Social (Basse Tension)', count: 0, kwh: 0, amount: 0 },
                { code: 'BT-D', name: 'Basse Tension Domestique', count: data?.tariffs?.find((t: any) => t.name === 'BT-D')?.count || 0, kwh: data?.tariffs?.find((t: any) => t.name === 'BT-D')?.kwh || 0, amount: data?.tariffs?.find((t: any) => t.name === 'BT-D')?.amount || 0 },
                { code: 'BT-P', name: 'Basse Tension Professionnelle', count: 0, kwh: 0, amount: 0 },
                { code: 'MT-G', name: 'Moyenne Tension Générale', count: 0, kwh: 0, amount: 0 },
                { code: 'HT', name: 'Haute Tension Industrielle', count: 0, kwh: 0, amount: 0 },
                { code: 'EP', name: 'Éclairage Public Municipal', count: 0, kwh: 0, amount: 0 }
              ].map(row => (
                <tr key={row.code} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3.5 pl-6 font-bold text-brand uppercase">{row.code}</td>
                  <td className="p-3.5 font-sans font-bold text-white">{row.name}</td>
                  <td className="p-3.5 text-center text-gray-300">{row.count}</td>
                  <td className="p-3.5 text-right text-cyan-300 font-bold">{row.kwh.toLocaleString('fr-FR')} kWh</td>
                  <td className="p-3.5 pr-6 text-right text-amber-300 font-black">{row.amount.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
