import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface Ctx {
  enCours: boolean;
  demarrer: () => void;
  terminer: () => void;
}

const ChargementCtx = createContext<Ctx | null>(null);

/** Plus de barre jaune globale : le chargement se voit sur le bouton de l’action. */
export function ChargementProvider({ children }: { children: ReactNode }) {
  const [actifs, setActifs] = useState(0);

  const valeur = useMemo<Ctx>(
    () => ({
      enCours: actifs > 0,
      demarrer: () => setActifs((n) => n + 1),
      terminer: () => setActifs((n) => Math.max(0, n - 1)),
    }),
    [actifs],
  );

  return <ChargementCtx.Provider value={valeur}>{children}</ChargementCtx.Provider>;
}

export function useChargement() {
  const ctx = useContext(ChargementCtx);
  if (!ctx) throw new Error('useChargement hors provider');
  return ctx;
}
