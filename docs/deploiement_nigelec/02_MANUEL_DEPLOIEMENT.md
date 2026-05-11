# Manuel d'Installation et de Déploiement
## Système e-EnergieTEC - NIGELEC

**Version:** 1.0
**Date:** Avril 2026

---

## 1. Prérequis Système
Pour héberger le backend et la base de données en production, les serveurs de la NIGELEC doivent respecter les configurations minimales suivantes :

*   **Système d'Exploitation :** Linux Ubuntu 22.04 LTS ou CentOS 9 (Recommandé).
*   **Mémoire (RAM) :** 16 Go (Minimum) / 32 Go (Recommandé pour PostgreSQL+TimescaleDB).
*   **Processeur (CPU) :** 8 vCPU.
*   **Stockage :** 500 Go SSD (Extensible).
*   **Logiciels requis :** 
    *   Docker (v24+) & Docker Compose (v2+)
    *   Node.js (v20 LTS) - Uniquement si exécution hors Docker.
    *   Git

## 2. Configuration de l'Environnement

Avant de lancer l'application, les variables d'environnement doivent être configurées de manière sécurisée.

1.  Cloner le dépôt officiel sécurisé.
2.  Copier le fichier d'exemple pour créer la configuration de production :
    ```bash
    cp .env.example .env
    ```
3.  Éditer le fichier `.env` avec les valeurs de production de la NIGELEC :

```ini
# --- CONFIGURATION DE BASE ---
NODE_ENV=production
PORT=3000

# Clé secrète de chiffrement (A CHANGER IMPERATIVEMENT)
JWT_SECRET=CleUltraSecrete_NIGELEC_Production_2026!

# --- BASE DE DONNEES ---
DB_TYPE=postgres
# Format: postgres://utilisateur:motdepasse@hote:port/basededonnees
DATABASE_URL=postgres://nigelec_db_admin:MotDePasseFort@localhost:5432/ami_mdms_nigelec
```

## 3. Lancement de l'Infrastructure (Via Docker)

L'utilisation de Docker garantit un déploiement reproductible et isolé.

1.  Démarrer les conteneurs (Base de données, Backend, Frontend) en tâche de fond :
    ```bash
    docker-compose up -d
    ```
2.  Vérifier que tous les services sont en cours d'exécution :
    ```bash
    docker-compose ps
    ```
3.  Consulter les journaux (logs) en temps réel pour vérifier qu'aucune erreur n'est survenue :
    ```bash
    docker-compose logs -f e-energietec-backend
    ```

## 4. Initialisation et Migration de la Base de Données

Lors du tout premier déploiement, il est nécessaire de créer la structure des tables et d'insérer les données administratives par défaut.

1.  Lancer le script de migration depuis le conteneur backend :
    ```bash
    docker exec -it e-energietec-backend npm run db:migrate
    ```
2.  *Optionnel :* Injecter la grille tarifaire standard de la NIGELEC (si script disponible) :
    ```bash
    docker exec -it e-energietec-backend npm run db:seed-tariffs
    ```

## 5. Maintenance et Mises à jour
Pour mettre à jour le système vers une nouvelle version sans interruption de service majeure :
```bash
# Récupération du nouveau code
git pull origin main

# Reconstruction des images
docker-compose build

# Redémarrage (Downtime de quelques secondes)
docker-compose up -d
```

## 6. Vérification Post-Déploiement
*   **Interface Web :** Accéder à `https://portail-ami.nigelec.ne` depuis un navigateur.
*   **Connexion :** Tester la connexion avec le compte Super Administrateur (`admin` / `admin`). **NB : Ce mot de passe doit être changé dès la première connexion.**
*   **API :** Exécuter une requête `GET` sur l'endpoint de santé : `https://api-ami.nigelec.ne/health` (Le serveur doit retourner `Status: OK`).
