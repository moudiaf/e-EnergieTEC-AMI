# Spécification de Référence API - e-EnergieTEC AMI

Ce document définit les interfaces système du MDMS (Meter Data Management System) et du HES (Head End System). Ces interfaces sont protégées contre les accès non autorisés et les attaques par déni de service (DoS).

## 🛡️ Stratégie de Sécurité API

### 1. Protection Anti-DoS (Rate Limiting)
Toutes les interfaces sont soumises à une limitation de débit stricte :
- **API Publiques (Login)** : 5 requêtes par minute par IP.
- **API Métier (MDMS)** : 60 requêtes par minute par IP.
- **API de Collecte (DCU)** : 200 requêtes par minute (réservé aux IPs DCU blanches).

### 2. Authentification & Autorisation
- **Transport** : Toutes les communications doivent s'effectuer via HTTPS (TLS 1.3).
- **Jetons** : Utilisation de JSON Web Tokens (JWT) avec signature RS256.
- **Secrets** : Les clés de signature sont gérées via un module de sécurité matériel (HSM).

---

## 📡 Endpoints du Système

### A. Gestion des Compteurs (Meters)
Interface permettant la supervision de l'état des compteurs.

| Méthode | Endpoint | Description | Rôle Requis |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meters` | Liste exhaustive des compteurs | Administrateur, Opérateur |
| `POST` | `/api/meters` | Provisionnement d'un nouveau compteur | Superviseur |
| `GET` | `/api/meters/:id` | État temps réel et configuration d'un compteur | Opérateur |

### B. Prépaiement STS (Vending)
Interface critique pour la génération des jetons de crédit.

| Méthode | Endpoint | Description | Sécurité |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tokens` | Génère un jeton STS conforme (TID, Anti-Rejou) | Signature HSM + Rate Limit |
| `GET` | `/api/tokens` | Historique des jetons émis pour un compteur | Audit Log obligatoire |

### C. Head End System (HES) - Collecte
Interface dédiée à la remontée des trames DLMS/COSEM.

| Méthode | Endpoint | Description | Protocole |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/hes/decode` | Décodage d'une trame hexadécimale en objets OBIS | DLMS/COSEM (IEC 62056) |
| `TCP:4059` | - | Entrée brute pour les concentrateurs DCU | HDLC / Binary |

### D. Revenue Assurance & Analytics
Analyse des pertes et détection de fraude assistée par IA.

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mdms/stats` | Statistiques globales VEE (Validation de données) |
| `GET` | `/api/analytics/energy-balance` | Bilan énergétique par zone géographique |
| `GET` | `/api/analytics/trends` | Tendances de consommation (30 derniers jours) |
| `GET` | `/api/analytics/distribution` | Répartition régionale des abonnés |

### E. Opérations Industrielles
Gestion de la facturation et audit trail.

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/billing/run` | Lancement manuel d'un cycle de facturation massif |
| `GET` | `/api/audit` | Extraction du journal d'audit immuable |
| `POST` | `/api/mdms/simulate-mass` | Simulation de charge réseau pour tests de stress |

---

## ⚠️ Codes d'Erreur Standards
- `429 Too Many Requests` : Limitation de débit dépassée (Action de protection DoS).
- `401 Unauthorized` : Jeton JWT manquant ou expiré.
- `403 Forbidden` : Privilèges insuffisants pour cette interface.
- `503 Service Unavailable` : Charge système trop élevée ou maintenance HSM.
