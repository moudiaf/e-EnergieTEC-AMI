import { db } from '../db';

async function cleanTickets() {
  console.log("[TICKETS] Nettoyage des tickets de test/fraude...");
  
  const res = db.prepare(`
    DELETE FROM tickets 
    WHERE subject LIKE '%FRAUDE%' 
       OR subject LIKE 'INTERVENTION%'
       OR subject LIKE '%TEST%'
       OR id LIKE 'TK-%'
       OR id LIKE 'TKT-Z%'
       OR id LIKE 'TKT-0%'
       OR id LIKE 'TKT-Q%'
       OR meterId LIKE '%MTR-TEST%' 
       OR description LIKE '%Ouverture de capot%'
       OR description LIKE '%Bypass%'
       OR description LIKE '%Simulation%'
       OR description = ''
       OR subject = ''
       OR subject IS NULL
  `).run();

  console.log(`[TICKETS] ${(res as any).changes} tickets obsolètes supprimés.`);

  const sampleTickets = [
    {
      id: 'TKT-2026-001',
      subject: 'Assistance sur la première recharge STS',
      description: 'Demande d\'explication sur la grille tarifaire Domestique BT et la déduction des redevances lors du paiement Orange Money.',
      customerId: 'C001',
      meterId: '541-234-567',
      status: 'Résolu',
      priority: 'Moyenne',
      assignedTo: 'Kiosque Vente 1',
      timestamp: '2026-06-15T10:30:00.000Z'
    },
    {
      id: 'TKT-2026-002',
      subject: 'Vérification de disjoncteur différentiel',
      description: 'Demande de passage d\'un technicien NIGELEC pour contrôle préventif du réarmement automatique.',
      customerId: 'C001',
      meterId: '541-234-567',
      status: 'Ouvert',
      priority: 'Basse',
      assignedTo: 'Technicien Réseau',
      timestamp: '2026-07-20T14:15:00.000Z'
    },
    {
      id: 'TKT-2026-003',
      subject: 'Signalement de baisse de tension secteur (Plateau)',
      description: 'Fluctuation de tension observée en fin d\'après-midi sur la ligne BT Goudel/Plateau.',
      customerId: 'C002',
      meterId: '541-234-568',
      status: 'Nouveau',
      priority: 'Haute',
      assignedTo: 'Technicien Réseau',
      timestamp: '2026-07-25T08:45:00.000Z'
    },
    {
      id: 'TKT-2026-004',
      subject: 'Duplicata de reçu pour comptabilité entreprise',
      description: 'Transmission du relevé d\'achat de jetons STS pour l\'exercice fiscal du 2ème trimestre.',
      customerId: 'C003',
      meterId: '541-234-569',
      status: 'Résolu',
      priority: 'Basse',
      assignedTo: 'Kiosque Vente 1',
      timestamp: '2026-07-10T11:20:00.000Z'
    },
    {
      id: 'TKT-2026-005',
      subject: 'Contrôle de conformité poste transformateur MT/BT',
      description: 'Demande de recette technique du nouveau poste transformateur industriel.',
      customerId: 'C004',
      meterId: '541-234-570',
      status: 'Ouvert',
      priority: 'Critique',
      assignedTo: 'Technicien Réseau',
      timestamp: '2026-07-26T16:00:00.000Z'
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO tickets (id, subject, description, customerId, meterId, status, priority, assignedTo, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of sampleTickets) {
    insertStmt.run(t.id, t.subject, t.description, t.customerId, t.meterId, t.status, t.priority, t.assignedTo, t.timestamp);
  }

  console.log(`[TICKETS] 5 tickets clients propres insérés avec succès.`);
}

cleanTickets().catch(console.error);
