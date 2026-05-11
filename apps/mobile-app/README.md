# e-EnergieTEC Mobile App (Native)

## 📱 Aperçu
Cette application mobile native est conçue pour les clients finaux de la NIGELEC. Elle permet une gestion intuitive du crédit d'énergie prépayé (STS) et une supervision en temps réel de la consommation.

## 🚀 Fonctionnalités
- **Dashboard Natif** : Consultation rapide du crédit restant (kWh).
- **Achat STS Express** : Intégration Native avec Orange Money & Airtel Cash.
- **Historique de Vending** : Accès aux derniers jetons générés.
- **Notifications Push** : Alertes de crédit bas et notifications de coupure réseau.
- **Support Client** : Ouverture de tickets directement depuis l'app.

## 🛠️ Stack Technique
- **Framework** : React Native / Expo
- **Design** : Tailored Dark Mode (Aesthetics Premium)
- **API** : REST API (e-EnergieTEC MDMS Gateway)
- **Authentification** : OAuth2 / OIDC (Compatible Keycloak/Active Directory)

## 📦 Installation (Développement)
1. Installer Expo Go sur votre smartphone.
2. `cd apps/mobile-app`
3. `npm install`
4. `npm start`
5. Scannez le QR Code avec l'application Expo Go.

## 🏗️ Build de Production
Pour générer les fichiers `.apk` (Android) et `.ipa` (iOS) :
```bash
eas build --platform android
eas build --platform ios
```

---
*Fait partie de la suite e-EnergieTEC AMI/STS v5.0*
