# Document d'Architecture Technique (DAT)
## Système e-EnergieTEC - Déploiement NIGELEC

**Version:** 6.5
**Date:** Septembre 2026
**Statut:** Qualifié pour Déploiement et Exploitation Nationale (NIGELEC / ARSE)

---

## 1. Objectif du Document
Ce document décrit l'architecture technique, matérielle et logicielle de la plateforme **e-EnergieTEC** dans le cadre de son déploiement national pour la NIGELEC. Il sert de référence pour les équipes DSI (Direction des Systèmes d'Information) de la NIGELEC pour l'installation, l'intégration et la maintenance.

## 2. Architecture Globale (Vue d'ensemble)
La solution e-EnergieTEC repose sur une architecture moderne de type "Full-Stack Web" avec une séparation claire entre le Frontend (présentation) et le Backend (logique métier & base de données).

L'architecture est structurée en 3 Tiers :
1. **Tier Présentation (Frontend) :** Interface utilisateur riche et réactive (React.js, Vite).
2. **Tier Logique (Backend) :** Serveur d'API RESTful (Node.js/Express) gérant les requêtes métiers, l'authentification et l'interface avec le réseau AMI et les modems GPRS/4G.
3. **Tier Données (Database) :** Base de données relationnelle persistante (PostgreSQL/SQLite) et base orientée séries temporelles (TimescaleDB) pour la gestion des courbes de charge (Load Profiles).

## 3. Composants Logiciels

### 3.1. Frontend (Application Client)
*   **Technologie :** React 18, TypeScript, Vite.js
*   **Stylisation :** Tailwind CSS (Design System NIGELEC - Orange/Vert Niger)
*   **Visualisation :** Recharts (Graphiques de consommation, Bilan Énergétique, analyse temporelle YoY %)
*   **Hébergement :** Fichiers statiques (HTML/CSS/JS) servis via un CDN ou un serveur NGINX.

### 3.2. Architecture Backend & Triple Démon Souverain
*   **Technologie :** Node.js 20 LTS, Framework Express.js, TypeScript
*   **Structure Découplée :**
    *   **Démon Sécurité KMS-HSM (Port 5000) :** Moteur cryptographique STS v2 (CEI 62055-41, SGC 600876) générant les jetons numériques sécurisés de 20 chiffres (Recharge, Clear Credit, Clear Tamper Subclass 5).
    *   **Démon Passerelle HES (Ports 4059 TCP & 4060 HTTP) :** Écouteur de trames DLMS push et passerelle d'acquisition temps réel.
    *   **Serveur Principal HES/MDMS (Port 3000) :** Gestion centralisée des APIs REST (`/api/*`), moteur de facturation NIGELEC 2024, passerelle Vending 2.0, surveillance Watchdog SSE et service web.
*   **Fonctions Clés :**
    *   Supervision temps réel et streaming SSE (`/api/stream/events`)
    *   **Télérelève Métrologique GPRS Directe par Codes OBIS (CEI 62056-61)** : Tension RMS `1.0.32.7.0.255`, Courant RMS `1.0.31.7.0.255`, Puissance `1.0.15.7.0.255`, Index d'énergie `1.0.1.8.0.255`.
    *   Algorithme de Détection d'Anomalies Réseau et Pertes Non-Techniques
    *   Génération de rapports PDF et bilans financiers conformes ARSE

### 3.3. Base de Données (SGBD)
*   **Environnement de Déploiement (Production NIGELEC) :**
    *   **PostgreSQL 16 :** Pour les données transactionnelles (Clients, Utilisateurs, Paiements, Factures).
    *   **TimescaleDB :** Extension PostgreSQL optimisée pour les données temporelles (Indexation massive des relevés de compteurs aux 15 minutes).
*   **Environnement de Démonstration/Local :** SQLite (Base de données embarquée).

## 4. Architecture de Déploiement (Infrastructure)

Pour garantir la haute disponibilité et la sécurité du système NIGELEC, le déploiement de production s'appuie sur la conteneurisation.

### 4.1. Environnement Conteneurisé (Docker)
L'ensemble de l'infrastructure est défini par des fichiers `docker-compose.yml` ou des manifestes Kubernetes, comprenant :
*   `e-energietec-backend` : Conteneur Node.js
*   `e-energietec-frontend` : Conteneur Nginx (Servant les fichiers statiques de Vite)
*   `e-energietec-db` : Conteneur PostgreSQL + TimescaleDB

### 4.2. Topologie Réseau
1.  **Zone DMZ (Internet / Agences) :** Accessible via un Load Balancer / Reverse Proxy (Nginx / HAProxy) qui gère la terminaison SSL/TLS (HTTPS).
2.  **Zone Application (LAN DSI) :** Serveurs Node.js isolés d'internet, accessibles uniquement depuis le Reverse Proxy.
3.  **Zone Données (LAN Sécurisé) :** Serveurs de base de données inaccessibles depuis le réseau public.

## 5. Intégration et API (Interfaçage)
La plateforme expose une série d'APIs RESTful pour la communication avec les systèmes tiers de la NIGELEC :

*   **API Opérateurs Mobile Money (Orange, Airtel, NITA) :** Endpoint sécurisé pour valider les paiements et renvoyer le code STS de 20 chiffres.
*   **API HES (Head End System) :** Endpoint de réception pour les données provenant des Concentrateurs (DCU) et des compteurs intelligents (Trame DLMS/COSEM parsée en JSON).
*   **Authentification API :** Les communications inter-systèmes sont sécurisées par des clés API (Bearer Tokens JWT) avec expiration gérée.

## 6. Sécurité Appliquée
*   **Chiffrement en Transit :** TLS 1.3 exigé sur l'ensemble des communications entrantes.
*   **Authentification Utilisateur :** Mécanisme JWT (JSON Web Tokens) avec durée de vie limitée (8 heures max) et rotation des secrets.
*   **Audit Trail (Traçabilité) :** Enregistrement systématique (Base de données `audits`) de chaque action critique (Ex: Génération de token, levée de fraude, création d'utilisateur).

## 7. Plan de Reprise d'Activité (PRA)
*   **Sauvegardes (Backups) :** Scripts cron quotidiens effectuant des dumps SQL complets encryptés (`pg_dump`) exportés sur un stockage externe (NAS DSI NIGELEC ou Cloud Storage sécurisé).
*   **Redondance :** (Phase 2) Mise en place d'un cluster PostgreSQL Active/Standby pour assurer la continuité en cas de panne matérielle du nœud principal.

---
*Ce document technique est une base évolutive. Il devra être mis à jour à chaque intégration d'un nouveau modèle de compteur physique ou interconnexion bancaire.*
