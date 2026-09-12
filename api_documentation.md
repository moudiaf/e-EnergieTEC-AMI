# 📘 Documentation Technique - API e-EnergieTEC (NIGELEC)

Ce document décrit les points de terminaison (endpoints) de l'API REST de la plateforme e-EnergieTEC pour la gestion intelligente des compteurs (AMI) et le prépaiement (STS).

## 🔐 Authentification (JWT)

Toutes les requêtes API (sauf `/api/login`) nécessitent un jeton de porteur (Bearer Token) dans l'en-tête `Authorization`.

- **POST /api/login**
  - **Corps**: `{ "username": "...", "password": "..." }`
  - **Réponse**: `{ "token": "...", "user": { ... } }`
  - **Note**: Le jeton est valide pendant 8 heures.

---

## 🏛️ Gestion des Actifs & Regions

### Clients
- **GET /api/customers** : Liste tous les clients (PII Masquées via Driver).
- **POST /api/customers** : Création d'un nouvel abonné.
- **PUT /api/customers/:id** : Mise à jour des informations de contact.

### Compteurs (Meters)
- **GET /api/meters** : Inventaire complet des compteurs (Magasin + Installés).
- **POST /api/meters** : Enregistrement d'un lot de compteurs.
- **PUT /api/meters/:id/communication** : Configuration IP/MAC et protocole (DLMS/Modbus).

---

## ⚡ Opérations STS (Prépaiement)

### Jetons (Tokens)
- **GET /api/tokens** : Historique exhaustif des recharges.
- **POST /api/tokens** : Génération et activation d'un token STS de 20 chiffres.
  - **Types supportés**: `recharge`, `key-change`, `clear-credit`, `clear-tamper`.
  - **Logique**: Met à jour automatiquement le crédit résiduel en base de données.

---

## 📡 Supervision AMI & MDMS

### Lectures d'Intervalles (VEE)
- **GET /api/mdms/stats** : KPI de performance du réseau (Lectures totales, Taux de validité).
- **POST /api/mdms/simulate-mass** : Déclenche une lecture de masse (96 intervalles/compteur).
  - **Traitement VEE**: Applique automatiquement le "Gap Filling" par interpolation linéaire en cas de perte de données.

### Alertes & Fraudes
- **GET /api/alerts** : Liste des anomalies détectées (Surtension, Tamper).
- **POST /api/alerts** : Déclenchement manuel d'une alerte système.
- **Note**: Les alertes de type `danger` créent automatiquement un ticket d'intervention pour les techniciens réseau.

---

## 📈 Analytics & Rapports
 
- **GET /api/analytics/energy-balance** : Bilan énergétique par région (Injecté vs Consommé).
- **GET /api/analytics/trends** : Courbe de charge consolidée sur les 30 derniers jours.
- **GET /api/statistics/consumption-matrix** : Matrice quotidienne 31j ou mensuelle 12m par compteur/région.
- **GET /api/statistics/meter-analysis** : Analyse comparative et ratios YoY (Year-over-Year %).
- **GET /api/statistics/financial-summary** : Synthèse financière et cascade fiscale NIGELEC 2024.

---

## 🛰️ Supervision Temps Réel, HES & Sécurité

- **GET /api/stream/events** : Flux Server-Sent Events (SSE) temps réel diffusant les battements de cœur des compteurs physiques et alertes réseau.
- **Port 5000 (KMS-HSM)** :
  - **GET /health** : Statut d'intégrité du module cryptographique STS v2 AES-128.
  - **POST /api/kms/generate-token** : Dérivation de clé et génération de jetons normalisés CEI 62055-41.
- **Ports 4059 & 4060 (Passerelle HES)** :
  - **TCP 4059** : Écouteur direct des trames DLMS push point-à-point.
  - **HTTP 4060** : Décodeur COSEM et passerelle locale.

### Endpoints HES Vending 2.0 & Télérelève GPRS

- **POST /api/v1/vending2/read-telemetry** :
  - Interrogation directe des registres OBIS réels du compteur physique sur le réseau GPRS (Tension `1.0.32.7.0.255`, Courant `1.0.31.7.0.255`, Puissance `1.0.15.7.0.255`, Énergie active `1.0.1.8.0.255`, Solde STS `0.0.19.40.0.255`).
  - Corps : `{ "meterNo": "0128260224778" }`
  - Met à jour automatiquement la base de données et le statut de connectivité.
- **POST /api/v1/vending2/token** :
  - Émission de jetons techniques STS certifiés (SubClass 1: `ClearCredit`, SubClass 5: `ClearTamperCondition`, SubClass 0: `Maximum Power Limit`).
  - Corps : `{ "meterNo": "0128260224778", "subClass": 5, "value": 0 }`
- **POST /api/v1/vending2/recharge** :
  - Vente de crédit d'énergie STS avec conversion automatique selon le barème progressif NIGELEC 2024.
- **POST /api/v1/vending2/relay-control** :
  - Télé-coupure (`open`) ou réarmement (`close`) du relais disjoncteur du compteur à distance.
- **POST /api/v1/vending2/clock-sync** :
  - Synchronisation de l'horloge interne certifiée RTC (OBIS `0.0.1.0.0.255`).
- **GET /api/v1/vending2/health** :
  - Diagnostic de connectivité de la tête de réseau HES et de l'APN GPRS.

---

> [!IMPORTANT]
> **Sécurité des données & Intégrité Zéro-Mock** : Toutes les données PII sont anonymisées et chaque réponse API reflète des calculs vérifiés sur données réelles ou matériel communicant certifié.
