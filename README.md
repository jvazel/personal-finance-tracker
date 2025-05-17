# Documentation du Projet Personal Finance Tracker
## Aperçu du Projet
Personal Finance Tracker est une application web complète pour la gestion des finances personnelles. Elle permet aux utilisateurs de suivre leurs dépenses, revenus, et d'analyser leurs habitudes financières à travers des rapports détaillés et des visualisations.

## Structure du Projet
L'application est divisée en deux parties principales:

### Frontend
- Développé avec React.js
- Interface utilisateur intuitive avec des composants Material UI
- Visualisations de données avec Chart.js
- Support PWA (Progressive Web App) avec service worker
### Backend
- Serveur Node.js avec Express
- Base de données MongoDB avec Mongoose
- API RESTful pour la gestion des données
- Services d'analyse financière avancés
## Fonctionnalités Principales
### Gestion des Transactions
- Ajout, modification et suppression de transactions
- Catégorisation des dépenses et revenus
- Filtrage et recherche avancés
### Catégories Personnalisables
- Création et gestion de catégories personnalisées
- Attribution de couleurs pour une meilleure visualisation
- Suivi des dépenses par catégorie
### Rapports et Analyses
- Rapports détaillés sur les dépenses et revenus
- Comparaison entre différentes périodes
- Analyse des tendances financières
- Suivi des dépenses récurrentes
### Objectifs Financiers
- Définition d'objectifs d'épargne
- Suivi de la progression vers les objectifs
- Recommandations personnalisées
### Fonctionnalités Avancées
- Importation/exportation de données CSV
- Mode hors ligne avec synchronisation
- Interface responsive pour mobile et desktop
## Installation et Configuration
### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB
- npm ou yarn
### Installation du Backend
Créez un fichier .env dans le dossier backend avec les variables suivantes:

### Installation du Frontend
## Démarrage de l'Application
### Backend
Le serveur backend démarrera sur http://localhost:5000

### Frontend
L'application frontend sera accessible sur http://localhost:3000

## Technologies Utilisées
### Frontend
- React.js
- Material UI
- Chart.js
- Framer Motion pour les animations
- Axios pour les requêtes HTTP
### Backend
- Node.js
- Express
- MongoDB avec Mongoose
- JWT pour l'authentification
- Winston pour la journalisation
## Structure des API
L'application expose plusieurs endpoints API:

### Transactions
- GET /api/transactions - Récupérer toutes les transactions
- POST /api/transactions - Créer une nouvelle transaction
- GET /api/transactions/reports - Données pour les rapports
- GET /api/transactions/dashboard - Données pour le tableau de bord
### Catégories
- GET /api/categories - Récupérer toutes les catégories
- POST /api/categories - Créer une nouvelle catégorie
### Analyses Financières
- Services de comparaison entre périodes
- Analyse des tendances
- Suivi de la progression financière
## Contribution
Pour contribuer au projet:

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité ( git checkout -b feature/amazing-feature )
3. Committez vos changements ( git commit -m 'Add some amazing feature' )
4. Poussez vers la branche ( git push origin feature/amazing-feature )
5. Ouvrez une Pull Request
## Licence
Ce projet est sous licence ISC.
