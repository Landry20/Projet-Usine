import { RefreshCw } from 'lucide-react';
import { useActualisation } from '../../hooks/useActualisation';

/** Actualise uniquement le contenu de l’écran ouvert — pas le menu fixe. */
export function BoutonActualiser() {
  const { mode, actualiserContenu } = useActualisation();
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-actualiser ${mode === 'contenu' ? 'spinning' : ''}`}
      onClick={actualiserContenu}
    >
      <RefreshCw size={16} />
      Actualiser
    </button>
  );
}
