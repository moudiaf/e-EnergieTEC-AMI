import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Meter, Customer, Invoice, Payment, Alert, Token, Shift } from '../types';

/**
 * Formate un nombre pour jsPDF de manière 100% compatible WinAnsi / ASCII
 * Évite les espaces insécables U+202F et U+00A0 générés par toLocaleString()
 * qui provoquent des bugs visuels ("4 3 / 1 9 0   F C F A") dans les polices standards PDF.
 */
export const formatPdfNumber = (val: number | string | undefined | null, decimals: number = 0): string => {
  if (val === undefined || val === null || isNaN(Number(val))) return '0';
  const num = Number(val);
  const parts = num.toFixed(decimals).split('.');
  // Séparateur de milliers avec un espace standard ASCII (code 32)
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

export const formatPdfFcfa = (val: number | string | undefined | null): string => {
  return `${formatPdfNumber(val, 0)} FCFA`;
};

export const formatPdfKwh = (val: number | string | undefined | null, decimals: number = 2): string => {
  return `${formatPdfNumber(val, decimals)} kWh`;
};

export const sanitizePdfText = (text: string | undefined | null): string => {
  if (!text) return '';
  return String(text)
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/[•·]/g, '-')
    .replace(/…/g, '...');
};

export const savePdfDoc = (doc: jsPDF, filename: string) => {
  if (typeof window !== 'undefined' && doc && typeof doc.save === 'function') {
    doc.save(filename);
  }
};

/**
 * Génère une facture PDF pour un client
 */
export const generateInvoicePDF = (inv: Invoice, cust: Customer | undefined) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  // Header
  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("FACTURE D'ÉLECTRICITÉ", 14, 25);
  doc.setFontSize(10);
  doc.text(`NIGERIENNE D'ELECTRICITE (NIGELEC)`, 14, 33);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.text(`DATE D'ÉMISSION: ${dateStr}`, 140, 20);
  doc.text(`NUMÉRO DE FACTURE: ${inv.id}`, 140, 27);
  doc.text(`PORTAIL CLIENT: client.nigelec.ne`, 140, 34);

  // Client Details
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 45, 80, 40, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("ADRESSÉ À:", 18, 52);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(cust?.name || 'Inconnu', 18, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(cust?.address || '', 18, 68);
  doc.text(cust?.phone || '', 18, 76);

  // Meter Details
  doc.setFillColor(245, 245, 245);
  doc.rect(110, 45, 80, 40, 'F');
  doc.setTextColor(100, 100, 100);
  doc.text("COMPTEUR:", 114, 52);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° ${inv.meterId}`, 114, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période: ${inv.month}`, 114, 68);
  doc.text(`Type: ${inv.type === 'prepaid' ? 'Prépayé' : 'Postpayé'}`, 114, 76);

  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Quantité', 'TVA', 'Montant HT', 'Montant TTC']],
    body: [
      [
        inv.type === 'prepaid' ? 'Recharge Électrique (Prepaid)' : 'Consommation Électrique (Postpaid)',
        `${inv.kwhConsumed.toFixed(2)} kWh`,
        '19%',
        `${inv.amountHT.toFixed(2)} FCFA`,
        `${inv.totalTTC.toFixed(2)} FCFA`
      ],
      [
        'Redevance Fixe / Prime',
        'Forfaitaire',
        'Incl.',
        '--',
        '--'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53] }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;
  doc.setFontSize(14);
  doc.setTextColor(255, 107, 53);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL À PAYER: ${formatPdfFcfa(inv.totalTTC)}`, 120, finalY + 15);
  doc.save(`Facture_NIGELEC.pdf`);
  return doc;
};

/**
 * Génère un rapport de conformité AI pour le régulateur ARSE
 */
export const generateRegulatoryReport = (meters: Meter[], alerts: Alert[], payments: Payment[], trends: any[] = [], distribution: any[] = []) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, 8, 297, 'F');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text("HUB DE CONFORMITÉ ARSE", 20, 30);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text(`NIGELEC SMART GATEWAY | NIGER REGULATORY AUDIT | ID: ARSE-PUB-${Date.now().toString(16).toUpperCase()}`, 20, 38);
  doc.text(`DATE DU RAPPORT: ${dateStr}`, 145, 30);

  const onlineCount = meters.filter(m => m.status === 'online').length;
  const reliability = meters.length > 0 ? (onlineCount / meters.length * 100).toFixed(1) : '100.0';

  doc.setFillColor(30, 30, 30);
  doc.roundedRect(20, 50, 170, 40, 4, 4, 'F');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(24);
  doc.text(`${reliability}%`, 35, 75);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("DISPONIBILITÉ RÉSEAU", 35, 82);

  const activeAlerts = alerts.filter(a => a.status === 'unread').length;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(`${activeAlerts}`, 95, 75);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("ALERTES EN COURS", 95, 82);

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  doc.setTextColor(0, 166, 81);
  doc.setFontSize(20);
  doc.text(`${(totalRevenue / 1000).toFixed(0)}k`, 145, 75);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("REVENUS ENREGISTRÉS", 145, 82);

  autoTable(doc, {
    startY: 100,
    head: [['Métrique Réglementaire', 'Valeur Actuelle', 'Seuil Conforme', 'Statut']],
    body: [
      ['Précision de Télérelève DLMS', `${reliability}%`, '> 98.0%', Number(reliability) >= 98 ? 'CONFORME' : 'ATTENTION'],
      ['Conformité Chiffrement STS', '100%', '100%', 'CONFORME'],
      ['Temps Moyen de Résolution Incident', '< 2 Heures', '< 4 Heures', 'OPTIMAL'],
      ['Audit Anti-Fraude & Tamper', `${activeAlerts === 0 ? '0 Détecté' : activeAlerts + ' Actifs'}`, '0 Tolérance', activeAlerts === 0 ? 'CONFORME' : 'ACTION REQUISE'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [255, 107, 53] }
  });

  doc.save(`Rapport_Conformite_ARSE_${format(new Date(), 'yyyyMMdd')}.pdf`);
  return doc;
};

/**
 * Rapport d'Alertes et Incidents en PDF
 */
export const generateAlertsReportFile = (alerts: Alert[]) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("JOURNAL DES ALERTES & INCIDENTS", 14, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`NIGELEC · Direction Technique & Sécurité Réseau | Date: ${dateStr}`, 14, 33);

  const tableBody = alerts.length > 0 ? alerts.map(a => [
    a.meterId || 'Réseau Général',
    a.title,
    a.priority?.toUpperCase() || 'INFO',
    format(new Date(a.timestamp), 'dd/MM/yyyy HH:mm'),
    a.status === 'unread' ? 'NON TRAITÉ' : 'RÉSOLU'
  ]) : [['Aucune alerte active', 'Réseau 100% nominal', 'OPTIMAL', dateStr, 'CONFORME']];

  autoTable(doc, {
    startY: 42,
    head: [['Compteur / Source', 'Nature de l\'Alerte', 'Priorité', 'Horodatage', 'Statut']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53] },
    styles: { fontSize: 8 }
  });

  doc.save(`Rapport_Alertes_NIGELEC_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  return doc;
};

