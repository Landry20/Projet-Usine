# Cahier des charges V2 — Application d’usine

Référence : `Dossier_Architecture_Application_Usine_V2.pdf` + `annexe_schema_postgresql.sql`.

Une seule application. Quatre domaines métier + le pilotage direction, un référentiel commun.

```
APPLICATION USINE
        │
        ├── PRODUCTION          (demande MP, journal de quart, bilan matière)
        ├── PRODUIT FINI        (tanks, jaugeage, expéditions, empotage)
        ├── LABORATOIRE         (échantillons, bulletins, non-conformités)
        ├── MAINTENANCE         (DI, OT, pièces, préventif)
        └── DIRECTION           (vue consolidée)
                │
         RÉFÉRENTIEL : utilisateurs, sites, machines
         MOTEUR : validation / signature (séparation des tâches)
```

## Circulation qui fait la valeur

- Arrêt machine déclaré en production → DI maintenance (durée ≥ seuil).
- Sortie PF du journal de quart → entrée tank.
- Bulletin d’analyse obligatoire avant clôture d’expédition.
- Depuis un n° de conteneur / flexitank : tank, lots de production, analyses, documents signés.

## Production

Équation : entrées = PF + sous-produits + écart. L’écart n’est pas une variable d’ajustement.

Seuils paramétrables : 1 % alerte, 3 % blocage. Rapport de quart verrouillé après approbation.

## Produit fini

Volume (litres) et masse (kg) coexistent. La pesée pont bascule fait foi commercialement.

## Laboratoire

Paramètres d’analyse = données, pas du code. Conformité calculée contre la spécification en vigueur.

## Rôles V2

ADMIN / DIRECTION / CHEF_USINE / DIRECTION_GENERALE : tous les compartiments.

CHEF_QUART, MAGASIN_MP, RESP_PROD : production.

RESP_LABO, TECH_LABO : laboratoire.

AGENT_EXPEDITION, RESP_PF : produit fini.

QUALITE : production + PF + laboratoire.
