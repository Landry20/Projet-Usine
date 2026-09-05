# GMAO — Gestion de Maintenance Assistée par Ordinateur



Application multi-utilisateurs (Lot 1 / MVP) destinée à remplacer la base Access.



- **Frontend** : React 18 + TypeScript (interface française, design industriel)

- **Backend** : NestJS, API REST versionnée `/v1`

- **Base** : PostgreSQL 14+ (Neon en production, Docker en local)



Les règles métier (transitions d’OT, stock, numérotation, permissions, coûts) sont **uniquement côté serveur**.



## Démarrage local



1. Démarrer **PostgreSQL** :



```bash

docker compose up -d

```



2. Configurer `backend/.env` (copier depuis `.env.example`) :



```

DB_HOST=127.0.0.1

DB_PORT=5432

DB_USER=gmao

DB_PASSWORD=gmao_app_2026

DB_NAME=gmao

```



3. Installer et initialiser le backend :



```bash

cd backend

npm install

npm run seed

npm run start:dev

```



4. Installer et lancer le frontend :



```bash

cd frontend

npm install

npm run dev

```



- Interface : http://localhost:5173

- API : http://localhost:4000/v1

- Swagger : http://localhost:4000/v1/docs



## Comptes de démonstration



Mot de passe commun : `ChangeMoi@2026!`



| E-mail | Profil |

|---|---|

| admin@usine.ci | Administrateur |

| maintenance@usine.ci | Responsable maintenance |

| planning@usine.ci | Planificateur |

| technicien@usine.ci | Technicien (S011) |

| magasin@usine.ci | Magasinier |

| exploitation@usine.ci | Demandeur |

| direction@usine.ci | Direction |

| qhse@usine.ci | QHSE |



## Périmètre livré (Lot 1)



M1 référentiels · M2 parc · M3 demandes · M4 OT correctifs · M5 stock · M12 administration.



Lot 2 (préventif, planning, PWA hors ligne) et Lot 3 (KPI avancés, achats, QHSE) : structure prévue, non encore développés.



## Déploiement (Neon + Vercel)



Voir le guide complet : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)



- **Neon** : base PostgreSQL (`DATABASE_URL`)

- **Vercel** : un seul projet (frontend + `api/` → backend)



## Tables complémentaires (hors schéma Postgres CDC)



- Table `refresh_token` : nécessaire au JWT court + refresh (CDC 5.2 / 14).

- Colonnes `tentatives_echec` / `bloque_jusqu_a` sur `utilisateur` : anti brute-force.

- Table `sequence_numero` : compteur annuel RG-01.

