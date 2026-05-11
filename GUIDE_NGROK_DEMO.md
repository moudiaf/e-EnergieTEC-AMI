# Guide de Démonstration Rapide via Ngrok

Ngrok permet d'exposer votre serveur local (votre ordinateur) sur Internet de manière sécurisée via une URL publique (`https://...`). C'est l'outil idéal pour une présentation impromptue devant la NIGELEC si vous n'avez pas de serveur Cloud.

---

## 🚀 Étape 1 : Installation de Ngrok
1. Rendez-vous sur [ngrok.com](https://ngrok.com/) et créez un compte gratuit.
2. Téléchargez l'exécutable pour Windows.
3. Décompressez le fichier `ngrok.exe`.

## 🔑 Étape 2 : Configuration de l'authentification
Ouvrez votre terminal (PowerShell ou CMD) dans le dossier où se trouve `ngrok.exe` et tapez la commande fournie sur votre tableau de bord Ngrok :
```bash
./ngrok config add-authtoken VOTRE_TOKEN_ICI
```

## 🏃 Étape 3 : Lancement de la plateforme e-EnergieTEC
Lancez d'abord votre application localement.
1. Ouvrez un terminal dans le dossier du projet.
2. Tapez : `npm run dev` (Le serveur tourne sur `http://localhost:3000`).

## 🌐 Étape 4 : Ouverture du tunnel public
Dans un **autre terminal**, lancez Ngrok pour rediriger le trafic vers le port 3000 :
```bash
./ngrok http 3000
```

## 📋 Étape 5 : Partage du lien
Ngrok va afficher une ligne nommée **Forwarding** :
`Forwarding  https://a1b2-c3d4-e5f6.ngrok-free.app -> http://localhost:3000`

- **Copiez le lien `https://...`**.
- Envoyez-le par e-mail ou WhatsApp aux participants de la démo.
- **Magie** : Ils peuvent désormais voir votre plateforme et tester l'App Mobile sur leur propre téléphone depuis n'importe quelle connexion Internet.

---

## ⚠️ Notes Importantes pour la NIGELEC
1. **Ne fermez pas votre terminal** : Si vous fermez le terminal Ngrok ou votre PC, le lien s'arrête instantanément.
2. **Version Gratuite** : Avec un compte gratuit, l'URL change à chaque redémarrage de Ngrok. Pour la présentation finale, lancez Ngrok le matin et ne le touchez plus jusqu'à la fin de la séance.
3. **Sécurité** : Ngrok utilise le protocole HTTPS, ce qui garantit que les données (jetons STS, infos clients) sont chiffrées entre votre PC et le téléphone des décideurs.

---
*Procédure générée pour la mise en service rapide de e-EnergieTEC v5.0.*
