import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { CourbesEvolution } from '../../components/ui/CourbesEvolution';
import { useAuth } from '../../hooks/useAuth';
import { fcfa } from '../../lib/libelles';
import { metier } from '../../services/metier.service';
import type { DashboardData } from '../../types';

export function DashboardPage() {
  const { utilisateur } = useAuth();
  const [d, setD] = useState<DashboardData | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    metier.dashboard().then(setD).catch(() => setErr('Impossible de charger les indicateurs serveur.'));
  }, []);

  if (err) return <div className="alert alert-err">{err}</div>;
  if (!d) return <p>Chargement du tableau de bord…</p>;

  const role = utilisateur?.role?.code;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Bonjour {utilisateur?.prenom}</h2>
          <p>Indicateurs et courbes calculés par l’API.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          rapport={{
            titre: 'Rapport maintenance',
            compartiment: 'Maintenance',
            colonnes: ['N°', 'Équipement', 'Priorité', 'Statut', 'Technicien'],
            lignes: (role === 'TECH' ? d.mesOt : d.interventionsDuJour).map((o) => [
              o.numero,
              `${o.equipement?.codeEquipement ?? ''} ${o.equipement?.designation ?? ''}`,
              o.priorite,
              o.statut,
              o.technicienResponsable?.nomPrenom ?? '—',
            ]),
            nomFichier: 'rapport-maintenance.pdf',
          }}
        />
        </div>
      </div>

      <div className="kpis">
        {(role === 'RESP_MAINT' || role === 'ADMIN' || role === 'PLANIF') && (
          <>
            <Kpi label="Demandes à traiter" value={d.demandesAttente} hint="Nouvelles DI" alert={d.demandesAttente > 0} />
            <Kpi label="OT ouverts" value={d.otOuverts} />
            <Kpi label="OT en retard" value={d.otRetard} alert={d.otRetard > 0} />
            <Kpi label="Coût maintenance" value={fcfa(d.coutMaintenance)} hint="OT clôturés" />
          </>
        )}
        {role === 'TECH' && (
          <>
            <Kpi label="Mes OT" value={d.mesOt.length} />
            <Kpi label="OT en retard" value={d.otRetard} alert={d.otRetard > 0} />
            <Kpi label="Demandes pièces" value={d.demandesPieces} />
            <Kpi label="Scanner" value="QR" hint="Accès terrain" />
          </>
        )}
        {role === 'MAGASIN' && (
          <>
            <Kpi label="Stock critique" value={d.stockCritique} alert={d.stockCritique > 0} />
            <Kpi label="Demandes de pièces" value={d.demandesPieces} warn={d.demandesPieces > 0} />
            <Kpi label="Valeur du stock" value={fcfa(d.valeurStock)} />
            <Kpi label="Articles sous seuil" value={d.stockCritique} />
          </>
        )}
        {(role === 'DIRECTION' || role === 'QHSE') && (
          <>
            <Kpi label="Disponibilité" value={`${d.tauxDisponibilite} %`} hint="Cible ≥ 95 %" ok />
            <Kpi label="MTBF" value={d.mtbf != null ? `${d.mtbf} h` : '—'} />
            <Kpi label="MTTR" value={`${d.mttr} h`} />
            <Kpi label="Préventif / total" value={`${d.ratioPreventif} %`} hint="Cible 70 %" />
          </>
        )}
        {role === 'ADMIN' && (
          <>
            <Kpi label="Équipements" value={d.nbEquipements} />
            <Kpi label="Utilisateurs actifs" value={d.nbUtilisateurs} />
            <Kpi label="Stock critique" value={d.stockCritique} />
            <Kpi label="Valeur stock" value={fcfa(d.valeurStock)} />
          </>
        )}
        {role === 'DEMANDEUR' && (
          <>
            <Kpi label="Mes demandes" value={d.demandesAttente} />
            <Kpi label="Équipements" value={d.nbEquipements} />
          </>
        )}
      </div>

      {d.series && (
        <CourbesEvolution
          series={d.series}
          titreActivite="OT ouverts par mois"
          titreVolume="Coût maintenance par mois (FCFA)"
        />
      )}

      <div className="card">
        <div className="card-h">
          <h3>{role === 'TECH' ? 'Mes interventions' : 'Interventions du jour'}</h3>
          <Link to="/ordres-travail" className="btn btn-ghost btn-sm">
            <ArrowRight size={14} />
            Voir tout
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Équipement</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Technicien</th>
              </tr>
            </thead>
            <tbody>
              {(role === 'TECH' ? d.mesOt : d.interventionsDuJour).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/ordres-travail/${o.id}`} className="mono">
                      {o.numero}
                    </Link>
                  </td>
                  <td>{o.equipement?.codeEquipement} — {o.equipement?.designation}</td>
                  <td>
                    <Badge valeur={o.priorite} />
                  </td>
                  <td>
                    <Badge valeur={o.statut} />
                  </td>
                  <td>{o.technicienResponsable?.nomPrenom ?? '—'}</td>
                </tr>
              ))}
              {(role === 'TECH' ? d.mesOt : d.interventionsDuJour).length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aucune intervention à afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  alert,
  warn,
  ok,
}: {
  label: string;
  value: number | string;
  hint?: string;
  alert?: boolean;
  warn?: boolean;
  ok?: boolean;
}) {
  return (
    <div className={`kpi ${alert ? 'alert' : warn ? 'warn' : ok ? 'ok' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
