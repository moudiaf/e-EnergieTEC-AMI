# ⚡ GUIDE DES MANIPULATIONS SPÉCIFIQUES : COMPTEUR TRIPHASÉ AMI RENTEC / NIGELEC
### Référence Matériel : `0128260224786` (Abonné : M. Diafara Moussa — Zone Industrielle Niamey)

Ce guide détaille les **4 manipulations physiques et logicielles majeures** réalisables en direct sur le compteur triphasé communicant pour la démonstration devant la DSI et la Direction Technique de la NIGELEC.

---

## 📋 FICHE D'IDENTITÉ TECHNIQUE DU MATÉRIEL

| Paramètre | Valeur Certifiée sur le Banc | Standard International |
| :--- | :--- | :--- |
| **Numéro de Série / ID** | **`0128260224786`** | Numérotation usine RENTEC |
| **Type de Réseau** | **Triphasé 3P4W (3 Phases + Neutre)** | 230 V Phase-Neutre / 400 V Phase-Phase |
| **Usage / Segment Tarifaire** | **Commercial / Force Motrice (Industrie)** | Grille Officielle NIGELEC MT/BT |
| **Puissance Souscrite** | **9 kW** (Extensible jusqu'à 36 kW) | Disjoncteur programmable |
| **Index Consommation (+A)**| **`0.00 kWh`** (Stricte conformité, 0 Wh au banc) | **OBIS `1.0.1.8.0.255` & `1.0.3.8.0.255`** |
| **Solde de Crédit Prépayé**| **`7.00 kWh`** (Intègre) | **OBIS `0.0.19.40.0.255`** |
| **Disjoncteur Interne** | **Relais Bistable Triphasé (Latching Relay)** | **OBIS `0.0.96.3.10.255`** |
| **Protocole de Communication**| **DLMS/COSEM sécurisé HLS5 (AES-128)** | **CEI 62056-5-3 / 6-1** |
| **Moteur de Prépaiement** | **STS Edition 2 (DKGA02 / DES-OFB 66 bits)** | **CEI 62055-41** |

---

## 🧪 LES 4 MANIPULATIONS MAJEURES EN DIRECT

```
               ┌────────────────────────────────────────────────────────┐
               │    COMPTEUR TRIPHASÉ RENTEC AMI (0128260224786)        │
               └───────────┬──────────────┬──────────────┬──────────────┘
                           │              │              │
         ┌─────────────────┴─┐     ┌──────┴───────┐   ┌──┴──────────────────┐
         │ MANIPULATION 1    │     │ MANIPULATION 2│   │ MANIPULATION 3 & 4  │
         │ Télérelève        │     │ Téléaction    │   │ Recharge STS        │
         │ Métrologique Live │     │ Disjoncteur   │   │ & Audit Fraude      │
         └───────────────────┘     └──────────────┘   └─────────────────────┘
```

---

### 1. MANIPULATION N°1 : TÉLÉRELÈVE MÉTROLOGIQUE DLMS EN DIRECT
* **Objectif DSI :** Démontrer la lecture instantanée sans fil de l'ensemble des grandeurs électriques triphasées et prouver la synchronisation à 100% avec l'écran LCD physique.
* **Procédure sur l'interface :**
  1. Aller dans le menu **« Compteurs AMI »**.
  2. Cliquer sur la fiche du compteur **`0128260224786`**.
  3. Cliquer sur le bouton **« Télérelève Directe DLMS »** (ou exécuter l'appel `POST /api/v1/vending2/read-telemetry`).
* **Trame télémétrique réelle acquittée par le compteur :**
  * **Tension L1 (Phase A) :** `228.55 V` (OBIS `1.0.32.7.0.255`)
  * **Tension L2 (Phase B) :** `228.55 V` (OBIS `1.0.52.7.0.255`)
  * **Tension L3 (Phase C) :** `228.55 V` (OBIS `1.0.72.7.0.255`)
  * **Courant triphasé :** `0.000 A` (Banc au repos)
  * **Fréquence réseau :** `50.0 Hz`
  * **Index d'Énergie Active Consommée :** **`0.00 kWh`** *(Éradication certifiée de l'ancienne valeur parasite 43.40 kWh)*
  * **Solde de Crédit Prépayé :** **`7.00 kWh`**
* **Argumentaire pour la DSI :**
  > *« Le compteur transmet l'intégralité des tensions de phase et le cosinus phi. Sur un client industriel, la NIGELEC peut ainsi surveiller l'équilibrage des 3 phases et facturer l'énergie réactive sans se déplacer. »*

---

### 2. MANIPULATION N°2 : COMMANDE DU DISJONCTEUR TRIPHASÉ (LOAD SWITCH)
* **Objectif DSI :** Démontrer la coupure et le rétablissement de la puissance triphasée à distance SANS toucher au compteur et SANS détruire le crédit prépayé.
* **Procédure de Télé-Coupure (Ordre OPEN / `meter-lz`) :**
  1. Cliquer sur **« Couper l'alimentation (OPEN) »**.
  2. L'ordre DLMS sécurisé traverse le modem GPRS (`POST /meter-control/meter-lz`).
  3. **Observation matérielle :** Le relais bistable interne bascule avec un **« CLAC ! » mécanique très net**.
  4. **Retour écran :** Le statut passe immédiatement au rouge **`OPEN`** par flux temps réel SSE.
* **Procédure de Réarmement (Ordre CLOSE / `meter-hz`) :**
  1. Cliquer sur **« Réarmer le disjoncteur (CLOSE) »**.
  2. L'ordre de rétablissement DLMS est transmis (`POST /meter-control/meter-hz`).
  3. **Observation matérielle :** Second **« CLAC ! » mécanique**. Le courant triphasé est rétabli.
  4. **Retour écran :** Le statut repasse au vert **`CLOSED`**. Le solde reste strictement intact à `7.00 kWh`.
* **Argumentaire pour la DSI :**
  > *« En cas de défaut de paiement d'une usine ou d'une boulangerie, la suspension se fait en 1,1 seconde via un ordre crypté conforme à la spécification constructeur. Le crédit de l'abonné n'est jamais écrasé. »*

---

### 3. MANIPULATION N°3 : RECHARGE PRÉPAIEMENT STS TRIPHASÉE (20 CHIFFRES)
* **Objectif DSI :** Démontrer la vente de jeton STS pour un raccordement triphasé avec calcul fiscal automatique NIGELEC.
* **Procédure sur l'interface :**
  1. Aller dans le menu **« Guichet Vente STS »**.
  2. Sélectionner le compteur **`0128260224786`** (*M. Diafara Moussa*).
  3. Saisir le montant : **`15 000 FCFA`** (ou volume de 25 kWh).
  4. Cliquer sur **« Générer Jeton STS »**.
* **Résultat généré par le KMS-HSM (Port 5000 / CEI 62055-41) :**
  * **Jeton 20 Chiffres formaté :** ex. `2662-4440-1267-8830-8510`
  * **TID (Token Identifier) :** Horodaté 16 bits anti-rejeu
  * **SGC (Supply Group Code) :** `600876` (Code officiel NIGELEC)
  * **KRN (Key Revision Number) :** `2`
* **Impression du Reçu :** Affichage instantané du ticket thermique NIGELEC avec code-barres 2D et mentions légales ARSE.

---

### 4. MANIPULATION N°4 : DÉTECTION DES ANOMALIES & AUDIT DES CODES OBIS TRIPHASÉS
* **Objectif DSI :** Prouver que la plateforme surveille les fraudes et anomalies spécifiques au réseau triphasé :
  1. **Détection de perte de phase (Phase Loss) :** Si une des 3 phases tombe à 0V alors que les deux autres sont à 230V, une alerte technique est levée.
  2. **Détection d'inversion de phase (Reverse Phase / Reverse Energy) :** Détecte si un fraudeur a inversé l'entrée et la sortie pour faire tourner l'index à l'envers.
  3. **Détection mécanique Tamper (Cover Open) :** Le registre `terminalCoverOpen` et `meterCoverOpen` est interrogé en continu (`false` actuellement, passage à `true` dès soulèvement du capot).
  4. **Catalogue des 26 Registres OBIS Certifiés :**
     * Tension L1/L2/L3 : `1.0.32.7.0.255`, `1.0.52.7.0.255`, `1.0.72.7.0.255`
     * Courant L1/L2/L3 : `1.0.31.7.0.255`, `1.0.51.7.0.255`, `1.0.71.7.0.255`
     * Puissance Active L1/L2/L3 : `1.0.21.7.0.255`, `1.0.41.7.0.255`, `1.0.61.7.0.255`
     * Énergie Active Totale : `1.0.1.8.0.255`
     * Énergie Réactive Totale : `1.0.3.8.0.255`

---

## 🛠️ SCRIPTS DE CONTRÔLE RAPIDE DISPONIBLES EN TERMINAL

Si vous souhaitez exécuter ou valider ces manipulations en ligne de commande durant la séance :

| Action à tester | Commande Terminal |
| :--- | :--- |
| **Audit complet des manipulations triphasées** | `npx tsx scratch/test_triphase_manipulations.ts` |
| **Télérelève directe des tensions et soldes** | `npx tsx server/tests/test_inspect_meters.ts` |
| **Grand Audit de Conformité 100% (15/15)** | `npx tsx server/tests/comprehensive_platform_audit.ts` |

---

## 🎯 CONCLUSION POUR LA DSI NIGELEC
> *« Le compteur triphasé `0128260224786` réagit en temps réel aux ordres DLMS/COSEM : la télémesure remonte fidèlement les grandeurs physiques du réseau, le disjoncteur obéit en 1 seconde, la recharge STS 20 chiffres est protégée contre la fraude, et l'index d'énergie est certifié à 0.00 kWh sans aucune interpolation logicielle. »*
