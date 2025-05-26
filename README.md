# Documentation du Projet Personal Finance Tracker
## Table des matières
1. Aperçu du Projet
2. Architecture
3. Technologies Utilisées
4. Structure du Projet
5. Fonctionnalités
6. API
7. Modèles de Données
8. Authentification et Sécurité
9. Installation et Configuration
10. Démarrage de l'Application
11. Contribution
## Aperçu du Projet
Personal Finance Tracker est une application web complète pour la gestion des finances personnelles. Elle permet aux utilisateurs de suivre leurs dépenses, revenus, et d'analyser leurs habitudes financières à travers des rapports détaillés et des visualisations. L'application offre une interface utilisateur intuitive et réactive, avec des fonctionnalités avancées d'analyse financière.

## Architecture
L'application est construite selon une architecture client-serveur moderne :

### Frontend
- Application React.js avec gestion d'état contextuel
- Chargement paresseux (lazy loading) des composants pour optimiser les performances
- Animations fluides avec Framer Motion
- Visualisations de données interactives avec Chart.js
- Support PWA (Progressive Web App) avec service worker
### Backend
- Serveur Node.js avec Express
- API RESTful pour la communication avec le frontend
- Base de données MongoDB avec Mongoose pour la modélisation des données
- Authentification JWT (JSON Web Token)
- Journalisation avancée avec Winston
## Technologies Utilisées
### Frontend
- React.js (v18.2.0) - Bibliothèque JavaScript pour construire l'interface utilisateur
- React Router (v6.20.1) - Gestion des routes côté client
- Material UI (v6.4.7) - Composants UI prêts à l'emploi
- Chart.js (v4.4.8) - Création de graphiques interactifs
- Framer Motion (v12.9.2) - Animations et transitions
- Axios (v1.8.4) - Client HTTP pour les requêtes API
- date-fns (v4.1.0) - Manipulation des dates
### Backend
- Node.js - Environnement d'exécution JavaScript côté serveur
- Express (v4.21.2) - Framework web pour Node.js
- MongoDB - Base de données NoSQL
- Mongoose (v8.12.1) - ODM (Object Data Modeling) pour MongoDB
- JWT (v9.0.2) - Authentification basée sur les tokens
- bcryptjs (v2.4.3) - Hachage des mots de passe
- Winston (v3.17.0) - Journalisation avancée
- Multer - Gestion des téléchargements de fichiers
## Structure du Projet
```
personal-finance-tracker/
├── backend/                  # Code du serveur
│   ├── controllers/         # Contrôleurs pour la logique métier
│   ├── middleware/          # Middleware (auth, validation, etc.)
│   ├── models/              # Modèles de données Mongoose
│   ├── routes/              # Définition des routes API
│   ├── services/            # Services métier
│   ├── utils/               # Utilitaires
│   └── server.js            # Point d'entrée du serveur
├── frontend/                # Code client 
React
│   ├── public/              # Fichiers 
statiques
│   └── src/                 # Code source React
│       ├── components/      # Composants React
│       ├── context/         # Contextes React pour la gestion d'état
│       ├── services/        # Services (API, etc.)
│       ├── styles/          # Fichiers CSS
│       ├── utils/           # Fonctions utilitaires
│       └── App.js           # Composant racine
└── package.json             # Configuration du projet racine
```
## Fonctionnalités
### Gestion des Transactions
- Ajout, modification et suppression de transactions
- Catégorisation des dépenses et revenus
- Filtrage et recherche avancés
- Affichage des transactions par mois
- Résumé financier mensuel (revenus, dépenses, solde)
### Catégories Personnalisables
- Création et gestion de catégories personnalisées
- Attribution de couleurs pour une meilleure visualisation
- Suivi des dépenses par catégorie
- Gestion des catégories fiscales (imposable, déductible)
### Tableau de Bord
- Vue d'ensemble des finances personnelles
- Graphique circulaire des dépenses par catégorie
- Tendances des revenus et dépenses
- Top des dépenses
- Limites de dépenses
### Rapports et Analyses
- Historique des transactions
- Rapport d'épargne
- Analyse des dépenses récurrentes
- Prédiction de flux de trésorerie
- Rapports détaillés sur les dépenses et revenus
### Analyse des Tendances
- Analyse des séries temporelles
- Comparaison entre périodes
- Carte de chaleur des dépenses
- Évolution des catégories
- Détection d'anomalies
- Analyse saisonnière
- Identification des fuites financières
### Objectifs Financiers
- Définition d'objectifs d'épargne
- Suivi de la progression vers les objectifs
- Jalons intermédiaires
- Calcul automatique du pourcentage de progression
### Gestion Fiscale
- Génération de rapports fiscaux
- Catégorisation des transactions pour les impôts
- Suivi des dépenses déductibles
- Soumission de rapports fiscaux
### Fonctionnalités Avancées
- Importation/exportation de données CSV
- Simulateur d'investissement
- Conseiller financier
- Interface responsive pour mobile et desktop
## API
L'application expose plusieurs endpoints API RESTful :

