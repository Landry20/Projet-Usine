import { libelleStatut } from '../../lib/libelles';

export function Badge({ valeur }: { valeur?: string | null }) {
  if (!valeur) return <span>—</span>;
  return <span className={`badge b-${valeur}`}>{libelleStatut(valeur)}</span>;
}
