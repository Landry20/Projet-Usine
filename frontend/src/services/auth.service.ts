import { api, enregistrerSession, effacerSession } from '../lib/api';
import type { SessionAuth, Utilisateur } from '../types';

/** Service d'authentification — aucune règle métier, uniquement l'appel API. */
export const authService = {
  async connexion(email: string, motDePasse: string): Promise<SessionAuth> {
    const { data } = await api.post<SessionAuth>('/auth/login', { email, motDePasse });
    enregistrerSession(data.accessToken, data.refreshToken);
    return data;
  },
  async moi(): Promise<Utilisateur> {
    const { data } = await api.get<Utilisateur>('/auth/me');
    return data;
  },
  async deconnexion(refreshToken?: string) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      effacerSession();
    }
  },
  async changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string) {
    const { data } = await api.post('/auth/changer-mot-de-passe', { ancienMotDePasse, nouveauMotDePasse });
    return data as { message: string };
  },
  async majProfil(payload: { nom: string; prenom?: string; telephone?: string }) {
    const { data } = await api.patch<Utilisateur>('/auth/profil', payload);
    return data;
  },
};
