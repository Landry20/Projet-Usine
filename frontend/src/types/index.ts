/** Types alignés sur les réponses de l'API /v1 — aucun calcul métier ici. */

export interface RoleResume {
  id: number;
  code: string;
  libelle: string;
}

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string | null;
  telephone?: string | null;
  role: RoleResume | null;
  siteId?: number | null;
  doitChangerMdp: boolean;
  permissions: string[];
  compartiments?: Array<'DEPOT' | 'PRODUCTION' | 'PRODUITS_FINIS' | 'LABORATOIRE' | 'MAINTENANCE' | 'DIRECTION'>;
  actif?: boolean;
  derniereConnexion?: string | null;
  site?: { id: number; code: string; libelle: string } | null;
}

export interface SessionAuth {
  accessToken: string;
  refreshToken: string;
  expireDans: number;
  doitChangerMdp: boolean;
  utilisateur: Utilisateur;
}

export interface ReponsePaginee<T> {
  donnees: T[];
  page: number;
  limite: number;
  total: number;
  pages: number;
}

export interface Site {
  id: number;
  code: string;
  libelle: string;
  client?: string | null;
  ville?: string | null;
}

export interface Localisation {
  id: number;
  siteId: number;
  code: string;
  libelle: string;
  niveau: number;
  site?: Site;
}

export interface Famille {
  id: number;
  code: string;
  libelle: string;
}

export interface Equipement {
  id: number;
  codeEquipement: string;
  designation: string;
  criticite: 'A' | 'B' | 'C';
  statut: string;
  qrCode: string | null;
  marque?: string | null;
  modele?: string | null;
  numeroSerie?: string | null;
  compteurActuel?: string;
  uniteCompteur?: string | null;
  famille?: Famille | null;
  localisation?: Localisation | null;
  caracteristiques?: Record<string, unknown> | null;
  coutCumule?: number;
  historique?: OrdreTravail[];
  enfants?: Equipement[];
}

export interface Demande {
  id: number;
  numero: string;
  description: string;
  urgence: string;
  arretProduction: boolean;
  statut: string;
  dateDemande: string;
  motifRejet?: string | null;
  equipement?: Equipement;
  demandeur?: Utilisateur;
}

export interface OrdreTravail {
  id: number;
  numero: string;
  typeMaintenance: string;
  origine: string;
  priorite: string;
  statut: string;
  descriptionDemandee?: string | null;
  datePlanifiee?: string | null;
  dateDebutReelle?: string | null;
  dateFinReelle?: string | null;
  travauxRealises?: string | null;
  diagnostic?: string | null;
  remede?: string | null;
  coutMainOeuvre: string;
  coutPieces: string;
  coutExterne: string;
  coutTotal: number;
  motifAttente?: string | null;
  equipement?: Equipement;
  technicienResponsable?: Technicien | null;
  cause?: { id: number; libelle: string } | null;
  mainOeuvre?: Pointage[];
  operations?: OperationOt[];
  pieces?: PieceOt[];
}

export interface Pointage {
  id: number;
  dateTravail: string;
  heureDebut: string;
  heureFin: string;
  dureeH: string;
  cout: string;
  tacheRealisee?: string | null;
  technicien?: Technicien;
}

export interface OperationOt {
  id: number;
  ordre: number;
  libelle: string;
  statut: string;
  obligatoire: boolean;
  observation?: string | null;
  valeurMesuree?: string | null;
}

export interface PieceOt {
  id: number;
  quantite: string;
  prixUnitaire: string;
  montant: string;
  article?: Article;
}

export interface Technicien {
  id: number;
  matricule: string;
  nomPrenom: string;
  statut: string;
  coutHoraire: string;
  specialite?: { id: number; code: string; libelle: string } | null;
}

export interface Article {
  id: number;
  refArticle: string;
  designation: string;
  quantiteStock: string;
  seuilReappro: string;
  prixUnitaireMoyen: string;
  emplacementMagasin?: string | null;
  pieceCritique: boolean;
  unite: string;
  actif: boolean;
}

export interface Mouvement {
  id: string;
  typeMvt: string;
  quantite: string;
  stockAvant: string;
  stockApres: string;
  dateMvt: string;
  motif?: string | null;
  article?: Article;
}

export interface DemandePiece {
  id: number;
  quantite: string;
  statut: string;
  dateDemande: string;
  article?: Article;
  ordreTravail?: OrdreTravail;
}

export interface PointSerie {
  mois: string;
  annee: number;
  precedente: number;
}

export interface SerieComparee {
  anneeCourante: number;
  anneePrecedente: number;
  activite: PointSerie[];
  volume: PointSerie[];
}

export interface DashboardData {
  role: string;
  otOuverts: number;
  otRetard: number;
  demandesAttente: number;
  stockCritique: number;
  demandesPieces: number;
  interventionsDuJour: OrdreTravail[];
  coutMaintenance: number;
  ratioPreventif: number;
  valeurStock: number;
  tauxDisponibilite: number;
  mtbf: number | null;
  mttr: number;
  nbEquipements: number;
  nbUtilisateurs: number;
  mesOt: OrdreTravail[];
  series?: SerieComparee;
}

