import { api } from '../lib/api';
import type {
  Article,
  BulletinAnalyse,
  ClientUsine,
  DashboardData,
  DashboardDirection,
  DashboardLabo,
  DashboardPf,
  DashboardProduction,
  Demande,
  DemandeMatiere,
  Echantillon,
  Expedition,
  JournalQuart,
  DemandePiece,
  Equipement,
  LigneProduction,
  LotProduit,
  Mouvement,
  MouvementProduit,
  Nomenclature,
  NonConformite,
  NotificationItem,
  OrdreFabrication,
  ParametreAnalyse,
  PointPrelevement,
  OrdreTravail,
  Produit,
  ReponsePaginee,
  Tank,
  Technicien,
} from '../types';

export const metier = {
  dashboard: () => api.get<DashboardData>('/dashboard').then((r) => r.data),
  notifications: () => api.get<NotificationItem[]>('/notifications').then((r) => r.data),

  sites: () => api.get('/sites').then((r) => r.data),
  localisations: () => api.get('/localisations').then((r) => r.data),
  familles: () => api.get('/familles').then((r) => r.data),
  specialites: () => api.get('/specialites').then((r) => r.data),
  causes: () => api.get('/causes').then((r) => r.data),
  categories: () => api.get('/categories-articles').then((r) => r.data),
  fournisseurs: () => api.get('/fournisseurs').then((r) => r.data),
  parametres: () => api.get('/parametres').then((r) => r.data),

  equipements: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Equipement>>('/equipements', { params }).then((r) => r.data),
  equipement: (id: number) => api.get<Equipement>(`/equipements/${id}`).then((r) => r.data),
  equipementQr: (code: string) => api.get<Equipement>(`/equipements/qr/${encodeURIComponent(code)}`).then((r) => r.data),
  creerEquipement: (payload: Record<string, unknown>) => api.post('/equipements', payload).then((r) => r.data),
  modifierEquipement: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/equipements/${id}`, payload).then((r) => r.data),

  demandes: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Demande>>('/demandes', { params }).then((r) => r.data),
  demande: (id: number) => api.get<Demande>(`/demandes/${id}`).then((r) => r.data),
  creerDemande: (payload: Record<string, unknown>) => api.post('/demandes', payload).then((r) => r.data),
  convertirDemande: (id: number, priorite?: string) =>
    api.post(`/demandes/${id}/convertir`, { priorite }).then((r) => r.data),
  rejeterDemande: (id: number, motif: string) => api.post(`/demandes/${id}/rejeter`, { motif }).then((r) => r.data),

  ots: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<OrdreTravail>>('/ordres-travail', { params }).then((r) => r.data),
  ot: (id: number) => api.get<OrdreTravail>(`/ordres-travail/${id}`).then((r) => r.data),
  creerOt: (payload: Record<string, unknown>) => api.post('/ordres-travail', payload).then((r) => r.data),
  planifierOt: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/ordres-travail/${id}`, payload).then((r) => r.data),
  statutOt: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/ordres-travail/${id}/statut`, payload).then((r) => r.data),
  pointer: (id: number, payload: Record<string, unknown>) =>
    api.post(`/ordres-travail/${id}/main-oeuvre`, payload).then((r) => r.data),
  rapportOt: (id: number, payload: Record<string, unknown>) =>
    api.patch(`/ordres-travail/${id}/rapport`, payload).then((r) => r.data),
  majOperation: (otId: number, opId: number, payload: Record<string, unknown>) =>
    api.patch(`/ordres-travail/${otId}/operations/${opId}`, payload).then((r) => r.data),
  ajouterOperation: (otId: number, libelle: string) =>
    api.post(`/ordres-travail/${otId}/operations`, { libelle }).then((r) => r.data),

  articles: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Article>>('/articles', { params }).then((r) => r.data),
  article: (id: number) => api.get(`/articles/${id}`).then((r) => r.data),
  critiques: () => api.get<Article[]>('/articles/critiques').then((r) => r.data),
  creerArticle: (payload: Record<string, unknown>) => api.post('/articles', payload).then((r) => r.data),
  mouvements: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Mouvement>>('/mouvements-stock', { params }).then((r) => r.data),
  creerMouvement: (payload: Record<string, unknown>) => api.post('/mouvements-stock', payload).then((r) => r.data),
  demandesPieces: (statut?: string) =>
    api.get<DemandePiece[]>('/demandes-pieces', { params: { statut } }).then((r) => r.data),
  demanderPiece: (otId: number, payload: Record<string, unknown>) =>
    api.post(`/ordres-travail/${otId}/pieces`, payload).then((r) => r.data),
  validerPiece: (id: number) => api.post(`/demandes-pieces/${id}/valider`).then((r) => r.data),
  refuserPiece: (id: number, motif: string) =>
    api.post(`/demandes-pieces/${id}/refuser`, { motif }).then((r) => r.data),

  techniciens: () => api.get<Technicien[]>('/techniciens').then((r) => r.data),
  utilisateurs: (params?: Record<string, unknown>) => api.get('/utilisateurs', { params }).then((r) => r.data),
  creerUtilisateur: (payload: Record<string, unknown>) => api.post('/utilisateurs', payload).then((r) => r.data),
  roles: () => api.get('/roles').then((r) => r.data),
  audit: (params?: Record<string, unknown>) => api.get('/audit', { params }).then((r) => r.data),

  dashboardProduction: () => api.get<DashboardProduction>('/dashboard/production').then((r) => r.data),
  dashboardPf: () => api.get<DashboardPf>('/dashboard/produits-finis').then((r) => r.data),
  produits: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Produit>>('/produits', { params }).then((r) => r.data),
  creerProduit: (payload: Record<string, unknown>) => api.post<Produit>('/produits', payload).then((r) => r.data),
  lignesProduction: () => api.get<LigneProduction[]>('/lignes-production').then((r) => r.data),
  creerLigneProduction: (payload: Record<string, unknown>) =>
    api.post<LigneProduction>('/lignes-production', payload).then((r) => r.data),
  nomenclatures: () => api.get<Nomenclature[]>('/nomenclatures').then((r) => r.data),
  creerNomenclature: (payload: Record<string, unknown>) =>
    api.post<Nomenclature>('/nomenclatures', payload).then((r) => r.data),
  ofs: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<OrdreFabrication>>('/ordres-fabrication', { params }).then((r) => r.data),
  of: (id: number) => api.get<OrdreFabrication>(`/ordres-fabrication/${id}`).then((r) => r.data),
  creerOf: (payload: Record<string, unknown>) =>
    api.post<OrdreFabrication>('/ordres-fabrication', payload).then((r) => r.data),
  statutOf: (id: number, payload: Record<string, unknown>) =>
    api.patch<OrdreFabrication>(`/ordres-fabrication/${id}/statut`, payload).then((r) => r.data),
  controleOf: (id: number, payload: Record<string, unknown>) =>
    api.post<OrdreFabrication>(`/ordres-fabrication/${id}/controle`, payload).then((r) => r.data),
  lots: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<LotProduit>>('/lots', { params }).then((r) => r.data),
  expedierLot: (id: number, quantite?: number) =>
    api.post<LotProduit>(`/lots/${id}/expedier`, { quantite }).then((r) => r.data),
  mouvementsProduits: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<MouvementProduit>>('/mouvements-produits', { params }).then((r) => r.data),

  demandesMatiere: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<DemandeMatiere>>('/demandes-matiere', { params }).then((r) => r.data),
  creerDemandeMatiere: (payload: Record<string, unknown>) =>
    api.post<DemandeMatiere>('/demandes-matiere', payload).then((r) => r.data),
  servirDemandeMatiere: (id: number, payload: Record<string, unknown>) =>
    api.post<DemandeMatiere>(`/demandes-matiere/${id}/servir`, payload).then((r) => r.data),
  refuserDemandeMatiere: (id: number, motif: string) =>
    api.post<DemandeMatiere>(`/demandes-matiere/${id}/refuser`, { motif }).then((r) => r.data),

  journaux: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<JournalQuart>>('/journaux-quart', { params }).then((r) => r.data),
  journal: (id: number) => api.get<JournalQuart>(`/journaux-quart/${id}`).then((r) => r.data),
  creerJournal: (payload: Record<string, unknown>) =>
    api.post<JournalQuart>('/journaux-quart', payload).then((r) => r.data),
  ajouterEntreeJournal: (id: number, payload: Record<string, unknown>) =>
    api.post<JournalQuart>(`/journaux-quart/${id}/entrees`, payload).then((r) => r.data),
  ajouterSortieJournal: (id: number, payload: Record<string, unknown>) =>
    api.post<JournalQuart>(`/journaux-quart/${id}/sorties`, payload).then((r) => r.data),
  ajouterArretJournal: (id: number, payload: Record<string, unknown>) =>
    api.post<JournalQuart>(`/journaux-quart/${id}/arrets`, payload).then((r) => r.data),
  soumettreJournal: (id: number, commentaireEcart?: string) =>
    api.post<JournalQuart>(`/journaux-quart/${id}/soumettre`, { commentaireEcart }).then((r) => r.data),
  verifierJournal: (id: number) => api.post<JournalQuart>(`/journaux-quart/${id}/verifier`).then((r) => r.data),
  approuverJournal: (id: number) => api.post<JournalQuart>(`/journaux-quart/${id}/approuver`).then((r) => r.data),
  retournerJournal: (id: number, motif: string) =>
    api.post<JournalQuart>(`/journaux-quart/${id}/retourner`, { motif }).then((r) => r.data),

  tanks: () => api.get<Tank[]>('/tanks').then((r) => r.data),
  tank: (id: number) => api.get<Tank>(`/tanks/${id}`).then((r) => r.data),
  jaugerTank: (id: number, payload: Record<string, unknown>) =>
    api.post(`/tanks/${id}/jaugeages`, payload).then((r) => r.data),

  clients: () => api.get<ClientUsine[]>('/clients').then((r) => r.data),
  creerClient: (payload: Record<string, unknown>) => api.post<ClientUsine>('/clients', payload).then((r) => r.data),
  expeditions: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Expedition>>('/expeditions', { params }).then((r) => r.data),
  expedition: (id: number) => api.get<Expedition>(`/expeditions/${id}`).then((r) => r.data),
  creerExpedition: (payload: Record<string, unknown>) =>
    api.post<Expedition>('/expeditions', payload).then((r) => r.data),
  ajouterChargement: (id: number, payload: Record<string, unknown>) =>
    api.post<Expedition>(`/expeditions/${id}/chargements`, payload).then((r) => r.data),
  cloturerExpedition: (id: number) => api.post<Expedition>(`/expeditions/${id}/cloturer`).then((r) => r.data),

  dashboardLabo: () => api.get<DashboardLabo>('/dashboard/laboratoire').then((r) => r.data),
  dashboardDirection: () => api.get<DashboardDirection>('/dashboard/direction').then((r) => r.data),
  pointsPrelevement: () => api.get<PointPrelevement[]>('/points-prelevement').then((r) => r.data),
  parametresAnalyse: () => api.get<ParametreAnalyse[]>('/parametres-analyse').then((r) => r.data),
  echantillons: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<Echantillon>>('/echantillons', { params }).then((r) => r.data),
  echantillon: (id: number) => api.get<Echantillon>(`/echantillons/${id}`).then((r) => r.data),
  creerEchantillon: (payload: Record<string, unknown>) =>
    api.post<Echantillon>('/echantillons', payload).then((r) => r.data),
  saisirAnalyse: (id: number, payload: Record<string, unknown>) =>
    api.post<Echantillon>(`/echantillons/${id}/analyses`, payload).then((r) => r.data),
  bulletins: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<BulletinAnalyse>>('/bulletins', { params }).then((r) => r.data),
  bulletin: (id: number) => api.get<BulletinAnalyse>(`/bulletins/${id}`).then((r) => r.data),
  creerBulletin: (payload: Record<string, unknown>) =>
    api.post<BulletinAnalyse>('/bulletins', payload).then((r) => r.data),
  soumettreBulletin: (id: number) => api.post<BulletinAnalyse>(`/bulletins/${id}/soumettre`).then((r) => r.data),
  verifierBulletin: (id: number) => api.post<BulletinAnalyse>(`/bulletins/${id}/verifier`).then((r) => r.data),
  approuverBulletin: (id: number, payload?: Record<string, unknown>) =>
    api.post<BulletinAnalyse>(`/bulletins/${id}/approuver`, payload ?? {}).then((r) => r.data),
  nonConformites: (params?: Record<string, unknown>) =>
    api.get<ReponsePaginee<NonConformite>>('/non-conformites', { params }).then((r) => r.data),
  creerNc: (payload: Record<string, unknown>) =>
    api.post<NonConformite>('/non-conformites', payload).then((r) => r.data),
  decisionNc: (id: number, payload: Record<string, unknown>) =>
    api.post<NonConformite>(`/non-conformites/${id}/decision`, payload).then((r) => r.data),
};
