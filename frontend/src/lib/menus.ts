import {
  Boxes,
  ClipboardList,
  Factory,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Package,
  Settings,
  Shield,
  TestTube,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react';
import type { CodeCompartiment } from '../hooks/useCompartiment';

export type LienMenu = { to: string; label: string; perm?: string; Icon: typeof LayoutDashboard; end?: boolean };

export const MENUS: Record<CodeCompartiment, { exploitation: LienMenu[]; systeme?: LienMenu[] }> = {
  DEPOT: {
    exploitation: [
      { to: '/depot', label: 'Pilotage dépôt', Icon: LayoutDashboard, end: true },
      { to: '/depot/zones', label: 'Zones de dépôt', Icon: Warehouse },
      { to: '/depot/matieres', label: 'Matières premières', Icon: Package },
      { to: '/depot/reception', label: 'Réception MP', Icon: Truck },
      { to: '/depot/lots', label: 'Lots & palettes', Icon: Package },
      { to: '/depot/demandes-mp', label: 'Demande matière première', Icon: ClipboardList },
      { to: '/depot/mouvements', label: 'Entrées / sorties', Icon: ClipboardList },
      { to: '/depot/demandes', label: 'Demandes production', Icon: Factory },
    ],
  },
  PRODUCTION: {
    exploitation: [
      { to: '/production', label: 'Pilotage production', Icon: LayoutDashboard, end: true },
      { to: '/production/demandes-matiere', label: 'Demandes de matière', Icon: Package },
      { to: '/production/journaux', label: 'Journaux de quart', Icon: ClipboardList },
      { to: '/production/ordres', label: 'Ordres de fabrication', Icon: Factory },
      { to: '/production/matieres', label: 'Matières premières', Icon: Package },
      { to: '/production/nomenclatures', label: 'Nomenclatures', Icon: ClipboardList },
      { to: '/production/lignes', label: 'Lignes / machines', Icon: Settings },
    ],
  },
  PRODUITS_FINIS: {
    exploitation: [
      { to: '/produits-finis', label: 'Pilotage PF', Icon: LayoutDashboard, end: true },
      { to: '/produits-finis/tanks', label: 'Tanks & jaugeage', Icon: Warehouse },
      { to: '/produits-finis/produits', label: 'Catalogue PF', Icon: Boxes },
      { to: '/produits-finis/lots', label: 'Lots & traçabilité', Icon: Package },
      { to: '/produits-finis/mouvements', label: 'Mouvements stock', Icon: Warehouse },
      { to: '/produits-finis/expeditions', label: 'Expéditions / empotage', Icon: Truck },
    ],
  },
  LABORATOIRE: {
    exploitation: [
      { to: '/laboratoire', label: 'Pilotage laboratoire', Icon: LayoutDashboard, end: true },
      { to: '/laboratoire/echantillons', label: 'Échantillons', Icon: TestTube },
      { to: '/laboratoire/bulletins', label: 'Bulletins d’analyse', Icon: FlaskConical },
      { to: '/laboratoire/non-conformites', label: 'Non-conformités', Icon: ClipboardList },
    ],
  },
  DIRECTION: {
    exploitation: [
      { to: '/direction', label: 'Vue consolidée', Icon: LineChart, end: true },
      { to: '/direction/achats', label: 'Demandes MP / commandes', Icon: Package },
      { to: '/employes', label: 'Employés', perm: 'direction.lire', Icon: Users },
    ],
  },
  MAINTENANCE: {
    exploitation: [
      { to: '/maintenance', label: 'Pilotage maintenance', Icon: LayoutDashboard, end: true },
      { to: '/demandes', label: 'Demandes', perm: 'demande.lire', Icon: ClipboardList },
      { to: '/ordres-travail', label: 'Ordres de travail', perm: 'ot.lire', Icon: Wrench },
      { to: '/equipements', label: 'Équipements', perm: 'equipement.lire', Icon: Settings },
      { to: '/stock', label: 'Stock pièces', perm: 'stock.lire', Icon: Warehouse },
      { to: '/articles', label: 'Articles', perm: 'stock.lire', Icon: Package },
      { to: '/techniciens', label: 'Techniciens', perm: 'referentiel.lire', Icon: Users },
    ],
    systeme: [
      { to: '/employes', label: 'Employés', perm: 'direction.lire', Icon: Users },
      { to: '/admin/utilisateurs', label: 'Administration', perm: 'utilisateur.gerer', Icon: Shield },
      { to: '/admin/audit', label: "Journal d'audit", perm: 'audit.lire', Icon: Shield },
    ],
  },
};