export interface Produit {
  id: number;
  refProduit: string;
  designation: string;
  typeProduit: 'MATIERE_PREMIERE' | 'SEMI_FINI' | 'PRODUIT_FINI' | 'SOUS_PRODUIT' | 'CONSOMMABLE';
  densiteReference?: string | null;
  unite: string;
  quantiteStock: string;
  seuilReappro: string;
  dureeConservationJours?: number | null;
  actif: boolean;
}

export interface LigneProduction {
  id: number;
  code: string;
  libelle: string;
  siteId?: number | null;
  equipementId?: number | null;
  actif: boolean;
  site?: Site | null;
  equipement?: Equipement | null;
}

export interface NomenclatureLigne {
  id: number;
  composantId: number;
  quantite: string;
  composant?: Produit;
}

export interface Nomenclature {
  id: number;
  code: string;
  libelle: string;
  produitId: number;
  produit?: Produit;
  lignes?: NomenclatureLigne[];
}

export interface DepotZone {
  id: number;
  code: string;
  libelle: string;
  type: string;
  siteId?: number | null;
  actif: boolean;
  site?: Site | null;
}

export interface LotDepot {
  id: number;
  numero: string;
  libelle: string;
  produitId: number;
  depotId?: number | null;
  capacite?: string | null;
  quantite: string;
  etat?: string;
  emplacement?: string | null;
  actif: boolean;
  produit?: Produit;
  depot?: DepotZone | null;
}

export interface ArrivageMatiere {
  id: number;
  numero: string;
  lotDepotId: number;
  produitId: number;
  quantite: string;
  numeroCamion?: string | null;
  poidsBrut?: string | null;
  fournisseurNom?: string | null;
  dateReception?: string | null;
  referenceBl?: string | null;
  commentaire?: string | null;
  dateArrivage: string;
  lotDepot?: LotDepot;
  produit?: Produit;
  depot?: DepotZone | null;
  fournisseur?: { id: number; code: string; raisonSociale: string } | null;
  utilisateur?: { id: number; nom: string; prenom?: string | null } | null;
}

export interface MouvementLotDepot {
  id: string;
  typeMvt: string;
  quantite: string;
  motif?: string | null;
  dateMvt: string;
  lotDepot?: LotDepot;
  utilisateur?: { id: number; nom: string; prenom?: string | null } | null;
}

export interface DemandeAchat {
  id: number;
  numero: string;
  type: string;
  statut: string;
  libelle: string;
  quantite?: string | null;
  motif?: string | null;
  motifRejet?: string | null;
  createdAt: string;
  dateDecision?: string | null;
  produit?: Produit | null;
  demandeur?: { id: number; nom: string; prenom?: string | null } | null;
}

export interface DashboardDepot {
  nbLots: number;
  stockTotal: string;
  demandesEnAttente: number;
  alertes: Array<{
    produitId: number;
    refProduit: string;
    designation: string;
    unite: string;
    quantiteStock: string;
    seuilReappro: string;
  }>;
  parDepot: Array<{ depot: DepotZone; nbLots: number; quantite: string }>;
  lots: LotDepot[];
}

export interface Fournisseur {
  id: number;
  code: string;
  raisonSociale: string;
}

export interface LotProduit {
  id: number;
  numero: string;
  quantite: string;
  statut: string;
  emplacement?: string | null;
  dateFabrication?: string | null;
  dateExpiration?: string | null;
  produit?: Produit;
  ordreFabrication?: { id: number; numero: string };
}

export interface OrdreFabrication {
  id: number;
  numero: string;
  quantitePrevue: string;
  quantiteConforme: string;
  quantiteRejetee: string;
  statut: string;
  datePlanifiee?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  motifAttente?: string | null;
  machineDisponible?: boolean;
  produit?: Produit;
  ligne?: LigneProduction | null;
  nomenclature?: Nomenclature | null;
  lots?: LotProduit[];
}

export interface MouvementProduit {
  id: string;
  typeStock: string;
  typeMvt: string;
  quantite: string;
  stockAvant: string;
  stockApres: string;
  motif?: string | null;
  dateMvt: string;
  produit?: Produit;
}

export interface DashboardProduction {
  ofOuverts: number;
  ofAttente: number;
  ofEnCours: OrdreFabrication[];
  nbMatieres: number;
  series?: SerieComparee;
}

export interface DashboardPf {
  lotsDisponibles: number;
  lotsBloques: number;
  stockPf: number;
  series?: SerieComparee;
}

export interface NotificationItem {
  id: string;
  type: string;
  titre: string;
  message: string | null;
  lu: boolean;
  dateCreation: string;
  lien?: string | null;
}

export interface UtilisateurMini {
  id: number;
  nom?: string;
  prenom?: string | null;
  email?: string;
}

