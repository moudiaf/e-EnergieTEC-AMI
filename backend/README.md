# ⚡ e-EnergieTEC - Backend REST API Server (MDMS & STS Core)

Ce dossier contient le serveur backend autonome de la plateforme de comptage intelligent et de prépaiement **e-EnergieTEC**.

## 🛠️ Stack Technique Backend
- **Serveur d'API** : Node.js (TypeScript) & Express
- **Base de Données** : SQLite (`ami_smart_meter.db`) pour développement / PostgreSQL + TimescaleDB pour Enterprise
- **Sécurité & Auth** : JWT (expiration 1h), Hachage Bcrypt (10 rounds), Protection anti-DDoS (Rate Limiting)
- **Cryptographie STS** : Standard IEC 62055-41/51 avec gestion TID et KMC Key Rollover

---

## 🚀 Démarrage & Commandes du Backend

```bash
# 1. Installation des dépendances
npm install

# 2. Exécution des tests d'intégration (5/5 tests PASS)
npm test

# 3. Démarrage du serveur API (Port 5000)
npm run dev
```

L'API est accessible par défaut sur : **http://localhost:5000**
- Health check : `GET http://localhost:5000/api/health`
- Endpoint racine : `GET http://localhost:5000/`

---

## 📡 Endpoints Principaux

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/login` | Authentification utilisateur & JWT |
| `POST` | `/api/forgot-password` | Récupération sécurisée du mot de passe |
| `GET` | `/api/meters` | Liste des compteurs et état métrologique |
| `POST` | `/api/tokens` | Génération de token STS 20-digits conforme |
| `POST` | `/api/meters/replace` | Remplacement de compteur & transfert solde |
| `POST` | `/api/load-shedding` | Délestage et contrôle relais DLMS |
| `GET` | `/api/customers` | Gestion des abonnés NIGELEC |
| `GET` | `/api/invoices` | Facturation postpayée multi-tranches |
| `GET` | `/api/dcus` | Concentrateurs de données (DCUs) |
| `GET` | `/api/audit` | Journaux d'audit de sécurité immuables |
