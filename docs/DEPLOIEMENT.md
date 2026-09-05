# Déploiement — un seul projet Vercel

```
Navigateur → https://projet-usine.vercel.app
                 ├─ /          → frontend (React)
                 └─ /v1/*      → api/[...path].js → backend NestJS → Neon
```

## Configuration Vercel (projet existant)

1. **Root Directory** : vide / `.` (racine du repo, pas `frontend`)
2. **Framework** : Other
3. Les commandes viennent de `vercel.json` à la racine

### Variables d’environnement (même projet)

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Neon |
| `DB_SSL` | `true` |
| `DB_SYNC` | `false` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://projet-usine.vercel.app` |
| `JWT_ACCESS_SECRET` | secret fort |
| `JWT_REFRESH_SECRET` | autre secret fort |

Pas de `VITE_API_URL` : le frontend appelle `/v1` sur le même domaine.

### Protection

Settings → Deployment Protection → **Off** (sinon l’API est bloquée).

## Local

```bash
docker compose up -d
cd backend && npm run seed && npm run start:dev
cd frontend && npm run dev
```
