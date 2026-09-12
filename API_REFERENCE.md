# 📡 SPÉCIFICATION DE RÉFÉRENCE API REST — e-EnergieTEC (RENTEC AMI v6.5)

Ce document définit l'ensemble des interfaces de programmation (API REST) exposées par le serveur HES/MDMS (Port 3000) et le module de sécurité KMS-HSM (Port 5000).

---

## 🛡️ 1. STRATÉGIE DE SÉCURITÉ & PROTOCOLE

### Sécurité & Transport
* **Transport** : HTTPS / TLS 1.3 obligatoire en production.
* **Authentification** : Jeton JSON Web Token (JWT) transmis dans l'en-tête `Authorization: Bearer <token>`.
* **RBAC (Role-Based Access Control)** : Validation stricte des rôles (`admin`, `vendor`, `tech`, `auditor`).

### Rate Limiting & Protection Anti-DoS
* **API Authentification (`/api/login`)** : 30 requêtes par minute par IP.
* **API Générales (`/api/...`)** : 5 000 requêtes par minute par IP.

---

## 📊 2. API DU MODULE STATISTIQUES & ANALYSE (`/api/statistics/...`)

### `GET /api/statistics/consumption-matrix`
Récupère la matrice de consommation journalière (31 jours) ou mensuelle (12 mois) par compteur et par zone.

* **Paramètres de requête (Query Params)** :
  * `mode` : `'daily'` (défaut) ou `'monthly'`.
  * `yearMonth` : format `YYYY-MM` (ex: `2026-08`) — utilisé en mode `daily`.
  * `year` : format `YYYY` (ex: `2026`) — utilisé en mode `monthly`.
  * `zone` : filtre géographique (ex: `'NIGER'`, `'NIAMEY'`, `'CUNI'`, `'DOSSO'`).
  * `meterId` : filtre par identifiant de compteur (ex: `'0128260224778'`).
  * `username` : filtre par nom ou code abonné (ex: `'Abonné NIGELEC'` ou `'Moussa'`).
* **Exemple de Réponse (`mode=monthly`)** :
```json
{
  "success": true,
  "mode": "monthly",
  "year": 2026,
  "totalMeters": 2,
  "columnTotals": { "1": 0, "2": 0, "8": 12.0, "12": 0 },
  "totalConsolidatedYearKwh": 12.0,
  "rows": [
    {
      "zoneName": "NIAMEY",
      "userName": "Abonné NIGELEC",
      "meterId": "0128260224778",
      "aliasName": "Koubia",
      "year": "2026",
      "totalYearKwh": 5.0,
      "months": { "1": 0, "2": 0, "8": 5.0, "12": 0 }
    }
  ]
}
```

---

### `GET /api/statistics/meter-analysis`
Récupère les séries comparatives d'analyse temporelle avec calcul des ratios YoY (Year-over-Year %).

* **Paramètres de requête** :
  * `meterId` : numéro du compteur cible.
  * `mode` : `'daily'` (comparaison mois courant vs mois précédent) ou `'monthly'` (comparaison année $N$ vs année $N-1$).
  * `yearMonth` : ex: `'2026-08'`.
  * `year` : ex: `'2026'`.
* **Réponse** : Tableau d'objets avec `dateLabel` / `monthName`, `thisMonthKwh` / `thisYearKwh`, `lastMonthKwh` / `lastYearKwh`, `yoyRatioPct`.

---

### `GET /api/statistics/financial-summary`
Génère la réconciliation financière et la cascade fiscale conforme à la réglementation NIGELEC 2024.

* **Paramètres de requête** :
  * `yearMonth` : période d'audit (ex: `'2026-08'`).
  * `regionId` : code région ou `'ALL'`.
* **Réponse** :
```json
{
  "success": true,
  "yearMonth": "2026-08",
  "totalRevenueFcfa": 1190,
  "totalKwhVended": 12.0,
  "avgPricePerKwh": 99,
  "taxBreakdown": {
    "partEnergieHT": 1000,
    "montantTVA": 190,
    "taxeORTN": 36,
    "taxeHabitat": 400,
    "primeFixeTotale": 3000
  },
  "operators": [
    { "name": "ORANGE", "count": 1, "amount": 690, "percentage": 58.0 },
    { "name": "AIRTEL", "count": 1, "amount": 500, "percentage": 42.0 }
  ],
  "tariffs": [
    { "name": "BT-D", "count": 1, "amount": 500, "kwh": 5.0 },
    { "name": "BT-P", "count": 1, "amount": 690, "kwh": 7.0 }
  ]
}
```

---

## 🔐 3. DÉMON SÉCURITÉ MATÉRIELLE KMS-HSM (`http://127.0.0.1:5000`)

| Méthode | Endpoint | Description | Norme |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Diagnostic de santé du module cryptographique KMS | CEI 62055-41 |
| `POST` | `/api/kms/generate-token` | Génération de jeton STS standard ou technique (20 chiffres) | STS-V2 AES-128 |

