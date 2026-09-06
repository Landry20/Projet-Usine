import { Bouton } from './Bouton';
import { Modale } from './Modale';

export function ConfirmModale({
  titre = 'Confirmer la suppression',
  texte,
  chargement,
  onAnnuler,
  onConfirmer,
}: {
  titre?: string;
  texte: string;
  chargement?: boolean;
  onAnnuler: () => void;
  onConfirmer: () => void;
}) {
  return (
    <Modale titre={titre} texte={texte} onFermer={onAnnuler}>
      <div className="page-head-actions">
        <Bouton variante="ghost" onClick={onAnnuler}>
          Annuler
        </Bouton>
        <Bouton variante="danger" chargement={chargement} onClick={onConfirmer}>
          Oui, supprimer
        </Bouton>
      </div>
    </Modale>
  );
}
