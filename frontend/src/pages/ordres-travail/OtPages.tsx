import { FormEvent, useEffect, useState } from 'react';
import { Check, Clock, Pause, Play, Plus, Save, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { fcfa } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Article, Equipement, OrdreTravail, ReponsePaginee, Technicien } from '../../types';

export function ListeOtPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<OrdreTravail> | null>(null);
  const [statut, setStatut] = useState('');
  useEffect(() => {
    metier.ots({ statut: statut || undefined }).then(setPage);
  }, [statut]);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Ordres de travail</h2>
          <p>Cycle BROUILLON → PLANIFIÉ → EN COURS → RÉALISÉ → CLÔTURÉ</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Ordres de travail',
              compartiment: 'Maintenance',
              colonnes: ['N°', 'Équipement', 'Type', 'Priorité', 'Statut', 'Coût'],
              lignes: (page?.donnees ?? []).map((o) => [
                o.numero,
                o.equipement?.codeEquipement ?? '',
                o.typeMaintenance,
                o.priorite,
                o.statut,
                o.coutTotal,
              ]),
              nomFichier: 'rapport-ordres-travail.pdf',
            }}
          />
        {aPermission('ot.creer') && (
          <Link className="btn btn-primary" to="/ordres-travail/nouveau">
            <Plus size={16} />
            Nouvel OT
          </Link>
        )}
        </div>
      </div>
      <div className="toolbar">
        <Selecteur value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {['BROUILLON', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE', 'REALISE', 'CLOTURE', 'ANNULE'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Selecteur>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Équipement</th>
              <th>Type</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Coût</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/ordres-travail/${o.id}`} className="mono">
                    {o.numero}
                  </Link>
                </td>
                <td>
                  {o.equipement?.codeEquipement} — {o.equipement?.designation}
                </td>
                <td>{o.typeMaintenance}</td>
                <td>
                  <Badge valeur={o.priorite} />
                </td>
                <td>
                  <Badge valeur={o.statut} />
                </td>
                <td>{fcfa(o.coutTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NouvelOtPage() {
  const nav = useNavigate();
  const [eqs, setEqs] = useState<Equipement[]>([]);
  const [techs, setTechs] = useState<Technicien[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    equipementId: '',
    descriptionDemandee: '',
    datePlanifiee: '',
    technicienResponsableId: '',
  });
  useEffect(() => {
    metier.equipements({ limite: 200 }).then((p) => setEqs(p.donnees));
    metier.techniciens().then(setTechs);
  }, []);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const ot = await metier.creerOt({
        equipementId: Number(form.equipementId),
        descriptionDemandee: form.descriptionDemandee,
        datePlanifiee: form.datePlanifiee || undefined,
        technicienResponsableId: form.technicienResponsableId ? Number(form.technicienResponsableId) : undefined,
      });
      nav(`/ordres-travail/${ot.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }
  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-h">
        <h3>Créer un ordre de travail</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b">
        {err && <div className="alert alert-err">{err}</div>}
        <p>Le numéro OT-AAAA-NNNNN est généré par le serveur. La priorité est proposée selon la criticité.</p>
        <div className="form-grid">
          <label className="field full">
            Équipement
            <Selecteur required value={form.equipementId} onChange={(e) => setForm({ ...form, equipementId: e.target.value })}>
              <option value="">—</option>
              {eqs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codeEquipement} — {e.designation}
                </option>
              ))}
            </Selecteur>
          </label>
          <label className="field full">
            Description
            <textarea rows={3} value={form.descriptionDemandee} onChange={(e) => setForm({ ...form, descriptionDemandee: e.target.value })} />
          </label>
          <label className="field">
            Date planifiée
            <input type="date" value={form.datePlanifiee} onChange={(e) => setForm({ ...form, datePlanifiee: e.target.value })} />
          </label>
          <label className="field">
            Technicien
            <Selecteur value={form.technicienResponsableId} onChange={(e) => setForm({ ...form, technicienResponsableId: e.target.value })}>
              <option value="">—</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.matricule} — {t.nomPrenom}
                </option>
              ))}
            </Selecteur>
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary">
            <Plus size={16} />
            Créer
          </button>
        </div>
      </div>
    </form>
  );
}

