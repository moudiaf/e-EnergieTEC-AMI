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

---

> [!IMPORTANT]
> **Sécurité des données** : Toutes les données PII (Emails, Téléphones) sont anonymisées dans les réponses API pour garantir la conformité aux directives de protection des données.
