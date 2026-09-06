import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { LogoManuPro } from '../brand/LogoManuPro';
import { Bouton } from '../ui/Bouton';

async function viderCaches() {
  if (!('caches' in window)) return;
  const noms = await caches.keys();
  await Promise.all(noms.map((n) => caches.delete(n)));
}

export function AlerteMiseAJour() {
  const [visible, setVisible] = useState(false);
  const [appliquer, setAppliquer] = useState<(() => Promise<void> | void) | null>(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const lance = useRef(false);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setVisible(true);
        setAppliquer(() => async () => {
          await viderCaches();
          await update(true);
        });
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        const verifier = () => {
          void registration.update();
        };
        const id = window.setInterval(verifier, 20000);
        window.addEventListener('focus', verifier);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') verifier();
        });
        verifier();
        return () => window.clearInterval(id);
      },
    });
  }, []);

  async function lancer() {
    if (busy || lance.current) return;
    lance.current = true;
    setBusy(true);
    setPct(1);
    const debut = Date.now();
    const duree = 1400;
    const id = window.setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - debut) / duree) * 100));
      setPct(Math.max(1, p));
      if (p >= 100) window.clearInterval(id);
    }, 30);
    try {
      await appliquer?.();
    } finally {
      window.location.reload();
    }
  }

  useEffect(() => {
    if (!visible || !appliquer || busy) return;
    const t = window.setTimeout(() => void lancer(), 350);
    return () => window.clearTimeout(t);
  }, [visible, appliquer, busy]);

  if (!visible) return null;

  return (
    <div className="maj-overlay" role="dialog" aria-modal="true" aria-labelledby="maj-titre">
      <div className="maj-carte">
        <LogoManuPro className="maj-logo" />
        <h2 id="maj-titre">Nouvelle version disponible</h2>
        <p>ManuPro se met à jour et vide le cache pour afficher la dernière version.</p>
        <div className="maj-progress" aria-live="polite">
          <div className="maj-progress-bar" style={{ width: `${Math.max(pct, busy ? 8 : 0)}%` }} />
          <strong>{pct} %</strong>
        </div>
        <div className="maj-actions">
          <Bouton variante="gold" chargement={busy} onClick={() => void lancer()}>
            <RefreshCw size={16} />
            Mettre à jour
          </Bouton>
        </div>
      </div>
    </div>
  );
}
