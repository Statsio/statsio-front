# Statsio Frontend - Documentation pour IA

## Vue d'ensemble du projet

Statsio est une plateforme de data journalism qui centralise analyses, sources et signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.

## Stack technique

- **Framework**: Vue 3 avec Composition API (script setup)
- **Build tool**: Vite 7
- **Langage**: TypeScript
- **Styling**: Tailwind CSS v4 + tokens CSS personnalisés + SCSS
- **State management**: Pinia
- **Routing**: Vue Router 5
- **Graphiques**: Chart.js
- **Tests**: Vitest
- **Linting**: ESLint + Oxlint
- **Formatting**: Prettier

## Architecture du projet

src/
├── api/              # Services API (appels HTTP)
├── assets/           # Ressources statiques (CSS tokens, images, icônes)
├── components/       # Composants Vue réutilisables
│   ├── auth/        # Composants d'authentification
│   ├── dashboard/   # Composants du tableau de bord
│   ├── home/        # Composants de la page d'accueil (voir AGENTS.md)
│   ├── layout/      # Composants de layout globaux (voir AGENTS.md)
│   ├── login/       # Composants de connexion
│   ├── polls/       # Composants de sondages
│   ├── statsdata/   # Composants StatsData
│   ├── studio-new/  # Composants du studio (en développement)
│   ├── tv/          # Composants TVStats
│   └── ui/          # Composants UI réutilisables (AppButton, etc.)
├── composables/      # Composables Vue (logique réutilisable)
├── data/            # Données statiques et configurations
├── layouts/         # Layouts de page (DefaultLayout, StudioLayout)
├── lib/             # Utilitaires et helpers
├── router/          # Configuration Vue Router
├── services/        # Services métier
├── stores/          # Stores Pinia
├── types/           # Types TypeScript
└── views/           # Vues/Pages de l'application

## Conventions de code

### Composants Vue

- Utiliser script setup avec TypeScript pour tous les composants
- Préférer les imports avec alias @/ pour les fichiers sous src/
- Nommer les composants globaux avec le préfixe App* (ex: AppButton.vue)
- Nommer les composants spécifiques à une fonctionnalité avec un préfixe approprié
- Garder les composants focalisés et composables

### Styling

- Réutiliser les tokens CSS existants dans src/assets/tokens.css
- Utiliser les variables CSS comme --color-primary, --color-secondary, --color-accent
- Réutiliser les helpers SCSS dans src/assets/theme.scss
- Préférer les utilitaires Tailwind existants avant d'ajouter du CSS personnalisé
- Maintenir la hiérarchie visuelle forte et orientée produit
- Assurer la responsivité mobile et desktop

### TypeScript

- Définir les types dans src/types/ pour les types partagés
- Utiliser des interfaces pour les objets de données
- Utiliser des types pour les unions et alias
- Éviter any, préférer unknown si nécessaire

### État et données

- Utiliser Pinia pour l'état global
- Créer des composables pour la logique réutilisable
- Garder les composants aussi présentationnels que possible

## Fonctionnalités principales

### Authentification
- Connexion email/password
- Authentification Google OAuth
- Gestion des tokens (access + refresh)
- Persistance locale ou session
- Store: src/stores/auth.ts

### Modules métier

1. **Articles**: Décryptages et analyses enrichies par les données
2. **Sondages**: Parcours et comparaison de vagues de sondages
3. **StatsData**: Exploration de datasets, comparaison d'indicateurs, pages personnalisées
4. **Chaînes**: Chaînes éditoriales et thématiques
5. **TVStats**: Tableaux de bord TV avec signaux d'audience
6. **Studio**: Interface d'édition drag & drop (en développement)

### Routing et guards

- Routes définies dans src/router/index.ts
- meta.requiresAuth: nécessite une session active
- meta.guestOnly: accessible uniquement aux non-connectés
- Redirection automatique vers /login si non authentifié
- Mémorisation de la destination pour redirection post-login

## API et services

### Configuration API

- Base URL configurée via variable d'environnement
- Endpoints définis dans src/api/statsio-endpoints.ts
- Services organisés par domaine métier dans src/services/

### Appels API

- Utiliser Axios pour les requêtes HTTP
- Intercepteurs pour l'authentification (token Bearer)
- Gestion centralisée des erreurs
- Types de réponse définis dans src/types/

## Accessibilité

- Préserver la navigation au clavier et les états de focus
- Ne pas supprimer la gestion du prefers-reduced-motion
- Les contrôles interactifs doivent avoir des labels clairs
- Maintenir une sémantique HTML appropriée

## Langue et contenu

- **Langue par défaut**: Français
- Préserver le contenu produit en français sauf demande explicite
- Garder les copies concises et orientées produit
- Les données de démo doivent rester cohérentes avec le positionnement Statsio

## Commandes

npm install              # Installation des dépendances
npm run dev             # Serveur de développement
npm run build           # Build de production
npm run type-check      # Vérification TypeScript
npm run test:unit       # Tests unitaires
npm run lint            # Linting (oxlint + eslint)
npm run format          # Formatage avec Prettier

## Variables d'environnement

Créer un fichier .env.local basé sur les besoins:

VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id

## Développement du Studio

Le studio est en cours de développement (voir plan_studio_claude.txt). Objectifs:

- Page protégée par authentification
- Header personnalisé avec logo, nom du contenu éditable, bouton enregistrer
- Sauvegarde automatique des modifications
- Sidebar pliable avec menus: Templates, Layouts, Blocks, Sources
- Canvas central avec drag & drop
- Blocks organisés par catégories (textes, tableaux, graphiques)
- Layouts pour organiser la mise en page (colonnes, grilles)

## Règles d'édition

- L'arbre de travail peut contenir des modifications utilisateur. Ne pas annuler les changements non liés.
- Lors de la modification d'un composant partagé, vérifier où il est utilisé avant de changer son API
- Pour le travail sur la homepage, lire aussi src/components/home/AGENTS.md
- Pour le travail sur la navigation/layout, lire aussi src/components/layout/AGENTS.md
- Préférer les petites modifications ciblées qui préservent la direction visuelle actuelle
- Éviter les layouts SaaS génériques, maintenir le style éditorial/média premium

## Principes de design

- **Hiérarchie visuelle forte**: Hero audacieux, cartes claires, KPIs visibles
- **Orientation produit**: Sentiment de produit data-média, pas de dashboard admin
- **Responsivité**: Vérifier les headers fixes, l'espacement des sections, le wrapping des CTA
- **Motion**: Supporter prefers-reduced-motion pour les animations
- **Cohérence**: Réutiliser les primitives UI existantes (badges, panels, labels mono, patterns CTA)

## Ressources importantes

- Design tokens: src/assets/tokens.css
- Helpers SCSS: src/assets/theme.scss
- Composant bouton principal: src/components/ui/AppButton.vue
- Store auth: src/stores/auth.ts
- Configuration router: src/router/index.ts
- Endpoints API: src/api/statsio-endpoints.ts

## Notes importantes

- Node.js version requise: ^20.19.0 || >=22.12.0
- Le projet utilise des imports avec alias @/ pointant vers src/
- Les composants doivent rester focalisés et composables
- Éviter d'ajouter de grandes quantités de logique inline dans les vues
- Créer un composable dédié ou un composant quand c'est plus clair
