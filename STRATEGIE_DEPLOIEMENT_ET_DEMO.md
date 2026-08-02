# Guide de Déploiement Cloud & Stratégie de Présentation NIGELEC

Ce document détaille la marche à suivre pour mettre en ligne la plateforme **e-EnergieTEC v5.0** et réussir la démonstration technique devant les décideurs de la NIGELEC et de l'ARSE.

---

## 🌐 1. Comment Tester & Déployer sur Internet

Pour que la plateforme soit accessible via un lien (ex: `https://demo.nigelec-ami.ne`), vous devez suivre ces étapes :

### Étape A : Choisir un Hébergeur
Comme notre architecture est basée sur **Docker Compose**, vous avez besoin d'un VPS (Virtual Private Server) avec au moins **8 Go de RAM** (pour faire tourner Kafka + TimescaleDB + Web API).
- **Options recommandées** : AWS (EC2), Google Cloud (Compute Engine), ou un fournisseur local/européen (OVH, Linode).

### Étape B : Mise en Ligne (Méthode Rapide)
1. **Connectez-vous à votre serveur** via SSH.
2. **Installer Docker & Docker Compose** sur le serveur.
3. **Transférez le fichier ZIP** final sur le serveur.
4. **Décompressez et lancez** :
   ```bash
   docker-compose up --build -d
   ```
5. **Configuration Nginx (SSL)** :
   Utilisez le service `edge-tls-gateway` (déjà dans le docker-compose) ou installez **Certbot** pour obtenir un certificat HTTPS gratuit (Let's Encrypt).

### Étape C : Test de l'App Mobile
Pour tester l'application mobile à distance :
1. Publiez-la sur **Expo Snack** ou via un build **Internal Testing** sur le Play Store.
2. Les testeurs de la NIGELEC scannent simplement un code QR pour voir l'application sur leur propre téléphone.

---

## 🎤 2. Stratégie de Présentation à la NIGELEC

La présentation doit être structurée pour "impressionner" (Aesthetics) tout en rassurant sur la "technique" (Conformité Standards).

### Introduction (5 min) : La Vision
- Présentez e-EnergieTEC non pas comme un simple portail, mais comme un **Ecosystème National de Souveraineté Énergétique**.
- Insistez sur l'indépendance vis-à-vis des constructeurs (Interopérabilité DLMS/STS).

### Démonstration Live (15 min) : "Le parcours du jeton"
Suivez ce scénario pour montrer la puissance du système :
1. **Achat côté Client** : Simulez un achat sur l'App Mobile via Orange Money. Montrez la génération instantanée du Jeton STS (avec protection TID).
2. **Revenue Assurance v5.0** : Ouvrez le tableau de bord "Garantie des Revenus". Montrez comment le système compare l'énergie des transformateurs et celle des clients pour débusquer les pertes.
3. **Intelligence Artificielle** : Montrez la liste des **"Top Suspects IA"**. Expliquez que le modèle ML identifie les fraudeurs par signature de charge, optimisant ainsi les descentes terrain.
4. **Supervision Géo-Intelligente** : Basculez sur la carte GIS. Changez de zone pour montrer la scalabilité nationale.
5. **Impression Thermique** : Imprimez un reçu en direct pour montrer que le système est prêt pour les agences physiques.

### Session Technique (10 min) : Pourquoi nous sommes Tier-1 ?
- Présentez le document **`GAP_ANALYSIS_NIGELEC.md`**.
- Expliquez l'**Architecture N-Tiers Modulaire** : une structure découplée qui garantit une maintenance simplifiée et une haute disponibilité des services critiques (STS, Billing).
- Parlez de l'isolation du **KMS/HSM** et de l'**Audit Trail Immuable** qui garantit la traçabilité de chaque franc encaissé.

### Conclusion : La Roadmap vers le Milliard de Trame
- Présentez la roadmap de 12 mois pour la certification officielle.
- Proposez un projet pilote sur un district de Niamey (ex: Plateau).

---

## 💡 Conseils pour le Jour J
- **Utilisez un grand écran** pour montrer la carte GIS (l'effet visuel est saisissant).
- **Ayez une version locale** (Offline) sur votre PC au cas où internet faiblirait pendant la démo.
- **Préparez des reçus thermiques pré-imprimés** à distribuer aux responsables comme "souvenir" de la démo.

---
*Ce guide accompagne la version 5.0 Enterprise Final.*
