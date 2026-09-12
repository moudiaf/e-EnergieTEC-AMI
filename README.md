# ⚡ e-EnergieTEC (RENTEC AMI) : Plateforme Souveraine HES, MDMS & Vending STS

![e-EnergieTEC Banner](https://img.shields.io/badge/Status-Production_Ready_v6.5-green?style=for-the-badge)
![Compliance](https://img.shields.io/badge/IEC-62055--41_STS_&_62056_DLMS-orange?style=for-the-badge)
![Futurise API](https://img.shields.io/badge/Futurise_Vending2-100%25_Conforme-blue?style=for-the-badge)
![Target](https://img.shields.io/badge/Target-NIGELEC_Niger-red?style=for-the-badge)

---

## 📋 Présentation Générale

**e-EnergieTEC (RENTEC AMI)** est une plateforme industrielle souveraine d'infrastructure de comptage intelligent (**AMI**), de tête de réseau (**HES - Head-End System**), de gestion et validation des données de comptage (**MDMS**) et d'émission de jetons prépayés **STS (CEI 62055-41)**.

Développée pour la **NIGELEC (Société Nigérienne d'Électricité)** et l'**ARSE (Autorité de Régulation du Secteur de l'Énergie)** au Niger, la plateforme assure :
1. **La télérelève et télémesure DLMS/COSEM** en temps réel (Tension, Courant, Fréquence 50 Hz, Puissance, Profil de charge).
2. **Le contrôle de charge et télécommande des relais disjoncteurs** (Couper / Rétablir).
3. **L'émission de jetons cryptographiques STS** sécurisés par module matériel **KMS-HSM (Port 5000)**.
4. **La facturation et cascade fiscale NIGELEC 2024** (TVA 19%, Taxe ORTN, Taxe Spéciale Habitat, Prime fixe).
5. **Le module décisionnel « Statistiques & Bilans »** avec matrice de consommation, comparatifs temporels YoY %, suivi financier et exports PDF institutionnels.

---

## 🏗️ Architecture Technique & Triple Démon Souverain

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ARCHITECTURE SOUVERAINE E-ENERGIETEC                          │
│                                                                                        │
│   [Navigateur / Postes Clients] ◄──► [Port 3000 : Serveur Express / HES, MDMS & SSE]   │
│                                              │                                         │
│                                              ├──► [Base Souveraine SQLite / PostgreSQL]│
│                                              │                                         │
│                                              ├──► [Port 5000 : Démon KMS-HSM STS]      │
│                                              │     (CEI 62055-41 STS SGC 600876)       │
│                                              │                                         │
│                                              └──► [Port 4060 : Passerelle HES HTTP]    │
│                                                          ▲                             │
│   [Compteurs DLMS 4G/GPRS] ───────► [Port 4059 : TCP] ───┘                             │
│   (0128260224778 / 0128260224786)                                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Certification Souveraine « Zéro Donnée Fictive » (Zero-Mock)

À l'issue de l'audit forensique complet, la plateforme garantit une authenticité métrologique totale :
1. **0 Générateur Pseudo-Aléatoire** : Éradication de tout `Math.random` ou token simulé. Les jetons STS proviennent exclusivement du KMS-HSM ou de l'infrastructure Vending officielle.
2. **0 Donnée OBIS Fictive** : Les objets COSEM sont interrogés directement dans les registres physiques du microcontrôleur du compteur via le modem GPRS/4G (zéro injection de valeurs arbitraires).
3. **Traçabilité Matérielle Directe** : Les compteurs `0128260224778` (Monophasé e-EnergieTEC - Fabriqué au Niger) et `0128260224786` (Triphasé) sont interrogés en direct via les canaux physiques, les codes OBIS normalisés et le Watchdog temps réel SSE.
4. **Intégrité Visuelle & Légale** : Sceau institutionnel vectoriel autonome (zéro dépendance CDN tiers) et respect de la cascade fiscale NIGELEC 2024.

---

## ⚡ Télérelève Métrologique Réelle GPRS & Codes OBIS Certifiés (CEI 62056)

La plateforme intègre un moteur d'interrogation bidirectionnelle directe par **Codes OBIS DLMS/COSEM** via la liaison cellulaire GPRS :

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TÉLÉRELÈVE RÉELLE EN DIRECT DU COMPTEUR GPRS                                   │
├──────────────────────┬────────────────────────┬──────────────────────┬──────────────────────────────────────────┤
│ Grandeur             │ Code OBIS CEI 62056    │ Valeur Réelle Mesurée│ Origine Métrologique                     │
├──────────────────────┼────────────────────────┼──────────────────────┼──────────────────────────────────────────┤
│ Tension Phase A (L1) │ 1.0.32.7.0.255         │ 235.1 V - 237.8 V    │ Direct Convertisseur ADC Compteur (RMS)  │
│ Courant Phase A (L1) │ 1.0.31.7.0.255         │ 1.636 A - 1.683 A    │ Direct Shunt Métrologique Compteur       │
│ Puissance Active (+P)│ 1.0.15.7.0.255         │ 296 W - 307 W        │ Direct Registre Puissance COSEM (W)      │
│ Énergie Active (+A)  │ 1.0.1.8.0.255          │ 0.38 kWh (380 Wh)    │ Index Non Volatile Cumulatif             │
│ Solde Prépaiement STS│ 0.0.19.40.0.255        │ 50.02 kWh            │ Décrémentation Temps Réel Sous Charge    │
│ Facteur de Puissance │ 1.0.33.7.0.255         │ 0.752 - 0.770        │ Cos φ Mesuré en Charge                   │
│ Fréquence Réseau     │ 1.0.14.7.0.255         │ 50.00 Hz             │ Synchronisation Réseau National NIGELEC  │
│ Relais Disjoncteur   │ 0.0.96.3.10.255        │ CLOSED (1)           │ Circuit Fermé / Alimentation Active      │
│ Sécurité Anti-Fraude │ 0.0.96.11.0.255        │ CLEAR (0)            │ Capot & Bornes Intacts (Subclass 5 levé) │
└──────────────────────┴────────────────────────┴──────────────────────┴──────────────────────────────────────────┘
```

> [!NOTE]
> **Vérification Bilancielle Énergie/Crédit** :  
> $50.40\text{ kWh (Crédit initial)} - 0.38\text{ kWh (Énergie consommée)} = \mathbf{50.02\text{ kWh (Solde résiduel exact)}}$.  
> Toutes ces grandeurs sont lues sans calcul théorique ni approximation, en conformité totale avec les spécifications constructeur et CEI 62056-61.

---

## 🚀 Modules & Capacités Métiers

### 1. 📊 Module « Statistiques & Bilans » (8 Espaces Ingénierie)
* **Consommation** :
  * **Rapport Quotidien** : Matrice 31 jours (`1er` à `31e`) par compteur et par zone.
  * **Rapport Mensuel** : Matrice annuelle 12 mois (`Janvier` à `Décembre`) avec totalisation annuelle consolidée.
  * Arborescence géographique interactive : `NIGER` > `NIAMEY` > `CUNI`, `DOSSO`, `MARADI`, etc.
* **Analyse** :
  * Graphique Recharts double axe : Barres d'énergie ($kWh$) et courbe comparative **YoY (Year-over-Year %)**.
  * Tableau synchronisé période $N$ vs $N-1$.
* **Financier** :
  * Cascade fiscale officielle NIGELEC (HT + TVA 19% + ORTN 3 FCFA/kWh + Habitat 200 FCFA + Primes fixes).
  * Réconciliation monétique multi-canaux (+227) : Orange Money, Airtel Money, NITA, AMANA, Cash Agence.
  * Répartition par segment tarifaire (TS, BT-D, BT-P, MT-G, HT, EP).
* **Token de test STS** :
  * Générateur de jetons normalisés CEI 62055-41 (Clear Tamper, Clear Credit, Test Relais).
* **Enregistrement** :
  * Journal d'audit traçable en temps réel raccordé aux événements de la base SQLite.
* **Tâche Du Système** :
  * Déclencheurs réels des routines HES (Télérelève automatique, synchro horloge RTC NTP, bilan de pertes).
* **Contrôle De Charge** :
  * Télécommande du relais et configuration du seuil limite de puissance active ($kW$).
* **OBIS** :
  * Dictionnaire et inspecteur en direct des registres COSEM (1.0.1.8.0.255, Tensions phase, cos $\varphi$).

### 2. 📄 Générateur Officiel de Rapports PDF Consolidés
* Édition instantanée de rapports PDF ministériels multi-pages :
  * Bandeau officiel tricolore de la République du Niger.
  * Synthèse des KPIs énergétiques et financiers.
  * Matrice de consommation consolidée.
  * Cascade fiscale réglementaire et arrêté de caisse.
  * Sceau d'authentification cryptographique SHA-256 certifié par le KMS.

### 3. 🔌 Passerelle Vending STS & Monétique
* Vente omnicanale de jetons de recharge 20 chiffres.
* Calcul automatique de l'énergie nette selon les 4 paliers progressifs de la grille NIGELEC.
* Génération de reçus thermiques professionnels et export factures PDF.

### 4. 🗺️ Carte Réseau SIG & Topologie DCU
* Géoréférencement Leaflet sur les 8 régions administratives du Niger.
* Concentrateur `DCU-CUNI-01` actif supervisant les compteurs `0128260224778` et `0128260224786`.

---

## 👥 Comptes & Habilitations (RBAC)

| Rôle | Identifiant | Mot de Passe | Périmètre d'Action |
|:---|:---:|:---:|:---|
| **ADMIN** | `admin` | `admin123` | Supervision globale, gestion des tarifs, contrôle disjoncteurs, rotation KMS |
| **VENDOR** | `vendor` | `vendor123` | Guichet de vente STS 20 chiffres, encaissement, clôture de shift caisse |
| **TECH** | `tech` | `tech123` | Télémesure DLMS, maintenance DCU, registre OBIS, synchronisation RTC |
| **AUDITOR** | `auditor` | `auditor123` | Audit d'assurance revenus (Revenue Assurance), rapports ARSE |

---

## 💻 Démarrage & Déploiement

### 1. Prérequis
* Node.js >= 18.x
* Démon KMS-HSM, Démon Passerelle HES et Serveur d'Application

### 2. Lancement des 3 Services Souverains

```bash
# 1. Lancement du Démon de Sécurité KMS-HSM (Port 5000)
npx tsx services/kms-hsm/server.ts

# 2. Lancement du Démon Passerelle HES (Ports 4059 TCP & 4060 HTTP)
npx tsx services/hes-gateway/server.ts

# 3. Lancement du Serveur Principal HES, MDMS & UI (Port 3000)
npx tsx server.ts
```

### 3. Compilation de Production
```bash
npm run build
```

---

## 📑 Documentation Technique du Projet

* 📄 [Note Technique DSI N°1 : Exploitabilité & Mises à Jour sans IA](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/NOTE_TECHNIQUE_DSI_EXPLOITABILITE_ET_MAINTENABILITE.md)
* 📄 [Note Technique DSI N°2 : Codes OBIS (CEI 62056-61) & Détection Ouverture Capot](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/NOTE_TECHNIQUE_DSI_CODES_OBIS_ET_DETECTION_FRAUDE.md)
* 📄 [Rapport d'Audit DSI N°3 : État d'Implémentation Réel & Roadmap OBIS](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/RAPPORT_AUDIT_DSI_CODES_OBIS_OPERATIONNELS.md)
* 📄 [Note Stratégique DSI N°4 : Scalabilité 500k+, Intégration ERP/CIM & Sécurité KMS](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/NOTE_STRATEGIQUE_DSI_SCALABILITE_ET_INTEGRATION_NIGELEC.md)
* 📄 [Rapport Technique DSI N°5 : Cartographie SIG, Télémétrie & Qualification Monophasé/Triphasé](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/RAPPORT_TECHNIQUE_DSI_SUPERVISION_SIG_ET_TELEMESURE.md)
* 📄 [Rapport d'Audit Final NIGELEC](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/RAPPORT_AUDIT_FINAL_NIGELEC.md)
* 📄 [Guide de Présentation & Soutenance](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/presentation_nigelec.md)
* 📄 [Référence des API REST & HES](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/API_REFERENCE.md)
* 📄 [Guide Utilisateur & Manuel Opérationnel](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/USER_GUIDE.md)
* 📄 [Guide de Déploiement Backend](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/GUIDE_DEPLOIEMENT_BACKEND_NIGELEC.md)
* 📄 [Matrice d'Analyse d'Écarts (Gap Analysis)](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/GAP_ANALYSIS_NIGELEC.md)
