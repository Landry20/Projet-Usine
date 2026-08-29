import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { TOKEN_KEY, assurerAccessValide, effacerSession } from '../lib/api';
import { authService } from '../services/auth.service';
import type { Utilisateur } from '../types';

interface AuthCtx {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  aPermission: (code: string) => boolean;
  connexion: (email: string, mdp: string) => Promise<Utilisateur>;
  deconnexion: () => Promise<void>;
  rafraichirProfil: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function restaurer() {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        setChargement(false);
        return;
      }
      const sessionOk = await assurerAccessValide();
      if (!sessionOk) {
        if (!ignore) {
          setUtilisateur(null);
          setChargement(false);
        }
        return;
      }
      try {
        const profil = await authService.moi();
        if (!ignore) setUtilisateur(profil);
      } catch {
        effacerSession();
        if (!ignore) setUtilisateur(null);
      } finally {
        if (!ignore) setChargement(false);
      }
    }
    void restaurer();
    return () => {
      ignore = true;
    };
  }, []);

  const valeur = useMemo<AuthCtx>(
    () => ({
      utilisateur,
      chargement,
      aPermission: (code) =>
        utilisateur?.role?.code === 'ADMIN' || (utilisateur?.permissions ?? []).includes(code),
      connexion: async (email, mdp) => {
        const session = await authService.connexion(email, mdp);
        setUtilisateur(session.utilisateur);
        return session.utilisateur;
      },
      deconnexion: async () => {
        await authService.deconnexion(sessionStorage.getItem('gmao.refresh') ?? undefined);
        setUtilisateur(null);
      },
      rafraichirProfil: async () => {
        setUtilisateur(await authService.moi());
      },
    }),
    [utilisateur, chargement],
  );

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
