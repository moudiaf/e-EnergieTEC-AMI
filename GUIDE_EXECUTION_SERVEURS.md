# 📘 GUIDE OPÉRATIONNEL D'EXÉCUTION DES SERVEURS AMI & STS
### e-EnergieTEC / NIGELEC — Head-End System, MDMS & Infrastructure Cryptographique

---

## 📑 1. Tableau Synoptique des Services & Ports

Le système AMI e-EnergieTEC repose sur une architecture de micro-services modulaires communicant via des protocoles réseau stricts (HTTP REST, WebSocket, TCP direct DLMS/COSEM).

| Service | Port(s) | Protocole | Fichier Source | Rôle Principal | Statut Initial |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **Serveur Principal API Express & Web** | **3000** | HTTP / WS | `server.ts` | Interface Web React SPA, API REST MDMS, Portail Marchand NIGELEC, Télé-recharge OTA, Watchdog GPRS 5-min | 🔴 ARRÊTÉ |
| **Moteur Cryptographique KMS-HSM STS** | **5000** | HTTP REST | `services/kms-hsm/server.ts` | Générateur binaire de jetons 20 chiffres (CEI 62055-41), gestion des clés maîtresses SGC / Vending Keys | 🔴 ARRÊTÉ |
| **Passerelle HES / DLMS Gateway** | **4059**<br>**4060** | TCP brut<br>HTTP REST | `services/hes-gateway/server.ts` | **Port 4059** : Collecteur TCP direct des trames HDLC/DLMS/COSEM<br>**Port 4060** : API de décodage OBIS & diagnostic | 🔴 ARRÊTÉ |

---

## 🛠️ 2. Prérequis d'Exécution

Avant de lancer les serveurs, assurez-vous d'avoir dans votre environnement :
1. **Node.js** : Version 18.x ou supérieure (`node -v`).
2. **TypeScript Runtime (`tsx`)** : Inclus dans les dépendances du projet (`npx tsx`).
3. **Répertoire courant** : Positionnez-vous à la racine du projet :
   ```powershell
   cd c:\Users\SMLLTP\Desktop\e_Energietec_AMI3\ami-smart-meter-sts
   ```

---

## 🚀 3. Méthode 1 : Démarrage Individuel dans des Terminaux Séparés (Recommandé pour Débogage)

Cette méthode permet d'observer les logs en temps réel de chaque service indépendamment.

### 🔷 Terminal 1 : Serveur Principal API Express & Interface Web (Port 3000)

1. Ouvrez un premier terminal PowerShell à la racine du projet.
2. Lancez la commande suivante :
   ```powershell
   npx tsx server.ts
   ```
   *Alternative via npm :*
   ```powershell
   npm run start:backend
   ```
3. **Logs attendus au démarrage :**
   ```text
   [SYS] Synchronisation de la base SQLite locale...
   [NIGELEC] Grille tarifaire synchronisée: 4 segments.
   Server running on http://localhost:3000
   [WATCHDOG-ONLINE] Automate de surveillance continue activé (intervalle: 300000ms).
   ```
4. **Accès :**
   - Interface Web (Dashboard, Compteurs, Portail Marchand) : **`http://localhost:3000`**
   - Documentation API Swagger : **`http://localhost:3000/api-docs`**

---

### 🔐 Terminal 2 : Moteur Cryptographique KMS-HSM STS (Port 5000)

1. Ouvrez un second terminal PowerShell à la racine du projet.
2. Lancez la commande suivante :
   ```powershell
   npx tsx services/kms-hsm/server.ts
   ```
3. **Logs attendus au démarrage :**
   ```text
   [KMS-HSM] Démarrage du Moteur Cryptographique STS CEI 62055-41...
   [KMS-HSM] Opérationnel et en écoute sur 0.0.0.0:5000
   ```
4. **Endpoints clés :**
   - Contrôle d'état : `GET http://localhost:5000/health`
   - Génération de jeton STS : `POST http://localhost:5000/api/kms/generate-token`

---

### 📡 Terminal 3 : Passerelle HES / DLMS Gateway (Ports 4059 & 4060)

1. Ouvrez un troisième terminal PowerShell à la racine du projet.
2. Lancez la commande suivante :
   ```powershell
   npx tsx services/hes-gateway/server.ts
   ```
3. **Logs attendus au démarrage :**
   ```text
   [HES-DLMS] Collecteur TCP sur le port 4059
   [HES-DLMS] API de décodage sur le port 4060
   ```
