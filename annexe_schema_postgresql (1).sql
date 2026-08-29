-- =====================================================================
--  GMAO - SCHEMA DE BASE DE DONNEES CIBLE (PostgreSQL 14+)
--  Projet   : Application de Gestion de la Maintenance Assistee par Ordinateur
--  Origine  : Migration / refonte de BASE_DE_DONNEE_DE_GESTION_DE_LA_MAINTENANCE.accdb
--  Auteur   : Jean Louis N'DRI - QHSE & Planning
--  Version  : 1.0
--  Devise   : FCFA (XOF) - Fuseau : Africa/Abidjan (UTC+0)
--  NOTE DEV : script de reference. A adapter si un ORM (Prisma, Eloquent,
--             TypeORM, Django) genere les migrations.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================================
-- 0. TYPES ENUMERES (referentiels fermes)
-- =====================================================================
CREATE TYPE type_maintenance   AS ENUM ('PREVENTIF','CORRECTIF','REGLEMENTAIRE','AMELIORATIF','PREDICTIF');
CREATE TYPE statut_ot          AS ENUM ('BROUILLON','PLANIFIE','EN_COURS','EN_ATTENTE','REALISE','CLOTURE','ANNULE');
CREATE TYPE priorite_ot        AS ENUM ('P1_URGENT','P2_HAUTE','P3_NORMALE','P4_BASSE');
CREATE TYPE origine_ot         AS ENUM ('DEMANDE','PLAN_PREVENTIF','CREATION_DIRECTE','RONDE');
CREATE TYPE statut_di          AS ENUM ('NOUVELLE','VALIDEE','REJETEE','CONVERTIE');
CREATE TYPE criticite_equip    AS ENUM ('A','B','C');
CREATE TYPE statut_equip       AS ENUM ('EN_SERVICE','A_L_ARRET','EN_PANNE','EN_REPARATION','REFORME');
CREATE TYPE type_mouvement     AS ENUM ('ENTREE','SORTIE','RETOUR','AJUSTEMENT','INVENTAIRE');
CREATE TYPE type_periodicite   AS ENUM ('JOUR','SEMAINE','MOIS','ANNEE','HEURE_FONCTIONNEMENT','KILOMETRE','CYCLE');
CREATE TYPE statut_commande    AS ENUM ('BROUILLON','ENVOYEE','PARTIELLEMENT_RECUE','RECUE','ANNULEE');

-- =====================================================================
-- 1. SOCLE : SECURITE, UTILISATEURS, SITES
-- =====================================================================
CREATE TABLE role (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(30)  NOT NULL UNIQUE,   -- ADMIN, RESP_MAINT, PLANIF, TECH, MAGASIN, DEMANDEUR, DIRECTION, QHSE
    libelle         VARCHAR(80)  NOT NULL,
    description     TEXT
);

CREATE TABLE permission (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(60) NOT NULL UNIQUE,    -- ex: ot.creer, ot.cloturer, stock.sortir, param.gerer
    module          VARCHAR(40) NOT NULL,
    libelle         VARCHAR(120) NOT NULL
);

CREATE TABLE role_permission (
    role_id         INT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id   INT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE utilisateur (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(120) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255) NOT NULL,          -- hash Argon2id ou bcrypt cost>=12
    nom             VARCHAR(80)  NOT NULL,
    prenom          VARCHAR(80),
    telephone       VARCHAR(30),
    role_id         INT NOT NULL REFERENCES role(id),
    site_id         INT,                            -- FK ajoutee plus bas
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_actif       BOOLEAN NOT NULL DEFAULT FALSE,
    derniere_connexion TIMESTAMPTZ,
    doit_changer_mdp   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ                     -- suppression logique (RG-12)
);

CREATE TABLE site (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,    -- ex: ABJ, BSM, OUM
    libelle         VARCHAR(120) NOT NULL,
    client          VARCHAR(120),                   -- TotalEnergies, OLA Energy, ELTON, PETROCI...
    adresse         TEXT,
    ville           VARCHAR(80),
    pays            VARCHAR(60) DEFAULT 'Cote d''Ivoire',
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),
    actif           BOOLEAN NOT NULL DEFAULT TRUE
);
ALTER TABLE utilisateur ADD CONSTRAINT fk_user_site FOREIGN KEY (site_id) REFERENCES site(id);

CREATE TABLE localisation (
    id              SERIAL PRIMARY KEY,
    site_id         INT NOT NULL REFERENCES site(id),
    parent_id       INT REFERENCES localisation(id),
    code            VARCHAR(30) NOT NULL,
    libelle         VARCHAR(120) NOT NULL,
    niveau          SMALLINT DEFAULT 1,             -- 1=zone, 2=atelier, 3=ligne, 4=poste
    UNIQUE (site_id, code)
);

-- =====================================================================
-- 2. RESSOURCES HUMAINES TECHNIQUES
-- =====================================================================
CREATE TABLE specialite (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,    -- MEC, ELEC, SOUD, HYD, INSTR, FROID
    libelle         VARCHAR(80) NOT NULL
);

