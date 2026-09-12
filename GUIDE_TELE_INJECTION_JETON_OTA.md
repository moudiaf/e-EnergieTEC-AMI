# 📡 GUIDE TECHNIQUE & OPÉRATIONNEL : TÉLÉ-INJECTION DU JETON STS À DISTANCE (OTA HES)
### Système de Télétransmission Automatisée Over-The-Air sans Saisie Clavier
**Société Nigérienne d'Électricité (NIGELEC) | Direction des Systèmes d'Information (DSI)**  
*Réf. Documentaire :* `GUIDE-TECH-OTA-NIGELEC-2026`  
*Statut :* **OPÉRATIONNEL & QUALIFIÉ EN PRODUCTION PURE**

---

## 1. PRINCIPE TECHNIQUE & VALEUR AJOUTÉE POUR LA NIGELEC

Dans les infrastructures de prépaiement traditionnelles, la recharge d'un compteur STS impose une contrainte physique à l'abonné :
1. L'abonné achète un crédit en agence ou par Mobile Money.
2. Il reçoit une suite de **20 chiffres** par SMS ou sur ticket papier.
3. Il doit saisir manuellement ces 20 chiffres sur le clavier (Keypad / UIU) du compteur sans faire d'erreur.

### La Rupture Technologique AMI Souveraine : L'Injection Directe OTA
Grâce à l'interconnexion native entre le **Système de Vente STS**, le **KMS-HSM (Port 5000)** et la **Tête de Réseau HES (Ports 4059/4060)** :
* Le jeton 20 chiffres généré selon la norme **CEI 62055-41** est automatiquement encapsulé dans une **trame APDU DLMS/COSEM sécurisée**.
* La trame est transmise par le canal cellulaire 4G/GPRS directement au modem du compteur.
* **Le crédit est injecté en direct en 1,2 seconde.**
* L'écran LCD du compteur physique s'incrémente immédiatement.
* Si le disjoncteur était ouvert pour cause de solde épuisé, le **relais bistable se réarme automatiquement** et rétablit le courant instantanément.

---

## 2. LES 4 CHEMINS D'ACCÈS À LA FONCTION SUR L'INTERFACE AMI

L'interface a été conçue pour offrir un accès immédiat à la télé-injection à distance quel que soit le contexte opérationnel de l'agent NIGELEC :

```
                                  ┌──────────────────────────────────────────────┐
                                  │      INTERFACE CENTRALE NIGELEC AMI          │
                                  └───────┬──────────────┬──────────────┬────────┘
                                          │              │              │
           ┌──────────────────────────────┴─┐    ┌───────┴────────┐   ┌─┴────────────────────────────┐
           │ CHEMIN 1                       │    │ CHEMIN 2       │   │ CHEMIN 3 & 4                 │
           │ Menu Compteurs AMI             │    │ Passerelle HES │   │ Carte SIG / Modale de Vente  │
           │ Bouton Vert Émeraude           │    │ Menu Direct    │   │ Inspection & Guichet STS     │
           └────────────────────────────────┘    └────────────────┘   └──────────────────────────────┘
```

---

### 📍 CHEMIN 1 : DEPUIS LE PARC DES COMPTEURS (RECOMMANDÉ POUR LA DSI)
C'est le parcours le plus visuel et le plus naturel lors d'une inspection technique :