export interface DemandeMatiere {
  id: number;
  numero: string;
  dateDemande: string;
  quantiteDemandee: string;
  quantiteServie?: string | null;
  motifEcart?: string | null;
  quart?: string | null;
  statut: string;
  produit?: Produit;
  ligne?: LigneProduction | null;
  lotDepot?: LotDepot | null;
  demandeur?: UtilisateurMini | null;
  magasinier?: UtilisateurMini | null;
}

export interface JournalEntree {
  id: number;
  quantiteKg: string;
  lotMatiere?: string | null;
  observation?: string | null;
  produit?: Produit;
  demandeMatiere?: DemandeMatiere | null;
}

export interface JournalSortie {
  id: number;
  quantiteKg: string;
  destination?: string | null;
  observation?: string | null;
  produit?: Produit;
  tank?: Tank | null;
}

export interface JournalArret {
  id: number;
  typeArret: string;
  cause?: string | null;
  dureeMin: number;
  equipement?: Equipement | null;
  demandeIntervention?: { id: number; numero: string } | null;
}

export interface JournalQuart {
  id: number;
  numero: string;
  dateJournee: string;
  quart: string;
  totalEntreesKg: string;
  totalSortiesKg: string;
  ecartKg: string;
  ecartPct?: string | null;
  rendementPct?: string | null;
  observations?: string | null;
  commentaireEcart?: string | null;
  statut: string;
  ligne?: LigneProduction;
  chefQuart?: UtilisateurMini;
  entrees?: JournalEntree[];
  sorties?: JournalSortie[];
  arrets?: JournalArret[];
}

export interface Tank {
  id: number;
  code: string;
  libelle?: string | null;
  capaciteLitres: string;
  stockLitres: string;
  stockKg: string;
  litresReserves: string;
  seuilHautPct: number;
  seuilBasPct: number;
  statut: string;
  remplissagePct?: number;
  alerteHaut?: boolean;
  alerteBas?: boolean;
  disponibleLitres?: number;
  produit?: Produit | null;
  mouvements?: TankMouvement[];
  jaugeages?: Jaugeage[];
}

export interface TankMouvement {
  id: string;
  typeMvt: string;
  quantiteLitres: string;
  quantiteKg?: string | null;
  dateMvt: string;
  stockAvantLitres?: string | null;
  stockApresLitres?: string | null;
  motif?: string | null;
}

export interface Jaugeage {
  id: number;
  hauteurCm?: string | null;
  volumeLitres: string;
  masseKg?: string | null;
  stockTheoriqueL?: string | null;
  ecartLitres?: string | null;
  dateJaugeage: string;
}

export interface ClientUsine {
  id: number;
  code: string;
  raisonSociale: string;
  pays?: string | null;
  incoterm?: string | null;
}

export interface Expedition {
  id: number;
  numero: string;
  type: string;
  dateExpedition: string;
  transporteur?: string | null;
  destination?: string | null;
  statut: string;
  totalLitres: string;
  totalKg: string;
  client?: ClientUsine;
  chargements?: Chargement[];
}

export interface Chargement {
  id: number;
  numeroConteneur: string;
  numeroFlexitank: string;
  quantiteLitres: string;
  masseCalculeeKg?: string | null;
  poidsNetKg?: string | null;
  ecartPeseeKg?: string | null;
  tank?: Tank;
  bulletinAnalyse?: BulletinAnalyse | null;
}

export interface PointPrelevement {
  id: number;
  code: string;
  libelle: string;
  type: string;
}

export interface ParametreAnalyse {
  id: number;
  code: string;
  libelle: string;
  unite?: string | null;
}

export interface Echantillon {
  id: number;
  numero: string;
  datePrelevement: string;
  observation?: string | null;
  produit?: Produit;
  point?: PointPrelevement | null;
  tank?: Tank | null;
  analyses?: AnalyseLigne[];
  bulletin?: BulletinAnalyse | null;
}

export interface AnalyseLigne {
  id: number;
  valeurNumerique?: string | null;
  valeurTexte?: string | null;
  conforme?: boolean | null;
  parametre?: ParametreAnalyse;
}

export interface BulletinAnalyse {
  id: number;
  numero: string;
  conclusion: string;
  statut: string;
  commentaire?: string | null;
  echantillon?: Echantillon;
}

export interface NonConformite {
  id: number;
  numero: string;
  description: string;
  decision?: string | null;
  justification?: string | null;
  statut: string;
  dateOuverture: string;
  produit?: Produit | null;
  tank?: Tank | null;
  bulletin?: BulletinAnalyse | null;
}

export interface DashboardLabo {
  echantillons: number;
  bulletinsEnCours: number;
  tauxConformite: number | null;
  ncOuvertes: number;
}

export interface DashboardDirection {
  rendementExtraction: number | null;
  stockTanksKg: number;
  conformiteLabo: number | null;
  disponibiliteMachines: number | null;
  documentsEnAttente: number;
  journauxEnAttente: number;
  bulletinsEnAttente: number;
  ncOuvertes: number;
}
