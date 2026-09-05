/**
 * Connexion frontend → backend.
 * En local, Vite proxy /v1 vers http://127.0.0.1:4000.
 * En production, l’API est sur le projet Vercel backend.
 */
import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'gmao.access';
const REFRESH_KEY = 'gmao.refresh';

const URL_BACKEND =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://projet-usineapi.vercel.app/v1' : '/v1');

export const api = axios.create({
  baseURL: URL_BACKEND,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

function payloadJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)) as { exp?: number };
  } catch {
    return null;
  }
}

function accessExpireBientot(token: string, margeSec = 20): boolean {
  const p = payloadJwt(token);
  if (!p?.exp) return true;
  return p.exp * 1000 <= Date.now() + margeSec * 1000;
}

function pagePublique() {
  const p = window.location.pathname;
  return p === '/' || p.startsWith('/connexion');
}

function oublierSessionEtQuitter() {
  effacerSession();
  if (!pagePublique()) window.location.href = '/connexion';
}

let renouvellementEnCours: Promise<boolean> | null = null;

/** Renouvelle l’access token si besoin. Évite un 401 visible sur /auth/me. */
export async function assurerAccessValide(): Promise<boolean> {
  const access = sessionStorage.getItem(TOKEN_KEY);
  const refresh = sessionStorage.getItem(REFRESH_KEY);
  if (access && !accessExpireBientot(access)) return true;
  if (!refresh) {
    effacerSession();
    return false;
  }
  if (!renouvellementEnCours) {
    renouvellementEnCours = axios
      .post<{ accessToken: string; refreshToken?: string }>(
        `${URL_BACKEND}/auth/refresh`,
        { refreshToken: refresh },
      )
      .then(({ data }) => {
        sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
        return true;
      })
      .catch(() => {
        effacerSession();
        return false;
      })
      .finally(() => {
        renouvellementEnCours = null;
      });
  }
  return renouvellementEnCours;
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (erreur: AxiosError<{ message?: string }>) => {
    const original = erreur.config;
    const url = String(original?.url ?? '');
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(erreur);
    }
    if (erreur.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      const ok = await assurerAccessValide();
      if (ok) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${sessionStorage.getItem(TOKEN_KEY)}`;
        return api(original);
      }
      oublierSessionEtQuitter();
    }
    return Promise.reject(erreur);
  },
);

export function enregistrerSession(access: string, refresh: string) {
  sessionStorage.setItem(TOKEN_KEY, access);
  sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function effacerSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function messageApi(err: unknown): string {
  const ax = err as AxiosError<{ message?: string }>;
  return ax.response?.data?.message ?? 'Une erreur est survenue. Réessayez.';
}

export { TOKEN_KEY, REFRESH_KEY };
