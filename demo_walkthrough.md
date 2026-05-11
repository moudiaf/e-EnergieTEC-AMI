# 🚀 Démonstration du Flux Complet : e-EnergieTEC

Ce guide vous accompagne à travers une démonstration de bout en bout illustrant la puissance de la plateforme pour la **Nigelec**.

## 🎭 Scénario : "De la détection de fraude à l'intervention terrain"

### Étape 1 : Analyse des Pertes (MDMS)
1. Allez dans la section **"Analytique"**.
2. Observez le tableau **"Bilan Énergétique"**.
3. **Observation** : La région de **Niamey** affiche un taux de perte de **32.8%** (en rouge). C'est une anomalie critique indiquant une possible fraude massive ou un poste défaillant.

### Étape 2 : Simulation d'une Fraude Critique
1. Toujours dans "Analytique", cliquez sur le bouton **"🔥 Simulation Fraude Critique"**.
2. **Ce qui se passe en arrière-plan** :
   - Le système AMI détecte une ouverture de capot sur le compteur `541-234-567`.
   - Une alerte SMS est simulée vers le centre de supervision.
   - Un **Ticket d'intervention** est automatiquement créé et assigné au technicien le plus proche.

### Étape 3 : Gestion Mobile (Portail Technicien)
1. Changez de profil (ou déconnectez-vous et reconnectez-vous en tant que `tech` / `tech123`).
2. Sur mobile (ou vue réduite), utilisez la **Bottom Nav** pour cliquer sur **"Missions"**.
3. **Action** : Vous voyez l'intervention "FRAUDE DÉTECTÉE".
4. Cliquez sur **"Commencer"**. Le statut passe à "En cours".
5. Une fois terminé, cliquez sur **"Clôturer"**. Le compteur est sécurisé.

### Étape 4 : Maintenance Logistique (Magasin)
1. Supposons que le compteur fraudé doive être remplacé. Allez dans **"Gestion du Magasin"**.
2. Recherchez un compteur avec le statut **"Disponible"** (ex: `542-001-002`).
3. Cliquez sur l'icône **"Camion" (Installer)**.
4. Le système vous demande d'assigner ce nouveau compteur au client `C001` pour remplacer l'ancien.
5. **Résultat** : Le nouveau compteur passe en statut "Posé" et l'ancien est envoyé en "Récupération/SAV".

### Étape 5 : Ventes STS & Recharge
1. Le client souhaite maintenant recharger son nouveau compteur.
2. Allez dans **"Recharge STS"**.
3. Saisissez l'ID du nouveau compteur.
4. Générez un **Token de 20 chiffres**.
5. **Observation** : Le crédit est mis à jour instantanément dans le MDMS.

### Étape 6 : Smart Grid & IA (Expert Edition)
1. Allez dans **"Segments Tarifaires"**.
2. Modifiez le tarif "Domestique" et montrez l'activation du **"Time-of-Use (ToU)"**.
3. **Observation** : Expliquez que le système changera automatiquement le prix du kWh selon l'heure (HP/HC).
4. Retournez dans **"Analytique"** et montrez le panneau **"IA : Fraudes Subtiles"**.
5. **Observation** : Le compteur `541-234-567` est détecté avec une probabilité de fraude de **94%** par signature de charge, même sans intrusion physique.

---

## 💡 Points Forts à souligner lors de la présentation
- **Réactivité** : Moins de 2 secondes entre la fraude et la création du ticket.
- **Souveraineté** : Infrastructure **Docker & HTTPS** pour un déploiement 100% maîtrisé au Niger.
- **Mobilité** : Le technicien n'a plus besoin de papier, tout est sur son PWA en mode **Offline**.
- **ROI & IA** : Réduction directe des pertes non-techniques via le Bilan Énergétique et le Machine Learning.
