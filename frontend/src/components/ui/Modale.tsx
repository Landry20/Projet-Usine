import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modale({
  titre,
  texte,
  onFermer,
  children,
}: {
  titre: string;
  texte?: string;
  onFermer: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') onFermer();
    }
    document.addEventListener('keydown', esc);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('no-scroll');
    };
  }, [onFermer]);

  return (
    <div className="modale-fond" onClick={onFermer} role="presentation">
      <div className="modale" role="dialog" aria-modal="true" aria-labelledby="modale-titre" onClick={(e) => e.stopPropagation()}>
        <div className="modale-h">
          <div>
            <h3 id="modale-titre">{titre}</h3>
            {texte && <p>{texte}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Fermer" onClick={onFermer}>
            <X size={16} />
          </button>
        </div>
        <div className="modale-b">{children}</div>
      </div>
    </div>
  );
}
