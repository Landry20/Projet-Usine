import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { LogoManuPro } from '../brand/LogoManuPro';
import { Bouton } from '../ui/Bouton';

export function AlerteMiseAJour() {
  const [visible, setVisible] = useState(false);
  const [appliquer, setAppliquer] = useState<(() => void) | null>(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setVisible(true);
        setAppliquer(() => () => update(true));
      },
    });
  }, []);

  function lancer() {
    if (busy) return;
    setBusy(true);
    setPct(1);
    const debut = Date.now();
    const duree = 1600;
    const id = window.setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - debut) / duree) * 100));
      setPct(Math.max(1, p));
      if (p >= 100) {
        window.clearInterval(id);
        appliquer?.();
        window.location.reload();
      }
    }, 30);
  }

  if (!visible) return null;

  return (
    <div className="maj-overlay" role="dialog" aria-modal="true" aria-labelledby="maj-titre">
      <div className="maj-carte">
        <LogoManuPro className="maj-logo" />
        <h2 id="maj-titre">Nouvelle version disponible</h2>
        <p>ManuPro a été mise à jour. Rechargez pour obtenir les dernières fonctionnalités.</p>
        {busy && (
          <div className="maj-progress" aria-live="polite">
            <div className="maj-progress-bar" style={{ width: `${pct}%` }} />
            <strong>{pct} %</strong>
          </div>
        )}
        <div className="maj-actions">
          <Bouton variante="ghost" disabled={busy} onClick={() => setVisible(false)}>
            Plus tard
          </Bouton>
          <Bouton variante="gold" chargement={busy} onClick={lancer}>
            <RefreshCw size={16} />
            Mettre à jour
          </Bouton>
        </div>
      </div>
    </div>
  );
}