CREATE TABLE technicien (
    id              SERIAL PRIMARY KEY,
    matricule       VARCHAR(20)  NOT NULL UNIQUE,   -- reprise Access : S010, S011...
    nom_prenom      VARCHAR(150) NOT NULL,
    specialite_id   INT REFERENCES specialite(id),
    responsable_id  INT REFERENCES technicien(id),  -- hierarchie interne
    utilisateur_id  INT REFERENCES utilisateur(id), -- compte de connexion (optionnel)
    site_id         INT REFERENCES site(id),
    statut          VARCHAR(20) NOT NULL DEFAULT 'ACTIF',  -- ACTIF, CONGE, INACTIF, SORTI
    cout_horaire    NUMERIC(12,2) DEFAULT 0,        -- FCFA / heure (valorisation MO)
    telephone       VARCHAR(30),
    date_embauche   DATE,
    habilitations   TEXT,                           -- electrique BR/B2V, travail en hauteur, ATEX...
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_tech_specialite ON technicien(specialite_id);

-- =====================================================================
-- 3. ACTIFS / PARC EQUIPEMENT
-- =====================================================================
CREATE TABLE famille_equipement (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,    -- POM, COM, GRP, VEH, LEV, ELEC
    libelle         VARCHAR(120) NOT NULL
);

CREATE TABLE equipement (
    id                  SERIAL PRIMARY KEY,
    code_equipement     VARCHAR(30)  NOT NULL UNIQUE,  -- RG-02 : SITE-FAM-NNN
    designation         VARCHAR(200) NOT NULL,
    famille_id          INT REFERENCES famille_equipement(id),
    parent_id           INT REFERENCES equipement(id), -- arborescence sous-ensembles
    localisation_id     INT REFERENCES localisation(id),
    marque              VARCHAR(80),
    modele              VARCHAR(80),
    numero_serie        VARCHAR(80),
    fournisseur_id      INT,                           -- FK ajoutee plus bas
    date_mise_service   DATE,
    valeur_acquisition  NUMERIC(14,2),                 -- FCFA
    fin_garantie        DATE,
    criticite           criticite_equip NOT NULL DEFAULT 'C',
    statut              statut_equip    NOT NULL DEFAULT 'EN_SERVICE',
    unite_compteur      VARCHAR(20),                   -- h, km, cycles
    compteur_actuel     NUMERIC(14,2) DEFAULT 0,
    qr_code             VARCHAR(60) UNIQUE,            -- etiquette terrain
    photo_url           TEXT,
    caracteristiques    JSONB,                         -- puissance, debit, tension... (souple)
    observations        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_equip_localisation ON equipement(localisation_id);
CREATE INDEX idx_equip_statut       ON equipement(statut);
CREATE INDEX idx_equip_criticite    ON equipement(criticite);

CREATE TABLE compteur_releve (
    id              SERIAL PRIMARY KEY,
    equipement_id   INT NOT NULL REFERENCES equipement(id) ON DELETE CASCADE,
    date_releve     DATE NOT NULL,
    valeur          NUMERIC(14,2) NOT NULL,
    unite           VARCHAR(20),
    releve_par      INT REFERENCES utilisateur(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (equipement_id, date_releve)
);

-- =====================================================================
-- 4. STOCK, ARTICLES, FOURNISSEURS
-- =====================================================================
CREATE TABLE fournisseur (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    raison_sociale  VARCHAR(150) NOT NULL,
    contact         VARCHAR(120),
    telephone       VARCHAR(30),
    email           VARCHAR(120),
    adresse         TEXT,
    delai_livraison_jours SMALLINT DEFAULT 0,
    note_evaluation SMALLINT CHECK (note_evaluation BETWEEN 1 AND 5),
    actif           BOOLEAN NOT NULL DEFAULT TRUE
);
ALTER TABLE equipement ADD CONSTRAINT fk_equip_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES fournisseur(id);

CREATE TABLE categorie_article (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    libelle         VARCHAR(120) NOT NULL
);

CREATE TABLE article (
    id                     SERIAL PRIMARY KEY,
    ref_article            VARCHAR(40)  NOT NULL UNIQUE,  -- corrige "Ref_Acticle" de l'Access
    designation            VARCHAR(200) NOT NULL,
    categorie_id           INT REFERENCES categorie_article(id),
    marque                 VARCHAR(80),
    unite                  VARCHAR(20) NOT NULL DEFAULT 'U',  -- U, L, kg, m
    quantite_stock         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantite_stock >= 0),
    seuil_reappro          NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_max              NUMERIC(12,2),
    prix_unitaire_moyen    NUMERIC(14,2) NOT NULL DEFAULT 0,  -- PUMP recalcule a chaque entree
    emplacement_magasin    VARCHAR(40),                       -- allee/rayon/casier
    fournisseur_principal_id INT REFERENCES fournisseur(id),
    delai_appro_jours      SMALLINT DEFAULT 0,
    garantie               VARCHAR(60),
    piece_critique         BOOLEAN NOT NULL DEFAULT FALSE,
    actif                  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ
);
CREATE INDEX idx_article_designation ON article USING gin (to_tsvector('french', designation));

-- Nomenclature : quelles pieces vont sur quel equipement
CREATE TABLE equipement_article (
    equipement_id   INT NOT NULL REFERENCES equipement(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    quantite_montee NUMERIC(10,2) DEFAULT 1,
    PRIMARY KEY (equipement_id, article_id)
);

CREATE TABLE mouvement_stock (
    id              BIGSERIAL PRIMARY KEY,
    article_id      INT NOT NULL REFERENCES article(id),
    type_mvt        type_mouvement NOT NULL,
    quantite        NUMERIC(12,2)  NOT NULL CHECK (quantite > 0),
    prix_unitaire   NUMERIC(14,2)  NOT NULL DEFAULT 0,
    montant         NUMERIC(16,2)  GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    date_mvt        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    ot_id           INT,                                   -- FK ajoutee plus bas
    commande_id     INT,
    bon_reference   VARCHAR(40),
    motif           TEXT,
    stock_avant     NUMERIC(12,2),
    stock_apres     NUMERIC(12,2),
    utilisateur_id  INT REFERENCES utilisateur(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mvt_article_date ON mouvement_stock(article_id, date_mvt DESC);

CREATE TABLE commande_achat (
    id                  SERIAL PRIMARY KEY,
    numero              VARCHAR(30) NOT NULL UNIQUE,   -- BC-2026-00001
    fournisseur_id      INT NOT NULL REFERENCES fournisseur(id),
    date_commande       DATE NOT NULL DEFAULT CURRENT_DATE,
    date_livraison_prevue DATE,
    statut              statut_commande NOT NULL DEFAULT 'BROUILLON',
    montant_total       NUMERIC(16,2) DEFAULT 0,
    demandeur_id        INT REFERENCES utilisateur(id),
    valide_par          INT REFERENCES utilisateur(id),
    date_validation     TIMESTAMPTZ,
    observations        TEXT
);

CREATE TABLE commande_ligne (
    id              SERIAL PRIMARY KEY,
    commande_id     INT NOT NULL REFERENCES commande_achat(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES article(id),
    quantite_cmd    NUMERIC(12,2) NOT NULL CHECK (quantite_cmd > 0),
    quantite_recue  NUMERIC(12,2) NOT NULL DEFAULT 0,
    prix_unitaire   NUMERIC(14,2) NOT NULL DEFAULT 0
);
ALTER TABLE mouvement_stock ADD CONSTRAINT fk_mvt_commande FOREIGN KEY (commande_id) REFERENCES commande_achat(id);

-- =====================================================================
-- 5. MAINTENANCE PREVENTIVE : GAMMES ET PLANS
-- =====================================================================
CREATE TABLE gamme_maintenance (
    id                    SERIAL PRIMARY KEY,
    code                  VARCHAR(30) NOT NULL UNIQUE,   -- GAM-POM-001
    libelle               VARCHAR(200) NOT NULL,
    type                  type_maintenance NOT NULL DEFAULT 'PREVENTIF',
    famille_id            INT REFERENCES famille_equipement(id),
    specialite_id         INT REFERENCES specialite(id),
    duree_estimee_h       NUMERIC(6,2) DEFAULT 1,
    nb_intervenants       SMALLINT DEFAULT 1,
    arret_requis          BOOLEAN NOT NULL DEFAULT FALSE,
    -- Volet QHSE (differenciant)
    epi_requis            TEXT,          -- casque, gants nitrile, harnais...
    risques_identifies    TEXT,          -- lien avec l'analyse de risque / JSA
    consignation_requise  BOOLEAN NOT NULL DEFAULT FALSE,  -- LOTO
    permis_travail_requis BOOLEAN NOT NULL DEFAULT FALSE,  -- point chaud, espace confine...
    mode_operatoire_url   TEXT,
    actif                 BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE gamme_operation (
    id              SERIAL PRIMARY KEY,
    gamme_id        INT NOT NULL REFERENCES gamme_maintenance(id) ON DELETE CASCADE,
    ordre           SMALLINT NOT NULL,
    libelle         VARCHAR(200) NOT NULL,
    instruction     TEXT,
    type_controle   VARCHAR(20) DEFAULT 'VISUEL',  -- VISUEL, MESURE, REMPLACEMENT, TEST
    valeur_min      NUMERIC(12,3),
    valeur_max      NUMERIC(12,3),
    unite           VARCHAR(20),
    obligatoire     BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (gamme_id, ordre)
);

CREATE TABLE gamme_piece (
    gamme_id        INT NOT NULL REFERENCES gamme_maintenance(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES article(id),
    quantite_prevue NUMERIC(10,2) NOT NULL DEFAULT 1,
    PRIMARY KEY (gamme_id, article_id)
);

CREATE TABLE plan_maintenance (
    id                   SERIAL PRIMARY KEY,
    equipement_id        INT NOT NULL REFERENCES equipement(id) ON DELETE CASCADE,
    gamme_id             INT NOT NULL REFERENCES gamme_maintenance(id),
    periodicite_type     type_periodicite NOT NULL,
    periodicite_valeur   INT NOT NULL CHECK (periodicite_valeur > 0),
    seuil_compteur       NUMERIC(14,2),          -- si declenchement par compteur
    alerte_avant_jours   SMALLINT NOT NULL DEFAULT 7,
    date_derniere_execution DATE,
    date_prochaine_echeance DATE,
    reglementaire        BOOLEAN NOT NULL DEFAULT FALSE,  -- controle obligatoire (levage, elec, incendie)
    reference_reglementaire VARCHAR(120),
    actif                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (equipement_id, gamme_id)
);
CREATE INDEX idx_plan_echeance ON plan_maintenance(date_prochaine_echeance) WHERE actif;

-- =====================================================================
-- 6. FLUX D'INTERVENTION : DI ET ORDRES DE TRAVAIL
-- =====================================================================
CREATE TABLE demande_intervention (
    id              SERIAL PRIMARY KEY,
    numero          VARCHAR(30) NOT NULL UNIQUE,       -- DI-2026-00001
    equipement_id   INT NOT NULL REFERENCES equipement(id),
    demandeur_id    INT NOT NULL REFERENCES utilisateur(id),
    date_demande    TIMESTAMPTZ NOT NULL DEFAULT now(),
    description     TEXT NOT NULL,
    urgence         priorite_ot NOT NULL DEFAULT 'P3_NORMALE',
    arret_production BOOLEAN NOT NULL DEFAULT FALSE,
    statut          statut_di NOT NULL DEFAULT 'NOUVELLE',
    ot_id           INT,                               -- FK ajoutee plus bas
    motif_rejet     TEXT,
    traite_par      INT REFERENCES utilisateur(id),
    date_traitement TIMESTAMPTZ
);

CREATE TABLE cause_defaillance (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    libelle         VARCHAR(150) NOT NULL,
    categorie       VARCHAR(60)   -- 5M : Matiere, Materiel, Methode, Main d'oeuvre, Milieu
);

CREATE TABLE ordre_travail (
    id                    SERIAL PRIMARY KEY,
    numero                VARCHAR(30) NOT NULL UNIQUE,     -- OT-2026-00001 (RG-01)
    equipement_id         INT NOT NULL REFERENCES equipement(id),
    type_maintenance      type_maintenance NOT NULL,
    origine               origine_ot NOT NULL DEFAULT 'CREATION_DIRECTE',
    plan_id               INT REFERENCES plan_maintenance(id),
    gamme_id              INT REFERENCES gamme_maintenance(id),
    demande_id            INT REFERENCES demande_intervention(id),
    priorite              priorite_ot NOT NULL DEFAULT 'P3_NORMALE',
    statut                statut_ot   NOT NULL DEFAULT 'BROUILLON',
    description_demandee  TEXT,
    -- Planification
    date_creation         TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_planifiee        DATE,
    technicien_responsable_id INT REFERENCES technicien(id),
    duree_estimee_h       NUMERIC(6,2),
    -- Realisation
    date_debut_reelle     TIMESTAMPTZ,
    date_fin_reelle       TIMESTAMPTZ,
    duree_arret_h         NUMERIC(8,2) DEFAULT 0,          -- indisponibilite equipement
    travaux_realises      TEXT,
    diagnostic            TEXT,
    cause_id              INT REFERENCES cause_defaillance(id),
    remede                TEXT,
    -- Volet QHSE
    permis_travail_requis BOOLEAN NOT NULL DEFAULT FALSE,
    permis_travail_ref    VARCHAR(40),
    consignation_loto     BOOLEAN NOT NULL DEFAULT FALSE,
    analyse_risque_faite  BOOLEAN NOT NULL DEFAULT FALSE,
    incident_associe      BOOLEAN NOT NULL DEFAULT FALSE,
    observations_hse      TEXT,
    -- Couts (RG-07 : calcules par trigger)
    cout_main_oeuvre      NUMERIC(14,2) NOT NULL DEFAULT 0,
    cout_pieces           NUMERIC(14,2) NOT NULL DEFAULT 0,
    cout_externe          NUMERIC(14,2) NOT NULL DEFAULT 0,
    cout_total            NUMERIC(14,2) GENERATED ALWAYS AS
                          (cout_main_oeuvre + cout_pieces + cout_externe) STORED,
    -- Cloture
    valide_par            INT REFERENCES utilisateur(id),
    date_cloture          TIMESTAMPTZ,
    cree_par              INT REFERENCES utilisateur(id),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ,
    CONSTRAINT chk_dates_ot CHECK (date_fin_reelle IS NULL OR date_debut_reelle IS NULL
                                   OR date_fin_reelle >= date_debut_reelle)
);
ALTER TABLE demande_intervention ADD CONSTRAINT fk_di_ot FOREIGN KEY (ot_id) REFERENCES ordre_travail(id);
ALTER TABLE mouvement_stock      ADD CONSTRAINT fk_mvt_ot FOREIGN KEY (ot_id) REFERENCES ordre_travail(id);
CREATE INDEX idx_ot_statut     ON ordre_travail(statut);
CREATE INDEX idx_ot_equipement ON ordre_travail(equipement_id);
CREATE INDEX idx_ot_planifiee  ON ordre_travail(date_planifiee);
CREATE INDEX idx_ot_type_date  ON ordre_travail(type_maintenance, date_fin_reelle);

-- Pointage main d'oeuvre (remplace Interventions_Techniciens + Travaux_Mains d'Oeuvres)
CREATE TABLE ot_main_oeuvre (
    id              SERIAL PRIMARY KEY,
    ot_id           INT NOT NULL REFERENCES ordre_travail(id) ON DELETE CASCADE,
    technicien_id   INT NOT NULL REFERENCES technicien(id),
    date_travail    DATE NOT NULL,
    heure_debut     TIME NOT NULL,
    heure_fin       TIME NOT NULL,
    duree_h         NUMERIC(6,2) NOT NULL,
    taux_horaire    NUMERIC(12,2) NOT NULL DEFAULT 0,
    cout            NUMERIC(14,2) GENERATED ALWAYS AS (duree_h * taux_horaire) STORED,
    tache_realisee  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_heures CHECK (heure_fin > heure_debut)
);
CREATE INDEX idx_mo_tech_date ON ot_main_oeuvre(technicien_id, date_travail);

-- Check-list d'execution (copie de la gamme a la creation de l'OT)
CREATE TABLE ot_operation (
    id                SERIAL PRIMARY KEY,
    ot_id             INT NOT NULL REFERENCES ordre_travail(id) ON DELETE CASCADE,
    gamme_operation_id INT REFERENCES gamme_operation(id),
    ordre             SMALLINT NOT NULL,
    libelle           VARCHAR(200) NOT NULL,
    statut            VARCHAR(20) NOT NULL DEFAULT 'A_FAIRE',  -- A_FAIRE, FAIT, NON_APPLICABLE
    valeur_mesuree    NUMERIC(12,3),
    conforme          BOOLEAN,
    observation       TEXT,
    realise_par       INT REFERENCES technicien(id),
    realise_le        TIMESTAMPTZ
);

-- Consommation de pieces (remplace Utilisation pieces, quantite typee)
CREATE TABLE ot_piece (
    id              SERIAL PRIMARY KEY,
    ot_id           INT NOT NULL REFERENCES ordre_travail(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES article(id),
    quantite        NUMERIC(12,2) NOT NULL CHECK (quantite > 0),
    prix_unitaire   NUMERIC(14,2) NOT NULL DEFAULT 0,
    montant         NUMERIC(16,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    date_sortie     TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivre_par     INT REFERENCES utilisateur(id),
    mouvement_id    BIGINT REFERENCES mouvement_stock(id)
);

CREATE TABLE piece_jointe (
    id              SERIAL PRIMARY KEY,
    entite          VARCHAR(40) NOT NULL,      -- EQUIPEMENT, OT, ARTICLE, GAMME, DI
    entite_id       INT NOT NULL,
    type_document   VARCHAR(40),               -- PHOTO_AVANT, PHOTO_APRES, FACTURE, MANUEL, PV, CERTIFICAT
    nom_fichier     VARCHAR(200) NOT NULL,
    url             TEXT NOT NULL,
    taille_ko       INT,
    ajoute_par      INT REFERENCES utilisateur(id),
    date_ajout      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pj_entite ON piece_jointe(entite, entite_id);

-- =====================================================================
-- 7. SYSTEME : AUDIT, NOTIFICATIONS, PARAMETRES
-- =====================================================================
CREATE TABLE journal_audit (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  INT REFERENCES utilisateur(id),
    action          VARCHAR(20) NOT NULL,      -- CREATE, UPDATE, DELETE, LOGIN, EXPORT
    table_concernee VARCHAR(60),
    enregistrement_id VARCHAR(40),
    valeurs_avant   JSONB,
    valeurs_apres   JSONB,
    adresse_ip      INET,
    date_action     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_date ON journal_audit(date_action DESC);

CREATE TABLE notification (
    id              BIGSERIAL PRIMARY KEY,
    destinataire_id INT NOT NULL REFERENCES utilisateur(id),
    type            VARCHAR(40) NOT NULL,      -- ECHEANCE_PREVENTIF, STOCK_CRITIQUE, OT_AFFECTE, DI_NOUVELLE
    titre           VARCHAR(150) NOT NULL,
    message         TEXT,
    lien            VARCHAR(200),
    lu              BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parametre (
    cle             VARCHAR(60) PRIMARY KEY,
    valeur          TEXT NOT NULL,
    description     TEXT
);
INSERT INTO parametre (cle, valeur, description) VALUES
 ('DEVISE','FCFA','Devise de valorisation'),
 ('TAUX_HORAIRE_DEFAUT','2500','Cout horaire par defaut d''un technicien (FCFA/h)'),
 ('JOURS_GENERATION_PREVENTIF','15','Nombre de jours avant echeance pour generer l''OT preventif'),
 ('FORMAT_NUM_OT','OT-{AAAA}-{00000}','Format de numerotation des OT'),
 ('HEURES_OUVREES_MOIS','173','Base de calcul du taux d''occupation');

-- =====================================================================
-- 8. TRIGGERS METIER
-- =====================================================================
-- RG-03/RG-04 : toute sortie de piece met a jour le stock et trace le mouvement
CREATE OR REPLACE FUNCTION trg_ot_piece_sortie() RETURNS TRIGGER AS $$
DECLARE v_stock NUMERIC(12,2); v_mvt BIGINT;
BEGIN
    SELECT quantite_stock INTO v_stock FROM article WHERE id = NEW.article_id FOR UPDATE;
    IF v_stock < NEW.quantite THEN
        RAISE EXCEPTION 'Stock insuffisant pour l''article % (dispo: %, demande: %)',
              NEW.article_id, v_stock, NEW.quantite;
    END IF;
    UPDATE article SET quantite_stock = quantite_stock - NEW.quantite WHERE id = NEW.article_id;
    INSERT INTO mouvement_stock (article_id, type_mvt, quantite, prix_unitaire, ot_id,
                                 motif, stock_avant, stock_apres, utilisateur_id)
    VALUES (NEW.article_id,'SORTIE',NEW.quantite,NEW.prix_unitaire,NEW.ot_id,
            'Sortie sur OT', v_stock, v_stock - NEW.quantite, NEW.delivre_par)
    RETURNING id INTO v_mvt;
    NEW.mouvement_id := v_mvt;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_ot_piece_sortie BEFORE INSERT ON ot_piece
FOR EACH ROW EXECUTE FUNCTION trg_ot_piece_sortie();

-- RG-07 : recalcul automatique des couts de l'OT
CREATE OR REPLACE FUNCTION trg_maj_cout_ot() RETURNS TRIGGER AS $$
DECLARE v_ot INT;
BEGIN
    v_ot := COALESCE(NEW.ot_id, OLD.ot_id);
    UPDATE ordre_travail o SET
      cout_main_oeuvre = COALESCE((SELECT SUM(cout) FROM ot_main_oeuvre WHERE ot_id = v_ot),0),
      cout_pieces      = COALESCE((SELECT SUM(montant) FROM ot_piece     WHERE ot_id = v_ot),0),
      updated_at       = now()
    WHERE o.id = v_ot;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_cout_mo    AFTER INSERT OR UPDATE OR DELETE ON ot_main_oeuvre
FOR EACH ROW EXECUTE FUNCTION trg_maj_cout_ot();
CREATE TRIGGER tg_cout_piece AFTER INSERT OR UPDATE OR DELETE ON ot_piece
FOR EACH ROW EXECUTE FUNCTION trg_maj_cout_ot();

-- RG-09 : a la cloture d'un OT preventif, recalcul de la prochaine echeance
CREATE OR REPLACE FUNCTION trg_cloture_ot() RETURNS TRIGGER AS $$
DECLARE p RECORD;
BEGIN
    IF NEW.statut = 'CLOTURE' AND OLD.statut <> 'CLOTURE' AND NEW.plan_id IS NOT NULL THEN
        SELECT * INTO p FROM plan_maintenance WHERE id = NEW.plan_id;
        UPDATE plan_maintenance SET
          date_derniere_execution = COALESCE(NEW.date_fin_reelle::date, CURRENT_DATE),
          date_prochaine_echeance = CASE p.periodicite_type
              WHEN 'JOUR'   THEN COALESCE(NEW.date_fin_reelle::date,CURRENT_DATE) + (p.periodicite_valeur || ' days')::interval
              WHEN 'SEMAINE'THEN COALESCE(NEW.date_fin_reelle::date,CURRENT_DATE) + (p.periodicite_valeur || ' weeks')::interval
              WHEN 'MOIS'   THEN COALESCE(NEW.date_fin_reelle::date,CURRENT_DATE) + (p.periodicite_valeur || ' months')::interval
              WHEN 'ANNEE'  THEN COALESCE(NEW.date_fin_reelle::date,CURRENT_DATE) + (p.periodicite_valeur || ' years')::interval
              ELSE p.date_prochaine_echeance END
        WHERE id = NEW.plan_id;
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_cloture_ot AFTER UPDATE ON ordre_travail
FOR EACH ROW EXECUTE FUNCTION trg_cloture_ot();

-- =====================================================================
-- 9. VUES DE PILOTAGE (KPI)
-- =====================================================================
-- Reprise et fiabilisation des requetes Access existantes
CREATE VIEW v_stock_critique AS
SELECT a.ref_article, a.designation, a.quantite_stock, a.seuil_reappro,
       (a.seuil_reappro - a.quantite_stock) AS quantite_a_commander,
       f.raison_sociale AS fournisseur, a.delai_appro_jours
FROM article a LEFT JOIN fournisseur f ON f.id = a.fournisseur_principal_id
WHERE a.actif AND a.quantite_stock <= a.seuil_reappro;

CREATE VIEW v_valeur_stock AS
SELECT COUNT(*) AS nb_references,
       SUM(quantite_stock) AS quantite_totale,
       SUM(quantite_stock * prix_unitaire_moyen) AS valeur_fcfa
FROM article WHERE actif;

CREATE VIEW v_echeancier_preventif AS
SELECT e.code_equipement, e.designation, l.libelle AS localisation,
       g.libelle AS gamme, p.date_prochaine_echeance,
       (p.date_prochaine_echeance - CURRENT_DATE) AS jours_restants,
       p.reglementaire
FROM plan_maintenance p
JOIN equipement e ON e.id = p.equipement_id
JOIN gamme_maintenance g ON g.id = p.gamme_id
LEFT JOIN localisation l ON l.id = e.localisation_id
WHERE p.actif ORDER BY p.date_prochaine_echeance;

CREATE VIEW v_charge_technicien AS
SELECT t.matricule, t.nom_prenom, s.libelle AS specialite,
       date_trunc('month', m.date_travail) AS mois,
       COUNT(DISTINCT m.ot_id) AS nb_ot,
       SUM(m.duree_h)          AS heures_travaillees,
       SUM(m.cout)             AS cout_mo_fcfa
FROM technicien t
LEFT JOIN ot_main_oeuvre m ON m.technicien_id = t.id
LEFT JOIN specialite s ON s.id = t.specialite_id
GROUP BY t.matricule, t.nom_prenom, s.libelle, date_trunc('month', m.date_travail);

-- MTBF / MTTR / disponibilite par equipement (base : 12 derniers mois)
CREATE VIEW v_indicateurs_equipement AS
WITH pannes AS (
  SELECT equipement_id,
         COUNT(*) AS nb_defaillances,
         SUM(duree_arret_h) AS heures_arret,
         SUM(EXTRACT(EPOCH FROM (date_fin_reelle - date_debut_reelle))/3600) AS heures_reparation
  FROM ordre_travail
  WHERE type_maintenance = 'CORRECTIF' AND statut = 'CLOTURE'
    AND date_fin_reelle >= now() - interval '12 months'
  GROUP BY equipement_id
)
SELECT e.code_equipement, e.designation, e.criticite,
       COALESCE(p.nb_defaillances,0)                        AS nb_defaillances,
       COALESCE(p.heures_arret,0)                           AS heures_arret,
       CASE WHEN COALESCE(p.nb_defaillances,0) > 0
            THEN (8760 - COALESCE(p.heures_arret,0)) / p.nb_defaillances END AS mtbf_h,
       CASE WHEN COALESCE(p.nb_defaillances,0) > 0
            THEN p.heures_reparation / p.nb_defaillances END AS mttr_h,
       ROUND(((8760 - COALESCE(p.heures_arret,0)) / 8760 * 100)::numeric, 2) AS taux_disponibilite_pct,
       (SELECT SUM(cout_total) FROM ordre_travail o
         WHERE o.equipement_id = e.id AND o.statut='CLOTURE'
           AND o.date_fin_reelle >= now() - interval '12 months')            AS cout_maintenance_12m
FROM equipement e LEFT JOIN pannes p ON p.equipement_id = e.id
WHERE e.deleted_at IS NULL;

-- Ratio preventif / correctif (cible : 70 / 30)
CREATE VIEW v_ratio_preventif AS
SELECT date_trunc('month', date_fin_reelle) AS mois,
       COUNT(*) FILTER (WHERE type_maintenance IN ('PREVENTIF','REGLEMENTAIRE')) AS nb_preventif,
       COUNT(*) FILTER (WHERE type_maintenance = 'CORRECTIF')                    AS nb_correctif,
       ROUND(100.0 * COUNT(*) FILTER (WHERE type_maintenance IN ('PREVENTIF','REGLEMENTAIRE'))
             / NULLIF(COUNT(*),0), 1)                                            AS taux_preventif_pct
FROM ordre_travail WHERE statut = 'CLOTURE' AND date_fin_reelle IS NOT NULL
GROUP BY 1 ORDER BY 1 DESC;

-- =====================================================================
-- 10. JEU DE DONNEES INITIAL (extrait de la base Access)
-- =====================================================================
INSERT INTO specialite (code, libelle) VALUES
 ('MEC','Mecanicien'), ('ELEC','Electricien'), ('SOUD','Soudeur'),
 ('HYD','Hydraulicien'), ('INSTR','Instrumentiste'), ('POLY','Polyvalent');

INSERT INTO technicien (matricule, nom_prenom, specialite_id, statut) VALUES
 ('S010','SOGOBA Issa',              (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S011','KOUAKOU Kouame Rubin',     (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S012','BAMBA Bakary Siriky',      (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S014','DIARASSOUBA Ben Swaliho',  (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S015','KOUAME Koffi JB',          (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S016','SEKONGO Kiboni',           (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S017','DOUMBIA Idrissa',          (SELECT id FROM specialite WHERE code='MEC'), 'ACTIF'),
 ('S019','KOFFI Renaud',             (SELECT id FROM specialite WHERE code='SOUD'),'ACTIF'),
 ('S022','BOHOUSSOU N''dri Germain', (SELECT id FROM specialite WHERE code='SOUD'),'ACTIF'),
 ('S028','ZORO Bi Arnaud',           (SELECT id FROM specialite WHERE code='ELEC'),'ACTIF'),
 ('S036','KONAN Kouame Olivier',     (SELECT id FROM specialite WHERE code='SOUD'),'ACTIF');

INSERT INTO role (code, libelle) VALUES
 ('ADMIN','Administrateur'), ('RESP_MAINT','Responsable maintenance'),
 ('PLANIF','Planificateur'), ('TECH','Technicien'), ('MAGASIN','Magasinier'),
 ('DEMANDEUR','Demandeur / exploitation'), ('DIRECTION','Direction (lecture)'),
 ('QHSE','Responsable QHSE');

INSERT INTO cause_defaillance (code, libelle, categorie) VALUES
 ('USU','Usure normale','Materiel'), ('LUB','Defaut de lubrification','Methode'),
 ('SUR','Surcharge / surintensite','Milieu'), ('HUM','Erreur humaine / mauvaise utilisation','Main d''oeuvre'),
 ('PIE','Piece defectueuse','Matiere'), ('COR','Corrosion','Milieu'),
 ('MTG','Defaut de montage','Methode'), ('ENV','Conditions environnementales','Milieu'),
 ('INC','Cause inconnue','Autre');
-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================

-- =====================================================================
--  EXTENSION V1.1
--  Fonctionnement hors ligne (mobile / APK) et extensibilite du parc
-- =====================================================================

-- ---------------------------------------------------------------------
-- 11. EXTENSIBILITE DU PARC
-- ---------------------------------------------------------------------
CREATE TYPE statut_fiche AS ENUM ('A_VALIDER','VALIDEE','REJETEE');

ALTER TABLE equipement
  ADD COLUMN statut_fiche       statut_fiche NOT NULL DEFAULT 'VALIDEE',  -- RG-27
  ADD COLUMN cree_depuis_mobile BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN valide_par         INT REFERENCES utilisateur(id),
  ADD COLUMN date_validation    TIMESTAMPTZ;

-- Un equipement au statut A_VALIDER est utilisable pour rattacher une
-- intervention mais exclu des indicateurs et de l'inventaire.
CREATE INDEX idx_equip_statut_fiche ON equipement(statut_fiche)
  WHERE statut_fiche = 'A_VALIDER';

-- Champs techniques definis par l'administrateur, sans redeveloppement.
-- Les valeurs sont stockees dans equipement.caracteristiques (JSONB),
-- indexees par le code du champ.
CREATE TABLE champ_personnalise (
    id              SERIAL PRIMARY KEY,
    famille_id      INT REFERENCES famille_equipement(id) ON DELETE CASCADE,
    code            VARCHAR(40) NOT NULL,          -- cle utilisee dans le JSONB
    libelle         VARCHAR(120) NOT NULL,
    type_champ      VARCHAR(20) NOT NULL,          -- TEXTE, NOMBRE, DATE, LISTE, BOOLEEN
    unite           VARCHAR(20),
    valeurs_possibles JSONB,                       -- pour le type LISTE
    obligatoire     BOOLEAN NOT NULL DEFAULT FALSE,
    ordre_affichage SMALLINT NOT NULL DEFAULT 1,
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (famille_id, code)
);
-- Recherche sur les caracteristiques variables
CREATE INDEX idx_equip_caracteristiques ON equipement USING gin (caracteristiques);

-- Tracabilite des imports Excel en masse (annulation possible)
CREATE TABLE import_lot (
    id              SERIAL PRIMARY KEY,
    type_import     VARCHAR(30) NOT NULL,          -- EQUIPEMENT, ARTICLE, TECHNICIEN
    nom_fichier     VARCHAR(200),
    nb_lignes       INT, nb_succes INT, nb_erreurs INT,
    rapport         JSONB,                         -- erreurs ligne a ligne
    annule          BOOLEAN NOT NULL DEFAULT FALSE,
    importe_par     INT REFERENCES utilisateur(id),
    date_import     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE equipement ADD COLUMN import_lot_id INT REFERENCES import_lot(id);
ALTER TABLE article    ADD COLUMN import_lot_id INT REFERENCES import_lot(id);

-- ---------------------------------------------------------------------
-- 12. TERMINAUX ET SYNCHRONISATION HORS LIGNE
-- ---------------------------------------------------------------------
CREATE TABLE terminal (
    id                SERIAL PRIMARY KEY,
    identifiant       VARCHAR(80) NOT NULL UNIQUE,  -- genere a l'installation
    utilisateur_id    INT REFERENCES utilisateur(id),
    modele            VARCHAR(80),
    version_os        VARCHAR(40),
    version_app       VARCHAR(20),
    derniere_sync     TIMESTAMPTZ,
    elements_en_attente INT DEFAULT 0,
    revoque           BOOLEAN NOT NULL DEFAULT FALSE,   -- RG-29 (perte / vol)
    date_revocation   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sync_lot (
    id              BIGSERIAL PRIMARY KEY,
    terminal_id     INT REFERENCES terminal(id),
    utilisateur_id  INT REFERENCES utilisateur(id),
    date_reception  TIMESTAMPTZ NOT NULL DEFAULT now(),
    nb_operations   INT NOT NULL DEFAULT 0,
    nb_acceptees    INT NOT NULL DEFAULT 0,
    nb_doublons     INT NOT NULL DEFAULT 0,      -- ignores par idempotence (RG-23)
    nb_conflits     INT NOT NULL DEFAULT 0,
    nb_rejetees     INT NOT NULL DEFAULT 0,
    version_app     VARCHAR(20),
    detail          JSONB                        -- motifs de rejet, arbitrages
);
CREATE INDEX idx_sync_date ON sync_lot(date_reception DESC);

-- Identifiant genere par le terminal : garantit l'idempotence (RG-23).
-- Une meme operation renvoyee apres coupure ne cree qu'un enregistrement.
ALTER TABLE ordre_travail        ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE demande_intervention ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE ot_main_oeuvre       ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE ot_piece             ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE ot_operation         ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE piece_jointe         ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE compteur_releve      ADD COLUMN client_uuid UUID UNIQUE;
ALTER TABLE equipement           ADD COLUMN client_uuid UUID UNIQUE;

-- Horodatage : saisie terrain (RG-24) distinct de la reception serveur
ALTER TABLE ordre_travail   ADD COLUMN saisi_hors_ligne BOOLEAN NOT NULL DEFAULT FALSE,
                            ADD COLUMN date_saisie_terrain TIMESTAMPTZ,
                            ADD COLUMN date_synchronisation TIMESTAMPTZ;
ALTER TABLE ot_main_oeuvre  ADD COLUMN date_saisie_terrain TIMESTAMPTZ,
                            ADD COLUMN date_synchronisation TIMESTAMPTZ;
ALTER TABLE piece_jointe    ADD COLUMN date_prise_vue TIMESTAMPTZ,
                            ADD COLUMN latitude NUMERIC(10,7),
                            ADD COLUMN longitude NUMERIC(10,7),
                            ADD COLUMN synchronisee BOOLEAN NOT NULL DEFAULT TRUE;

-- Demande de sortie de piece saisie hors ligne : ne devient un mouvement
-- de stock qu'apres validation du magasinier (RG-26).
CREATE TYPE statut_demande_piece AS ENUM ('EN_ATTENTE','VALIDEE','REFUSEE');

CREATE TABLE demande_piece (
    id              SERIAL PRIMARY KEY,
    client_uuid     UUID UNIQUE,
    ot_id           INT NOT NULL REFERENCES ordre_travail(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES article(id),
    quantite        NUMERIC(12,2) NOT NULL CHECK (quantite > 0),
    demande_par     INT REFERENCES technicien(id),
    date_demande    TIMESTAMPTZ NOT NULL DEFAULT now(),
    statut          statut_demande_piece NOT NULL DEFAULT 'EN_ATTENTE',
    traite_par      INT REFERENCES utilisateur(id),
    date_traitement TIMESTAMPTZ,
    motif_refus     TEXT,
    ot_piece_id     INT REFERENCES ot_piece(id)   -- renseigne apres validation
);
CREATE INDEX idx_demande_piece_statut ON demande_piece(statut) WHERE statut = 'EN_ATTENTE';

-- Parametres complementaires
INSERT INTO parametre (cle, valeur, description) VALUES
 ('DUREE_SESSION_HORS_LIGNE_JOURS','7','Validite d''une session hors ligne avant reconnexion obligatoire (RG-28)'),
 ('QUOTA_LOCAL_MO','500','Empreinte maximale des donnees et photos sur le terminal'),
 ('PHOTO_LARGEUR_MAX_PX','1600','Redimensionnement des photos avant stockage local'),
 ('PHOTO_QUALITE','75','Qualite de compression des photos en pourcentage'),
 ('VERSION_APP_MIN','1.0.0','Version minimale de l''application mobile acceptee par le serveur'),
 ('JOURS_OT_PRECHARGES','7','Profondeur de prechargement des ordres de travail sur le terminal');

-- Vue de supervision de la flotte de terminaux
CREATE VIEW v_etat_terminaux AS
SELECT t.identifiant, u.nom, u.prenom, t.modele, t.version_app,
       t.derniere_sync,
       (now() - t.derniere_sync) AS anciennete_sync,
       t.elements_en_attente, t.revoque
FROM terminal t LEFT JOIN utilisateur u ON u.id = t.utilisateur_id
ORDER BY t.derniere_sync NULLS FIRST;

-- Equipements crees sur le terrain et en attente de validation (RG-27)
CREATE VIEW v_equipements_a_valider AS
SELECT e.id, e.code_equipement, e.designation, l.libelle AS localisation,
       e.created_at, u.nom AS cree_par
FROM equipement e
LEFT JOIN localisation l ON l.id = e.localisation_id
LEFT JOIN utilisateur  u ON u.id = e.valide_par
WHERE e.statut_fiche = 'A_VALIDER' AND e.deleted_at IS NULL;
-- =====================================================================
-- FIN DE L'EXTENSION V1.1
-- =====================================================================
