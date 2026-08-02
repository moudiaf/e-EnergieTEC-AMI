# e-EnergieTEC : Système Intégré AMI & Smart Prepayment (STS) - Enterprise Edition

![e-EnergieTEC Banner](https://img.shields.io/badge/Status-Production_Ready-green?style=for-the-badge)
![Compliance](https://img.shields.io/badge/IEC-62055--41_STS-orange?style=for-the-badge)
![GIS Engine](https://img.shields.io/badge/GIS-Esri_Leaflet_MapLibre-cyan?style=for-the-badge)
![Target](https://img.shields.io/badge/Target-NIGELEC_Niger-red?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Enterprise_Docker-blue?style=for-the-badge)

## 📋 Présentation du Projet
**e-EnergieTEC** est une plateforme souveraine de gestion d'infrastructure de comptage intelligent (AMI) de type **"Thick Smart Metering"**. Conçue et développée spécifiquement pour répondre aux exigences techniques, tarifaires, géospatiales et visuelles de la **NIGELEC (Société Nigérienne d'Électricité)** et de l'**ARSE (Autorité de Régulation du Secteur de l'Énergie)** au Niger. 

La solution orchestre l'intégralité du cycle de vie de l'énergie : de la télé-relève avancée à la vente prépayée STS, en passant par le système d'hypervision antifraude, la console SIG géospatiale et la gestion du réseau de concentration DCU.

---

## 🛠 Architecture Technique (Enterprise Edition)

### 🟦 Frontend (Client Stratégique & Dashboarding)
*   **Framework** : React 19 (Vite)
*   **Console Cartographique SIG** : Integration **Leaflet / MapLibre GL** avec basculement multi-fournisseurs (**Esri World Imagery Satellite HD**, **OpenStreetMap**, **OpenTopo Map Terrain**, **CARTO Dark Matter**).
*   **Design System** : Tailwind CSS avec UI Premium (Glassmorphism, Dark Mode)
*   **Branding** : Intégration totale de la charte graphique NIGELEC (Orange Nigelec, Vert Niger, Blasons des 8 Régions).
*   **Visualisation** : Recharts (Analyses MDMS temps réel) & Framer Motion (Micro-interactions UI).
*   **Génération de Rapports** : jsPDF + autoTable (Rapports ARSE & Réconciliation Mobile Money).

### 🟧 Backend (Core MDMS & Vending API) - Architecture N-Tiers
*   **Serveur Applicatif** : Node.js (TypeScript) & Express avec Architecture Modulaire.
*   **Base de Données Transactionnelle** : PostgreSQL (Architecture Enterprise) / SQLite (Développement).
*   **Base de Données Séries Temporelles** : TimescaleDB (Optimisé pour les données de comptage/télé-relève).
*   **Sécurité** : JWT (HSM Ready) & Chiffrement AES-256 (Génération de tokens STS durcie avec gestion TID et Bcrypt pour les mots de passe).
*   **Tunneling & Exposition** : Ngrok optimisé avec `clientPort: 443` pour WebSocket HMR sans interruption.

---

## 🚀 Fonctionnalités Clés & Conformité NIGELEC

### 1. Vente prépayée STS & Mobile Money (+227)
*   Conformité stricte à la norme **IEC 62055-41 (Jetons 20 chiffres)**.
*   Grille tarifaire NIGELEC (TVA 19%, Taxe Habitat 100 F, Redevances ORTN + Municipale, Prime Fixe).
*   **Canal Mobile Money** : Saisie du numéro payeur (+227) avec requête Push USSD simulée (Orange Money, Airtel, NITA, AMANA).

### 2. Console SIG Multicalque & Télémesure Triphasée HTA/BT
*   **4 Fonds de carte** : Esri Satellite HD, OpenStreetMap, OpenTopo Terrain, CARTO Dark Mode.
*   **Calques Réseau** : Compteurs (verts/rouges), DCU Concentrateurs (cyans), Postes HTA/BT (losanges dorés), Dorsale HT (132kV/90kV).
*   **Panneau Télémesure Direct** : Télémétrie Triphasée $V_{L1}, V_{L2}, V_{L3}$, $I_1, I_2, I_3$, Cos φ et télé-actions (Coupure / Réarmement à distance).

### 3. Maintenance Terrain & Sécurité Antifraude
*   **Code Levée de Doute `2026`** pour réinitialiser les fraudes capot et refermer le contacteur interne du compteur.
*   **Supervision des DCU** : Modification (PUT), Ping de latence temps-réel, Reboot à distance.

---

## 👥 Accès & Habilitations Utilisateurs (Rôles)

| Rôle | Identifiant | Mot de Passe | Périmètre d'Action |
|:---|:---:|:---:|:---|
| **ADMIN** | `admin` | `admin123` | Gestion globale, habilitations, tarifs, audits KMS |
| **VENDOR** | `vendor` | `vendor123` | Kiosque vente STS, paiements Mobile Money (+227) |
| **TECH** | `tech` | `tech123` | Maintenance réseau, levée de doute (`2026`), DCUs, SIG |
| **CUSTOMER** | `jean` | `jean123` | Portail abonné, recharges en ligne, consommation |
| **AUDITOR** | `auditor` | `auditor123` | Assurance revenus, rapports réglementaires ARSE |

---

## 📡 Installation, Exécution & Déploiement

### Pré-requis
*   Node.js (v18+)
*   Docker & Docker Compose (Optionnel, pour mode Enterprise)

### 💻 Environnement de Développement & Déploiement Local

**1. Installation des dépendances :**
```bash
npm install
```

**2. Tests d'Intégration & Audit de Santé :**
```bash
# Vérification TypeScript
npm run lint

# Run de la suite de tests automatisés (5/5 PASS)
npx tsx server/tests/run-tests.ts

# Audit de la base de données
npx tsx server/db/debug_check.ts
```

**3. Démarrage de l'Application (Express Backend + Vite Frontend) :**
```bash
npm run dev
```
*Application accessible via `http://localhost:3000`.*
