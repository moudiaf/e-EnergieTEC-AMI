# Manuel Superviseur & Centre de Contrôle
## e-EnergieTEC - Outils d'Analyse NIGELEC

Destiné aux responsables d'exploitation, auditeurs internes et ingénieurs du centre de contrôle national NIGELEC.

---

## 1. Le Tableau de Bord Central (Dashboard)
Le Dashboard offre une vue macro-économique et technique du réseau en temps réel.
*   **KPIs Principaux :** Vérifiez le total des ventes (FCFA) du jour, l'énergie délivrée (kWh), et le taux de disponibilité des compteurs communicants.
*   **Profil de Charge :** Observez la courbe croisée entre l'énergie consommée (données MDMS) et l'énergie de production. Un écart visuel brutal signale un problème de réseau.

## 2. L'Analytique et le Bilan Énergétique
Accessible via la section **Analytique**, ce module est le cœur de la lutte anti-fraude non-technique (Pertes Commerciales).
*   **Bilan Énergétique (Par Région) :** Le tableau compare l'énergie injectée dans les transformateurs (Sous-stations) avec l'énergie facturée (totalisée via les compteurs intelligents). 
*   **Analyse des Pertes :** La colonne "Pertes (%)" calcule l'écart. Si une zone dépasse 12% ou 20%, elle passe en statut d'alerte Orange ou Rouge, nécessitant l'envoi d'équipes de contrôle sur le terrain.
*   **Tendance de Consommation :** Compare les ventes et les kWh des 30 derniers jours avec le mois précédent pour repérer des baisses anormales de consommation.

## 3. Le Module de Détection de Fraude par IA (Machine Learning)
Le système évalue en continu un "Score de Risque" (de 0 à 100%) pour chaque compteur.
*   Dans l'écran **Analytique**, consultez la liste des "Fraudes Subtiles".
*   Les compteurs avec un score > 80% sont marqués en **ROUGE (Critique)**.
*   **Cliquer sur "Audit" :** Ouvre un rapport détaillé listant les facteurs de risque : 
    *   Chute soudaine de la consommation comparée à l'historique.
    *   Différence entre l'énergie achetée et l'énergie mesurée (Bypass).
    *   Temps prolongé sans recharge (Dormant).

## 4. Gestion des Alertes Physiques (Tamper)
Si un compteur est ouvert de force, contourné, ou subit un fort champ magnétique, le Concentrateur (DCU) remonte une alarme critique (Danger).
1. Allez dans la section **Alertes**.
2. Identifiez l'alerte (Ex: "Ouverture de capot").
3. Envoyez une équipe technique (Création de Ticket).
4. **Levée d'Alarme (Clear Tamper) :** Une fois le compteur inspecté et réparé par le technicien, le superviseur peut cliquer sur **Levée**. Cela génère automatiquement un Token spécial (Clear Tamper Token) qui, une fois entré sur le compteur, rétablit le relais et rallume le courant.

## 5. Configuration et Grille Tarifaire
Seul un Superviseur ou Administrateur peut modifier la configuration commerciale.
1. Allez dans **Tarifs**.
2. Vous y trouvez la grille nationale (Social, Domestique, Commercial, EP, etc.).
3. **Important :** Toute modification du tarif de l'énergie, de la redevance fixe ou du taux de TVA impacte *immédiatement* les nouvelles ventes aux guichets et sur les plateformes mobiles. À utiliser avec la plus grande précaution.
