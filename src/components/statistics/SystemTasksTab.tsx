import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, AlertCircle, RefreshCw, Layers, Calendar, Server } from 'lucide-react';
import { useAmi } from '../../context/AmiContext';

export const SystemTasksTab: React.FC = () => {
  const { authFetch, addToast, fetchData, meters } = useAmi();
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState([
    { id: 'TASK-01', name: 'Télérelève Globale Programmée (DLMS/COSEM)', endpoint: '/api/v1/vending2/read-region', method: 'POST', body: { regionId: 'NIAMEY' }, cron: '00:00 UTC (Quotidien)', target: 'Ensemble du Parc (8 Régions)', status: 'ACTIF', lastRun: 'Actif', duration: 'Réel' },
    { id: 'TASK-02', name: 'Synchronisation d\'Horloge NTP/RTC Réseau (50Hz)', endpoint: '/api/v1/vending2/clock-sync', method: 'POST', body: { meterNo: '0128260224778' }, cron: 'Toutes les 6 heures', target: 'Compteurs Monophasés & Triphasés', status: 'ACTIF', lastRun: 'Actif', duration: 'Réel' },
    { id: 'TASK-03', name: 'Calcul du Bilan d\'Énergie & Détection Pertes', endpoint: '/api/statistics/consumption-matrix?yearMonth=2026-08', method: 'GET', body: null, cron: 'Toutes les heures', target: 'Postes HTA/BT & Concentrateurs DCU', status: 'ACTIF', lastRun: 'Actif', duration: 'Réel' },
    { id: 'TASK-04', name: 'Contrôle d\'Intégrité Cryptographique KMS-HSM', endpoint: '/api/v1/vending2/health', method: 'GET', body: null, cron: 'Toutes les 24 heures', target: 'Démon Port 5000 / Keystore STS', status: 'ACTIF', lastRun: 'Actif', duration: 'Réel' },
  ]);

  const handleRunTask = async (task: any) => {
    setRunningTaskId(task.id);
    addToast(`Exécution de la tâche : ${task.name}...`, 'info');
    try {
      const options: RequestInit = {
        method: task.method,
      };
      if (task.body) {
        options.body = JSON.stringify(task.body);
      }
      
      const res = await authFetch(task.endpoint, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      await fetchData();
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastRun: `Exécuté à ${new Date().toLocaleTimeString()} (Succès)` } : t));
      addToast(`Tâche ${task.name} exécutée avec succès via l'API HES !`, 'success');
    } catch (e: any) {
      addToast(`Erreur d'exécution de la tâche : ${e.message}`, 'error');
    } finally {
      setRunningTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-[#14151a] p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <Clock className="text-brand" size={22} /> Planificateur des Tâches Réelles du Système (HES Daemon)
          </h3>
          <p className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-0.5">
            Exécution réelle des télérelèves réseau, synchronisations d'horloge et bilans énergétiques
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase border border-emerald-500/30">
          Connexions Réelles HES Port 3000
        </span>
      </div>

      {/* ── Tasks Table ── */}
      <div className="bg-[#14151a] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#1c1e26] text-xs font-black text-orange-400 uppercase">
                <th className="p-4 pl-6">ID & Désignation de la Tâche</th>
                <th className="p-4">Périodicité / Déclencheur</th>
                <th className="p-4">Cible Réseau</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4">Dernière Exécution</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-white font-sans text-sm">{t.name}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">Route: {t.endpoint}</p>
                  </td>
                  <td className="p-4 font-sans text-amber-300 font-bold">{t.cron}</td>
                  <td className="p-4 font-sans text-gray-300">{t.target}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    <p>{t.lastRun}</p>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleRunTask(t)}
                      disabled={runningTaskId === t.id}
                      className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {runningTaskId === t.id ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                      {runningTaskId === t.id ? "Exécution..." : "Exécuter Réel"}
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
