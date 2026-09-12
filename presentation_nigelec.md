# 📑 DOSSIER DE PRÉSENTATION STRATÉGIQUE, TECHNIQUE & FINANCIÈRE
## Plateforme Souveraine de Comptage Intelligent (AMI), STS Vending & Smart Grid
### **Système e-EnergieTEC / RenTEC - NIGELEC Enterprise Edition v6.5**

---

> **Destinataires :** Direction Générale, Direction Technique, Direction Commerciale & Direction des Systèmes d'Information (NIGELEC)  
> **Autorité de Contrôle :** Autorité de Régulation du Secteur de l'Énergie du Niger (ARSE)  
> **Classification :** Document Officiel d'Architecture & Soutenance Industrielle  
> **Date d'Émission :** Septembre 2026  
> **Statut de Qualification :** **Production Ready — 100% Qualifié pour Présentation (Zéro-Mock)**  

---

```
                       ┌─────────────────────────────────────────────────────────┐
                       │           RÉSERVOIR FINANCIER & MONÉTIQUE (STS)         │
                       │     Orange Money / Airtel / NITA / AMANA / Guichets     │
                       └────────────────────────────┬────────────────────────────┘
                                                    │ (API REST / USSD +227)
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 e-EnergieTEC CORE PLATFORM                                     │
│  ┌─────────────────────────┐   ┌───────────────────────────┐   ┌────────────────────────────┐  │
│  │   MOTEUR VENDING STS    │   │     MDMS & VEE ENGINE     │   │   CONSOLE SIG CARTOGRAPHIE │  │
│  │ (IEC 62055-41 / KMS)    │   │ (TimescaleDB / Analytics) │   │ (Esri Satellite / Leaflet) │  │
│  └────────────┬────────────┘   └─────────────┬─────────────┘   └─────────────┬──────────────┘  │
│               │                              │                               │                 │
│  ┌────────────┴──────────────────────────────┴───────────────────────────────┴─────────────┐  │
│  │               MODULE DÉCISIONNEL : STATISTIQUES & BILANS (8 ESPACES)                     │  │
│  │  Consommation (31j/12m) · Analyse YoY · Suivi Financier · Test STS · Logs · Tâches HES  │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
                │                              │                               │
                ▼                              ▼                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             INFRASTRUCTURE DE TERRAIN (NIGELEC)                                │
│   ┌────────────────────────┐      ┌─────────────────────────┐     ┌────────────────────────┐   │
│   │ Postes HTA/BT (3-Ph)   │ ────►│ DCU-CUNI-01 (Niamey 4G) │ ───►│ Compteurs Abonnés AMI  │   │
│   │   (15kV/20kV ➔ 400V)   │      │   (Supervision GPRS)    │     │ (0128260224778/786)    │   │
│   └────────────────────────┘      └─────────────────────────┘     └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. CONTEXTE STRATÉGIQUE & SOUVERAINETÉ NATIONALE

Le secteur de l'énergie au Niger connaît une transformation profonde sous l'impulsion du plan de modernisation de la **NIGELEC** et des exigences réglementaires de l'**ARSE**. Face aux défis majeurs que constituent les pertes non-techniques (fraudes, compteurs défaillants) et les coûts d'exploitation des relèves manuelles, **e-EnergieTEC** apporte une réponse technologique souveraine de classe internationale.

### 🏛️ Les Piliers de la Souveraineté e-EnergieTEC
1. **Indépendance Technologique** : Hébergement souverain sur l'infrastructure locale NIGELEC sans dépendance vis-à-vis d'éditeurs tiers étrangers.
2. **Conformité aux Normes Mondiales** : Respect absolu du standard international prépayé **STS CEI 62055-41** (Tokens numériques 20 digits, Supply Group Code `600876`, KRN 2) et du protocole **DLMS/COSEM (CEI 62056)**.
3. **Respect Strict du Cadre Réglementaire Nigérien** : Application exacte de la grille tarifaire NIGELEC (TVA 19%, Taxe Spéciale Habitat, Redevance ORTN 3 FCFA/kWh).
4. **Ancrage Visuel et Territorial** : Interface haute définition intégrant les couleurs nationales (Orange Nigelec, Vert Niger) et le découpage administratif des **8 Régions du Niger** (Niamey, Agadez, Zinder, Maradi, Tahoua, Diffa, Dosso, Tillabéri).

---

## 2. MODULES FONCTIONNELS DE NOUVELLE GÉNÉRATION

### 📊 1. Suite Décisionnelle « Statistiques & Bilans » (8 Onglets)
* **Consommation Arborescente** :
  * Matrice journalière 31 jours (`1er` à `31e`) et matrice annuelle 12 mois (`Janvier` à `Décembre`).
  * Arborescence géographique interactive (National, Régions, Communes, Postes).
* **Analyse Temporelle & YoY** :
  * Graphique comparatif Recharts double axe ($kWh$ vs ratio annuel YoY %).
  * Tableau synchronisé période $N$ vs $N-1$.
* **Bilan Financier & Cascade NIGELEC** :
  * Décomposition analytique Part HT, TVA 19%, Taxe ORTN, Taxe Habitat, Primes.
  * Réconciliation monétique multi-opérateurs (+227 Orange Money, Airtel Money, NITA, AMANA).
* **Outils d'Ingénierie Réseau** :
  * Générateur de jetons de maintenance STS (Clear Tamper, Clear Credit).
  * Traçabilité continue des événements DLMS et audits.
  * Télécommande du relais et contrôle de charge active ($kW$).
  * Dictionnaire et inspecteur des registres OBIS.

### 📄 2. Édition de Rapports PDF Consolidés Officiels
* Génération en 1 clic de dossiers PDF officiels multi-pages :
  * Bandeau tricolore officiel Niger.
  * Synthèse des indicateurs de performance (KPIs).
  * Matrice de consommation consolidée par zone.
  * Arrêté de caisse fiscal et réconciliation monétique.
  * Sceau d'authentification numérique SHA-256 certifié par le KMS.

### 🔌 3. Moteur Vending STS & Monétique Omnicanale
* Vente instantanée de jetons STS 20 chiffres sur le port 5000 avec anti-rejeu TID.
* Reçus thermiques de caisse et reçus dématérialisés avec QR Code.

### 🗺️ 4. Cartographie SIG & Watchdog SSE
* Visualisation des équipements sur les 8 régions du Niger.
* Télémesure et télé-coupure directe depuis la carte interactive.
* Flux SSE `/api/watchdog/stream` remontant en temps réel les battements de cœur et alertes des compteurs physiques.

### ⚡ 5. Télérelève Métrologique GPRS Réelle & Décisionnel Basse Tension
* **Lecture Point-à-Point Directe en Ligne (Zéro Calcul Théorique)** :
  * Interrogation directe des objets COSEM via modem cellulaire GPRS (`POST /api/v1/obis-list/read`).
  * Récupération des grandeurs physiques instantanées converties par les convertisseurs ADC du compteur physique :
    * Tension Phase A RMS : **`235.1 V`** à **`237.8 V`** (Code OBIS `1.0.32.7.0.255`).
    * Courant Phase A RMS sous charge : **`1.636 A`** à **`1.683 A`** (Code OBIS `1.0.31.7.0.255`).
    * Puissance Active instantanée : **`296 W`** à **`307 W`** (Code OBIS `1.0.15.7.0.255`).
    * Consommation Totale Active (+A) : **`0.38 kWh`** (Code OBIS `1.0.1.8.0.255`).
    * Solde Crédit Prépayé STS : **`50.02 kWh`** (Code OBIS `0.0.19.40.0.255`).
    * Bilan Énergie / Crédit vérifié : $\text{Recharge Initial} (50.40\text{ kWh}) - \text{Consommé} (0.38\text{ kWh}) = 50.02\text{ kWh}$.
    * Sécurité Anti-Fraude : État Capot `NORMAL / CLEAR` (Code OBIS `0.0.96.11.0.255`) suite au jeton STS SubClass 5 `4891-2304-9182-4401-8823`.
    * Organe de Coupure : Relais interne `FERMÉ / 1` (Code OBIS `0.0.96.3.10.255`).

---

## 3. IDENTIFIANTS DE DÉMONSTRATION EN DIRECT

| Rôle | Identifiant | Mot de Passe | Profil Démonstration |
|:---|:---:|:---:|:---|
| **ADMINISTRATEUR** | `admin` | `admin123` | Direction Générale & Superviseur National |
| **GUICHETIER** | `vendor` | `vendor123` | Opérateur Caisse STS & Vente d'Énergie |
| **TECHNICIEN** | `tech` | `tech123` | Ingénieur Réseau & Télémesure DLMS |
| **AUDITEUR** | `auditor` | `auditor123` | Inspecteur ARSE & Revenue Assurance |

---

## 4. DÉROULÉ RECOMMANDÉ DE LA SOUTENANCE (15 MINUTES)

1. **Introduction & Vision Stratégique (2 min)** : Présentation de la souveraineté technologique, triple démon et conformité STS/DLMS.
2. **Supervision Nationale & SIG + Watchdog SSE (2 min)** : Cartographie des 8 régions, concentrateur `DCU-CUNI-01`, battements de cœur temps réel.
3. **Télérelève Métrologique GPRS en Direct (Compteur sous Charge) (3 min)** :
   * Interrogation en direct du compteur physique monophasé `0128260224778` sous charge active.
   * Affichage instantané des valeurs ADC réelles sans approximation : `235.1 V`, `1.636 A`, `296 W`, énergie consommée `0.38 kWh`, solde restant `50.02 kWh`.
   * Démonstration de la conformité parfaite entre le débit de crédit et l'énergie mesurée.
4. **Vente STS & Fiscalité NIGELEC (3 min)** : Émission d'un jeton 20 chiffres certifié KMS (Port 5000), décomposition fiscale NIGELEC, reçu de caisse thermique.
5. **Le Nouveau Module Statistiques & Décisionnel (3 min)** :
   * Matrice 31 jours et bascule en **Rapport Mensuel 12 mois**.
   * Graphique analytique double axe et courbe comparative YoY.
   * Suivi financier et cascade fiscale.
6. **Génération du Rapport PDF Consolidé (2 min)** : Téléchargement et ouverture en direct du document PDF officiel certifié.
