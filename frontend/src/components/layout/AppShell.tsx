import { useEffect, useRef, useState } from 'react';
import {
  Boxes,
  Check,
  ChevronDown,
  Factory,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Package,
  QrCode,
  RefreshCw,
  ScanLine,
  Settings,
  UserRound,
  Warehouse,
  Wrench,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useActualisation } from '../../hooks/useActualisation';
import { useAuth } from '../../hooks/useAuth';
import { ACCUEIL_COMPARTIMENT, COMPARTIMENTS, useCompartiment, type CodeCompartiment } from '../../hooks/useCompartiment';
import { useUsine } from '../../hooks/useUsine';
import { MENUS } from '../../lib/menus';
import { InviteInstallation } from '../pwa/InviteInstallation';
import { SquelettePage } from '../ui/SquelettePage';

function initiales(prenom?: string | null, nom?: string) {
  return `${(prenom ?? '').charAt(0)}${(nom ?? '').charAt(0)}`.toUpperCase() || 'U';
}

export function AppShell() {
  const { utilisateur, aPermission, deconnexion } = useAuth();
  const { actif, disponibles, setActif } = useCompartiment();
  const { usineId } = useUsine();
  const { cleContenu, actualiserGlobal, mode } = useActualisation();
  const nav = useNavigate();
  const loc = useLocation();
  const menu = MENUS[actif];
  const visibles = (liens: typeof menu.exploitation) =>
    liens.filter((l) => !l.perm || aPermission(l.perm) || utilisateur?.role?.code === 'ADMIN');

  const [menuProfil, setMenuProfil] = useState(false);
  const [tiroir, setTiroir] = useState(false);
  const [transition, setTransition] = useState(false);
  const profilRef = useRef<HTMLDivElement>(null);
  const premier = useRef(true);

  useEffect(() => {
    setTiroir(false);
    setMenuProfil(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    setTransition(true);
    const t = window.setTimeout(() => setTransition(false), 480);
    return () => window.clearTimeout(t);
  }, [actif]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', tiroir);
    return () => document.body.classList.remove('no-scroll');
  }, [tiroir]);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setTiroir(false);
    }
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  useEffect(() => {
    function dehors(e: MouseEvent) {
      if (profilRef.current && !profilRef.current.contains(e.target as Node)) setMenuProfil(false);
    }
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  return (
    <div className="app-shell">
      {tiroir && <button type="button" className="sidebar-backdrop" aria-label="Fermer le menu" onClick={() => setTiroir(false)} />}
      <aside className={`sidebar ${tiroir ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-row">
            <div>
              <div className="brand-kicker">{COMPARTIMENTS.find((c) => c.code === actif)?.kicker}</div>
              <h1>ManuPro</h1>
            </div>
            <button type="button" className="sidebar-close" aria-label="Fermer le menu" onClick={() => setTiroir(false)}>
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-group">Exploitation</div>
          {visibles(menu.exploitation).map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setTiroir(false)}>
              <l.Icon size={17} strokeWidth={1.9} />
              {l.label}
            </NavLink>
          ))}
          {visibles(MENUS.MAINTENANCE.systeme ?? []).length > 0 && (
            <>
              <div className="nav-group">Système</div>
              {visibles(MENUS.MAINTENANCE.systeme ?? []).map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setTiroir(false)}>
                  <l.Icon size={17} strokeWidth={1.9} />
                  {l.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-install">
          <InviteInstallation />
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <button type="button" className="icon-btn btn-menu" aria-label="Ouvrir le menu" onClick={() => setTiroir(true)}>
              <Menu size={18} />
            </button>
            <h2>{titrePage(loc.pathname)}</h2>
          </div>
          <div className="compartiment-choix">
            <nav className="compartiment-switch" aria-label="Compartiments">
              {COMPARTIMENTS.filter((c) => disponibles.includes(c.code)).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={c.code === actif ? 'active' : ''}
                  onClick={() => {
                    setActif(c.code);
                    nav(ACCUEIL_COMPARTIMENT[c.code]);
                  }}
                >
                  {iconeCompartiment(c.code)}
                  <span className="switch-label">{c.label}</span>
                </button>
              ))}
            </nav>
            {disponibles.length > 1 && <SelectCompartiment />}
          </div>
          <div className="topbar-actions">
            <SelectUsine />
            {actif === 'MAINTENANCE' && (
              <NavLink to="/terrain/scan" className="btn btn-gold btn-scan">
                <QrCode size={16} />
                <span className="btn-txt">Scanner</span>
              </NavLink>
            )}
            <button
              type="button"
              className={`icon-btn ${mode === 'global' ? 'spinning' : ''}`}
              title="Actualisation globale"
              onClick={actualiserGlobal}
            >
              <RefreshCw size={17} />
            </button>
            <div className="profil-wrap" ref={profilRef}>
              <button type="button" className="profil-btn" title="Mon compte" onClick={() => setMenuProfil((v) => !v)}>
                <span className="avatar">{initiales(utilisateur?.prenom, utilisateur?.nom)}</span>
              </button>
              {menuProfil && (
                <div className="profil-menu">
                  <div className="profil-menu-head">
                    <span className="avatar">{initiales(utilisateur?.prenom, utilisateur?.nom)}</span>
                    <div>
                      <strong>
                        {utilisateur?.prenom} {utilisateur?.nom}
                      </strong>
                      <span>{utilisateur?.role?.libelle}</span>
                      <span>{utilisateur?.email}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuProfil(false);
                      nav('/profil');
                    }}
                  >
                    <UserRound size={16} />
                    Mon profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuProfil(false);
                      nav('/parametres');
                    }}
                  >
                    <Settings size={16} />
                    Paramètres
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={async () => {
                      setMenuProfil(false);
                      await deconnexion();
                      nav('/');
                    }}
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={`content ${mode === 'contenu' ? 'content-refresh' : ''}`}>
          {transition ? <SquelettePage /> : <Outlet key={`${cleContenu}-${usineId ?? 'all'}`} />}
        </div>
      </div>
      <nav className="mobile-nav">
        {actif === 'MAINTENANCE' ? (
          <>
            <NavLink to="/maintenance" end>
              <LayoutDashboard size={18} />
              Accueil
            </NavLink>
            <NavLink to="/ordres-travail">
              <Wrench size={18} />
              OT
            </NavLink>
            <NavLink to="/terrain/scan">
              <ScanLine size={18} />
              QR
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        ) : actif === 'LABORATOIRE' ? (
          <>
            <NavLink to="/laboratoire" end>
              <LayoutDashboard size={18} />
              Accueil
            </NavLink>
            <NavLink to="/laboratoire/bulletins">
              <FlaskConical size={18} />
              Labo
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        ) : actif === 'DIRECTION' ? (
          <>
            <NavLink to="/direction" end>
              <LineChart size={18} />
              Pilotage
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        ) : actif === 'DEPOT' ? (
          <>
            <NavLink to="/depot" end>
              <LayoutDashboard size={18} />
              Accueil
            </NavLink>
            <NavLink to="/depot/reception">
              <Package size={18} />
              Réception
            </NavLink>
            <NavLink to="/depot/lots">
              <Warehouse size={18} />
              Lots
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        ) : actif === 'PRODUCTION' ? (
          <>
            <NavLink to="/production" end>
              <LayoutDashboard size={18} />
              Accueil
            </NavLink>
            <NavLink to="/production/ordres">
              <Factory size={18} />
              OF
            </NavLink>
            <NavLink to="/production/matieres">
              <Package size={18} />
              Matières
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        ) : (
          <>
            <NavLink to="/produits-finis" end>
              <LayoutDashboard size={18} />
              Accueil
            </NavLink>
            <NavLink to="/produits-finis/lots">
              <Package size={18} />
              Lots
            </NavLink>
            <button type="button" onClick={() => setTiroir(true)}>
              <Menu size={18} />
              Menu
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

function iconeCompartiment(code: CodeCompartiment) {
  if (code === 'DEPOT') return <Warehouse size={16} />;
  if (code === 'PRODUCTION') return <Factory size={16} />;
  if (code === 'PRODUITS_FINIS') return <Boxes size={16} />;
  if (code === 'LABORATOIRE') return <FlaskConical size={16} />;
  if (code === 'DIRECTION') return <LineChart size={16} />;
  return <Wrench size={16} />;
}

function SelectUsine() {
  const { usineId, usines, setUsineId, peutChanger } = useUsine();
  const actuelle = usines.find((u) => u.id === usineId);
  if (!usines.length) return null;
  if (!peutChanger) {
    return actuelle ? <span className="usine-fixe">{actuelle.libelle}</span> : null;
  }
  return (
    <label className="usine-select">
      <Warehouse size={14} />
      <select
        value={usineId ?? ''}
        onChange={(e) => setUsineId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Toutes les usines</option>
        {usines.map((u) => (
          <option key={u.id} value={u.id}>
            {u.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectCompartiment() {
  const { actif, disponibles, setActif } = useCompartiment();
  const nav = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const racine = useRef<HTMLDivElement>(null);
  const choix = COMPARTIMENTS.filter((c) => disponibles.includes(c.code));
  const actuel = choix.find((c) => c.code === actif);

  useEffect(() => {
    function dehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  return (
    <div className={`sel compartiment-select ${ouvert ? 'open' : ''}`} ref={racine}>
      <button
        type="button"
        className="sel-btn has-ico"
        aria-label="Choisir un compartiment"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <span className="sel-ico">{iconeCompartiment(actif)}</span>
        <span className="sel-val">{actuel?.label}</span>
        <ChevronDown size={16} className="sel-chevron" />
      </button>
      {ouvert && (
        <ul className="sel-liste" role="listbox">
          {choix.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                role="option"
                aria-selected={c.code === actif}
                className={`sel-opt ${c.code === actif ? 'active' : ''}`}
                onClick={() => {
                  setActif(c.code);
                  nav(ACCUEIL_COMPARTIMENT[c.code]);
                  setOuvert(false);
                }}
              >
                <span className="sel-opt-ligne">
                  {iconeCompartiment(c.code)}
                  {c.label}
                </span>
                {c.code === actif && <Check size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function titrePage(path: string) {
  if (path.startsWith('/profil')) return 'Mon profil';
  if (path.startsWith('/parametres')) return 'Paramètres';
  if (path.startsWith('/production/demandes-matiere')) return 'Demandes de matière';
  if (path.startsWith('/production/journaux')) return 'Journaux de quart';
  if (path.startsWith('/production/ordres')) return 'Ordres de fabrication';
  if (path.startsWith('/depot/reception')) return 'Réception MP';
  if (path.startsWith('/depot/lots')) return 'Lots & palettes';
  if (path.startsWith('/depot/zones')) return 'Zones de dépôt';
  if (path.startsWith('/depot/matieres')) return 'Matières premières';
  if (path.startsWith('/depot/demandes-mp')) return 'Demande matière première';
  if (path.startsWith('/depot/mouvements')) return 'Mouvements dépôt';
  if (path.startsWith('/depot/demandes')) return 'Demandes production';
  if (path.startsWith('/depot')) return 'Dépôts & matières premières';
  if (path.startsWith('/production/matieres')) return 'Matières premières';
  if (path.startsWith('/direction/achats')) return 'Demandes MP / commandes';
  if (path.startsWith('/production/nomenclatures')) return 'Nomenclatures';
  if (path.startsWith('/production/lignes')) return 'Lignes de production';
  if (path.startsWith('/production')) return 'Gestion de production';
  if (path.startsWith('/produits-finis/tanks')) return 'Tanks et jaugeage';
  if (path.startsWith('/produits-finis/lots')) return 'Lots et traçabilité';
  if (path.startsWith('/produits-finis/mouvements')) return 'Mouvements produits';
  if (path.startsWith('/produits-finis/expeditions')) return 'Expéditions';
  if (path.startsWith('/produits-finis/produits')) return 'Catalogue produits finis';
  if (path.startsWith('/produits-finis')) return 'Gestion des produits finis';
  if (path.startsWith('/laboratoire/echantillons')) return 'Échantillons';
  if (path.startsWith('/laboratoire/bulletins')) return 'Bulletins d’analyse';
  if (path.startsWith('/laboratoire/non-conformites')) return 'Non-conformités';
  if (path.startsWith('/laboratoire')) return 'Laboratoire et qualité';
  if (path.startsWith('/direction')) return 'Pilotage direction';
  if (path === '/maintenance' || path === '/') return 'Gestion de maintenance';
  if (path.startsWith('/demandes')) return "Demandes d'intervention";
  if (path.startsWith('/ordres-travail')) return 'Ordres de travail';
  if (path.startsWith('/equipements')) return 'Parc équipements';
  if (path.startsWith('/stock')) return 'Stock pièces de rechange';
  if (path.startsWith('/articles')) return 'Articles maintenance';
  if (path.startsWith('/techniciens')) return 'Techniciens';
  if (path.startsWith('/admin/audit')) return "Journal d'audit";
  if (path.startsWith('/admin')) return 'Administration';
  if (path.startsWith('/terrain')) return 'Terrain';
  return 'Application industrielle';
}
