# 🚀 Démonstration du Flux Complet : e-EnergieTEC

Ce guide vous accompagne à travers une démonstration de bout en bout illustrant la puissance de la plateforme pour la **Nigelec**.

## 🎭 Scénario : "De la détection d'anomalie réseau à l'intervention et la vente STS"

### Étape 1 : Analyse des Pertes & Supervision Réseau (v6.5 Souveraine)
1. Allez dans la section **"Statistiques & Bilans"**.
2. Observez la matrice de consommation quotidienne et annuelle, ainsi que le **Bilan Énergétique**.
3. **Observation** : Le système compare en temps réel l'énergie injectée dans les transformateurs (HTA/BT) et l'énergie facturée. La zone de **Niamey** affiche un taux de perte commerciale maîtrisé.
4. Le flux **Watchdog SSE** (`/api/watchdog/stream`) supervise les battements de cœur en temps réel des compteurs physiques `0128260224778` et `0128260224786`.

### Étape 1bis : Télérelève Métrologique Réelle Directe GPRS (Compteur sous Charge)
1. Allez dans la section **"Compteurs AMI"** ou **"Statistiques > Codes OBIS"**.
2. Sélectionnez le compteur monophasé `0128260224778` (ou triphasé `0128260224786`).
3. Cliquez sur **"Télérelève Directe GPRS"** (ou déclenchez `POST /api/v1/vending2/read-telemetry`).
4. **Observation en direct (Zéro approximation)** :
   * La plateforme interroge séquentiellement la carte modem cellulaire du compteur via les objets COSEM (`POST /api/v1/obis-list/read`).
   * **Tension RMS Réelle** : `235.1 V` (OBIS `1.0.32.7.0.255`).
   * **Courant RMS Réel** : `1.636 A` (OBIS `1.0.31.7.0.255`).
   * **Puissance Active Réelle** : `296 W` (OBIS `1.0.15.7.0.255`).
   * **Énergie Totale Consommée (+A)** : `0.38 kWh` (OBIS `1.0.1.8.0.255`).
   * **Solde Crédit Restant** : `50.02 kWh` (OBIS `0.0.19.40.0.255`).
   * **Vérification Physique** : La consommation ($0.38\text{ kWh}$) correspond exactement à la décrémentation du solde prépayé ($50.40 - 0.38 = 50.02\text{ kWh}$).


### Étape 2 : Supervision des Alertes Physiques et Réseau
1. Dans "Alertes", visualisez les alertes réelles de communication ou d'ouverture de capot (Tamper).
2. **Ce qui se passe en arrière-plan** :
   - Lorsqu'un compteur perd sa connexion ou signale une ouverture capot, une alerte est consignée immédiatement dans la base SQLite.
   - Un **Ticket d'intervention** est créé pour l'équipe technique.

### Étape 3 : Gestion Terrain (Portail Technicien)
1. Reconnectez-vous en tant que `tech` / `tech123`.
2. Sur mobile (ou vue réduite), utilisez la navigation pour accéder aux **"Missions"**.
3. **Action** : Vous visualisez l'intervention assignée.
4. Cliquez sur **"Commencer"** puis **"Clôturer"** après inspection physique.

### Étape 4 : Maintenance Logistique & Magasin
1. Allez dans **"Magasin & Actifs"**.
2. Visualisez l'état du parc matériel et le stock réel synchronisé avec la base.
3. Les compteurs en attente d'attribution ou en SAV y sont répertoriés avec leur statut exact.

### Étape 5 : Ventes STS & Recharge Certifiée KMS-HSM
1. Rendez-vous dans **"Recharge STS"**.
2. Sélectionnez le compteur physique `0128260224778`.
3. Saisissez le montant en FCFA (ex: 5 000 FCFA).
4. Cliquez sur **"Générer Jeton STS"**.
5. **Observation** : Le jeton 20 chiffres est généré par le moteur **KMS-HSM (Port 5000)** selon la norme CEI 62055-41, avec ventilation fiscale NIGELEC 2024 automatique.
6. Imprimez le reçu thermique pour le client.

### Étape 6 : Édition du Rapport Ministériel Consolidé
1. Dans le bandeau supérieur de **"Statistiques & Bilans"**, cliquez sur **`[📄 Rapport Consolidé National (PDF)]`**.
2. Ouvrez le document officiel PDF généré avec sceau cryptographique SHA-256 certifié par le KMS.

---

## 💡 Points Forts à souligner lors de la soutenance NIGELEC
- **Zéro-Mock & Transparence Totale** : Toutes les données présentées proviennent d'appels physiques réels et de la base SQLite.
- **Triple Démon Souverain** : Découplage strict entre la cryptographie STS (Port 5000), la tête de réseau HES (Ports 4059/4060) et l'application MDMS/UI (Port 3000).
- **Conformité Internationale** : Normes CEI 62055-41 (STS v2) et CEI 62056 (DLMS/COSEM).
- **Intégration Fiscale NIGELEC 2024** : Respect rigoureux des tranches sociales et des taxes légales (TVA 19%, ORTN, Habitat).