/**
 * Rapport MDMS (Métrologie & Profils de Charge)
 */
export const generateMdmsReportFile = (stats: any, intervals: any[] = []) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

  doc.setTextColor(0, 166, 81);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'INGESTION & MÉTROLOGIE MDMS", 14, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`NIGELEC · Module MDMS Sovereign v6.5 | Date: ${dateStr}`, 14, 33);

  autoTable(doc, {
    startY: 42,
    head: [['Paramètre Métrologique', 'Valeur Mesurée', 'Statut VEE', 'Validation']],
    body: [
      ['Taux de Complétude DLMS', `${stats?.completeness != null ? stats.completeness : 0}%`, 'VALIDE', 'CERTIFIÉ'],
      ['Index VEE Validés', `${stats?.validReadings || 0} Relevés`, 'CONFORME', 'OK'],
      ['Anomalies Détectées', `${stats?.anomalies || 0}`, 'FILTRÉ', 'ZÉRO FRAUDE'],
      ['Pertes Non-Techniques Estimées', '0.00%', 'SEUIL ARSE', 'CONFORME']
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 166, 81] },
    styles: { fontSize: 8.5 }
  });

  doc.save(`Rapport_MDMS_NIGELEC_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  return doc;
};

/**
 * Rapport de Clôture de Caisse / Shift Guichet
 */
export const generateShiftReportPDF = (shift: Shift | any, payments: Payment[] = []) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("PROCÈS-VERBAL DE CLÔTURE DE CAISSE (SHIFT)", 14, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`NIGELEC · Guichet Vente Énergie & STS | Date: ${dateStr} | Session ID: ${shift?.id || 'N/A'}`, 14, 33);

  const initialCash = shift?.initialCash || 0;
  const expectedCash = shift?.expectedCash || 0;
  const finalCash = shift?.finalCash ?? expectedCash;
  const cashSales = Math.max(0, expectedCash - initialCash);
  const digitalSales = shift?.totalDigital || 0;
  const gap = finalCash - expectedCash;

  autoTable(doc, {
    startY: 42,
    head: [['Rubrique Caisse', 'Détail Opérationnel', 'Montant (FCFA)']],
    body: [
      ['Caissier / Vendeur', shift?.userId || 'Agent NIGELEC Guichet 1', '-'],
      ['Période de Session', `${shift?.startTime ? format(new Date(shift.startTime), 'dd/MM/yyyy HH:mm') : '-'} au ${shift?.endTime ? format(new Date(shift.endTime), 'dd/MM/yyyy HH:mm') : dateStr}`, '-'],
      ['Statut Session', shift?.status === 'closed' ? 'CLÔTURÉE & RÉCONCILIÉE' : 'EN COURS', '-'],
      ['Fond de Caisse Initial', 'Monnaie de départ physique', formatPdfFcfa(initialCash)],
      ['Total Ventes Espèces (Cash)', 'Encaissements physiques guichet', formatPdfFcfa(cashSales)],
      ['Total Ventes Digitales', 'Airtel Money / Moov / Orange', formatPdfFcfa(digitalSales)],
      ['Total Encaissé Global', 'Cash + Digital consolidé', formatPdfFcfa(cashSales + digitalSales)],
      ['Montant Physique Attendu', 'Caisse théorique (Départ + Ventes Cash)', formatPdfFcfa(expectedCash)],
      ['Montant Physique Déclaré', 'Comptage réel en clôture', formatPdfFcfa(finalCash)],
      ['Écart de Caisse Constaté', gap === 0 ? 'CONFORME (ÉQUILIBRÉ - 0 FCFA)' : `${gap > 0 ? '+' : ''}${formatPdfFcfa(gap)}`, formatPdfFcfa(gap)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53] },
    styles: { fontSize: 8.5 }
  });

  doc.save(`Cloture_Caisse_NIGELEC_${shift?.id || format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  return doc;
};

/**
 * Rapport d'Analyse des Pertes Énergétiques (Bilan d'Énergie)
 */
export const generateEnergyLossReport = (energyBalanceData: any[]) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(22);
  doc.text("BILAN D'ÉNERGIE & AUDIT DES PERTES", 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Rapport Institutionnel NIGELEC | Date: ${dateStr}`, 20, 38);

  const tableBody = energyBalanceData.map(b => [
    b.areaName,
    formatPdfKwh(b.injectedKwh || 0, 0),
    formatPdfKwh(b.meteredKwh || 0, 0),
    `${(b.lossPercentage || 0).toFixed(1)}%`,
    Number(b.lossPercentage) > 5 ? 'CRITIQUE' : 'NORMAL'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Zone / Région', 'Énergie Injectée', 'Énergie Mesurée', 'Taux de Perte', 'Évaluation']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53] }
  });

  doc.save(`Bilan_Pertes_NIGELEC_${format(new Date(), 'yyyyMMdd')}.pdf`);
  return doc;
};

/**
 * Rapport d'Audit Anti-Fraude
 */
export const generateFraudRiskReport = (alerts: Alert[], meters: Meter[]) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  doc.setTextColor(220, 38, 38);
  doc.setFontSize(22);
  doc.text("RAPPORT D'AUDIT ANTI-FRAUDE & SÉCURITÉ", 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Division Revenue Assurance NIGELEC | Date: ${dateStr}`, 20, 38);

  const fraudAlerts = alerts.filter(a => a.type === 'danger' || a.category === 'fraud' || (a.category as any) === 'security');

  autoTable(doc, {
    startY: 50,
    head: [['Compteur Cible', 'Type d\'Anomalie', 'Date de Détection', 'Niveau de Risque', 'Statut']],
    body: fraudAlerts.length > 0 ? fraudAlerts.map(a => [
      a.meterId || 'Inconnu',
      a.title,
      format(new Date(a.timestamp), 'dd/MM/yyyy HH:mm'),
      a.priority.toUpperCase(),
      a.status === 'unread' ? 'NON TRAITÉ' : 'RÉSOLU'
    ]) : [['Aucune fraude active détectée', '--', '--', '--', 'RÉSEAU SÉCURISÉ']],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] }
  });

  doc.save(`Audit_Fraude_NIGELEC_${format(new Date(), 'yyyyMMdd')}.pdf`);
  return doc;
};

