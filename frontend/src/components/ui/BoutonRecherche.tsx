import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Settings, UserRound, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCompartiment } from '../../hooks/useCompartiment';
import { MENUS } from '../../lib/menus';

/** Recherche d’écrans dans le contenu de la page — pas dans la barre fixe. */
export function BoutonRecherche() {
  const { utilisateur, aPermission } = useAuth();
  const { actif } = useCompartiment();
  const nav = useNavigate();
  const loc = useLocation();
  const [ouvert, setOuvert] = useState(false);
  const [motCle, setMotCle] = useState('');
  const champ = useRef<HTMLInputElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const menu = MENUS[actif];

  const catalogue = useMemo(
    () =>
      [...menu.exploitation, ...(MENUS.MAINTENANCE.systeme ?? [])]
        .filter((l) => !l.perm || aPermission(l.perm) || utilisateur?.role?.code === 'ADMIN')
        .concat([
          { to: '/profil', label: 'Mon profil', Icon: UserRound },
          { to: '/parametres', label: 'Paramètres', Icon: Settings },
        ]),
    [actif, utilisateur, aPermission, menu.exploitation],
  );

  const resultats = catalogue.filter((l) => l.label.toLowerCase().includes(motCle.trim().toLowerCase()));

  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);

  useEffect(() => {
    setOuvert(false);
    setMotCle('');
  }, [loc.pathname]);

  useEffect(() => {
    function dehors(e: MouseEvent) {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(false);
        setMotCle('');
      }
    }
    document.addEventListener('mousedown', dehors);
    return () => document.removeEventListener('mousedown', dehors);
  }, []);

  return (
    <div className="recherche-page" ref={racine}>
      <button
        type="button"
        className={`btn btn-ghost ${ouvert ? 'on' : ''}`}
        onClick={() => setOuvert((v) => !v)}
      >
        <Search size={16} />
        Rechercher
      </button>
      {ouvert && (
        <div className="recherche-barre recherche-barre-page">
          <Search size={16} />
          <input
            ref={champ}
            value={motCle}
            onChange={(e) => setMotCle(e.target.value)}
            placeholder="Mot-clé : OF, lots, demandes, stock…"
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Fermer la recherche"
            onClick={() => {
              setMotCle('');
              setOuvert(false);
            }}
          >
            <X size={16} />
          </button>
          {motCle.trim() && (
            <div className="recherche-liste">
              {resultats.length === 0 && <p>Aucun écran ne correspond.</p>}
              {resultats.map((r) => (
                <button
                  key={r.to}
                  type="button"
                  onClick={() => {
                    nav(r.to);
                    setOuvert(false);
                    setMotCle('');
                  }}
                >
                  <r.Icon size={16} />
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
