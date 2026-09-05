import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { metier } from '../services/metier.service';
import type { Site } from '../types';

const CLE = 'gmao.usine';

interface Ctx {
  usineId: number | null;
  usines: Site[];
  setUsineId: (id: number | null) => void;
  peutChanger: boolean;
}

const C = createContext<Ctx | null>(null);

export function UsineProvider({ children }: { children: ReactNode }) {
  const { utilisateur } = useAuth();
  const [usines, setUsines] = useState<Site[]>([]);
  const [usineId, setEtat] = useState<number | null>(null);
  const role = utilisateur?.role?.code;
  const peutChanger = ['ADMIN', 'DIRECTION', 'DIRECTION_GENERALE', 'CHEF_USINE'].includes(role ?? '');

  useEffect(() => {
    metier.usines().then(setUsines).catch(() => setUsines([]));
  }, [utilisateur?.id]);

  useEffect(() => {
    if (!utilisateur) return;
    if (!peutChanger) {
      const fixe = utilisateur.siteId ?? null;
      setEtat(fixe);
      if (fixe) sessionStorage.setItem(CLE, String(fixe));
      else sessionStorage.removeItem(CLE);
      return;
    }
    const sauve = Number(sessionStorage.getItem(CLE));
    if (Number.isFinite(sauve) && sauve > 0) setEtat(sauve);
    else setEtat(utilisateur.siteId ?? null);
  }, [utilisateur?.id, utilisateur?.siteId, peutChanger]);

  const valeur = useMemo<Ctx>(
    () => ({
      usineId,
      usines,
      peutChanger,
      setUsineId: (id) => {
        setEtat(id);
        if (id) sessionStorage.setItem(CLE, String(id));
        else sessionStorage.removeItem(CLE);
      },
    }),
    [usineId, usines, peutChanger],
  );

  return <C.Provider value={valeur}>{children}</C.Provider>;
}

export function useUsine() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useUsine hors provider');
  return ctx;
}
