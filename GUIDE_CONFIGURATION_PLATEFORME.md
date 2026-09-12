# 📘 GUIDE DE CONFIGURATION ET DE PARAMÉTRAGE DE LA PLATEFORME AMI / HES
**Système Intelligent de Télérelève, Gestion MDMS & Prépaiement STS 2026**  
**Opérateur / Client :** NIGELEC / e-Energietec  
**Référence Document :** `DOC-AMI-CFG-2026-V1`

---

## 📑 TABLE DES MATIÈRES
1. [Vue d'Ensemble de l'Architecture Système](#1-vue-densemble-de-larchitecture-système)
2. [Configuration Réseau & Modems 4G des Compteurs](#2-configuration-réseau--modems-4g-des-compteurs)
3. [Paramétrage Cryptographique & Sécurité DLMS/COSEM (HLS5)](#3-paramétrage-cryptographique--sécurité-dlmscosem-hls5)
4. [Spécification & Paramétrage STS Prépaiement (IEC 62055)](#4-spécification--paramétrage-sts-prépaiement-iec-62055)
5. [Cartographie des Registres & Codes OBIS DLMS](#5-cartographie-des-registres--codes-obis-dlms)
6. [Configuration du Fichier `.env` & Variables Système](#6-configuration-du-fichier-env--variables-système)
7. [Procédures Opérationnelles d'Exploitation (Runbook)](#7-procédures-opérationnelles-dexploitation-runbook)

---

## 1. VUE D'ENSEMBLE DE L'ARCHITECTURE SYSTÈME

La plateforme **e-Energietec AMI** assure la supervision complète, la relève temps réel, la détection des fraudes et la distribution de crédits prépayés STS pour les compteurs communicants (Monophasés et Triphasés).

```mermaid
graph TD
    A[Compteur Intelligent 4G / DLMS] -->|TCP Socket Port 4059| B(Passerelle HES TCP / DLMS)
    C[Compteurs en Réseau PLC/RF] -->|Concentrateur DCU| B
    B -->|HTTP Port 4060| D[Moteur de Décodage & Passerelle HES]
    D --> E[(Base de Données MDMS SQLite / PostgreSQL)]
    G[Module Sécurisé KMS-HSM Port 5000] -->|Génération Jetons 20 Digits STS| E
    E --> F[API REST, Watchdog SSE & Web UI Port 3000]
```

---

## 2. CONFIGURATION RÉSEAU & MODEMS 4G DES COMPTEURS

Pour qu'un compteur communique de manière autonome avec la plateforme e-Energietec, son modem GPRS/4G interne doit être configuré avec les paramètres suivants via le logiciel de paramétrage fabricant :

### 📡 Paramètres de Communication GPRS / LTE
| Paramètre | Valeur Standard / Recommandée | Description |
|---|---|---|
| **APN** | `nigelec.apn` *(ou `internet`)* | Point d'accès réseau opérateur SIM local |
| **User / Password APN** | *(Laisser vide ou selon opérateur)* | Authentification carte SIM |
| **Target Mode** | `Client Auto Connect (TCP)` | Connexion automatique proactive du compteur |
| **IP Address Cible** | `hes.e-energietec.ne:4059` *(ou IP Serveur)* | Adresse et port d'écoute du serveur HES |
| **Heartbeat Interval** | `300 s` (5 minutes) | Fréquence de signal de présence et maintien TCP |
| **Niveau Signal Requis** | `CSG / CSQ >= 15` (31 = 100%) | Puissance de réception radio 4G |

---

## 3. PARAMÉTRAGE CRYPTOGRAPHIQUE & SÉCURITÉ DLMS/COSEM (HLS5)

La communication entre le serveur HES et les compteurs intelligents est protégée par un chiffrement de niveau **HLS5 (High-Level Security - AES-128 GCM)** :

```json
{
  "SecurityPolicy": "AuthenticationEncryption",
  "BlockCipherKey_EK": "000102030405060708090A0B0C0D0E0F",
  "AuthenticationKey_AK": "D0D1D2D3D4D5D6D7D8D9DADBDCDDDEDF",
  "SystemTitle": "ABCDEFGH",
  "SystemTitleHex": "4142434445464748"
}
```

- **Clé de Chiffrement EK (Block Cipher Key)** : `000102030405060708090A0B0C0D0E0F`  
  *Garantit la confidentialité intégrale des index et valeurs électriques.*
- **Clé d'Authentification AK** : `D0D1D2D3D4D5D6D7D8D9DADBDCDDDEDF`  
  *Vérifie l'identité du serveur HES et du compteur via le mécanisme GMAC.*
- **Titre Système (System Title)** : `ABCDEFGH` (`0x4142434445464748`)  
  *Identifiant unique de la session de télérelève sur 8 octets.*

---

## 4. SPÉCIFICATION & PARAMÉTRAGE STS PRÉPAIEMENT (IEC 62055)

La génération et l'injection des jetons de recharge conformes à la norme **STS Edition 2 (STS-600)** reposent sur les constantes de sécurité métrologique suivantes :

| Paramètre STS | Code / Symbole | Valeur Système | Description |
|---|---|---|---|
| **Supply Group Code** | **SGC** | **`600876`** | Code officiel du groupe de fourniture NIGELEC |
| **Tariff Index** | **TI** | **`1`** | Index du tarif applicable au compteur |
| **Manufacturer Code** | **MFC** | **`0128`** | Code constructeur (Compteurs de série `0128...`) |
| **Key Revision Number** | **KRN** | **`2`** | Révision de la clé maîtresse STS |
| **Key Type** | **KT** | **`2`** | Clé de distribution / Vending Key |
| **Encryption Algorithm** | **EA** | **`7` (EA07)** | Algorithme cryptographique STS 20 chiffres |
| **Key Expiration Number** | **KEN** | **`255`** | Validité permanente de la clé de chiffrement |
| **TID Base Date** | **TID** | `1993-01-01` | Date origine du calcul de l'anti-rejeu STS |

---

## 5. CARTOGRAPHIE DES REGISTRES & CODES OBIS DLMS

Les données métrologiques relevées sur les compteurs communicants (CEI 62056) correspondent à la grille de registres normalisée vérifiée en télérelève directe point-à-point :

| Grandeur Métrologique | Code OBIS (DLMS) | Endpoint HES Direct | Valeur Typique / Unité |
|---|---|---|---|
| **Tension Ligne A (RMS ADC)** | **`1.0.32.7.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `235.10 V` à `237.80 V` |
| **Courant Phase A (RMS ADC)** | **`1.0.31.7.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `1.636 A` à `1.683 A` |
| **Puissance Active Phase A** | **`1.0.15.7.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `296 W` à `307 W` |
| **Consommation Totale Cumulée (+A)** | **`1.0.1.8.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `0.38 kWh` (380 Wh) |
| **Solde Crédit Prépayé STS** | **`0.0.19.40.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `50.02 kWh` |
| **Tension Ligne B & C (Triphasé)** | `1.0.52.7.0.255` / `1.0.72.7.0.255` | `POST /api/v1/obis-list/read` (`data_index: 2`) | `230.00 V` |
| **Courant Ligne B & C (Triphasé)** | `1.0.51.7.0.255` / `1.0.71.7.0.255` | `POST /api/v1/obis-list/read` (`data_index: 2`) | `0.000 A` |
| **Fréquence Réseau** | **`1.0.14.7.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `50.00 Hz` |
| **Alerteur Ouverture Capot (Tamper)** | **`0.0.96.11.0.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `0` = Normal / `1` = Fraude |
| **Statut Disjoncteur (Relais)** | **`0.0.96.3.10.255`** | `POST /api/v1/obis-list/read` (`data_index: 2`) | `1` = FERMÉ / `0` = OUVERT |

---

## 6. CONFIGURATION DU FICHIER `.ENV` & VARIABLES SYSTÈME

Le fichier [`.env`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/.env) à la racine de l'application réunit tous les paramètres opérationnels :

```env
# ==============================================================================
# NIGELEC AMI PLATFORM - PRODUCTION / STAGING ENVIRONMENT CONFIGURATION
# ==============================================================================
PORT=3000
NODE_ENV=development
JWT_SECRET=nigelec-sts-secure-alpha-2026-prod-secret

# Base de Données (sqlite / postgres)
DB_TYPE=sqlite
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ami_smart_meter

# Module Sécurité Matériel KMS / HSM STS (Port 5000)
KMS_URL=http://localhost:5000/api/kms

# Interconnexion Fabricant Futurise HES Vending 2.0
FUTURISE_BASE_URL=https://dlms.futurise-tech.com:4680/api/v1
FUTURISE_USERNAME=eEnergietec
FUTURISE_PASSWORD=111111
FUTURISE_TIMEOUT=15000
FUTURISE_REJECT_UNAUTHORIZED=false

# Token d'Ingénieur Permanent HES (Privilège Role ID 6 pour lecture point-à-point OBIS)
FUTURISE_API_TOKEN=eyJhbGciOi...

# Port d'écoute direct passerelle DLMS TCP et HTTP
DLMS_TCP_PORT=4059
HES_HTTP_PORT=4060
```

---

## 7. PROCÉDURES OPÉRATIONNELLES D'EXPLOITATION (RUNBOOK)

### 🚀 A. Démarrage de la Plateforme (Les 3 Démons Souverains)
```bash
# 1. Vérification TypeScript (0 erreur)
npx tsc --noEmit

# 2. Démon 1 : Sécurité Cryptographique KMS-HSM STS (Port 5000)
npx tsx services/kms-hsm/server.ts

# 3. Démon 2 : Passerelle Tête de Réseau HES (Port 4059 TCP & 4060 HTTP)
npx tsx services/hes-gateway/server.ts

# 4. Démon 3 : Serveur Principal MDMS, REST API & Watchdog SSE (Port 3000)
npx tsx server.ts
```

### ⚡ B. Enrôlement d'un Nouveau Compteur
1. Accéder à l'interface sur **`http://localhost:3000`** -> Menu **`Compteurs AMI`**.
2. Cliquer sur **`Ajouter un Compteur`**.
3. Renseigner le numéro de série constructeur (ex: `0128260224786`).
4. Sélectionner le type de phase (`Monophasé 230V` ou `Triphasé 400V`).
5. Associer l'abonné NIGELEC et positionner les coordonnées géographiques SIG.

### 💳 C. Émission d'un Jeton STS de Recharge
1. Accéder au menu **`Vente STS & Prépaiement`**.
2. Sélectionner le compteur cible.
3. Saisir le montant en FCFA (la conversion en kWh s'applique selon la grille NIGELEC).
4. Cliquer sur **`Générer Jeton STS`**.
5. Imprimer le reçu thermique contenant le jeton 20 chiffres (`XXXX-XXXX-XXXX-XXXX-XXXX`) et les mentions obligatoires (`SGC: 600876`, `KRN: 2`, `EA: 07`).

---

**© 2026 e-EnergieTEC (RENTEC AMI) — Documentation Technique et Guide de Paramétrage Système.**
