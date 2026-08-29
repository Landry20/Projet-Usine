# Guide de déploiement — GMAO Projet Usine

Ce guide couvre la mise en production avec **Neon** (PostgreSQL), **Vercel** (frontend) et un hébergeur Node.js pour l’API NestJS.

## Architecture cible

```
Navigateur → Vercel (React) → API NestJS (Railway/Render) → Neon (PostgreSQL)
```

> **Note importante** : Vercel héberge le frontend statique. L’API NestJS est un serveur Node.js long-running — elle se déploie sur **Railway** ou **Render** (gratuit ou peu coûteux), pas sur Vercel.

---

## Étape 1 — Base de données Neon (PostgreSQL)

Vous avez déjà un compte Neon. Pour ce projet :

1. Connectez-vous sur [console.neon.tech](https://console.neon.tech).
2. Cliquez **New Project** (ou réutilisez un projet existant).
3. Nom suggéré : `gmao-usine` — région proche de vos utilisateurs (ex. `eu-central-1`).
4. Une base `neondb` est créée par défaut. Renommez-la ou créez une branche `main` dédiée `gmao`.
5. Onglet **Connection Details** → copiez l’URL **Pooled connection** (recommandée pour le serverless) :

   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

6. Conservez cette URL — c’est votre `DATABASE_URL`.

### Initialiser le schéma et les données de démo

Depuis votre machine locale, dans `backend/.env` :

```env
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
DB_SSL=true
DB_SYNC=true
NODE_ENV=development
JWT_ACCESS_SECRET=<secret-long-aleatoire>
JWT_REFRESH_SECRET=<autre-secret-long>
FRONTEND_URL=https://votre-app.vercel.app
```

Puis :

```bash
cd backend
npm install
npm run seed
```

Le seed crée les tables (via TypeORM `synchronize`) et insère les comptes de démo.

> En production, passez `DB_SYNC=false` après la première initialisation et gérez les évolutions via migrations TypeORM.

---

## Étape 2 — API backend (Railway ou Render)

### Option A — Railway (recommandé)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Sélectionnez le dépôt `Projet-Usine`.
3. **Root Directory** : `backend`
4. **Build Command** : `npm install && npm run build`
5. **Start Command** : `npm run start:prod`
6. Variables d’environnement :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | URL Neon (pooled) |
   | `DB_SSL` | `true` |
   | `DB_SYNC` | `false` (après seed initial) |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (Railway injecte souvent `$PORT`) |
   | `FRONTEND_URL` | URL Vercel du frontend |
   | `JWT_ACCESS_SECRET` | Secret fort |
   | `JWT_REFRESH_SECRET` | Secret fort |
   | `APP_URL` | URL publique Railway de l’API |

7. Railway génère une URL publique, ex. `https://gmao-api-production.up.railway.app`.

8. Vérifiez : `https://votre-api.railway.app/v1/docs` (Swagger).

### Option B — Render

1. [render.com](https://render.com) → **New Web Service** → repo GitHub.
2. Root Directory : `backend`, Build : `npm install && npm run build`, Start : `npm run start:prod`.
3. Mêmes variables d’environnement que ci-dessus.

---

## Étape 3 — Frontend sur Vercel

Vous avez déjà déployé un projet sur Vercel. Pour **Projet Usine** :

1. [vercel.com/dashboard](https://vercel.com/dashboard) → **Add New Project**.
2. Importez le dépôt GitHub `Landry20/Projet-Usine` (ou le nom choisi).
3. Configuration :

   | Paramètre | Valeur |
   |---|---|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Variables d’environnement :

   | Variable | Valeur |
   |---|---|
   | `VITE_API_URL` | `https://votre-api.railway.app/v1` |

5. **Deploy**.

6. Retournez sur Railway/Render et mettez à jour `FRONTEND_URL` avec l’URL Vercel finale (ex. `https://projet-usine.vercel.app`).

### Déploiement automatique via GitHub Actions (optionnel)

Si vous préférez le CD via Actions plutôt que l’intégration native Vercel :

1. Vercel → **Settings → General** → copiez **Project ID** et **Org ID**.
2. Vercel → **Account Settings → Tokens** → créez un token.
3. GitHub → dépôt → **Settings → Secrets and variables → Actions** :

   | Secret | Contenu |
   |---|---|
   | `VERCEL_TOKEN` | Token Vercel |
   | `VERCEL_ORG_ID` | Org ID |
   | `VERCEL_PROJECT_ID` | Project ID |
   | `VITE_API_URL` | URL API `/v1` |

Le workflow `.github/workflows/cd-vercel.yml` déploiera à chaque push sur `main`.

---

## Étape 4 — Dépôt GitHub

Le dépôt est créé avec :

- **CI** (`.github/workflows/ci.yml`) : build backend + frontend à chaque push/PR.
- **CD Vercel** (`.github/workflows/cd-vercel.yml`) : déploiement frontend sur `main` (secrets requis).

---

## Étape 5 — Vérification finale

| Test | URL attendue |
|---|---|
| Frontend | `https://xxx.vercel.app` |
| API health | `https://xxx.railway.app/v1/docs` |
| Connexion | `admin@usine.ci` / `ChangeMoi@2026!` |

---

## Développement local (PostgreSQL)

```bash
# Démarrer Postgres
docker compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm run start:dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

- Interface : http://localhost:5173  
- API : http://localhost:4000/v1

---

## Checklist sécurité production

- [ ] `DB_SYNC=false` en production
- [ ] Secrets JWT uniques et longs (≥ 32 caractères)
- [ ] `FRONTEND_URL` limité au domaine Vercel (pas de wildcard)
- [ ] Changer les mots de passe de démo avant mise en service réelle
- [ ] Neon : activer la protection par mot de passe, limiter les IP si possible