### Authentification
- POST /api/auth/register - Inscription d'un nouvel utilisateur
- POST /api/auth/login - Connexion utilisateur
- GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
### Transactions
- GET /api/transactions - Récupérer toutes les transactions (avec filtres de date)
- POST /api/transactions - Créer une nouvelle transaction
- PUT /api/transactions/:id - Mettre à jour une transaction
- DELETE /api/transactions/:id - Supprimer une transaction
- GET /api/transactions/dashboard - Données pour le tableau de bord
- GET /api/transactions/monthly-summary - Résumé financier mensuel
### Catégories
- GET /api/categories - Récupérer toutes les catégories
- POST /api/categories - Créer une nouvelle catégorie
- PUT /api/categories/:id - Mettre à jour une catégorie
- DELETE /api/categories/:id - Supprimer une catégorie
### Objectifs
- GET /api/goals/savings-goals - Récupérer les objectifs d'épargne
- POST /api/goals - Créer un nouvel objectif
- PUT /api/goals/:id - Mettre à jour un objectif
- DELETE /api/goals/:id - Supprimer un objectif
### Rapports et Analyses
- GET /api/reports - Récupérer les rapports disponibles
- GET /api/trends/time-series - Données de séries temporelles
- GET /api/trends/period-comparison - Comparaison entre périodes
- GET /api/trends/heatmap - Données pour la carte de chaleur
- GET /api/trends/category-evolution - Évolution des catégories
- GET /api/trends/anomalies - Détection d'anomalies
- GET /api/trends/seasonal-patterns - Patterns saisonniers
- GET /api/trends/financial-leakage - Fuites financières
### Fiscalité
- GET /api/tax/data/:year - Données fiscales pour une année
- POST /api/tax/report/:year - Générer un rapport fiscal
- GET /api/tax/reports - Liste des rapports fiscaux
- PUT /api/tax/reports/:id/submit - Soumettre un rapport fiscal
### Import/Export
- POST /api/import-export/import - Importer des données
- GET /api/import-export/export - Exporter des données
## Modèles de Données
### Utilisateur (User)
```
{
  username: String,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  createdAt: Date
}
```
### Transaction
```
{
  description: String,
  amount: Number,
  type: String (income/expense),
  category: ObjectId (ref: Category),
  date: Date,
  user: ObjectId (ref: User),
  note: String,
  goalId: ObjectId (ref: Goal)
}
```
### Catégorie (Category)
```
{
  name: String,
  type: String (income/expense/both),
  color: String (hex color),
  icon: String,
  user: ObjectId (ref: User),
  taxable: Boolean,
  taxDeductible: Boolean,
  taxCategory: String
}
```
### Objectif (Goal)
```
{
  title: String,
  description: String,
  type: String (savings/expense_limit),
  category: String,
  targetAmount: Number,
  currentAmount: Number,
  targetDate: Date,
  milestones: Array,
  user: ObjectId (ref: User),
  createdAt: Date,
  // Propriétés virtuelles
  remainingAmount: Number,
  progressPercentage: Number,
  isCompleted: Boolean,
  remainingDays: Number
}
```
## Authentification et Sécurité
L'application utilise JWT (JSON Web Token) pour l'authentification :

1. Inscription et Connexion : Les utilisateurs s'inscrivent avec un email et un mot de passe. Les mots de passe sont hachés avec bcryptjs avant d'être stockés.
2. Protection des Routes : Le middleware protect vérifie la validité du token JWT pour toutes les routes protégées.
3. Intercepteurs Axios : Le frontend utilise des intercepteurs pour ajouter automatiquement le token aux requêtes et gérer les erreurs d'authentification.
4. Gestion des Sessions : Les tokens sont stockés dans le localStorage et automatiquement supprimés en cas d'expiration.
## Installation et Configuration
### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB
- npm ou yarn
### Installation
1. Cloner le dépôt
```
git clone <url-du-repo>
cd personal-finance-tracker
```
2. Installer les dépendances
```
npm run install-all
```
3. Configuration du Backend Créez un fichier .env dans le dossier backend avec les variables suivantes :
```
MONGODB_URI=mongodb://localhost:27017/
finance-tracker
JWT_SECRET=votre_secret_jwt
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```
4. Configuration du Frontend Créez un fichier .env dans le dossier frontend avec les variables suivantes :
```
REACT_APP_API_URL=http://localhost:5000/api
```
## Démarrage de l'Application
### Mode Développement
```
npm run dev
```
Cette commande démarre simultanément le serveur backend ( http://localhost:5000 ) et l'application frontend ( http://localhost:3000 ).

### Production
```
npm run build
npm start
```
## Contribution
Pour contribuer au projet :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité ( git checkout -b feature/amazing-feature )
3. Committez vos changements ( git commit -m 'Add some amazing feature' )
4. Poussez vers la branche ( git push origin feature/amazing-feature )
5. Ouvrez une Pull Request
Ce projet est sous licence ISC.