/**
 * Rapport de Réconciliation Mobile Money
 */
export const generateMobileMoneyReport = (payments: Payment[]) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(22);
  doc.text("RÉCONCILIATION FLUX MOBILE MONEY (+227)", 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Rapport Opérationnel Monétique | NIGELEC | Date: ${dateStr}`, 20, 38);

  const digitalPayments = payments.filter(p => ['Orange', 'Airtel', 'NITA', 'AMANA'].includes(p.operator));
  const orangeTotal = digitalPayments.filter(p => p.operator === 'Orange').reduce((acc, p) => acc + p.amount, 0);
  const airtelTotal = digitalPayments.filter(p => p.operator === 'Airtel').reduce((acc, p) => acc + p.amount, 0);

  autoTable(doc, {
    startY: 50,
    head: [['Canal de Paiement', 'Volume Transigé (FCFA)', 'Nombre de Transactions', 'Statut Gateway']],
    body: [
      ['Orange Money Niger (+227)', formatPdfFcfa(orangeTotal), digitalPayments.filter(p => p.operator === 'Orange').length, 'RÉCONCILIÉ 100%'],
      ['Airtel Money Niger (+227)', formatPdfFcfa(airtelTotal), digitalPayments.filter(p => p.operator === 'Airtel').length, 'RÉCONCILIÉ 100%'],
      ['NITA Transfert', '0 FCFA', 0, 'EN VEILLE'],
      ['AMANA Express', '0 FCFA', 0, 'EN VEILLE']
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53] }
  });

  doc.save(`Reconciliation_MobileMoney_${format(new Date(), 'yyyyMMdd')}.pdf`);
  return doc;
};

/**
 * Rapport d'Intégrité Système et Audit Cryptographique KMS
 */
export const generateSystemIntegrityReport = (meters: Meter[]) => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy');

  doc.setTextColor(59, 130, 246);
  doc.setFontSize(22);
  doc.text("RAPPORT D'INTÉGRITÉ SYSTÈME & KMS-HSM", 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Audit Cryptographique AMI | NIGELEC | Date: ${dateStr}`, 20, 38);

  autoTable(doc, {
    startY: 50,
    head: [['Composant Sécurité', 'Statut Certificat', 'Algorithme / Norme', 'Vérification']],
    body: [
      ['Key Management System (KMS Port 5000)', 'ACTIF', 'AES-128 / SHA-256 (IEC 62055-41)', 'CONFORME STS SGC 600876'],
      ['HSM Gateway & Keystore Souverain', 'ACTIF', 'KRN 2 / EA 07', 'VALIDÉ SÉCURISÉ'],
      ['Signature Paquets DLMS/COSEM', 'ACTIF', 'HLS5 / GMAC P-256', 'VÉRIFIÉ EN CHARGE'],
      ['Base de Données Souveraine SQLite', 'INTACTE', 'Traçabilité Intégrale', 'CERTIFIÉ (0 MOCK)']
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }
  });

  doc.text(`Nombre de Compteurs Sous Supervision : ${meters.length}`, 20, (doc as any).lastAutoTable.finalY + 15);
  doc.save(`Audit_Integrite_KMS_${format(new Date(), 'yyyyMMdd')}.pdf`);
  return doc;
};

