import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './useAuth';
import { authService } from '../services/auth.service';
import { metier } from '../services/metier.service';
import type { Site } from '../types';

const CLE = 'gmao.usine';

interface Ctx {
  usineId: number | null;
  usines: Site[];
  setUsineId: (id: number | null) => void;
  rafraichirUsines: () => Promise<void>;
  peutChanger: boolean;
  pret: boolean;
}

const C = createContext<Ctx | null>(null);

export function UsineProvider({ children }: { children: ReactNode }) {
  const { utilisateur } = useAuth();
  const [usines, setUsines] = useState<Site[]>([]);
  const [usineId, setEtat] = useState<number | null>(null);
  const [pret, setPret] = useState(false);
  const role = utilisateur?.role?.code;
  const peutChanger = ['ADMIN', 'DIRECTION_GENERALE'].includes(role ?? '');

  async function rafraichirUsines() {
    try {
      setUsines(await metier.usines());
    } catch {
      setUsines([]);
    }
  }

  useEffect(() => {
    if (!utilisateur) {
      setUsines([]);
      setPret(false);
      return;
    }
    void rafraichirUsines().finally(() => setPret(true));
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
    else if (utilisateur.siteId) setEtat(utilisateur.siteId);
    else setEtat(null);
  }, [utilisateur?.id, utilisateur?.siteId, peutChanger]);

  const valeur = useMemo<Ctx>(
    () => ({
      usineId,
      usines,
      peutChanger,
      pret,
      rafraichirUsines,
      setUsineId: (id) => {
        setEtat(id);
        if (id) sessionStorage.setItem(CLE, String(id));
        else sessionStorage.removeItem(CLE);
        if (peutChanger && id) void authService.choisirSite(id).catch(() => undefined);
      },
    }),
    [usineId, usines, peutChanger, pret],
  );

  return <C.Provider value={valeur}>{children}</C.Provider>;
}

export function useUsine() {
  const ctx = useContext(C);
  if (!ctx) throw new Error('useUsine hors provider');
  return ctx;
}
