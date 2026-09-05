import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PageChargement } from './components/ui/PageChargement';
import { useAuth } from './hooks/useAuth';
import { ACCUEIL_COMPARTIMENT, useCompartiment } from './hooks/useCompartiment';
import { AuditPage, TechniciensPage, UtilisateursPage } from './pages/admin/AdminPages';
import { ChangerMdpPage } from './pages/auth/ChangerMdpPage';
import { ConnexionPage } from './pages/auth/ConnexionPage';
import { ParametresPage, ProfilPage } from './pages/compte/ComptePages';
import { AlerteMiseAJour } from './components/pwa/AlerteMiseAJour';
import { PresentationPage } from './pages/public/PresentationPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DetailDemandePage, ListeDemandesPage, NouvelleDemandePage } from './pages/demandes/DemandesPages';
import { FicheEquipementPage, ListeEquipementsPage, NouvelEquipementPage } from './pages/equipements/EquipementsPages';
import { FicheOtPage, ListeOtPage, NouvelOtPage } from './pages/ordres-travail/OtPages';
import {
  DemandesAchatPage,
  DemandesDepotPage,
  DashboardDepotPage,
  LotsDepotPage,
  MouvementsDepotPage,
  ReceptionPage,
  ZonesDepotPage,
} from './pages/depot/DepotPages';
import {
  DashboardProductionPage,
  FicheOfPage,
  LignesPage,
  ListeOfPage,
  MatieresPage,
  NomenclaturesPage,
  NouvelOfPage,
} from './pages/production/ProductionPages';
import {
  CataloguePfPage,
  DashboardPfPage,
  LotsPage,
  MouvementsPfPage,
} from './pages/produits-finis/ProduitsFinisPages';
import { ArticlesPage, StockPage } from './pages/stock/StockPages';
import { ScanPage, SyncPage } from './pages/terrain/TerrainPages';
import {
  BulletinsPage,
  DashboardDirectionPage,
  DashboardLaboPage,
  DemandesMatierePage,
  EchantillonsPage,
  ExpeditionsPage,
  FicheBulletinPage,
  FicheEchantillonPage,
  FicheExpeditionPage,
  FicheJournalPage,
  JournauxQuartPage,
  NonConformitesPage,
  TanksPage,
} from './pages/usine-v2/UsineV2Pages';

function Prive({ children }: { children: ReactNode }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <PageChargement message="Vérification de la session…" />;
  if (!utilisateur) return <Navigate to="/connexion" replace />;
  return <>{children}</>;
}

function AccueilConnecte() {
  const { actif } = useCompartiment();
  return <Navigate to={ACCUEIL_COMPARTIMENT[actif]} replace />;
}

function Porte() {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <PageChargement message="Chargement…" />;
  if (utilisateur) return <AccueilConnecte />;
  return <PresentationPage />;
}

export function App() {
  return (
    <>
    <AlerteMiseAJour />
    <Routes>
      <Route path="/" element={<Porte />} />
      <Route path="/connexion" element={<ConnexionPage />} />
      <Route path="/changer-mot-de-passe" element={<ChangerMdpPage />} />
      <Route
        element={
          <Prive>
            <AppShell />
          </Prive>
        }
      >
        <Route path="/depot" element={<DashboardDepotPage />} />
        <Route path="/depot/reception" element={<ReceptionPage />} />
        <Route path="/depot/lots" element={<LotsDepotPage />} />
        <Route path="/depot/zones" element={<ZonesDepotPage />} />
        <Route path="/depot/mouvements" element={<MouvementsDepotPage />} />
        <Route path="/depot/demandes" element={<DemandesDepotPage />} />
        <Route path="/production" element={<DashboardProductionPage />} />
        <Route path="/production/demandes-matiere" element={<DemandesMatierePage />} />
        <Route path="/production/journaux" element={<JournauxQuartPage />} />
        <Route path="/production/journaux/:id" element={<FicheJournalPage />} />
        <Route path="/production/ordres" element={<ListeOfPage />} />
        <Route path="/production/ordres/nouveau" element={<NouvelOfPage />} />
        <Route path="/production/ordres/:id" element={<FicheOfPage />} />
        <Route path="/production/matieres" element={<MatieresPage />} />
        <Route path="/production/depot" element={<Navigate to="/depot/lots" replace />} />
        <Route path="/production/arrivage" element={<Navigate to="/depot/reception" replace />} />
        <Route path="/production/nomenclatures" element={<NomenclaturesPage />} />
        <Route path="/production/lignes" element={<LignesPage />} />
        <Route path="/produits-finis" element={<DashboardPfPage />} />
        <Route path="/produits-finis/tanks" element={<TanksPage />} />
        <Route path="/produits-finis/produits" element={<CataloguePfPage />} />
        <Route path="/produits-finis/lots" element={<LotsPage />} />
        <Route path="/produits-finis/mouvements" element={<MouvementsPfPage />} />
        <Route path="/produits-finis/expeditions" element={<ExpeditionsPage />} />
        <Route path="/produits-finis/expeditions/:id" element={<FicheExpeditionPage />} />
        <Route path="/laboratoire" element={<DashboardLaboPage />} />
        <Route path="/laboratoire/echantillons" element={<EchantillonsPage />} />
        <Route path="/laboratoire/echantillons/:id" element={<FicheEchantillonPage />} />
        <Route path="/laboratoire/bulletins" element={<BulletinsPage />} />
        <Route path="/laboratoire/bulletins/:id" element={<FicheBulletinPage />} />
        <Route path="/laboratoire/non-conformites" element={<NonConformitesPage />} />
        <Route path="/direction" element={<DashboardDirectionPage />} />
        <Route path="/direction/achats" element={<DemandesAchatPage />} />
        <Route path="/maintenance" element={<DashboardPage />} />
        <Route path="/equipements" element={<ListeEquipementsPage />} />
        <Route path="/equipements/nouveau" element={<NouvelEquipementPage />} />
        <Route path="/equipements/:id" element={<FicheEquipementPage />} />
        <Route path="/demandes" element={<ListeDemandesPage />} />
        <Route path="/demandes/nouvelle" element={<NouvelleDemandePage />} />
        <Route path="/demandes/:id" element={<DetailDemandePage />} />
        <Route path="/ordres-travail" element={<ListeOtPage />} />
        <Route path="/ordres-travail/nouveau" element={<NouvelOtPage />} />
        <Route path="/ordres-travail/:id" element={<FicheOtPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/techniciens" element={<TechniciensPage />} />
        <Route path="/admin/utilisateurs" element={<UtilisateursPage />} />
        <Route path="/admin/audit" element={<AuditPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/parametres" element={<ParametresPage />} />
        <Route path="/terrain/scan" element={<ScanPage />} />
        <Route path="/terrain/sync" element={<SyncPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
