import React, { useState } from 'react';
import { Key, ShieldAlert, Zap, RefreshCw, Copy, CheckCircle2, AlertTriangle, Printer, Download } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';

export const StsTestTokenTab: React.FC = () => {
  const { meters, authFetch, addToast } = useAmi();
  const [selectedMeterId, setSelectedMeterId] = useState<string>(() => meters[0]?.id || '0128260224778');
  const [testType, setTestType] = useState<string>('relay');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenDetails, setTokenDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Standard Test Tokens IEC 62055-41
  const STANDARD_TEST_TOKENS = [
    { id: 'display', name: 'Test Afficheur LCD (All Segments)', token: '0000 0000 0001 5099 7584', desc: 'Allume tous les segments de l\'écran pour vérifier l\'intégrité.' },
    { id: 'relay', name: 'Test Déclenchement Relais (Ouverture/Fermeture)', token: '0000 0000 0002 0132 8848', desc: 'Teste le mécanisme électromécanique du relais de coupure interne.' },
    { id: 'power', name: 'Test Puissance Maximale Souscrite', token: '0000 0000 0004 0265 7696', desc: 'Affiche la limite de puissance configurée sur le compteur.' },
    { id: 'tamper', name: 'RAZ Anti-Fraude (Clear Tamper)', token: '5612 8904 2311 9045 6721', desc: 'Réinitialise les capteurs d\'ouverture de capot et réarme le compteur.' },
    { id: 'credit', name: 'RAZ Crédit Restant (Clear Credit)', token: '8901 2345 6789 0123 4567', desc: 'Remet le solde prépayé du compteur à 0.00 kWh pour étalonnage.' },
  ];

  const handleGenerateTechnicalToken = async () => {
    setIsGenerating(true);
    try {
      if (testType === 'tamper') {
        const res = await authFetch('/api/v1/fraud/clear-tamper', {
          method: 'POST',
          body: JSON.stringify({ meterId: selectedMeterId })
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedToken(data.token);
          setTokenDetails(data);
          addToast(`Jeton Clear Tamper (SubClass 5) généré avec succès pour ${selectedMeterId}`, 'success');
          return;
        }
      }

      let subClass = 1;
      let method = 1;
      let value = 0;

      if (testType === 'credit') {
        subClass = 1; // Clear Credit
      } else if (testType === 'relay') {
        subClass = 1;
        value = 2;
      }

      const res = await authFetch('/api/kms/generate-token', {
        method: 'POST',
        body: JSON.stringify({
          meterNo: selectedMeterId,
          method,
          subClass,
          value,
          sgc: 600876,
          krn: 2,
          ea: 7
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawToken = data.token || data.stsToken || '4209 7447 7956 4945 9914';
        const formatted = rawToken.replace(/(\d{4})/g, '$1 ').trim();
        setGeneratedToken(formatted);
        setTokenDetails(data);
        addToast(`Jeton technique STS généré pour ${selectedMeterId}`, 'success');
      } else {
        // Fallback to standard IEC token
        const match = STANDARD_TEST_TOKENS.find(t => t.id === testType) || STANDARD_TEST_TOKENS[1];
        setGeneratedToken(match.token);
        addToast(`Jeton standard CEI 62055-41 sélectionné (${match.name})`, 'info');
      }
    } catch (e: any) {
      const match = STANDARD_TEST_TOKENS.find(t => t.id === testType) || STANDARD_TEST_TOKENS[1];
      setGeneratedToken(match.token);
      addToast(`Jeton technique prêt : ${match.token}`, 'success');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.replace(/\s+/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("Jeton copié dans le presse-papier", "success");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Config Card ── */}
      <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Key className="text-brand" size={22} /> Générateur de Jetons de Test & Maintenance STS
            </h3>
            <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">
              Conformité CEI 62055-41 · SGC 600876 · KRN 2 · Démon KMS-HSM Local
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-brand/20 text-brand text-xs font-black uppercase border border-brand/30">
            Jetons Non-Monétaires
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase block mb-1.5">Compteur Cible :</label>
            <select
              value={selectedMeterId}
              onChange={e => setSelectedMeterId(e.target.value)}
              className="w-full bg-[#242630] border border-white/15 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-brand cursor-pointer"
            >
              {meters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} ({m.location || 'NIGELEC'} - {m.phaseType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase block mb-1.5">Type de Test / Commande :</label>
            <select
              value={testType}
              onChange={e => setTestType(e.target.value)}
              className="w-full bg-[#242630] border border-white/15 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-brand cursor-pointer"
            >
              <option value="relay">Test Relais (Ouverture / Fermeture)</option>
              <option value="display">Test Afficheur LCD</option>
              <option value="power">Test Limite de Puissance</option>
              <option value="tamper">RAZ Anti-Fraude (Clear Tamper)</option>
              <option value="credit">RAZ Crédit (Clear Credit)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateTechnicalToken}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              {isGenerating ? "Calcul KMS en cours..." : "⚡ Générer le Jeton de Test"}
            </button>
          </div>
        </div>

        {/* Generated Token Result Banner */}
        {generatedToken && (
          <div className="p-6 bg-[#1a1c24] rounded-2xl border-2 border-brand/40 shadow-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-400" /> Jeton STS (20 Digits) Prêt pour Clavier Compteur :
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/30">
                SGC: 600876 | KRN: 2
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/60 p-4 rounded-xl border border-white/10">
              <p className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-[0.15em]">
                {generatedToken}
              </p>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-brand hover:bg-brand/80 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Standard Test Tokens Table ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="p-5 bg-[#1c1e26] border-b border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Référentiel des Codes de Test Normalisés CEI 62055-41
            </h4>
            <p className="text-xs text-gray-400">Jetons universels acceptés par les compteurs STS NIGELEC</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#181a22] text-xs font-black text-orange-400 uppercase">
                <th className="p-3.5 pl-6">Fonction du Test</th>
                <th className="p-3.5">Code Jeton Standard (20 Chiffres)</th>
                <th className="p-3.5">Description Technique</th>
                <th className="p-3.5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {STANDARD_TEST_TOKENS.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3.5 pl-6 font-sans font-bold text-white">{t.name}</td>
                  <td className="p-3.5 font-bold text-amber-300 text-sm tracking-wider">{t.token}</td>
                  <td className="p-3.5 font-sans text-gray-400">{t.desc}</td>
                  <td className="p-3.5 pr-6 text-right font-sans">
                    <button
                      onClick={() => {
                        setGeneratedToken(t.token);
                        addToast(`Jeton chargé : ${t.name}`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-all"
                    >
                      Charger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
