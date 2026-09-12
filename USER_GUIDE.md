# 📖 MANUEL UTILISATEUR OPÉRATIONNEL — e-EnergieTEC (RENTEC AMI v6.5)

> **GUIDE D'EXPLOITATION OPÉRATIONNELLE À DESTINATION DES INGÉNIEURS, CAISSIERS NIGELEC ET AUDITEURS ARSE**

---

## 1. 🔑 SÉCURITÉ, CONNEXION ET RÔLES D'ACCÈS (RBAC)

La plateforme **e-EnergieTEC Sovereign** met en œuvre un contrôle d'accès basé sur les rôles (RBAC) conforme aux normes de sécurité électrique au Niger :

| Profil | Identifiant | Mot de Passe | Prérogatives & Responsabilités |
|:---|:---:|:---:|:---|
| **ADMINISTRATEUR** | `admin` | `admin123` | Supervision nationale, paramétrage de la grille tarifaire, contrôle disjoncteurs, gestion KMS-HSM |
| **GUICHETIER / VENDEUR** | `vendor` | `vendor123` | Vente de crédit STS 20 chiffres, encaissement (Cash / Mobile Money +227), arrêtés de caisse |
| **TECHNICIEN RÉSEAU** | `tech` | `tech123` | Télémesure DLMS, synchronisation horloge RTC, maintenance des DCU, registres OBIS |
| **AUDITEUR ARSE** | `auditor` | `auditor123` | Audit d'assurance revenus (Revenue Assurance), contrôle de conformité, extraction des rapports |

---

## 2. 📊 ESPACE « STATISTIQUES & BILANS » (LES 8 SOUS-MENUS)

Le menu **Statistiques & Bilans** constitue le centre de pilotage décisionnel de la NIGELEC :

### A. Onglet « Consommation » (Matrice 31j & 12 Mois)
1. **Arborescence Géographique (Volet Gauche)** :
   * Dépliez **`NIGER (National)`** pour naviguer dans **`NIAMEY`**, **`CUNI`**, **`DOSSO`**, **`MARADI`**, etc.
2. **Bascule Quotidien / Mensuel** :
   * **`[RAPPORT QUOTIDIEN]`** : Affiche la matrice des 31 jours (`1er` à `31e`) du mois sélectionné avec total mensuel en $kWh$.
   * **`[RAPPORT MENSUEL]`** : Affiche les 12 mois de l'année (`Janvier` à `Décembre`) avec le total annuel consolidé par compteur.
3. **Exportation** :
   * Cliquez sur **`[CSV]`** pour extraire la feuille de calcul brute.
   * Cliquez sur **`[📄 Rapport PDF Consolidé]`** pour obtenir le rapport officiel mis en page.

### B. Onglet « Analyse » (Comparatif & YoY %)
* **Graphique Recharts Double Axe** :
  * Barres bleues et vertes : Consommation de la période en cours vs période précédente ($kWh$).
  * Courbe orange avec points : **Ratio YoY (Year-over-Year %)**.
* **Tableau Synchronisé** :
  * Cliquez sur une ligne pour inspecter le détail journalier ou mensuel.
* **Export PDF** : Cliquez sur **`[📄 Rapport PDF]`**.

### C. Onglet « Suivi Financier »
* Synthèse du chiffre d'affaires et ventilation selon la **Loi de Finances NIGELEC 2024** :
  * Part Énergie Hors Taxes (HT), TVA 19%, Taxe ORTN (3 FCFA/kWh), Taxe Spéciale Habitat (200 FCFA/trans.), Primes Fixes.
* Répartition des canaux **+227 Mobile Money** (Orange Money, Airtel Money, NITA, AMANA, Cash Agence).
* Cliquez sur **`[📄 Bilan Financier PDF]`** pour télécharger l'état financier officiel.

### D. Onglets Techniques STS & DLMS
* **Token de test STS** :
  * Génération de jetons normalisés CEI 62055-41 (Clear Tamper SubClass 5, Clear Credit SubClass 1, Test Relais).
  * En cas de sabotage capot (`tamperStatus = 'tampered'`), sélectionnez **Clear Tamper**, cliquez sur générer : le jeton 20 chiffres réarme immédiatement le contacteur du compteur.
