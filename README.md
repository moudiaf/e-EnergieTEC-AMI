# e-EnergieTEC : Système Intégré AMI & Smart Prepayment (STS) - Enterprise Edition

![e-EnergieTEC Banner](https://img.shields.io/badge/Status-Production_Ready-green?style=for-the-badge)
![Compliance](https://img.shields.io/badge/IEC-62055--41_STS-orange?style=for-the-badge)
![Target](https://img.shields.io/badge/Target-NIGELEC_Niger-red?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Enterprise_Docker-blue?style=for-the-badge)

## 📋 Présentation du Projet
**e-EnergieTEC** est une plateforme souveraine de gestion d'infrastructure de comptage intelligent (AMI) de type **"Thick Smart Metering"**. Conçue et développée spécifiquement pour répondre aux exigences techniques, tarifaires et visuelles de la **NIGELEC (Société Nigérienne d'Electricité)** et de l'**ARSE (Autorité de Régulation du Secteur de l'Énergie)** au Niger. 

La solution orchestre l'intégralité du cycle de vie de l'énergie : de la télé-relève avancée à la vente prépayée STS, en passant par le système d'hypervision antifraude et la gestion du cycle de vie matériel.

---

## 🛠 Architecture Technique (Enterprise Edition)

L'application a évolué vers une architecture robuste, scalable et conteneurisée, adaptée aux déploiements nationaux massifs.

### 🟦 Frontend (Client Stratégique & Dashboarding)
*   **Framework** : React 18 (Vite)
*   **Design System** : Tailwind CSS avec UI Premium (Glassmorphism, Dark Mode)
*   **Branding** : Intégration totale de la charte graphique NIGELEC (Orange Nigelec, Vert Niger, Blasons régionaux).
*   **Visualisation** : Recharts (Analyses MDMS temps réel) & Framer Motion (Micro-interactions UI).
*   **Génération de Rapports** : jsPDF + autoTable (Rapports ARSE & Réconciliation Mobile Money).

### 🟧 Backend (Core MDMS & Vending API)
*   **Serveur Applicatif** : Node.js (TypeScript) & Express
*   **Base de Données Transactionnelle** : PostgreSQL (Architecture Enterprise)
*   **Base de Données Séries Temporelles** : TimescaleDB (Optimisé pour les données de comptage/télé-relève)
*   **Sécurité** : JWT & Chiffrement AES-256 (Génération de tokens STS 20 chiffres)
*   **Déploiement** : Conteneurisation Docker & Orchestration via Docker Compose.

---

## 🚀 Fonctionnalités Clés & Conformité NIGELEC

### 1. Moteur Tarifaire National & Vending STS
*   Conformité stricte aux grilles tarifaires NIGELEC (Monophasé/Triphasé).
*   Application de la **TVA à 19%** et des redevances fixes.
*   Gestion unifiée de la devise nationale (**FCFA**).
*   Intégration et réconciliation dynamique des paiements (Guichet, Mobile Money).

### 2. MDMS & VEE (Validation, Estimation, Editing)
*   Traitement massif des profils de charge à intervalles de 15 minutes (TimescaleDB).
*   Règles de validation automatiques (Seuils de tension, surcharges).
*   Estimation intelligente des creux de données (Interpolation).

### 3. Hypervision & Détection de Fraude Intelligente
*   Détection en temps réel de 22 scénarios de fraude : Bypass, ouverture capot, champs magnétiques.
*   Cartographie et localisation des incidents sur la topologie du réseau de Niamey.
*   Génération de fiches d'intervention automatisées.

### 4. Centre de Gestion des Clés (KMC) & Sécurité
*   Support natif du **Supply Group Code (SGC) 600451**.
*   Gestion sécurisée des **Key Revision Numbers (KRN)** et processus de Rollover cryptographique (KRN 1 ➔ 2).
*   Audit log infalsifiable de toutes les actions sensibles (Syslog sécurisé).

---

## 📡 Installation, Exécution & Déploiement

Le projet est conçu pour s'exécuter dans des environnements locaux pour le développement, ou via Docker pour la production.

### Pré-requis
*   Node.js (v18+)
*   Docker & Docker Compose (Pour l'environnement Enterprise)
*   Ngrok (Optionnel, pour l'exposition du serveur local lors des démos)

### 🐳 Déploiement Docker (Recommandé - Production)
L'environnement complet (PostgreSQL + TimescaleDB + Backend + Frontend) se lance via Docker Compose :
```bash
# Lancement de l'infrastructure de base de données
docker-compose up -d db timescale

# Lancement des services applicatifs
docker-compose up -d api frontend
```

### 💻 Environnement de Développement Local
**1. Installation des dépendances :**
```bash
npm install
```

**2. Démarrage du Backend (Mode Dev) :**
```bash
npm run server
```
*L'API est exposée sur `http://localhost:3001`.*

**3. Démarrage du Frontend :**
```bash
npm run dev
```
*Interface accessible via `http://localhost:3000`.*

**4. Tunneling Ngrok (Pour Démonstration Distante) :**
Pour exposer l'application localement à des parties prenantes externes :
```bash
ngrok http 3000
```

---

## 📊 Rapports Réglementaires Automatisés
Le système génère dynamiquement des rapports exportables pour la direction :
*   **Audit ARSE** : Conformité réglementaire et qualité de service (SAIDI/SAIFI).
*   **Bilan Financier STS** : Volume injecté vs. volume vendu (Revenue Assurance).
*   **Logs d'Intégrité Système** : Historique consolidé des accès et opérations critiques.

---

## 👤 Rôles et Droits d'Accès
*   **ADMIN / SUPER-ADMIN** : Supervision nationale, configuration système et KMC.
*   **VENDING (Guichetier)** : Opérations de vente STS, annulations et gestion clientèle.
*   **TECH (Technicien Réseau)** : Résolution d'anomalies, maintenance des compteurs (Cycle de vie).
*   **AUDITEUR** : Accès en lecture seule aux rapports et logs d'intégrité.

---
© 2026 **e-EnergieTEC** | Plateforme AMI Conçue pour NIGELEC.