1. Dans le menu latéral (Sidebar), ouvrez le domaine **`COMPTAGE & RÉSEAU`**.
2. Cliquez sur **`Compteurs AMI`** (`/meters`).
3. Dans la liste, cliquez sur la ligne du **Compteur Triphasé `0128260224786`** (ou monophasé).
4. Le volet d'inspection s'ouvre, affichant les tensions en direct, l'index de consommation et le solde.
5. Dans le bandeau d'actions en bas, cliquez sur le bouton vert émeraude :  
   👉 **`⚡ TÉLÉ-RECHARGE OTA (HES / STS)`** *(bouton vert avec l'éclair jaune)*.
6. **Effet automatique :** L'identifiant `0128260224786` est mémorisé, la vue bascule instantanément vers la console de télé-injection, et **la modale de recharge s'ouvre déjà pré-remplie** sur ce compteur.

---

### 📍 CHEMIN 2 : DEPUIS LA PASSERELLE HES AUTONOME
C'est l'interface de supervision directe pour l'administrateur réseau et les télétransmissions en masse :

1. Dans le menu latéral, ouvrez le domaine **`VENTE STS & MONÉTIQUE`**.
2. Cliquez sur **`Passerelle HES Autonome`** (`/vending`) *(icône d'antenne radio)*.
3. Dans le premier onglet **« Supervision Modems 4G & Sockets TCP »**, repérez le compteur dans la table.
4. Dans la colonne **Action DLMS**, cliquez sur le bouton violet :  
   👉 **`⚡ Télé-recharge HES`**.

---

### 📍 CHEMIN 3 : DEPUIS LA CARTE RÉSEAU SIG
Si l'opérateur est en train de géo-superviser le réseau de Niamey :

1. Menu **`Carte Réseau SIG`** (`/map`).
2. Cliquez sur le repère du compteur sur la carte.
3. Dans la fenêtre **« Inspection Compteur »**, cliquez directement sur :  
   👉 **`📡 Télé-Recharge OTA Directe (HES / DLMS)`** *(en tête des télécommandes)*.

---

### 📍 CHEMIN 4 : DEPUIS LE GUICHET VENTE & STS CLASSIQUE
Lors d'une vente au comptoir où le client souhaite ne pas avoir à taper le code chez lui :

1. Menu **`Guichet Vente & STS`** (`/sts-prepaid`).
2. Saisissez le montant et cliquez sur **« Générer Jeton STS »**.
3. Dans la fenêtre de succès **« Token Généré avec Succès »**, cliquez sur le bouton vert en tête de liste :  
   👉 **`⚡ 📡 Télétransmettre au Compteur (OTA HES) ➔`**.

---

## 3. LE WORKFLOW INDUSTRIEL EN 3 ÉTAPES (DANS LA MODALE)

Dès l'ouverture de la console de télé-recharge, l'opération se déroule en **3 étapes visuelles** guidées par une barre de progression :

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ 1. PARAMÈTRES           │ 2. TICKET & JETON STS   │ 3. TÉLÉTRANSMISSION OTA │
│ (Sélection & Montant)   │ (Calcul fiscal NIGELEC) │ (Injection DLMS live)   │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Étape 1 : Paramètres & Montant
* **Compteur Cible :** Déjà pré-sélectionné (ex: `0128260224786 (Triphasé 400V • Solde: 7.00 kWh)`).
* **Montant de la Recharge :**  
  * Boutons de raccourcis rapides : **`2 000 FCFA`**, **`5 000 FCFA`**, **`10 000 FCFA`**, ou saisie libre (ex : `15 000 FCFA`).
* **Validation :** Cliquez sur le bouton :  
  `1. Émettre Jeton STS & Calculer (CEI 62055-41) ➔`

### Étape 2 : Reçu Officiel & Préparation de la Trame
* L'écran affiche :
  * Le volume de kWh net calculé selon la grille tarifaire NIGELEC (déduction redevances + TVA 19%).
  * Le **jeton STS 20 chiffres** officiel (ex : `2662-4440-1267-8830-8510`).
  * Les options d'impression immédiate du **Reçu Thermique** ou de téléchargement en **PDF**.
* **Le Déclencheur OTA :**  
  Juste en dessous du reçu apparaît le bouton d'action principal :  
  👉 **`2. 📡 Télétransmettre au Compteur (OTA HES) ➔`**

### Étape 3 : Injection DLMS & Confirmation
* En cliquant sur le bouton, le système :
  1. Génère la trame APDU DLMS de crédit d'énergie.
  2. Transmet l'ordre au modem 4G du compteur via la passerelle HES.
  3. Enregistre la transaction dans la table `tokens` et `payments`.
* **Affichage de succès immédiat :**
  ```
  ✅ Télétransmission DLMS / HES Réussie !
  Le crédit de +15.09 kWh a été injecté directement sur le compteur 0128260224786 sans saisie manuelle.
  Passerelle DCU : DCU-CUNI-01 (47.90.150.122)
  Nouveau Solde Actualisé : 22.09 kWh
  ```

---

## 4. CE QUE LA DSI PEUT CONSTATER SUR LE BANC PHYSIQUE

Lors de l'exécution de la télé-recharge en direct devant la DSI :

1. **Sur l'écran du laptop :** Confirmation du succès avec le volume de kWh ajouté et le nouveau solde.
2. **Sur le compteur physique :**  
   * En appuyant sur le bouton de défilement du compteur triphasé, l'index de solde de crédit (OBIS `0.0.19.40.0.255`) affiche instantanément la nouvelle valeur (ex: `22.09 kWh`).
3. **Sur le disjoncteur :**  
   * Si le compteur était préalablement coupé (`OPEN`) pour manque de crédit, le relais émet un **« CLAC ! » mécanique** et le courant se rétablit automatiquement.

---

## 5. ARGUMENTAIRE STRATÉGIQUE POUR LA SOUTENANCE

| Question / Défi de la DSI | Réponse Technique de l'Expert |
| :--- | :--- |
| **« Que se passe-t-il si le compteur n'a pas de réseau au moment de l'achat ? »** | Le jeton STS 20 chiffres reste imprimé sur le reçu et consigné dans la base. Si la liaison 4G est momentanément indisponible, le client peut toujours taper les 20 chiffres au clavier. Dès le retour du réseau, la passerelle HES synchronise le compteur. |
| **« Peut-on brancher un système de Mobile Money (Orange Money, Moov) ? »** | Oui. Notre endpoint REST `POST /api/v1/vending2/recharge` prend en charge l'ensemble du cycle : paiement mobile ➔ émission du jeton ➔ télé-injection OTA automatique en 1 seul appel API. |
| **« Quelle est la sécurité de la trame OTA ? »** | La trame est chiffrée de bout en bout en **AES-128 HLS5** avec clés d'authentification et de chiffrement dédiées (`AK`/`EK`). Un tiers sur le réseau GSM ne peut ni intercepter ni falsifier le jeton. |

---

## 6. CONCLUSION
La fonction de télé-injection OTA scelle la supériorité opérationnelle de la plateforme AMI NIGELEC : elle élimine les erreurs de saisie humaine, automatise le recouvrement des recettes et prépare la NIGELEC à l'intégration fluide avec les banques et les opérateurs de Mobile Money du Niger.
