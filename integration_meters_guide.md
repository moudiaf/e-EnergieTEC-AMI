# 📘 Guide d'Expert : Intégration de Nouveaux Compteurs (FUTURISE & Hexing)

Ce guide détaille la procédure technique pour intégrer des compteurs communicants de marques tierces comme **FUTURISE** ou **Hexing** dans l'écosystème **e-EnergieTEC v4.0**.

---

## 1. Architecture de Communication
Les compteurs FUTURISE et Hexing supportent généralement deux modes de connectivité :

### A. Connexion Via DCU (Concentrateur)
*   **Technologie** : PLC (Power Line Communication) ou RF (Radio Fréquence).
*   **Usage** : Zones denses (quartiers résidentiels).
*   **Intégration** : Le compteur est associé à un `dcuId` dans la plateforme. Le DCU agit comme passerelle IP.

### B. Connexion Directe (Point-to-Point)
*   **Technologie** : GPRS / NB-IoT / 4G.
*   **Usage** : Clients industriels ou zones rurales isolées.
*   **Intégration** : Le compteur possède sa propre adresse IP.

---

## 2. Configuration du Protocole (DLMS/COSEM)
La plateforme utilise le standard **IEC 62056 (DLMS/COSEM)**. Pour chaque nouveau modèle de compteur, les paramètres suivants doivent être renseignés :

| Paramètre | Valeur Typique (Hexing/Futurise) | Description |
| :--- | :--- | :--- |
| **Physical Address** | Dérivée du numéro de série | Adresse MAC/ID physique du compteur. |
| **Logical Address** | `1` (Public) ou `16` (Management) | Point d'accès aux données. |
| **Authentication** | HLS5 (GMAC) | Niveau de sécurité pour la lecture/écriture. |
| **OBIS Codes** | `1.0.1.8.0.255` (Énergie active +) | Identifiants des registres de données. |

---

## 3. Gestion du Prépaiement (Standard STS)
Pour que les jetons (Tokens) générés par **e-EnergieTEC** soient acceptés par les compteurs Hexing/Futurise, la configuration STS doit être alignée :

1.  **SGC (Supply Group Code)** : Code Nigelec (ex: `600XXX`).
2.  **KRN (Key Revision Number)** : Généralement `1` ou `2`.
3.  **Encrypted Algorithm** : STS Edition 2 (20 digits).
4.  **PAN (Product Alternative Number)** : Spécifique au fabricant.

---

## 4. Procédure de Provisionnement (MDMS)

Pour ajouter un lot de compteurs Hexing, utilisez l'API de la plateforme :

```bash
# Exemple d'appel API pour injecter un compteur Hexing
curl -X POST https://api.nigelec.ne/api/meters \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "HEX-2026-0001",
    "serialNumber": "860001234567",
    "supplier": "Hexing Electrical",
    "protocol": "DLMS/COSEM",
    "type": "domestic",
    "paymentMode": "prepaid",
    "lifecycleStatus": "in_stock",
    "warehouseLocation": "Magasin Central Niamey"
  }'
```

---

## 5. Mapping des Alarmes (Interopérabilité)
Les codes d'erreur varient selon les constructeurs. Voici le mapping recommandé :

| Event Code Hexing/Futurise | Alerte e-EnergieTEC | Gravité |
| :--- | :--- | :--- |
| **E-01** | Fraude (Ouverture Capot) | 🚨 Critique |
| **E-04** | Tension Faible | ⚠️ Warning |
| **E-25** | Relais de Coupure Bloqué | 🚨 Critique |
| **L-01** | Crédit Épuisé | ℹ️ Info |

---

## 6. Checklist de Validation Terrain
Avant le déploiement massif :
1.  **Test de Pinguabilité** : Vérifier que le serveur HES voit l'adresse IP/MAC.
2.  **Synchronisation Horloge** : Très important pour les profils de charge (Interval Data).
3.  **Test de Recharge** : Générer un Token de 1 kWh et vérifier l'acceptation sur le clavier (UIU/CIU).
4.  **Lecture Profil de Charge** : Vérifier que les 96 points de données (15 min) remontent correctement.

---
> [!TIP]
> **Conseil d'Expert** : Pour les compteurs **Futurise**, privilégiez la communication **RF-Mesh** si le réseau électrique est instable, car le PLC souffre souvent du bruit harmonique sur les lignes BT.
