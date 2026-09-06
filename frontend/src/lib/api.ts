/**
 * Connexion frontend → backend.
 * Toujours /v1 : Vite proxy en local, rewrite Vercel en production.
 */
import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'gmao.access';
const REFRESH_KEY = 'gmao.refresh';

const URL_BACKEND = import.meta.env.VITE_API_URL || '/v1';

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

type ConfigBouton = { _bouton?: HTMLButtonElement };

let dernierBouton: HTMLButtonElement | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'click',
    (e) => {
      const btn = (e.target as HTMLElement | null)?.closest('button.btn');
      dernierBouton = btn instanceof HTMLButtonElement ? btn : null;
    },
    true,
  );
}

function methodeEcriture(methode?: string) {
  const m = (methode ?? 'get').toLowerCase();
  return m === 'post' || m === 'put' || m === 'patch' || m === 'delete';
}

function poserSpinner(btn: HTMLButtonElement) {
  btn.classList.add('btn-busy');
  btn.disabled = true;
  const n = Number(btn.dataset.req ?? '0') + 1;
  btn.dataset.req = String(n);
  if (!btn.querySelector('.btn-spinner')) {
    const s = document.createElement('span');
    s.className = 'btn-spinner';
    s.setAttribute('aria-hidden', 'true');
    btn.prepend(s);
  }
}

function retirerSpinner(btn: HTMLButtonElement) {
  const n = Math.max(0, Number(btn.dataset.req ?? '1') - 1);
  btn.dataset.req = String(n);
  if (n > 0) return;
  btn.classList.remove('btn-busy');
  btn.disabled = false;
  btn.querySelectorAll('span.btn-spinner').forEach((el) => el.remove());
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const usine = sessionStorage.getItem('gmao.usine');
  if (usine) config.headers['X-Usine-Id'] = usine;
  const url = String(config.url ?? '');
  if (methodeEcriture(config.method) && dernierBouton && !url.includes('/auth/refresh') && !(config as ConfigBouton)._bouton) {
    (config as ConfigBouton)._bouton = dernierBouton;
    poserSpinner(dernierBouton);
  }
  return config;
});

api.interceptors.response.use(
  (r) => {
    const btn = (r.config as ConfigBouton)._bouton;
    if (btn) retirerSpinner(btn);
    return r;
  },
  async (erreur: AxiosError<{ message?: string }>) => {
    const original = erreur.config;
    const url = String(original?.url ?? '');
    const btnErreur = (original as ConfigBouton | undefined)?._bouton;
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      if (btnErreur) retirerSpinner(btnErreur);
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
    if (btnErreur) retirerSpinner(btnErreur);
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
