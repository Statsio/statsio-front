<p align="center">
  <img src="public/brand/statsio-logo.svg" alt="Statsio" width="80" />
</p>

# Statsio Front

Frontend de **Statsio**, plateforme de data journalism qui centralise analyses, sources et signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.

Application **Nuxt 4** (Vue 3 + TypeScript), déployée sur **Cloudflare Workers**.

> Projet backend associé : [`statsio-api`](../statsio-api) (Laravel 12) — API consommée par cette application. Voir son [README](../statsio-api/README.md).

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Cloner le projet](#cloner-le-projet)
- [Démarrage rapide avec Docker (recommandé)](#démarrage-rapide-avec-docker-recommandé)
- [Installation manuelle (sans Docker)](#installation-manuelle-sans-docker)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture)
- [Commandes utiles](#commandes-utiles)
- [Tests](#tests)
- [Déploiement](#déploiement)

## Stack technique

| Composant | Choix |
|---|---|
| Framework | Nuxt 4 (`compatibilityVersion: 4`) + Vue 3 Composition API |
| Langage | TypeScript |
| Styling | Tailwind CSS v4 + tokens CSS custom + SCSS |
| State | Pinia (`@pinia/nuxt`) |
| Rendu | SSR hybride — pages publiques en SSR (SEO), Studio/admin en client-only (`ssr: false`) |
| Graphiques | Chart.js |
| Cartes | MapLibre GL |
| Éditeur riche | Tiptap (Studio) |
| Tests | Vitest |
| Linting | ESLint + Oxlint |
| Formatting | Prettier |
| Hébergement | Cloudflare Workers (preset Nitro `cloudflare_module`) |

## Prérequis

### Avec Docker (recommandé)

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose v2 (`docker compose`)

### Sans Docker (installation locale)

- Node.js `^20.19.0` ou `>=22.12.0` (voir `engines` dans [`package.json`](package.json))
- npm

L'API backend ([`statsio-api`](../statsio-api)) doit tourner (par défaut sur `http://localhost:8080`) pour que le frontend fonctionne pleinement.

## Cloner le projet

```bash
git clone git@github.com:Statsio/statsio-front.git
cd statsio-front
```

## Démarrage rapide avec Docker (recommandé)

```bash
cp .env.example .env.local   # à adapter si besoin
docker compose up -d --build
```

Le conteneur installe les dépendances (`npm install`) puis lance le serveur de dev Nuxt avec hot-reload (le dossier est monté en volume).

Accès : http://localhost:3000

Commandes courantes :

```bash
docker compose logs -f                 # logs en temps réel
docker compose restart nuxt-app        # après modif de .env.local
docker compose exec nuxt-app sh
docker compose exec nuxt-app npm run lint
docker compose exec nuxt-app npm run type-check
docker compose down
```

> Depuis la racine du monorepo, un `docker-compose.yml` orchestre front + API + PostgreSQL ensemble — voir [DOCKER_README.md](../DOCKER_README.md).

## Installation manuelle (sans Docker)

```bash
npm install
cp .env.example .env.local   # à adapter
npm run dev
```

L'application démarre sur http://localhost:3000.

## Variables d'environnement

Créer un `.env.local` à partir de [`.env.example`](.env.example) — préfixe `NUXT_PUBLIC_` obligatoire pour toute variable exposée au client :

| Variable | Rôle | Défaut |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | Base URL de l'API Statsio | `http://localhost:8080/api` |
| `NUXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID Google OAuth (doit matcher celui de l'API) | — |
| `NUXT_PUBLIC_APP_ENV` | Environnement logique (`development`/`production`) | `development` |
| `NUXT_PUBLIC_PASSWORD_MIDDLEWARE` | Mot de passe global optionnel (site en accès restreint) | vide = désactivé |
| `NUXT_PUBLIC_COMING_SOON` | Active la page "coming soon" | `false` |
| `NUXT_PUBLIC_COMING_SOON_BYPASS_CODE` | Code pour contourner la page "coming soon" | — |

Après toute modification de `.env.local` en Docker : `docker compose restart nuxt-app`.

## Architecture

```
app/
├── api/              # Services API (appels HTTP via axios)
├── assets/           # CSS tokens, images, icônes
├── components/       # Composants Vue (auto-importés)
│   ├── auth/ dashboard/ home/ layout/ login/
│   ├── polls/ statsdata/ studio/ tv/
│   └── ui/           # Composants UI réutilisables (AppButton, ...)
├── composables/      # Composables Vue (auto-importés)
├── layouts/          # default.vue, studio.vue, admin.vue
├── middleware/       # auth.ts, guest.ts, admin.ts
├── pages/            # Routing fichier-système Nuxt
├── plugins/          # 01.axios.ts, 02.fontawesome.ts, 03.auth-init.client.ts
├── services/         # Services métier
├── stores/           # Stores Pinia (auto-importés)
├── types/            # Types TypeScript
└── app.vue

public/brand/         # Assets de marque servis statiquement (/brand/*)
server/                # Handlers Nitro (dont le stub https-proxy-agent pour Workers)
```

L'alias `@/` pointe vers `app/` (configuré dans [`nuxt.config.ts`](nuxt.config.ts)).

### Modules métier

| Module | Rôle |
|---|---|
| Articles | Décryptages et analyses enrichies par les données |
| Sondages | Parcours et comparaison de vagues de sondages |
| StatsData | Exploration de datasets, comparaison d'indicateurs, pages personnalisées |
| Chaînes | Chaînes éditoriales et thématiques |
| TVStats | Tableaux de bord TV avec signaux d'audience |
| Studio | Éditeur drag & drop, protégé par authentification, client-only |

### Authentification

- Email/mot de passe et Google OAuth
- Tokens access + refresh, store [`app/stores/auth.ts`](app/stores/auth.ts)
- Guard [`app/middleware/auth.ts`](app/middleware/auth.ts) : redirection vers `/login` si non authentifié, avec mémorisation de la destination

## Commandes utiles

```bash
npm run dev             # serveur de dev (port 3000)
npm run build            # build de production SSR
npm run generate          # build statique (SSG)
npm run preview           # prévisualiser le build
npm run type-check        # vérification TypeScript (nuxt typecheck)
npm run lint               # oxlint + eslint (--fix)
npm run lint:ci             # lint en mode check (CI, sans --fix)
npm run format               # Prettier
```

## Tests

```bash
npm run test:unit
```

Tests unitaires avec Vitest (`@vue/test-utils`, `@pinia/testing`, `axios-mock-adapter`).

## Déploiement

Déploiement sur Cloudflare Workers via [`wrangler.toml`](wrangler.toml) (preset Nitro `cloudflare_module`) :

```bash
npm run deploy   # nuxt build && wrangler deploy
```

Un environnement `staging` est défini dans `wrangler.toml` (`wrangler deploy --env staging`).
