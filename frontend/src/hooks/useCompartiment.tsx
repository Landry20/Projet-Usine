import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';

export type CodeCompartiment = 'PRODUCTION' | 'PRODUITS_FINIS' | 'LABORATOIRE' | 'MAINTENANCE' | 'DIRECTION';

export const COMPARTIMENTS: { code: CodeCompartiment; label: string; kicker: string }[] = [
  { code: 'PRODUCTION', label: 'Production', kicker: 'Bilan matière' },
  { code: 'PRODUITS_FINIS', label: 'Produit fini', kicker: 'Tanks & expéditions' },
  { code: 'LABORATOIRE', label: 'Laboratoire', kicker: 'Qualité' },
  { code: 'MAINTENANCE', label: 'Maintenance', kicker: 'GMAO' },
  { code: 'DIRECTION', label: 'Direction', kicker: 'Pilotage' },
];

export const ACCUEIL_COMPARTIMENT: Record<CodeCompartiment, string> = {
  PRODUCTION: '/production',
  PRODUITS_FINIS: '/produits-finis',
  LABORATOIRE: '/laboratoire',
  MAINTENANCE: '/maintenance',
  DIRECTION: '/direction',
};

const CLE = 'gmao.compartiment';

interface Ctx {
  actif: CodeCompartiment;
  disponibles: CodeCompartiment[];
  setActif: (c: CodeCompartiment) => void;
}

const C = createContext<Ctx | null>(null);

export function CompartimentProvider({ children }: { children: ReactNode }) {
  const { utilisateur } = useAuth();
  const disponibles = (utilisateur?.compartiments?.length
    ? utilisateur.compartiments
    : ['MAINTENANCE']) as CodeCompartiment[];
  const [actif, setActifEtat] = useState<CodeCompartiment>(disponibles[0]);

  useEffect(() => {
    const sauve = sessionStorage.getItem(CLE) as CodeCompartiment | null;
    if (sauve && disponibles.includes(sauve)) setActifEtat(sauve);
    else setActifEtat(disponibles[0]);
  }, [utilisateur?.id, disponibles.join('|')]);

  const valeur = useMemo<Ctx>(
    () => ({
      actif,
      disponibles,
      setActif: (c) => {
        if (!disponibles.includes(c)) return;
        sessionStorage.setItem(CLE, c);
        setActifEtat(c);
      },
    }),
    [actif, disponibles],
  );

  return <C.Provider value={valeur}>{children}</C.Provider>;
}

export function useCompartiment() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useCompartiment hors provider');
  return ctx;
}
