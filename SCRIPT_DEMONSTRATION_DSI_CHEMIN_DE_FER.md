# 🎯 CHEMIN DE FER OPÉRATIONNEL : SOUTENANCE TECHNIQUE & DÉMONSTRATION DSI NIGELEC
### Guide Pas-à-Pas pour la Recette en Direct des Compteurs Communicants AMI & Prépaiement STS

---

## 📌 FICHE SIGNALÉTIQUE DE LA SÉANCE
* **Auditoire visé :** Directeur des Systèmes d'Information (DSI), Directeur Commercial & Clientèle (DCC), Direction de l'Exploitation Réseau & Équipe Métrologie / Smart Metering de la NIGELEC.
* **Format & Durée :** Démonstration immersive en direct (Live SAT / POC) — **35 à 45 minutes maximum**.
* **Matériel requis en salle :**
  1. **Poste de présentation :** Laptop connecté au vidéoprojecteur (Navigateur Web sur `http://localhost:3000`).
  2. **Banc d'essais physique à vue de l'assistance :**
     * **Compteur Monophasé RENTEC STS (`0128260224778`)** branché sous tension, relié à une charge témoin visible (ex. lampe à incandescence de 60W ou projecteur).
     * **Compteur Triphasé RENTEC STS (`0128260224786`)** branché sous tension au repos.
     * Voyants cellulaires GPRS/4G actifs (clignotement régulier confirmant l'attachement réseau).

---

## ⏱️ PHASE 0 : CHECK-LIST TECHNIQUE AVANT ENTRÉE EN SALLE (T - 15 min)

Exécuter cette vérification rapide en coulisses pour garantir un sans-faute absolu :

1. **Vérifier les 3 démons en tâche de fond :**
   * Port `3000` : Serveur Core REST & Watchdog SSE
   * Port `5000` : Serveur KMS-HSM STS Edition 2
   * Ports `4059/4060` : Passerelle HES DLMS/COSEM
2. **Vérifier la connectivité des compteurs physiques :**
   ```bash
   npx tsx server/tests/test_inspect_meters.ts
   ```
   *S'assurer que les tensions `234.7 V` (Mono) et `219.2 V` (Tri) répondent.*
3. **Préparer les onglets du navigateur sur `http://localhost:3000` :**
   * Onglet 1 : Carte SIG Réseau (`/`)
   * Onglet 2 : Fiche Compteurs AMI (`/meters`)
   * Onglet 3 : Guichet Vente STS (`/vending` ou `/billing`)
   * Onglet 4 : Bilan Énergétique MDMS (`/mdms`)

---

## 🎬 DÉROULEMENT DU CHEMIN DE FER (CHRONOGRAMME MINUTE PAR MINUTE)

```
[00:00] ─── ACTE 1 : ACCUEIL & VUE SPATIALE SIG RÉSEAU NIAMEY ──────────────── (5 min)
[05:00] ─── ACTE 2 : LA PREUVE MÉTROLOGIQUE « ÉCRAN LCD vs WEB » ────────────── (7 min)
[12:00] ─── ACTE 3 : L'ÉPREUVE REINE : TÉLÉCOUPURE & RÉARMEMENT DU DISJONCTEUR (8 min)
[20:00] ─── ACTE 4 : RECHARGE STS 20 CHIFFRES & PIÈGE DU DOUBLE RECHARGEMENT ── (7 min)
[27:00] ─── ACTE 5 : BILAN ÉNERGÉTIQUE MDMS & ÉRADICATION DE LA FRAUDE ──────── (5 min)
[32:00] ─── ACTE 6 : AUDIT CYBER SOUVERAIN & CERTIFICAT D'HOMOLOGATION ──────── (3 min)
[35:00] ─── QUESTIONS / RÉPONSES & CONCLUSION STRATÉGIQUE ───────────────────── (10 min)
```

---

### 🟢 ACTE 1 : ACCUEIL, SOUVERAINETÉ & VUE SPATIALE SIG
* **Durée :** 5 minutes (00:00 ➔ 05:00)
* **Écran :** Menu **« Carte Réseau SIG »** en plein écran.
* **Ce qui est affiché :**
  * La cartographie satellite et vectorielle de Niamey.
  * Les concentrateurs DCU et les 2 compteurs communicants géolocalisés avec pastilles vertes "En Ligne" :
    * Marqueur 1 : **Agence Centrale NIGELEC** (Compteur Monophasé `0128260224778`).
    * Marqueur 2 : **Zone Industrielle de Niamey** (Compteur Triphasé `0128260224786`).

#### 🗣️ Discours du Présentateur (Verbatim conseillé) :
> *« Monsieur le Directeur des Systèmes d'Information, Messieurs les membres du Comité Technique, bienvenue.*  
> *Ce que vous avez sous les yeux n'est ni une maquette, ni un environnement de simulation. C'est l'infrastructure AMI souveraine connectée en direct aux compteurs physiques installés ici sur notre banc de recette.*  
> *Notre premier objectif d'ingénierie a été d'offrir à la NIGELEC une vision cartographique en temps réel de chaque point de livraison du territoire nigérien. Chaque compteur remonte sa position GPS, sa qualité de signal 4G et son statut instantané sans latence.*  
> *Regardons maintenant ce qui se passe à l'intérieur de ces équipements. »*

#### 🎯 Action du Démonstrateur :
* Cliquer sur le marqueur du compteur Monophasé : faire apparaître le pop-up interactif avec tension live (`~234 V`), courant (`1.67 A`) et solde prépayé.

---

### 🟢 ACTE 2 : LA PREUVE MÉTROLOGIQUE « ÉCRAN LCD DU COMPTEUR vs ÉCRAN WEB »
* **Durée :** 7 minutes (05:00 ➔ 12:00)
* **Écran :** Menu **« Compteurs AMI »** ➔ Sélection du Compteur Triphasé `0128260224786`.
* **Manipulation Matérielle :**
  * Inviter un ingénieur de la DSI à s'approcher du banc d'essais.
  * Lui demander d'appuyer sur le bouton physique de défilement du compteur triphasé et de lire à voix haute :
    1. La tension de phase affichée sur le LCD.
    2. L'index d'énergie active consommée (`0.00 kWh`).
    3. Le solde de crédit restant (`7.00 kWh`).

#### 🎯 Action du Démonstrateur :
* Sur l'application, cliquer sur le bouton **« Télérelève Directe DLMS »**.
* Montrer l'indicateur de requête GPRS instantanée.
* Dès l'affichage des données sur le tableau de bord, comparer les chiffres :
  * **Tension L1 :** Identique au volt près.
  * **Consommation Totale :** Strictement `0.00 kWh` (souligner qu'aucune formule arbitraire ne subsiste).
  * **Solde de Prépaiement :** Strictement `7.00 kWh`.

#### 🗣️ Discours du Présentateur :
> *« Dans les déploiements traditionnels, les systèmes de supervision utilisent souvent des interpolations ou des estimations pour combler les trous de collecte. Ce n'est pas le cas ici.*  
> *Notre passerelle HES interroge directement les registres d'objets standardisés COSEM selon la norme internationale CEI 62056-6-1.*  
> *Ce que le client voit sur son compteur chez lui est à 100% identique à ce que l'opérateur NIGELEC voit sur ses consoles. Aucune contestation de facture n'est possible. »*

---

### 🔴 ACTE 3 : L'ÉPREUVE REINE : TÉLÉCOUPURE & RÉARMEMENT DU DISJONCTEUR (LOAD SWITCH)
* **Durée :** 8 minutes (12:00 ➔ 20:00)
* **Écran :** Fiche détaillée du Compteur Monophasé `0128260224778` ➔ Volet **« Commande de Relais / Disjoncteur »**.
* **Dispositif Matériel :** La lampe témoin connectée au compteur est **allumée**.

#### 🎯 Action 3.1 : La Télécoupure (Ordre OPEN)
1. Demander l'attention de la salle sur le compteur physique et la lampe.
2. Cliquer sur le bouton rouge **« Couper l'alimentation (Ordre OPEN) »**.
3. Une modale de sécurité demande confirmation avec motif d'audit (ex : *"Impayé / Suspension administrative"*). Confirmer.
4. **EFFET IMMÉDIAT DANS LA SALLE :**
   * Un **« CLAC ! » mécanique très net** retentit dans le compteur (basculement physique du relais bistable interne).
   * La lampe témoin s'éteint instantanément.
   * Sur l'écran, le statut du relais bascule en temps réel de **`CLOSED (Enclenché)`** à **`OPEN (Coupé)`** avec voyant rouge sans recharger la page (diffusion SSE).

#### 🗣️ Discours du Présentateur :
> *« Mesdames et Messieurs, voici la concrétisation de la rentabilité d'un réseau AMI. Pour couper un client mauvais payeur, la NIGELEC n'a plus besoin de mobiliser un véhicule, deux agents de terrain et du carburant.*  
> *En 3 secondes, l'ordre crypté DLMS a traversé le réseau cellulaire jusqu'au modem du compteur. Le relais mécanique a coupé la phase. Le client est immédiatement isolé du réseau en toute sécurité. »*

#### 🎯 Action 3.2 : Le Rétablissement (Ordre CLOSE / ARM)
1. Cliquer sur **« Réarmer le disjoncteur (Ordre CLOSE) »**.
2. **EFFET PHYSIQUE :**
   * Second **« CLAC ! » mécanique**.
   * La lampe se rallume instantanément.
   * Le statut repasse au vert **`CLOSED`**.
3. Montrer dans la section **« Piste d'Audit »** que l'action a été enregistrée avec l'identifiant de l'opérateur, l'heure à la milliseconde près et l'empreinte de la transaction.

---

### 🟢 ACTE 4 : RECHARGE STS 20 CHIFFRES & LE PIÈGE DU DOUBLE RECHARGEMENT
* **Durée :** 7 minutes (20:00 ➔ 27:00)
* **Écran :** Menu **« Guichet Vente STS »**.

#### 🎯 Action 4.1 : La Génération du Jeton Officiel NIGELEC
1. Sélectionner le compteur monophasé `0128260224778`.
2. Sélectionner le client associé (*Ibrahim Souley*).
3. Saisir un montant d'achat : **`5 000 FCFA`**.
4. Constater le calcul instantané selon la grille officielle ARSE/NIGELEC :
   * Tranche tarifaire appliquée (Usage domestique).
   * Déduction de la redevance et de la TVA.
   * Volume exact de kWh crédité.
5. Cliquer sur **« Générer Jeton STS »**.
6. **Résultat à l'écran :**
   * Le jeton 20 chiffres certifié s'affiche en format clair (ex : `6355-8452-9575-8756-9821`).
   * Ouverture de la modale du **Reçu Thermique NIGELEC** avec code-barres 2D, SGC `600876` et KRN `2`.

#### 🎯 Action 4.2 : L'Épreuve du "Double Rechargement" (Piège classique de la DSI)
1. Expliquer à la DSI le principe de protection cryptographique du **TID (Token Identifier)**.
2. Tenter de réémettre immédiatement la même recharge pour le même compteur ou d'injecter deux fois le jeton.
3. **Preuve affichée :** La plateforme intercepte la duplication : le jeton est immédiatement verrouillé contre toute tentative de réutilisation (*Anti-Replay Protection* certifiée CEI 62055-41).

---

### 🟢 ACTE 5 : BILAN ÉNERGÉTIQUE MDMS & DÉTECTION DES PERTES NON TECHNIQUES
* **Durée :** 5 minutes (27:00 ➔ 32:00)
* **Écran :** Menu **« Bilan Énergétique MDMS »**.

#### 🗣️ Discours du Présentateur :
> *« Le plus grand défi de la distribution électrique en Afrique de l'Ouest, ce sont les pertes non techniques : les fraudes, les compteurs shuntés, les branchements directs clandestins.*  
> *Notre MDMS intègre un algorithme d'équilibrage de bilan énergétique par poste source et par départ.*  
> *Le concentrateur de quartier (DCU) mesure l'énergie injectée au départ du transformateur HTA/BT. Le MDMS fait la somme exacte des énergies enregistrées par les compteurs communicants situés en aval.*  
> *Si un delta anormal apparaît, le système déclenche une investigation ciblée sur le poste sans attendre les relevés manuels de fin de mois. »*

#### 🎯 Action du Démonstrateur :
* Montrer la matrice des postes de Niamey (Poste Niamey II, Goudel, Zone Industrielle).
* Pointer le taux de perte calculé et la localisation des concentrateurs sur le graphe de distribution.

---

### 🟢 ACTE 6 : ARCHITECTURE DE SÉCURITÉ CYBER & CERTIFICAT D'HOMOLOGATION
* **Durée :** 3 minutes (32:00 ➔ 35:00)
* **Écran :** Menu **« Sécurité & KMS »** puis affichage du **Certificat d'Homologation**.

#### 🎯 Points Clés à Présenter :
1. **Cloisonnement des Secrets (KMS-HSM Dédié sur Port 5000) :**
   * Démontrer que les clés maîtresses STS ne sont jamais exposées dans le navigateur ni stockées en clair.
   * L'algorithme de dérivation DKGA02 s'exécute dans un environnement isolé protégé par jeton JWT et politique RBAC stricte.
2. **Verrouillage « Production Pure » :**
   * Confirmer l'éradication totale des boutons et des routes de fausses alertes (rejet 403 Forbidden prouvé par l'audit).
3. **Présentation du Rapport d'Audit :**
   * Présenter le document officiel : [`CERTIFICAT_DE_CONFORMITE_ET_QUALIFICATION_EXPERT.md`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/CERTIFICAT_DE_CONFORMITE_ET_QUALIFICATION_EXPERT.md).
   * Souligner le score : **15 / 15 Contrôles Validés (100% Conforme)**.

---

## 🛡️ FICHES RÉFLEXES « QUE FAIRE SI... » (GESTION DU DIRECT)

| Imprévu Potentiel | Cause Technique | Réaction & Réponse Immédiate de l'Expert |
| :--- | :--- | :--- |
| **La télérelève met 8 à 10 secondes à répondre** | Latence temporaire du relais GPRS de l'opérateur télécom local. | **Argument d'expert :** *« Vous constatez ici le temps réel de traversée du réseau GSM d'Airtel/Moov au Niger. Le compteur acquitte la trame APDU DLMS de bout en bout. Nous privilégions l'intégrité cryptographique absolue à la précipitation. »* |
| **La DSI demande : « Peut-on intégrer notre logiciel de caisse existant ? »** | Question classique sur l'interopérabilité. | **Réponse immédiate :** *« Absolument. Notre architecture dispose d'une API REST OpenAPI/Swagger documentée (`/api/v1/vending2/*`). N'importe quel ERP (SAP, Oracle, application mobile bancaire) peut commander des tokens en 2 lignes de code. »* |
| **La DSI demande : « Que se passe-t-il si un fraudeur ouvre le capot des bornes ? »** | Question sur la sécurité mécanique. | **Réponse immédiate :** *« Le microswitch de détection d'ouverture de capot bascule immédiatement. Le compteur génère un événement OBIS `Terminal Cover Open` horodaté, et le relais peut être configuré pour déclencher la disjonction immédiate. »* |

---

## 🏆 CONCLUSION STRATÉGIQUE À DÉLIVRER À LA DIRECTION
> *« Monsieur le DSI, la NIGELEC a aujourd'hui le choix entre deux approches : continuer à dépendre de solutions propriétaires fermées où chaque évolution nécessite des mois de négociation avec des éditeurs étrangers, ou adopter cette plateforme souveraine, basée sur les standards mondiaux ouverts STS et DLMS/COSEM, dont la NIGELEC a la totale maîtrise technologique et financière.*  
> *Le système est prêt, validé, sécurisé et qualifié en Production Pure. »*
