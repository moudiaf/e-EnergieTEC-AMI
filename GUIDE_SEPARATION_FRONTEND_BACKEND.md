# 🔀 GUIDE DE SÉPARATION PHYSIQUE FRONTEND & BACKEND — RENTEC AMI

> **DOCUMENT TECHNIQUE POUR LES ARCHITECTES DEVOPS ET ADMINISTRATEURS SÉCURITÉ**

---

## 🎯 1. OUI, LA SÉPARATION COMPLÈTE EST TOTALEMENT PRÉVUE ET SUPPORTÉE

La plateforme **RENTEC AMI** a été conçue dès l'origine pour pouvoir fonctionner :
- **Soit en mode Unifié (Monolithe moderne)** : Un seul serveur Node.js hébergeant l'API Backend et le Frontend.
- **Soit en mode Distribué (Séparation physique stricte)** :
  - **Serveur 1 (Frontend SPA)** : Nginx / Apache / CDN S3 hébergeant uniquement l'interface React SPA (`dist/`).
  - **Serveur 2 (Backend API HES / MDMS)** : Serveur d'API Node.js (`server.ts`) hébergé dans le réseau interne / DMZ restreint (`https://api-hes.nigelec.ne`).

---

## 📐 2. SCHÉMA DE L'ARCHITECTURE SÉPARÉE

```
                           +-------------------------------------+
                           |      NAVIGATEUR CLIENT / USER       |
                           +------------------+------------------+
                                              |
                     +------------------------+------------------------+
                     | (1) Chargement HTML/JS | (2) Appels API REST    |
                     v                        v (HTTPS / CORS)         |
    +----------------------------------+   +----------------------------------+
    |       SERVEUR 1 : FRONTEND       |   |       SERVEUR 2 : BACKEND        |
    |      (Nginx / Static Web)        |   |   (Node.js / Express API HES)    |
    |   URL: https://hes.nigelec.ne    |   |  URL: https://api-hes.nigelec.ne |
    |   Contenu: Dossier /dist         |   |  Point Entrée: server.ts         |
    +----------------------------------+   +----------------+-----------------+
                                                            |
                                      +---------------------+---------------------+
                                      |                     |                     |
                                      v                     v                     v
                             +-----------------+   +-----------------+   +-----------------+
                             |  PostgreSQL /   |   |   Passerelle    |   |  Compteurs AMI  |
                             |   TimescaleDB   |   | Futurise Vending|   |   DLMS / STS    |
                             +-----------------+   +-----------------+   +-----------------+
```

---

## 🛠️ 3. DÉPLOIEMENT DU FRONTEND SEUL (SERVEUR 1)

### Étape 1 : Compilation du Frontend avec l'URL du Backend

Au moment du build du frontend, spécifier la variable d'environnement `VITE_API_URL` pointant vers le serveur backend :

```bash
# Exemple de build ciblant l'API distante de NIGELEC
VITE_API_URL=https://api-hes.nigelec.ne npm run build
```

Le dossier `dist/` généré contiendra l'application web statique pré-configurée pour contacter `https://api-hes.nigelec.ne`.

### Étape 2 : Configuration Nginx pour le Frontend (`/etc/nginx/sites-available/frontend.conf`)

```nginx
server {
    listen 80;
    server_name hes.nigelec.ne;

    root /var/www/rentec-ami-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip / Security Headers
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

---

## ⚡ 4. DÉPLOIEMENT DU BACKEND SEUL (SERVEUR 2)

Le serveur Backend n'a **pas besoin du dossier `dist/`** ni des fichiers source frontend (`src/`).

### Fichiers requis pour le Serveur Backend uniquement :

- `server.ts`
- `server/` (dossier des services backend, DB, tests)
- `services/` (passerelles microservices)
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `.env`
- `ami_smart_meter.db` (ou connexion PostgreSQL `DB_HOST=...`)

### Étape 1 : Installation et Démarrage du Backend

```bash
# On install les dépendances backend
npm install --production=false

# Lancement du serveur Backend API seul
PORT=3000 NODE_ENV=production npm run start:backend
```

### Étape 2 : Configuration Nginx Reverse Proxy / SSL pour le Backend (`/etc/nginx/sites-available/backend.conf`)

```nginx
server {
    listen 80;
    server_name api-hes.nigelec.ne;

    # Transmission des requêtes au process Node.js (server.ts)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔒 5. SÉCURITÉ ET CORS (Cross-Origin Resource Sharing)

Lorsque le Frontend (`https://hes.nigelec.ne`) et le Backend (`https://api-hes.nigelec.ne`) sont séparés sur deux domaines différents, le serveur backend `server.ts` gère automatiquement les en-têtes CORS nécessaires :

```typescript
// Déjà intégré dans server.ts
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
```

---

## 🧪 6. PROCÉDURE DE VERIFICATION SÉPARÉE

1. **Vérifier l'API Backend Seule** :
   ```bash
   curl https://api-hes.nigelec.ne/api/mdms/stats
   ```
   *(Doit retourner le JSON des statistiques HES)*

2. **Vérifier l'Interface Frontend Seule** :
   Ouvrir `https://hes.nigelec.ne` dans votre navigateur. L'interface se connectera de manière transparente à l'API `https://api-hes.nigelec.ne`.
