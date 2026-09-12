# 📦 GUIDE DE DÉPLOIEMENT BACKEND & HES — RENTEC AMI / NIGELEC

> **DOCUMENT TECHNIQUE D'EXPLOITATION ET DÉPLOIEMENT EN PRODUCTION POUR LES ÉQUIPES SYSTÈME ET RÉSEAU NIGELEC**

---

## 📋 1. VUE D'ENSEMBLE DE L'ARCHITECTURE

La plateforme **RENTEC AMI** n'est pas uniquement une interface frontend React SPA, mais une **plateforme full-stack avec un serveur Backend Head-End System (HES) & MDMS de niveau industriel**.

### Structure des Fichiers Backend dans le Repository :

- **Point d'Entrée Backend Serveur REST & HES** : [`server.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server.ts)  
  *Serveur Express Node.js/TypeScript gérant la sécurité, le RBAC, les rate limiters anti-DoS, la persistance SQL, la génération de jetons STS et le routage API.*
- **Passerelle d'Intégration API Vending2 / Futurise** : [`server/services/futurise-api.client.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server/services/futurise-api.client.ts) & [`vending2.service.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server/services/vending2.service.ts)  
  *Passerelle distante de recharge prépayée, gestion des jetons STS 20 chiffres, gestion du captcha et résilience réseau (backoff exponentiel).*
- **Moteur Prépayé STS (IEC 62055-41/51)** : [`server/services/sts-prepayment.service.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server/services/sts-prepayment.service.ts)
- **Persistance & Base de Données** : [`server/db/database.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server/db/database.ts) & [`ami_smart_meter.db`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/ami_smart_meter.db)  
  *Support natif SQLite et PostgreSQL (TimescaleDB).*
- **Microservices Métier** : [`services/`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/services)  
  *(Passerelle DLMS/COSEM, Simulateur KMS-HSM, Détecteur de Fraude ML, Passerelle ERP CIM).*

---

## 🚀 2. MODES DE DÉPLOIEMENT DU BACKEND

Le serveur Backend peut être exécuté selon **4 méthodes adaptées à votre infrastructure** :

### Méthode A : Exécution Directe Node.js (Architecture Souveraine Triple Démon)

Le système complet s'appuie sur trois démons indépendants :
1. **Démon Sécurité KMS-HSM (Port 5000)** : Moteur cryptographique STS v2 AES-128.
2. **Démon Passerelle HES (Ports 4059 TCP & 4060 HTTP)** : Réception des trames DLMS push et décodage.
3. **Serveur Principal HES/MDMS & UI (Port 3000)** : API REST, persistance SQL, Watchdog SSE et interface web Vite.

```bash
# 1. Installation des dépendances
npm install

# 2. Lancement du Démon KMS-HSM (Port 5000)
npx tsx services/kms-hsm/server.ts

# 3. Lancement du Démon Passerelle HES (Ports 4059/4060)
npx tsx services/hes-gateway/server.ts

# 4. Lancement du Serveur Principal HES, MDMS & UI (Port 3000)
npx tsx server.ts
```

---

### Méthode B : Service Daemon Linux Systemd (Recommandé en Production Linux)

Un fichier de service Systemd dédié est fourni à la racine : [`rentec-ami-backend.service`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/rentec-ami-backend.service).

#### Procédure d'installation :

1. Copier le projet dans le répertoire de destination (ex: `/var/www/rentec-ami`).
2. Copier le fichier service dans le répertoire Systemd :
   ```bash
   sudo cp rentec-ami-backend.service /etc/systemd/system/
   ```
3. Recharger le démon Systemd et démarrer le service :
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable rentec-ami-backend
   sudo systemctl start rentec-ami-backend
   ```
4. Vérifier le statut du service Backend :
   ```bash
   sudo systemctl status rentec-ami-backend
   ```

---

### Méthode C : Conteneur Docker Unique (Backend Server)

Utiliser le [`Dockerfile`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/Dockerfile) mis à jour à la racine :

```bash
# Build de l'image Docker du Backend
docker build -t rentec-ami-backend .

# Exécution du conteneur Backend
docker run -d -p 3000:3000 --name rentec-backend --env-file .env rentec-ami-backend
```

---

### Méthode D : Architecture Microservices Docker-Compose (Multi-Services)

Utiliser le fichier [`docker-compose.yml`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/docker-compose.yml) pour déployer l'ensemble de l'écosystème (Backend API, TimescaleDB, Kafka, Redis, KMS-HSM, Passerelle DLMS/COSEM, ML Fraud) :

```bash
docker-compose up -d --build
```

---

## ⚙️ 3. VARIABLES D'ENVIRONNEMENT (`.env`)

Assurez-vous que le fichier `.env` à la racine contient les paramètres de configuration du Backend :

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=rentec_ami_super_secret_jwt_key_2026

# Configuration Passerelle HES Vending2 / Futurise
FUTURISE_BASE_URL=https://dlms.futurise-tech.com:4680/api/v1
FUTURISE_USERNAME=eEnergietec
FUTURISE_PASSWORD=111111
FUTURISE_TIMEOUT=15000
FUTURISE_REJECT_UNAUTHORIZED=false

# Token d'Ingénieur Permanent HES (Privilèges Role ID 6 pour télérelève point-à-point OBIS)
FUTURISE_API_TOKEN=eyJhbGciOi...

# Configuration Base de Données
DB_TYPE=sqlite # ou postgres
# DATABASE_URL=postgres://nigelec_admin:SecurePass2026!@localhost:5432/ami_mdms
```

---

## 🧪 4. VERIFICATION TECHNIQUE DE L'API BACKEND

Pour prouver le bon fonctionnement de l'API Backend, exécutez les commandes `curl` suivantes :

### Test 1 : Vérification Santé de l'API
```bash
curl http://localhost:3000/api/mdms/stats
```

### Test 2 : Authentification Server-to-Server / JWT
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Test 3 : Diagnostic Santé KMS-HSM
```bash
curl http://localhost:5000/health
```

### Test 4 : Flux Temps Réel Watchdog SSE
```bash
curl -N http://localhost:3000/api/watchdog/stream
```

### Test 5 : Télérelève Métrologique Réelle GPRS (Compteur sous Charge)
```bash
curl -X POST http://localhost:3000/api/v1/vending2/read-telemetry \
  -H "Content-Type: application/json" \
  -d '{"meterNo": "0128260224778"}'
```

### Test 6 : Exécution des Tests d'Intégration Métier Backend
```bash
npm run test:integration
```

---

## 📞 ASSISTANCE & SUPPORT

Si vos équipes système nécessitent un ajustement spécifique de l'architecture backend (ex: séparation physique sur deux serveurs distincts Frontend Nginx / Backend Node.js), le serveur backend [`server.ts`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/server.ts) peut être exécuté indépendamment sous Nginx comme reverse proxy (`proxy_pass http://127.0.0.1:3000`).
