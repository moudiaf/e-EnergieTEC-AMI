# Politique de Sécurité et Cryptographie STS
## Système e-EnergieTEC - NIGELEC

**Version:** 1.0
**Date:** Avril 2026

---

## 1. Contexte
Ce document définit les règles de sécurité, de gestion des accès (RBAC) et d'intégrité cryptographique applicables au système e-EnergieTEC. Étant donné le caractère financier critique des transactions STS (Standard Transfer Specification), une tolérance zéro est appliquée concernant la fraude interne et externe.

## 2. Gestion des Habilitations (RBAC - Role-Based Access Control)

Le système limite les actions en fonction du rôle attribué à chaque compte utilisateur. Le principe du *moindre privilège* s'applique.

*   **Administrateur Système (Super Admin) :** 
    *   Gestion de l'infrastructure, création des tarifs, gestion des utilisateurs, audit global.
    *   *Interdiction :* Ne peut pas encaisser d'argent ni générer de tokens gratuits.
*   **Superviseur / Ingénieur Centre de Contrôle :**
    *   Visualisation des bilans énergétiques, analyse des courbes de charge, levée des alertes de fraude, clôture des caisses.
*   **Vendeur / Opérateur Caisse :**
    *   Recherche de clients, encaissement de paiements, génération et impression de tokens STS.
    *   *Interdiction :* Ne peut pas modifier un compte client ni supprimer un historique.
*   **Technicien Réseau :**
    *   Consultation de la localisation des compteurs (GIS), gestion des tickets d'intervention, déclaration des remplacements de compteurs.

## 3. Sécurité Logique et Mots de Passe
*   **Complexité :** Tout mot de passe doit contenir au minimum 12 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux.
*   **Durée de vie de la session :** Le jeton de session (JWT) expire automatiquement au bout de **8 heures** d'inactivité ou à la fin du shift (quart) de travail.
*   **Désactivation :** Tout compte inactif pendant 30 jours est automatiquement suspendu.

## 4. Sécurité Cryptographique (Standard STS)

Le cœur financier du système repose sur la génération des codes STS de 20 chiffres.

### 4.1. Isolement de la fonction KMS (Key Management System)
*   La fonction de génération des tokens est découplée.
*   Les clés de chiffrement de distribution (Vending Keys - VK) sont stockées dans la base de données de manière fortement chiffrée.
*   *(Roadmap Phase 2)* : Intégration d'un module physique **HSM (Hardware Security Module)** conforme FIPS 140-2 Level 3 pour que les opérations de chiffrement STS se déroulent dans une puce inviolable.

### 4.2. Rotation des Clés (Key Rollover)
*   En conformité avec la STS Association (Base Date 2014 / 2024), le système gère les processus de **Key Revision Number (KRN)**.
*   Des tokens spéciaux de "Key Change" (2 x 20 chiffres) peuvent être générés depuis l'interface "Gestion STS" pour basculer un lot de compteurs sur une nouvelle clé de sécurité (KRN2).

## 5. Journalisation et Audit (Audit Trail)
La plateforme intègre un système d'Audit inaltérable.
*   **Enregistrement :** Toute action de modification, de génération de token ou d'accès aux données sensibles génère une entrée dans la table `audits`.
*   **Informations conservées :** Horodatage précis (Timestamp), Identifiant Utilisateur, Adresse IP, Action effectuée, Données avant/après (Payload).
*   **Non-répudiation :** Les journaux ne peuvent pas être supprimés ou modifiés depuis l'interface web, même par un Administrateur. Seul un accès base de données (DBA) permettrait une altération, ce qui est strictement contrôlé par les accès serveur.

## 6. Protection contre l'Exfiltration de Données
*   L'export massif de la base de données clients est bloqué pour les rôles standards.
*   Les exports Excel réglementaires sont limités et chaque export génère une alerte d'Audit.