export function FicheOtPage() {
  const { id } = useParams();
  const { aPermission, utilisateur } = useAuth();
  const [ot, setOt] = useState<OrdreTravail | null>(null);
  const [techs, setTechs] = useState<Technicien[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [pointage, setPointage] = useState({ technicienId: '', dateTravail: '', heureDebut: '08:00', heureFin: '10:00' });
  const [piece, setPiece] = useState({ articleId: '', quantite: '1' });
  const [rapport, setRapport] = useState({ travauxRealises: '', diagnostic: '', remede: '' });
  const [motif, setMotif] = useState('');

  async function reload() {
    if (!id) return;
    const data = await metier.ot(Number(id));
    setOt(data);
    setRapport({
      travauxRealises: data.travauxRealises ?? '',
      diagnostic: data.diagnostic ?? '',
      remede: data.remede ?? '',
    });
  }
  useEffect(() => {
    reload();
    metier.techniciens().then(setTechs);
    metier.articles({ limite: 200 }).then((p) => setArticles(p.donnees));
  }, [id]);

  async function run(fn: () => Promise<unknown>) {
    setErr('');
    setOk('');
    try {
      await fn();
      await reload();
      setOk('Enregistré.');
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!ot) return <p>Chargement…</p>;
  const clos = ot.statut === 'CLOTURE';

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="mono">{ot.numero}</h2>
          <p>
            {ot.equipement?.codeEquipement} — {ot.equipement?.designation}
          </p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <Badge valeur={ot.statut} />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}

      <div className="kpis">
        <div className="kpi">
          <div className="label">Main-d\'œuvre</div>
          <div className="value">{fcfa(ot.coutMainOeuvre)}</div>
        </div>
        <div className="kpi">
          <div className="label">Pièces</div>
          <div className="value">{fcfa(ot.coutPieces)}</div>
        </div>
        <div className="kpi">
          <div className="label">Externe</div>
          <div className="value">{fcfa(ot.coutExterne)}</div>
        </div>
        <div className="kpi">
          <div className="label">Total (calculé)</div>
          <div className="value">{fcfa(ot.coutTotal)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Transitions d\'état</h3>
        </div>
        <div className="card-b" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {ot.statut === 'BROUILLON' && aPermission('ot.planifier') && (
            <button className="btn btn-primary" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'PLANIFIE' }))}>
              <Clock size={15} />
              Planifier
            </button>
          )}
          {ot.statut === 'PLANIFIE' && (
            <button className="btn btn-ok" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'EN_COURS' }))}>
              <Play size={15} />
              Démarrer
            </button>
          )}
          {ot.statut === 'EN_COURS' && (
            <>
              <button className="btn btn-gold" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'REALISE' }))}>
                <Check size={15} />
                Passer à réalisé
              </button>
              <input placeholder="Motif d\'attente" value={motif} onChange={(e) => setMotif(e.target.value)} />
              <button className="btn btn-ghost" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'EN_ATTENTE', motif }))}>
                <Pause size={15} />
                Mettre en attente
              </button>
            </>
          )}
          {ot.statut === 'EN_ATTENTE' && (
            <button className="btn btn-ok" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'EN_COURS' }))}>
              <Play size={15} />
              Reprendre
            </button>
          )}
          {ot.statut === 'REALISE' && aPermission('ot.cloturer') && (
            <button className="btn btn-primary" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'CLOTURE' }))}>
              <Check size={15} />
              Valider / clôturer
            </button>
          )}
          {(ot.statut === 'BROUILLON' || ot.statut === 'PLANIFIE') && (
            <button className="btn btn-danger" onClick={() => run(() => metier.statutOt(ot.id, { statut: 'ANNULE', motif: motif || 'Annulation' }))}>
              <X size={15} />
              Annuler
            </button>
          )}
        </div>
      </div>

      {aPermission('ot.planifier') && !clos && (
        <div className="card">
          <div className="card-h">
            <h3>Planification</h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Date
              <input
                type="date"
                defaultValue={ot.datePlanifiee ?? ''}
                onBlur={(e) => e.target.value && run(() => metier.planifierOt(ot.id, { datePlanifiee: e.target.value }))}
              />
            </label>
            <label className="field">
              Technicien responsable
              <Selecteur
                defaultValue={ot.technicienResponsable?.id ?? ''}
                onChange={(e) => run(() => metier.planifierOt(ot.id, { technicienResponsableId: Number(e.target.value) }))}
              >
                <option value="">—</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.matricule} {t.nomPrenom}
                  </option>
                ))}
              </Selecteur>
            </label>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-h">
          <h3>Check-list</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>#</th>
              <th>Opération</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(ot.operations ?? []).map((op) => (
              <tr key={op.id}>
                <td>{op.ordre}</td>
                <td>
                  {op.libelle} {op.obligatoire ? '*' : ''}
                </td>
                <td>
                  <Badge valeur={op.statut} />
                </td>
                <td>
                  {!clos && (
                    <>
                      <button className="btn btn-sm btn-ok" onClick={() => run(() => metier.majOperation(ot.id, op.id, { statut: 'FAIT' }))}>
                        Fait
                      </button>{' '}
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => run(() => metier.majOperation(ot.id, op.id, { statut: 'NON_APPLICABLE', observation: 'Non applicable terrain' }))}
                      >
                        N/A
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clos && aPermission('ot.planifier') && (
          <div className="card-b">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const libelle = window.prompt('Libellé de l\'opération');
                if (libelle) run(() => metier.ajouterOperation(ot.id, libelle));
              }}
            >
              Ajouter une opération
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Pointage main-d\'œuvre</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Technicien</th>
              <th>Date</th>
              <th>Plage</th>
              <th>Durée</th>
              <th>Coût</th>
            </tr>
          </thead>
          <tbody>
            {(ot.mainOeuvre ?? []).map((m) => (
              <tr key={m.id}>
                <td>{m.technicien?.nomPrenom}</td>
                <td>{m.dateTravail}</td>
                <td>
                  {m.heureDebut} – {m.heureFin}
                </td>
                <td>{m.dureeH} h</td>
                <td>{fcfa(m.cout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clos && aPermission('ot.executer') && (
          <form
            className="card-b form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                metier.pointer(ot.id, {
                  technicienId: Number(pointage.technicienId),
                  dateTravail: pointage.dateTravail,
                  heureDebut: pointage.heureDebut,
                  heureFin: pointage.heureFin,
                }),
              );
            }}
          >
            <label className="field">
              Technicien
              <Selecteur required value={pointage.technicienId} onChange={(e) => setPointage({ ...pointage, technicienId: e.target.value })}>
                <option value="">—</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.matricule} {t.nomPrenom}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Date
              <input type="date" required value={pointage.dateTravail} onChange={(e) => setPointage({ ...pointage, dateTravail: e.target.value })} />
            </label>
            <label className="field">
              Début
              <input type="time" value={pointage.heureDebut} onChange={(e) => setPointage({ ...pointage, heureDebut: e.target.value })} />
            </label>
            <label className="field">
              Fin
              <input type="time" value={pointage.heureFin} onChange={(e) => setPointage({ ...pointage, heureFin: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">Pointer</button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Pièces</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Qté</th>
              <th>PU</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {(ot.pieces ?? []).map((p) => (
              <tr key={p.id}>
                <td>{p.article?.refArticle}</td>
                <td>{p.quantite}</td>
                <td>{fcfa(p.prixUnitaire)}</td>
                <td>{fcfa(p.montant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!clos && aPermission('stock.demander') && (
          <form
            className="card-b form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                metier.demanderPiece(ot.id, { articleId: Number(piece.articleId), quantite: Number(piece.quantite) }),
              );
            }}
          >
            <label className="field">
              Article
              <Selecteur required value={piece.articleId} onChange={(e) => setPiece({ ...piece, articleId: e.target.value })}>
                <option value="">—</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.refArticle} — {a.designation} (stock {a.quantiteStock})
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Quantité
              <input type="number" min="0.01" step="0.01" value={piece.quantite} onChange={(e) => setPiece({ ...piece, quantite: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-ghost">
                {utilisateur?.role?.code === 'MAGASIN' ? 'Sortir du stock' : 'Demander au magasin'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Rapport / diagnostic</h3>
        </div>
        <form
          className="card-b form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => metier.rapportOt(ot.id, rapport));
          }}
        >
          <label className="field full">
            Travaux réalisés
            <textarea rows={3} value={rapport.travauxRealises} onChange={(e) => setRapport({ ...rapport, travauxRealises: e.target.value })} disabled={clos} />
          </label>
          <label className="field">
            Diagnostic
            <textarea rows={2} value={rapport.diagnostic} onChange={(e) => setRapport({ ...rapport, diagnostic: e.target.value })} disabled={clos} />
          </label>
          <label className="field">
            Remède
            <textarea rows={2} value={rapport.remede} onChange={(e) => setRapport({ ...rapport, remede: e.target.value })} disabled={clos} />
          </label>
          {!clos && (
            <div className="full">
              <button className="btn btn-primary">
                <Save size={16} />
                Enregistrer le rapport
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
