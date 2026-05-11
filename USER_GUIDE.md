# Guide d'Utilisation : e-EnergieTEC AMI & STS - Enterprise Edition

Ce guide est destiné aux opérateurs, techniciens, auditeurs et administrateurs de la **NIGELEC** pour l'utilisation quotidienne de la plateforme souveraine de gestion AMI e-EnergieTEC.

---

## 1. Accès au Système & Environnement
### Environnement et Démarrage
L'application e-EnergieTEC Enterprise fonctionne désormais sur une infrastructure conteneurisée robuste :
*   L'accès principal s'effectue via l'URL fournie par l'administrateur (ex: `http://localhost:3000` en local ou via le tunnel **Ngrok** sécurisé pour les accès distants).
*   **Design Premium** : L'interface utilise un mode sombre (Dark Mode) et des effets "Glassmorphism" aux couleurs officielles de la NIGELEC (Orange et Vert) pour un confort visuel optimal lors de la supervision prolongée.

### Connexion Sécurisée
1.  Rendez-vous sur la page de connexion sécurisée.
2.  Saisissez vos identifiants (Username/Password).
3.  Validez le **Captcha de sécurité** (Section 6 Compliance).
4.  Une authentification **MFA (Multi-Factor Authentication)** est exigée pour les profils à hauts privilèges (Administrateurs & Auditeurs ARSE).

---

## 2. Opérations de Vente (Module Vending STS)
Le module de vente est dynamique et directement connecté au moteur de facturation avec application de la **TVA nationale (19%)**.

### Générer un Jeton de Recharge (Token)
1.  Allez dans la section **"Vente STS / Prépayé"**.
2.  Sélectionnez le **Compteur** du client (via recherche ID, PAN ou Nom).
3.  Choisissez le **Canal de Paiement Dynamique** (Guichet, Orange Money, Airtel Cash, **NITA**, **Moov Money** ou **AMANA**).
4.  Saisissez le **Montant** (exclusivement en **FCFA**).
5.  Cliquez sur **"Générer Jeton"**.
6.  *Calcul Automatique* : Le système déduit dynamiquement la TVA de 19%, les taxes d'électrification et les redevances fixes avant la conversion en kWh.
7.  **Reçu** : Cliquez sur l'icône d'impression pour générer le reçu officiel ou transmettre le token par SMS.

### Codes de Service Spéciaux STS
*   `Key Change` : Mettre à jour les clés cryptographiques du compteur (Suite à un Rollover KRN).
*   `Clear Tamper` : Réinitialiser l'état d'effraction après une intervention terrain validée.
*   `Max Power Limit` : Définir la limite de puissance de souscription.

---

## 3. Supervision MDMS, Télé-relève & Hypervision
### Monitoring en Temps Réel
*   Le **Tableau de Bord** offre une vue consolidée avec graphiques analytiques.
*   **Canaux de Vente** : Visualisez en direct la répartition des ventes par opérateurs télécoms et guichets physiques.
*   **VEE (Validation, Estimation, Editing)** : Vérifiez la cohérence des courbes de charge (intervalles de 15 minutes) stockées dans la base de données temporelle (TimescaleDB).

### Actions à Distance (Bidirectionnelles)
1.  Depuis la **Carte Interactive (Niamey)** ou la liste des compteurs.
2.  Cliquez sur un compteur pour accéder au centre de contrôle.
3.  **Relais** : Déconnectez ou reconnectez l'alimentation physiquement en un clic.

---

## 4. Hypervision & Détection des Fraudes
### Alertes Intelligentes
*   Les alertes critiques (Bypass, Ouverture Capot, Champs Magnétiques) apparaissent immédiatement et géolocalisées.
*   **Action Automatique** : Toute fraude de niveau critique déclenche l'**ouverture immédiate du relais** du fraudeur.

### Résolution des Incidents
1.  Consultez le module **"Tickets Support"**.
2.  Assignez un technicien NIGELEC à l'intervention.
3.  Une fois l'intégrité rétablie sur le terrain, émettez un jeton STS `Clear Tamper` depuis le système pour réalimenter le client.

---

## 5. Rapports, Réconciliation & Conformité
Générez des documents infalsifiables et directement liés aux données de production (PostgreSQL) :
1.  Allez dans la section **"Rapports & Audits"**.
2.  Types de rapports disponibles :
    *   **Réconciliation Mobile Money** : Bilan croisé des transactions APIs (Orange, Airtel, etc.) vs la base de données.
    *   **Conformité (ARSE)** : Audit général de performance, SAIDI/SAIFI.
    *   **Bilan Énergétique STS** : Ratio Énergie Injectée / Énergie Vendue (Revenue Assurance).
    *   **Intégrité Système** : Export des logs de sécurité pour audit.

---

## 6. Gestion du Matériel (Lifecycle des Actifs)
Gérez le cycle de vie complet des équipements :
1.  Section **"Magasin & Actifs"**.
2.  Cliquez sur "Nouveau Compteur" lors de la réception magasin.
3.  Transitionnez les statuts : `En Stock` ➔ `Assigné` ➔ `Installé` ➔ `Défectueux/SAV` ➔ `Rebut`.

---

## 7. Sécurité KMC (Key Management Centre) & Configuration
### Centre de Sécurité
*   **Logs d'Intégrité** : Le système enregistre toute modification de configuration.
*   **Rotation des Clés (Rollover)** : La migration KRN (Key Revision Number) s'opère depuis ce module de manière cryptée et sécurisée.
*   **Configuration Persistante** : Les paramètres globaux (Seuils d'alerte, Tarification Nigelec) sont modifiables par les administrateurs et persistés en base de données.

### Support Technique NIGELEC
En cas de dysfonctionnement de l'application ou de la base de données :
*   Support IT Interne : support-it@nigelec.ne
*   Hotline Niveau 2 e-EnergieTEC : +227 20 XX XX XX