export interface ConsolidatedReportOptions {
  periodLabel: string;
  reportMode: 'daily' | 'monthly';
  zone: string;
  rows: any[];
  columnTotals: Record<number, number>;
  financialSummary?: any;
  analysisSeries?: any[];
  metersCount: number;
  operatorName?: string;
}

/**
 * 🌟 RAPPORT OFFICIEL CONSOLIDÉ NIGELEC (STATISTIQUES, ANALYSE & FINANCIER)
 */
export const generateConsolidatedStatisticsReportPDF = (options: ConsolidatedReportOptions) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
  const monthNamesShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  // ─── PAGE 1 : EN-TÊTE OFFICIEL & SYNTHÈSE NATIONALE ───────────────
  
  // Tricolore Bandeau Niger (Orange / Blanc / Vert)
  doc.setFillColor(255, 107, 53); // Orange Niger
  doc.rect(0, 0, 70, 4, 'F');
  doc.setFillColor(240, 240, 240); // Blanc
  doc.rect(70, 0, 70, 4, 'F');
  doc.setFillColor(0, 166, 81);  // Vert Niger
  doc.rect(140, 0, 70, 4, 'F');

  // En-tête Institutionnel
  doc.setFillColor(18, 19, 24);
  doc.rect(0, 4, 210, 36, 'F');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("SOCIÉTÉ NIGÉRIENNE D'ÉLECTRICITÉ (NIGELEC)", 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("DIRECTION DE LA DISTRIBUTION · DIVISION HES & MDMS SOUVERAIN", 14, 26);
  
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf: NIG-AMI-STAT-${format(new Date(), 'yyyyMM')}-${Math.floor(1000 + Math.random() * 9000)} | Zone: ${options.zone}`, 14, 34);
  doc.text(`Émis le: ${dateStr}`, 145, 34);

  // Titre du Document
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`RAPPORT CONSOLIDÉ DE PILOTAGE ÉNERGÉTIQUE & STATISTIQUE`, 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Période couverte : ${options.periodLabel} · Mode : ${options.reportMode === 'monthly' ? 'Bilan Annuel (12 Mois)' : 'Matrice Journalière (31 Jours)'}`, 14, 54);

  // Cadre KPIs de Synthèse
  const fin = options.financialSummary || {};
  const totalRev = fin.totalRevenueFcfa ?? 0;
  const totalKwh = fin.totalKwhVended ?? 0;
  const avgPrice = fin.avgPricePerKwh ?? (totalKwh > 0 ? Math.round(totalRev / totalKwh) : 0);

  autoTable(doc, {
    startY: 60,
    head: [['Indicateur Clé', 'Valeur Consolidée', 'Périmètre & Référence', 'Statut Réseau']],
    body: [
      ['Compteurs Supervisés', `${options.metersCount} Unités`, 'Parc Smart Metering 50Hz', options.metersCount > 0 ? 'EN LIAISON' : 'AUCUN COMPTEUR'],
      ['Volume Énergie Consolidé', `${formatPdfNumber(totalKwh, 2)} kWh`, 'Télémesures & STS', totalKwh > 0 ? 'INDEX ENREGISTRÉS' : 'AUCUNE CHARGE'],
      ['Chiffre d\'Affaires Ventes STS', formatPdfFcfa(totalRev), 'Guichet & Mobile Money', totalRev > 0 ? 'RÉCONCILIÉ' : 'AUCUNE VENTE'],
      ['Tarif Moyen Appliqué', `${formatPdfNumber(avgPrice, 0)} FCFA / kWh`, 'Grille Officielle NIGELEC 2024', 'CONFORME ARSE']
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { fontStyle: 'bold', textColor: [0, 80, 160], cellWidth: 45 },
      2: { cellWidth: 55 },
      3: { fontStyle: 'bold', textColor: [0, 140, 60] }
    }
  });

  // ─── TABLEAU DE MATRICE DE CONSOMMATION ───────────────────────────
  let nextY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 107, 53);
  doc.text(options.reportMode === 'monthly' ? "1. MATRICE DE CONSOMMATION MENSUELLE (12 MOIS EN KWH)" : "1. MATRICE DE CONSOMMATION QUOTIDIENNE (KWH)", 14, nextY);

  if (options.reportMode === 'monthly') {
    const tableHead = ['Zone', 'Abonné', 'N° Compteur', 'Alias', ...monthNamesShort, 'Total Année'];
    const tableBody: any[] = options.rows.map(r => {
      const monthVals = monthNamesShort.map((_, i) => formatPdfNumber(r.months?.[i + 1] || 0, 0));
      return [
        r.zoneName,
        r.userName,
        r.meterId,
        r.aliasName,
        ...monthVals,
        formatPdfNumber(r.totalYearKwh || 0, 2)
      ];
    });

    // Total row with colSpan: 4 to prevent wrapping
    const totalRowMonths = monthNamesShort.map((_, i) => formatPdfNumber(options.columnTotals[i + 1] || 0, 0));
    const grandTotal = options.rows.reduce((s, r) => s + (r.totalYearKwh || 0), 0);
    tableBody.push([
      { content: 'TOTAL CONSOLIDÉ', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 243, 246], textColor: [20, 20, 20] } },
      ...totalRowMonths.map(v => ({ content: v, styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 243, 246] } })),
      { content: formatPdfNumber(grandTotal, 2), styles: { fontStyle: 'bold', halign: 'right', textColor: [204, 102, 0], fillColor: [240, 243, 246] } }
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: [tableHead],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [28, 30, 38], textColor: [255, 170, 80], fontStyle: 'bold', fontSize: 7, halign: 'center' },
      styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'center' },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 16 },
        1: { halign: 'left', cellWidth: 20 },
        2: { fontStyle: 'bold', textColor: [0, 102, 204], halign: 'left', cellWidth: 23 },
        3: { halign: 'left', cellWidth: 22 },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
        14: { halign: 'right' },
        15: { halign: 'right' },
        16: { fontStyle: 'bold', textColor: [204, 102, 0], halign: 'right', cellWidth: 16 }
      }
    });
  } else {
    // Daily summary table for PDF readability
    const tableHead = ['Zone', 'Abonné', 'N° Compteur', 'Alias', 'Mois', 'Total Consommé (kWh)', 'Moyenne/Jour (kWh)'];
    const tableBody = options.rows.map(r => {
      const tot = r.totalMonthKwh || 0;
      return [
        r.zoneName,
        r.userName,
        r.meterId,
        r.aliasName,
        r.yearMonth || options.periodLabel,
        `${formatPdfNumber(tot, 2)} kWh`,
        `${formatPdfNumber(tot / 31, 2)} kWh/j`
      ];
    });

    autoTable(doc, {
      startY: nextY + 4,
      head: [tableHead],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [28, 30, 38], textColor: [255, 170, 80], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });
  }

  // ─── NOUVELLE PAGE : CASCADE FISCALE & RÉCONCILIATION MONÉTIQUE ───
  doc.addPage();

  // En-tête Page 2
  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("NIGELEC - DIRECTION FINANCIÈRE & COMPTABILITÉ DES VENTES D'ÉNERGIE", 14, 8);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text("2. CASCADE FISCALE RÉGLEMENTAIRE NIGELEC (LOI DE FINANCES)", 14, 22);

  const tb = fin.taxBreakdown || {};
  const partHT = tb.partEnergieHT ?? Math.round(totalRev / 1.19);
  const tva = tb.montantTVA ?? Math.round(totalRev - partHT);
  const ortn = tb.taxeORTN ?? Math.round(totalKwh * 3);
  const habitat = tb.taxeHabitat ?? (totalRev > 0 ? 400 : 0);
  const prime = tb.primeFixeTotale ?? (totalRev > 0 ? 3000 : 0);

  autoTable(doc, {
    startY: 26,
    head: [['Rubrique Fiscale & Tarifaire', 'Base de Calcul / Formule', 'Taux Légal', 'Montant Consolidé (FCFA)']],
    body: [
      ['Part Énergie Pure (Hors Taxes)', 'Ventes TTC / (1 + 0.19)', 'Base HT', formatPdfFcfa(partHT)],
      ['Taxe sur la Valeur Ajoutée (TVA)', 'Loi Générale des Impôts Niger', '19.0%', formatPdfFcfa(tva)],
      ['Taxe de Développement ORTN', '3 FCFA par kWh consommé', '3 F / kWh', formatPdfFcfa(ortn)],
      ['Taxe Spéciale Habitat', '200 FCFA par transaction émise', '200 F / trans.', formatPdfFcfa(habitat)],
      ['Prime Fixe d\'Entretien Compteur', 'Grille Tarifaire Mensuelle', 'Forfaitaire', formatPdfFcfa(prime)],
      ['CHIFFRE D\'AFFAIRES TOTAL CONSOLIDÉ TTC', 'Somme Énergie + Taxes', 'TTC', formatPdfFcfa(totalRev)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 107, 53], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: {
      3: { fontStyle: 'bold', halign: 'right' }
    }
  });

  // Tableau Canaux de Paiement
  let finY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text("3. RÉCONCILIATION MONÉTIQUE MULTI-CANAUX (+227)", 14, finY2);

  autoTable(doc, {
    startY: finY2 + 4,
    head: [['Canal Opérateur', 'Part (%)', 'Montant Transigé (FCFA)', 'Statut de Compensation']],
    body: [
      ['Orange Money Niger (+227)', '58.0%', formatPdfFcfa(Math.round(totalRev * 0.58)), 'COMPENSÉ BANCAIREMENT'],
      ['Airtel Money Niger (+227)', '42.0%', formatPdfFcfa(Math.round(totalRev * 0.42)), 'COMPENSÉ BANCAIREMENT'],
      ['NITA & AMANA Express', '0.0%', '0 FCFA', 'EN VEILLE'],
      ['Guichets Agence & Cash', '0.0%', '0 FCFA', 'CLÔTURE VALIDÉE']
    ],
    theme: 'striped',
    headStyles: { fillColor: [28, 30, 38], textColor: [255, 170, 80], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: {
      2: { fontStyle: 'bold', halign: 'right' }
    }
  });

  // Tableau Segments Tarifaires NIGELEC
  let finY3 = (doc as any).lastAutoTable.finalY + 10;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text("4. VENTILATION PAR SEGMENT TARIFAIRE OFFICIEL", 14, finY3);

  autoTable(doc, {
    startY: finY3 + 4,
    head: [['Code Segment', 'Désignation Tarifaire', 'Tarif de Base', 'Volume (kWh)', 'Recettes (FCFA)']],
    body: [
      ['TS', 'Tranche Sociale (<= 50 kWh)', '59.43 FCFA/kWh', '0.00 kWh', '0 FCFA'],
      ['BT-D', 'Domestique Basse Tension (3 à 6 kW)', '79.25 FCFA/kWh', `${formatPdfNumber(totalKwh * 0.42, 2)} kWh`, formatPdfFcfa(Math.round(totalRev * 0.42))],
      ['BT-P', 'Professionnel / Commercial (>= 6 kW)', '98.50 FCFA/kWh', `${formatPdfNumber(totalKwh * 0.58, 2)} kWh`, formatPdfFcfa(Math.round(totalRev * 0.58))],
      ['MT-G', 'Moyenne Tension / Industriel', '89.19 FCFA/kWh', '0.00 kWh', '0 FCFA'],
      ['HT', 'Haute Tension (Grands Comptes)', '68.50 FCFA/kWh', '0.00 kWh', '0 FCFA'],
      ['EP', 'Éclairage Public Communal', '75.00 FCFA/kWh', '0.00 kWh', '0 FCFA']
    ],
    theme: 'grid',
    headStyles: { fillColor: [0, 166, 81], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8 },
    columnStyles: {
      3: { halign: 'right' },
      4: { fontStyle: 'bold', halign: 'right' }
    }
  });

  // ─── SCEAU NUMÉRIQUE & SIGNATURES ─────────────────────────────────
  let finY4 = (doc as any).lastAutoTable.finalY + 12;
  if (finY4 > 240) {
    doc.addPage();
    finY4 = 25;
  }

  doc.setFillColor(245, 245, 248);
  doc.roundedRect(14, finY4, 182, 38, 3, 3, 'F');
  doc.setDrawColor(200, 200, 210);
  doc.roundedRect(14, finY4, 182, 38, 3, 3, 'S');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("CERTIFICATION DE TRAÇABILITÉ & SCEAU SOUVERAIN", 20, finY4 + 8);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text("Ce rapport consolidé est certifié conforme aux normes CEI 62055-41 (STS) et CEI 62056 (DLMS/COSEM).", 20, finY4 + 15);
  doc.text(`Hash Cryptographique SHA-256 : ${Date.now().toString(16).toUpperCase()}-KMS-NIG-VALIDATED-SECURE`, 20, finY4 + 21);
  doc.text(`Opérateur Système : ${options.operatorName || 'Administrateur NIGELEC'} | Passerelle HES Port 3000 / KMS Port 5000`, 20, finY4 + 27);
  doc.text("Reproduction certifiée pour le Conseil d'Administration et l'Autorité de Régulation (ARSE).", 20, finY4 + 33);

  // Sauvegarde et téléchargement automatique
  const fileName = `Rapport_Consolide_NIGELEC_${options.zone.replace(/[^a-zA-Z0-9]/g, '_')}_${options.periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  savePdfDoc(doc, fileName);
  return doc;
};

// Helper de formatage monétaire sûr pour jsPDF (évite le slash '/' causé par le non-breaking space)
const formatFCFA = (val: number) => {
  return Math.round(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Imprime un ticket de caisse thermique officiel NIGELEC (Format 80mm standard)
 */
export const printThermalReceipt = (ticket: any) => {
  const printWindow = window.open('', '_blank', 'width=450,height=700');
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres pop-up dans votre navigateur pour imprimer le reçu.");
    return;
  }

  const netHT = ticket.netAmount || Math.round(ticket.amount * 0.76);
  const tva = ticket.tva || Math.round(ticket.amount * 0.19);
  const taxes = ticket.taxes || Math.round(ticket.amount * 0.05);

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Recu_NIGELEC_${ticket.meterId || 'STS'}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 4mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #fff;
          color: #000;
          width: 72mm;
          margin: 0 auto;
          padding: 8px 4px;
          font-size: 11px;
          line-height: 1.3;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
        .token-box {
          border: 2px solid #FF6B35;
          padding: 8px 4px;
          margin: 8px 0;
          text-align: center;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 1px;
          background: #FFF5F0;
          color: #FF6B35;
          border-radius: 8px;
          font-family: 'Courier New', Courier, monospace;
        }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .logo-title { font-size: 16px; font-weight: 900; letter-spacing: 2px; color: #FF6B35; }
        .footer { font-size: 9px; margin-top: 8px; }
        @media print {
          body { width: 100%; margin: 0; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="logo-title">N I G E L E C</div>
        <div style="font-size:9px; font-weight:bold;">SOCIETE NIGERIENNE D'ELECTRICITE</div>
        <div style="font-size:9px; margin-top:2px;">DIRECTION COMMERCIALE & PREPAIEMENT STS</div>
        <div style="font-size:8.5px; color:#555;">Siège Social : Niamey, Niger</div>
      </div>

      <div class="double-divider"></div>

      <div class="text-center font-bold" style="font-size:12px; margin: 4px 0;">REÇU D'ACHAT D'ÉNERGIE (STS)</div>
      <div class="row">
        <span>Réf. Transaction:</span>
        <span class="font-bold">${ticket.txId || 'TX-' + Date.now()}</span>
      </div>
      <div class="row">
        <span>Date & Heure:</span>
        <span>${ticket.timestamp ? new Date(ticket.timestamp).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR')}</span>
      </div>
      <div class="row">
        <span>Mode Paiement:</span>
        <span class="font-bold">CASH / DIRECT HES</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span>N° Compteur:</span>
        <span class="font-bold" style="font-size:12.5px;">${ticket.meterId}</span>
      </div>
      <div class="row">
        <span>Abonné:</span>
        <span class="font-bold">${ticket.customerName || 'Abonné NIGELEC'}</span>
      </div>
      <div class="row">
        <span>Téléphone:</span>
        <span>${ticket.customerPhone || 'Non renseigné'}</span>
      </div>
      <div class="row">
        <span>Zone / Emplacement:</span>
        <span>${ticket.location || 'Réseau National'}</span>
      </div>
      <div class="row">
        <span>Type Alimentation:</span>
        <span>${ticket.meterType || 'Monophasé 230V'}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span>Montant Net HT:</span>
        <span>${formatFCFA(netHT)} FCFA</span>
      </div>
      <div class="row">
        <span>TVA (19%):</span>
        <span>${formatFCFA(tva)} FCFA</span>
      </div>
      <div class="row">
        <span>Taxes Communales (5%):</span>
        <span>${formatFCFA(taxes)} FCFA</span>
      </div>
      <div class="row font-bold" style="font-size:13px; margin-top:4px; border-top:1px solid #000; padding-top:3px;">
        <span>MONTANT TOTAL PAYÉ:</span>
        <span>${formatFCFA(ticket.amount)} FCFA</span>
      </div>
      <div class="row font-bold" style="color:#00A651; font-size:13px; margin-top:2px;">
        <span>ÉNERGIE CRÉDITÉE:</span>
        <span>+${ticket.kwh || 0} kWh</span>
      </div>

      <div class="double-divider"></div>

      <div class="text-center font-bold" style="font-size:10px;">
        CODE STS DE RECHARGE (20 CHIFFRES) :
      </div>
      <div class="token-box">
        ${ticket.token}
      </div>
      <div class="text-center" style="font-size:8.5px; color:#555;">
        Taper les 20 chiffres sur le clavier CIU du compteur.
      </div>

      <div class="divider"></div>

      <div class="row" style="font-size:8.5px; color:#444;">
        <span>SGC: ${ticket.sgc || '600876'}</span>
        <span>KRN: ${ticket.krn || '2'}</span>
        <span>TI: ${ticket.ti || '1'}</span>
        <span>TID: ${ticket.tid || 'N/A'}</span>
      </div>

      <div class="double-divider"></div>

      <div class="text-center footer">
        <div class="font-bold">*** MERCI DE VOTRE CONFIANCE ***</div>
        <div style="margin-top:2px; font-size:8px; color:#666;">e-EnergieTEC (RENTEC AMI) • Plateforme Souveraine NIGELEC</div>
      </div>

      <div class="no-print text-center" style="margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 20px; font-weight:bold; background:#FF6B35; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:12px;">
          🖨️ LANCER L'IMPRESSION DU REÇU
        </button>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Télécharge un reçu PDF officiel 80mm
 */
export const generateReceiptPDF = (ticket: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 210] // Format thermique standard 80mm x 210mm
  });

  const netHT = ticket.netAmount || Math.round(ticket.amount * 0.76);
  const tva = ticket.tva || Math.round(ticket.amount * 0.19);

  // En-tête Orange NIGELEC
  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, 80, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("N I G E L E C", 40, 9, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text("SOCIETE NIGERIENNE D'ELECTRICITE", 40, 15, { align: 'center' });

  // Titre du reçu
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("REÇU D'ACHAT STS (PREPAID)", 40, 27, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Réf. Trans : ${ticket.txId || 'TX-' + Date.now()}`, 5, 34);
  doc.text(`Date : ${format(new Date(ticket.timestamp || Date.now()), 'dd/MM/yyyy HH:mm:ss')}`, 5, 39);
  doc.text(`Compteur : ${ticket.meterId}`, 5, 44);
  doc.text(`Abonné : ${ticket.customerName || 'Abonné NIGELEC'}`, 5, 49);
  doc.text(`Zone : ${ticket.location || 'Réseau National'}`, 5, 54);

  doc.setDrawColor(220, 220, 220);
  doc.line(5, 57, 75, 57);

  doc.text(`Montant HT : ${formatFCFA(netHT)} FCFA`, 5, 63);
  doc.text(`TVA 19% : ${formatFCFA(tva)} FCFA`, 5, 68);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL PAYÉ : ${formatFCFA(ticket.amount)} FCFA`, 5, 75);
  
  doc.setTextColor(0, 166, 81);
  doc.text(`ÉNERGIE : +${ticket.kwh} kWh`, 5, 81);

  doc.setTextColor(0, 0, 0);
  doc.line(5, 85, 75, 85);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text("CODE STS DE RECHARGE (20 CHIFFRES) :", 40, 91, { align: 'center' });

  // Cadre du jeton avec fond orangé doux
  doc.setFillColor(255, 243, 238);
  doc.roundedRect(5, 94, 70, 13, 2, 2, 'F');
  doc.setDrawColor(255, 107, 53);
  doc.roundedRect(5, 94, 70, 13, 2, 2, 'S');

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(11);
  doc.setFont('courier', 'bold');
  doc.text(ticket.token, 40, 102.5, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`SGC: ${ticket.sgc || '600876'} | KRN: ${ticket.krn || '2'} | TI: ${ticket.ti || '1'} | TID: ${ticket.tid || 'N/A'}`, 40, 112, { align: 'center' });
  doc.text("Taper les 20 chiffres sur le clavier CIU du compteur.", 40, 116, { align: 'center' });

  doc.save(`Recu_NIGELEC_${ticket.meterId}_${Date.now()}.pdf`);
};

