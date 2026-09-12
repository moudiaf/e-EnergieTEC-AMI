# 🎯 Guide de Déploiement & Stratégie de Soutenance NIGELEC
## Plateforme Souveraine e-EnergieTEC (RENTEC AMI v6.5)

Ce document détaille la marche à suivre pour déployer la plateforme **e-EnergieTEC v6.5 Souveraine** et réussir la démonstration technique devant les décideurs de la NIGELEC et de l'ARSE.

---

## 🌐 1. Déploiement Réseau & Démonstration

### Option A : Démonstration Locale Haute Résilience (Recommandé en Salle de Conseil)
Pour éliminer tout risque d'aléa réseau lors de la soutenance :
1. **Lancement des 3 Démons Souverains** sur le poste de démonstration :
   ```bash
   # Terminal 1 : KMS-HSM STS v2 (Port 5000)
   npx tsx services/kms-hsm/server.ts

   # Terminal 2 : Passerelle Tête de Réseau HES (Ports 4059 & 4060)
   npx tsx services/hes-gateway/server.ts

   # Terminal 3 : Serveur HES/MDMS, Watchdog SSE & Web UI (Port 3000)
   npx tsx server.ts
   ```
2. **Accès Local Sécurisé** : `http://localhost:3000`.
3. **Partage Écran ou Tunnel Sécurisé** : En cas de besoin de consultation sur smartphone de test, utiliser un tunnel HTTPS sécurisé (voir [`GUIDE_NGROK_DEMO.md`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/GUIDE_NGROK_DEMO.md)).

### Option B : Déploiement Serveur Linux / Cloud Souverain NIGELEC
* Consulter le [`GUIDE_DEPLOIEMENT_BACKEND_NIGELEC.md`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/GUIDE_DEPLOIEMENT_BACKEND_NIGELEC.md) pour l'installation Systemd ou Docker-Compose.

---

## 🎤 2. Stratégie de Soutenance devant la NIGELEC (Scénario 15 Minutes)

La présentation doit mettre en avant la **souveraineté nationale**, la **conformité normative** et la **garantie Zéro Donnée Fictive (Zero-Mock)**.

### Introduction (3 min) : La Vision Souveraine
- Présentez e-EnergieTEC comme l'instrument d'**indépendance énergétique et technologique** de la République du Niger.
- Rappelez l'alignement strict avec la norme **CEI 62055-41 (STS v2)** et le protocole **DLMS/COSEM (CEI 62056)**.

### Démonstration Live (8 min) : L'Épreuve du Réel
1. **Supervision SIG & Télérelève GPRS Point-à-Point (Compteur sous Charge)** :
   - Ouvrez la carte SIG de Niamey ou l'onglet Compteurs AMI.
   - Montrez les compteurs réels communicants : le monophasé `0128260224778` (sous charge) et le triphasé `0128260224786`.
   - Lancez la télérelève directe GPRS : mettez en avant l'interrogation point-à-point des objets COSEM via l'API HES (`POST /api/v1/obis-list/read`) **sans aucun calcul théorique**.
   - Montrez les valeurs ADC instantanées converties en direct : Tension `235.1 V` (OBIS `1.0.32.7.0.255`), Courant `1.636 A` (OBIS `1.0.31.7.0.255`), Puissance `296 W` (OBIS `1.0.15.7.0.255`), Énergie consommée `0.38 kWh` (OBIS `1.0.1.8.0.255`), et Solde restant décrémenté `50.02 kWh` (OBIS `0.0.19.40.0.255`).
   - Montrez la cohérence parfaite du bilan ($50.40 - 0.38 = 50.02\text{ kWh}$).
2. **Watchdog SSE en Direct** :
   - Démontrez le flux temps réel `/api/watchdog/stream`. Montrez la remontée instantanée d'alerte lors d'une rupture de liaison et le retour au statut `En Ligne`.
3. **Le Vrai Parcours du Jeton STS 20 Chiffres** :
   - Effectuez une vente au guichet pour `5 000 FCFA`.
   - Montrez la dérivation de clé matérielle sur le **KMS-HSM (Port 5000)** et la génération instantanée du token STS conforme (`XXXX-XXXX-XXXX-XXXX-XXXX`).
   - Montrez l'application automatique de la grille fiscale NIGELEC 2024 (TVA 19%, ORTN, Habitat, Prime fixe).
4. **Le Nouveau Module Décisionnel « Statistiques & Bilans »** :
   - Matrice quotidienne 31 jours (`1er` au `31e`).
   - Bascule en Matrice annuelle 12 mois (`Janvier` à `Décembre`) avec consolidation par zone.
   - Graphique double axe d'analyse temporelle avec calcul de ratio annuel **YoY %**.
5. **Génération du Rapport PDF Consolidé Ministériel** :
   - Cliquez sur **`[📄 Rapport Consolidé National (PDF)]`**.
   - Ouvrez le PDF officiel : bandeau tricolore national, arrêté de caisse et sceau numérique SHA-256 certifié KMS.

### Session Technique & Q/R (4 min) : Pourquoi cette solution est Qualifiée Tier-1 ?
- Présentez le [`RAPPORT_AUDIT_FINAL_NIGELEC.md`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/RAPPORT_AUDIT_FINAL_NIGELEC.md) et la matrice [`GAP_ANALYSIS_NIGELEC.md`](file:///c:/Users/SMLLTP/Desktop/e_Energietec_AMI3/ami-smart-meter-sts/GAP_ANALYSIS_NIGELEC.md).
- Expliquez le découpage étanche du Triple Démon (Port 3000, Port 5000, Ports 4059/4060).
- Confirmez la certification **Zéro-Mock** : chaque chiffre affiché découle d'une mesure ou d'un calcul réel en base de données.

---

## 💡 Conseils Pratiques pour le Jour J
- **Grand Écran ou Vidéoprojecteur 4K** : La cartographie SIG et les matrices de consommation offrent un rendu professionnel optimal.
- **Démarrage à Froid Préparé** : Les 3 démons doivent être vérifiés 15 minutes avant le début de la séance (`/health` sur le KMS et `/api/v1/vending2/health`).
- **Copies du Dossier d'Audit** : Avoir imprimé 2 exemplaires du rapport d'audit final certifié.

---
*Document certifié conforme pour la version souveraine v6.5 Enterprise.*