* **Corps de requête (`POST /api/kms/generate-token`)** :
```json
{
  "meterId": "0128260224778",
  "amount": 500,
  "type": "0",
  "krn": "2",
  "ti": "1"
}
```
* **Réponse** :
```json
{
  "success": true,
  "token": "4891-2304-9182-4401-8823",
  "tid": 17697882,
  "meterId": "0128260224778",
  "class": "Credit",
  "algorithm": "STS-V2-AES-128",
  "issuedAt": "2026-08-26T12:00:00.000Z"
}
```

---

## ⚡ 4. PASSERELLE HES, TÉLÉMESURE DLMS & WATCHDOG SSE

La tête de réseau (HES) s'appuie sur deux canaux :
* **Port TCP 4059** : Écouteur direct des trames brutes DLMS/COSEM push émises par les modems 4G/GPRS des compteurs.
* **Port HTTP 4060** : Décodeur et passerelle d'intermédiation DLMS (`services/hes-gateway/server.ts`).
* **Port HTTP 3000** : Endpoints REST et flux temps réel SSE (Server-Sent Events) du serveur d'application.
* **Liaison Fabricant HES Cloud** : `https://dlms.futurise-tech.com:4680/api/v1` (accès direct aux APN GPRS des compteurs physiques).

### Endpoints HES Vending 2.0 & Télérelève

| Méthode | Endpoint | Description | Rôle Requis |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/vending2/recharge` | Vente STS avec calcul automatique des tranches NIGELEC | `admin`, `vendor` |
| `POST` | `/api/v1/vending2/token` | Émission de jetons techniques STS (Clear Credit, Clear Tamper, KCT) | `admin`, `vendor`, `tech` |
| `POST` | `/api/v1/vending2/read-telemetry` | **Télérelève directe OBIS DLMS/COSEM** ($V$, $A$, $W$, $kWh$, solde, tamper, relais) | `admin`, `tech` |
| `POST` | `/api/v1/vending2/relay-control` | Ordre de coupure (`open`) ou réarmement (`close`) du disjoncteur | `admin`, `tech` |
| `POST` | `/api/v1/vending2/clock-sync` | Synchronisation de l'horloge interne RTC (OBIS `0.0.1.0.0.255`) | `admin`, `tech` |
| `POST` | `/api/v1/vending2/read-region` | Télérelève en masse par direction régionale | `admin`, `tech` |
| `GET` | `/api/v1/vending2/health` | Statut de connectivité de la tête de réseau HES | Tous rôles |
| `GET` | `/api/stream/events` | **Flux SSE temps réel** : battements de cœur, santé des compteurs et alertes comm | Tous rôles |

---

### Exemple de Télérelève Métrologique Réelle (`POST /api/v1/vending2/read-telemetry`)

* **Corps de Requête** :
```json
{
  "meterNo": "0128260224778"
}
```

* **Réponse Normalisée (Extraction Directe Registres OBIS Compteur)** :
```json
{
  "code": 200,
  "msg": "Lecture télémétrique temps-réel DLMS réussie",
  "source": "FUTURISE_HES_GPRS",
  "timestamp": "2026-09-06T18:09:55.394Z",
  "meterNo": "0128260224778",
  "parsedTelemetry": {
    "meterNo": "0128260224778",
    "phaseType": "monophase",
    "voltageA": 235.1,
    "currentA": 1.636,
    "powerA": 296,
    "totalPowerKw": 0.296,
    "frequency": 50.0,
    "powerFactor": 0.77,
    "totalElectricityKwh": 0.38,
    "remainingCreditKwh": 50.02,
    "meterCoverOpen": false,
    "terminalCoverOpen": false,
    "relayStatus": "CLOSED",
    "tamperStatus": "clear",
    "firmware": "v2.4.1",
    "protocol": "DLMS/COSEM",
    "subscribedPower": 9
  }
}
```

---

### Exemple de Jeton de Gestion Technique (`POST /api/v1/vending2/token`)

Permet de générer les jetons de maintenance prévus par la norme CEI 62055-41 :

* **Subclasses Supportées** :
  * `1` : **Clear Credit** (Remise à zéro du solde résiduel et ouverture du relais).
  * `5` : **Clear Tamper Condition** (Réinitialisation de l'état de fraude après effraction capot).
  * `0` : **Maximum Power Limit** (Plafond de puissance souscrite en kW).
* **Corps de Requête** :
```json
{
  "meterNo": "0128260224778",
  "subClass": 5,
  "value": 0
}
```
* **Réponse** :
```json
{
  "status": "SUCCESS",
  "token": "4891-2304-9182-4401-8823",
  "explain": "ClearTamperCondition",
  "flowNo": "202412211311189351000128"
}
```

---

## 🏛️ 5. GESTION DES TARIFS, COMPTEURS & CONCENTRATEURS

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tariffs` | Retourne la grille des 6 segments officiels NIGELEC 2024 |
| `GET` | `/api/meters` | Liste des compteurs réels physiques et leur statut |
| `POST` | `/api/meters` | Enregistrement d'un nouveau compteur intelligent |
| `GET` | `/api/dcus` | Liste des concentrateurs de données (ex: `DCU-CUNI-01`) |
| `POST` | `/api/dcus` | Ajout d'un concentrateur de sous-station |
| `GET` | `/api/customers` | Annuaire des abonnés et contrats raccordés |