* **Enregistrement** : Journal d'audit traçable en temps réel raccordé aux événements de la base SQLite.
* **Tâche Du Système** : Déclencheur des télérelèves HES et vérification de la santé des démons.
* **Contrôle De Charge** : Télécommande du relais disjoncteur (Coupure / Rétablissement) et configuration du seuil limite de puissance ($kW$).
* **OBIS (Dictionnaire & Télémesure Directe)** :
  * Inspecteur interactif des registres COSEM CEI 62056-61.
  * Sélectionnez le compteur cible (`0128260224778`), puis cliquez sur **« Interroger Compteur en Direct (GPRS) »** pour extraire en temps réel la tension exacte ($V\text{ RMS}$), le courant ($A$), la puissance active ($kW$) et l'index cumulatif d'énergie consommée ($kWh$).

---

## 3. 📄 EXPORTATION DES RAPPORTS PDF CONSOLIDÉS

Pour éditer le rapport complet d'activité pour la Direction Générale ou le Régulateur (ARSE) :
1. Dans le bandeau supérieur de **Statistiques**, cliquez sur **`[📄 Rapport Consolidé National (PDF)]`**.
2. Le document PDF téléchargé comprend automatiquement :
   * L'en-tête officiel tricolore de la République du Niger.
   * La synthèse des indicateurs de performance (KPIs).
   * La matrice de consommation consolidée par zone.
   * La cascade fiscale réglementaire NIGELEC.
   * La ventilation des encaissements par opérateur Mobile Money et par segment tarifaire.
   * Le sceau cryptographique SHA-256 certifié par le KMS-HSM.

---

## 4. ⚡ GUICHET VENTE STS & MONÉTIQUE (+227)

1. Rendez-vous dans **« Guichet Recharge STS »**.
2. Sélectionnez le compteur (ex: `0128260224778`).
3. Saisissez le montant en FCFA (ex: `5 000 FCFA`).
4. Choisissez le canal de règlement (Orange Money, Airtel Money ou Guichet Cash).
5. Cliquez sur **« Générer Jeton STS »**.
6. Le jeton 20 chiffres (format `XXXX-XXXX-XXXX-XXXX-XXXX`) est généré via le KMS-HSM (Port 5000) et prêt à l'impression thermique ou à l'envoi par SMS.

---

## 5. 🗺️ CARTE RÉSEAU SIG & SUPERVISION MATÉRIELLE

* **Supervision Géographique** : Visualisez les concentrateurs (ex: `DCU-CUNI-01`) et les compteurs associés sur les 8 régions du Niger.
* **Télémesure en 1 Clic** : Cliquez sur un marqueur de compteur pour lancer une interrogation DLMS instantanée ($V$, $A$, $kW$, $Hz$, solde $kWh$).
* **Télé-Coupure d'Urgence** : Actionnez à distance l'ouverture ou la fermeture du disjoncteur en cas d'impayé ou de fin de bail.

---

## 6. 🛰️ SUPERVISION TEMPS RÉEL, WATCHDOG SSE & ALERTES

* **Flux Événementiel Watchdog SSE (`/api/watchdog/stream`)** :
  * L'application web maintient une connexion continue Server-Sent Events avec le serveur principal.
  * Le statut de connectivité des compteurs physiques (`0128260224778` et `0128260224786`) est mis à jour en direct sans rechargement de page.
* **Gestion des Alertes de Communication** :
  * Lorsqu'un compteur ne répond plus ou dépasse le délai de garde, une alerte critique `COMMUNICATION_TIMEOUT` est automatiquement consignée dans le journal d'audit et la table d'alertes.
  * Dès réception d'un signal de vie ou d'une trame DLMS valide, l'alerte est automatiquement clôturée et le compteur repasse au statut `En Ligne`.
* **Zéro Mock Garanti** :
  * Les indicateurs reflètent exclusivement la connectivité matérielle réelle. Si un compteur est injoignable, le système affiche `Hors Ligne` en toute transparence technique.

