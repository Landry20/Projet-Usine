# Déploiement — un seul projet Vercel

```
Navigateur → https://projet-usine.vercel.app
                 ├─ /          → frontend (React)
                 └─ /v1/*      → api/[...path].js → backend NestJS → Neon
```

## Activer le déploiement automatique depuis GitHub

Le workflow `.github/workflows/cd-vercel.yml` déploie à chaque push sur `main`.

### 1. Récupérer les IDs Vercel

1. [vercel.com/account/tokens](https://vercel.com/account/tokens) → **Create** → copiez le token
2. Projet `projet-usine` → **Settings → General** :
   - **Project ID**
   - **Team / Org ID** (affiché près du Project ID)

### 2. Ajouter les secrets GitHub

Repo [Landry20/Projet-Usine](https://github.com/Landry20/Projet-Usine) → **Settings → Secrets and variables → Actions → New repository secret** :

| Secret | Valeur |
|---|---|
| `VERCEL_TOKEN` | token créé ci-dessus |
| `VERCEL_ORG_ID` | Org / Team ID |
| `VERCEL_PROJECT_ID` | Project ID |

### 3. Lancer

- Push sur `main`, ou
- Onglet **Actions** → **CD — Vercel** → **Run workflow**

### Alternative sans Actions

Vercel → projet → **Settings → Git** : connecter le repo, Root Directory = vide.  
Chaque push déploie aussi (en plus ou à la place des Actions).

## Variables d’environnement Vercel (même projet)

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Neon |
| `DB_SSL` | `true` |
| `DB_SYNC` | `false` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://projet-usine.vercel.app` |
| `JWT_ACCESS_SECRET` | secret fort |
| `JWT_REFRESH_SECRET` | autre secret fort |

Root Directory : vide (racine). Deployment Protection : **Off**.
