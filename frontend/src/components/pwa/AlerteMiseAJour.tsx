import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { LogoManuPro } from '../brand/LogoManuPro';

/**
 * Popup quand une nouvelle version de l’application est disponible (PWA / cache).
 */
export function AlerteMiseAJour() {
  const [visible, setVisible] = useState(false);
  const [appliquer, setAppliquer] = useState<(() => void) | null>(null);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setVisible(true);
        setAppliquer(() => () => update(true));
      },
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="maj-overlay" role="dialog" aria-modal="true" aria-labelledby="maj-titre">
      <div className="maj-carte">
        <LogoManuPro className="maj-logo" />
        <h2 id="maj-titre">Nouvelle version disponible</h2>
        <p>ManuPro a été mise à jour. Rechargez pour obtenir les dernières fonctionnalités et corrections.</p>
        <div className="maj-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setVisible(false)}>
            Plus tard
          </button>
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => {
              appliquer?.();
              window.location.reload();
            }}
          >
            <RefreshCw size={16} />
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  );
}
