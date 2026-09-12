# 🎨 e-EnergieTEC - Frontend Web & PWA (React 19 + Vite)

Ce dossier contient l'interface utilisateur web et mobile (PWA) de la plateforme **e-EnergieTEC**.

## 🛠️ Stack Technique Frontend
- **Framework** : React 19 & Vite
- **Design & Styles** : Tailwind CSS v4, Glassmorphism, OLED Dark Mode
- **Cartographie SIG** : Leaflet & MapLibre GL avec switch multi-providers (Esri Satellite HD, CARTO Dark, OpenStreetMap, Terrain)
- **Visualisation & Graphiques** : Recharts & Framer Motion
- **Génération Reçus & PDF** : jsPDF + autoTable

---

## 🚀 Démarrage & Commandes du Frontend

```bash
# 1. Installation des dépendances
npm install

# 2. Lancement en mode développement (Port 3000 avec proxy API vers http://localhost:5000)
npm run dev

# 3. Compilation pour la production (Génère le dossier dist/)
npm run build
```

L'interface est accessible par défaut sur : **http://localhost:3000**
Toutes les requêtes vers `/api/...` sont automatiquement redirigées vers le serveur backend (`http://localhost:5000`).
