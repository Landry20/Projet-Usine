import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { BarreChargement } from '../components/ui/PageChargement';

interface Ctx {
  enCours: boolean;
  demarrer: () => void;
  terminer: () => void;
}

const ChargementCtx = createContext<Ctx | null>(null);

/** Compteur d'appels API : affiche une barre globale sans bloquer l'écran. */
export function ChargementProvider({ children }: { children: ReactNode }) {
  const [actifs, setActifs] = useState(0);

  useEffect(() => {
    const req = api.interceptors.request.use((config) => {
      setActifs((n) => n + 1);
      return config;
    });
    const res = api.interceptors.response.use(
      (r) => {
        setActifs((n) => Math.max(0, n - 1));
        return r;
      },
      (err) => {
        setActifs((n) => Math.max(0, n - 1));
        return Promise.reject(err);
      },
    );
    return () => {
      api.interceptors.request.eject(req);
      api.interceptors.response.eject(res);
    };
  }, []);

  const valeur = useMemo<Ctx>(
    () => ({
      enCours: actifs > 0,
      demarrer: () => setActifs((n) => n + 1),
      terminer: () => setActifs((n) => Math.max(0, n - 1)),
    }),
    [actifs],
  );

  return (
    <ChargementCtx.Provider value={valeur}>
      <BarreChargement visible={valeur.enCours} />
      {children}
    </ChargementCtx.Provider>
  );
}

export function useChargement() {
  const ctx = useContext(ChargementCtx);
  if (!ctx) throw new Error('useChargement hors provider');
  return ctx;
}
