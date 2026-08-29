import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Mode = 'aucun' | 'contenu' | 'global';

interface Ctx {
  cleContenu: number;
  mode: Mode;
  actualiserContenu: () => void;
  actualiserGlobal: () => void;
}

const C = createContext<Ctx | null>(null);

export function ActualisationProvider({ children }: { children: ReactNode }) {
  const [cleContenu, setCle] = useState(0);
  const [mode, setMode] = useState<Mode>('aucun');

  const relancer = useCallback((suivant: Mode) => {
    setMode(suivant);
    setCle((n) => n + 1);
    window.setTimeout(() => setMode('aucun'), suivant === 'global' ? 900 : 700);
  }, []);

  const valeur = useMemo<Ctx>(
    () => ({
      cleContenu,
      mode,
      actualiserContenu: () => relancer('contenu'),
      actualiserGlobal: () => relancer('global'),
    }),
    [cleContenu, mode, relancer],
  );

  return <C.Provider value={valeur}>{children}</C.Provider>;
}

export function useActualisation() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useActualisation hors provider');
  return ctx;
}
