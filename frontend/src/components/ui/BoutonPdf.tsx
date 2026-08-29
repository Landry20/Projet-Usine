import { FileDown } from 'lucide-react';
import { telechargerRapportPdf, type RapportPdf } from '../../lib/pdf';

export function BoutonPdf({ rapport, compact }: { rapport: RapportPdf; compact?: boolean }) {
  return (
    <button type="button" className={`btn ${compact ? 'btn-ghost btn-sm' : 'btn-ghost'}`} onClick={() => telechargerRapportPdf(rapport)}>
      <FileDown size={15} />
      {compact ? 'PDF' : 'Télécharger le rapport PDF'}
    </button>
  );
}