4. **Canaux réseau :**
   - **Port TCP 4059** : Écoute directe des connexions TCP entrantes des compteurs et concentrateurs DCU (trames HDLC/DLMS).
   - **Port HTTP 4060** : `GET http://localhost:4060/health` et `POST http://localhost:4060/api/hes/decode`.

---

## ⚡ 4. Méthode 2 : Démarrage Tout-en-Un (Script PowerShell Automatisé)

Pour lancer simultanément les trois serveurs dans 3 fenêtres PowerShell distinctes en une seule commande :

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🚀 Serveur Principal Express Web (Port 3000)...' -ForegroundColor Cyan; npx tsx server.ts"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🔐 Moteur Cryptographique KMS-HSM STS (Port 5000)...' -ForegroundColor Yellow; npx tsx services/kms-hsm/server.ts"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '📡 Passerelle HES DLMS Gateway (Ports 4059/4060)...' -ForegroundColor Green; npx tsx services/hes-gateway/server.ts"
```

---

## 🐳 5. Méthode 3 : Démarrage via Conteneurs Docker (Environnement Conteneurisé)

Si vous disposez de Docker Desktop actif, vous pouvez lancer les services via `docker-compose` :

```powershell
# Démarrer les 3 services essentiels
docker-compose up -d ami-backend kms-hsm-service he-system-gateway

# Vérifier l'état des conteneurs
docker-compose ps

# Suivre les journaux en direct
docker-compose logs -f ami-backend kms-hsm-service he-system-gateway
```

---

## 🔍 6. Procédure de Vérification & Tests de Bon Fonctionnement

Après le lancement, vous pouvez vérifier immédiatement l'état des ports et la réactivité de chaque service :

### A. Vérifier les ports en écoute (PowerShell)
```powershell
Get-NetTCPConnection -LocalPort 3000, 5000, 4059, 4060 -State Listen -ErrorAction SilentlyContinue | Format-Table LocalAddress, LocalPort, State, OwningProcess
```
*Si les ports apparaissent avec l'état `Listen`, tous les services sont opérationnels.*

### B. Tester l'API du Serveur Principal (Port 3000)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/meters" -Method Get | Select-Object -First 1
```

### C. Tester le Moteur KMS-HSM STS (Port 5000)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```
*Réponse attendue :*
```json
{
  "status": "HEALTHY",
  "kms": "ONLINE",
  "port": 5000,
  "standard": "IEC 62055-41"
}
```

### D. Tester la Passerelle HES / DLMS (Port 4060)
```powershell
Invoke-RestMethod -Uri "http://localhost:4060/health" -Method Get
```
*Réponse attendue :*
```json
{
  "status": "HEALTHY",
  "gateway": "ONLINE",
  "tcpPort": 4059,
  "apiPort": 4060,
  "standard": "IEC 62056 DLMS/COSEM"
}
```

---

## 🛑 7. Procédure d'Arrêt Propre des Serveurs (Graceful Shutdown)

### A. Arrêt Manuel
- Dans chaque terminal où un serveur est exécuté, appuyez sur :
  ```text
  CTRL + C
  ```
  puis confirmez avec `O` (ou `Y`) si le terminal demande une confirmation.

### B. Arrêt Automatisé / Libération des Ports (PowerShell)
Si un service reste actif en arrière-plan ou pour forcer la fermeture propre de tous les serveurs :

```powershell
# Arrêter tous les processus écoutant sur les ports 3000, 5000, 4059, 4060
$ports = @(3000, 5000, 4059, 4060)
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Port $p libéré (PID: $($_.OwningProcess))" -ForegroundColor Green
        }
    } else {
        Write-Host "ℹ️ Port $p déjà libre." -ForegroundColor Gray
    }
}
```

---

## ⚠️ 8. Dépannage des Erreurs Courantes (Troubleshooting)

| Symptôme | Cause Probable | Solution |
| :--- | :--- | :--- |
| `Error: listen EADDRINUSE: address already in use :::3000` | Une instance précédente tourne encore sur le port 3000. | Exécutez le script d'arrêt PowerShell ci-dessus pour libérer le port 3000, puis relancez. |
| `Error: listen EADDRINUSE :::5000` | Un autre service (ex. AirPlay ou processus Node orphelin) occupe le port 5000. | Exécutez `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`. |
| `Connection refused` sur le port 4059 | La passerelle HES DLMS n'a pas été démarrée dans son terminal. | Lancez `npx tsx services/hes-gateway/server.ts`. |
| Les jetons STS ne sont pas acceptés | Le compteur cible attend un Master Key (VK) ou un SGC spécifique. | Vérifiez le paramètre `SGC` (défaut : `600876`) et `KRN` (défaut : `2`) dans la console de télé-recharge. |
