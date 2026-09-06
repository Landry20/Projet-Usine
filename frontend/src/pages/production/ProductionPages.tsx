import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Factory, Pause, Play, Plus, Search } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { CourbesEvolution } from '../../components/ui/CourbesEvolution';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type {
  ArrivageMatiere,
  DashboardProduction,
  Equipement,
  LigneProduction,
  LotDepot,
  Nomenclature,
  OrdreFabrication,
  Produit,
  ReponsePaginee,
  Tank,
} from '../../types';

function Kpi({ label, value, hint, alert }: { label: string; value: number | string; hint?: string; alert?: boolean }) {
  return (
    <div className={`kpi ${alert ? 'alert' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function DashboardProductionPage() {
  const { utilisateur } = useAuth();
  const [d, setD] = useState<DashboardProduction>({
    ofOuverts: 0,
    ofAttente: 0,
    ofEnCours: [],
    nbMatieres: 0,
  });
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardProduction().then(setD).catch(() => setErr('Impossible de charger le pilotage production.'));
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Bonjour {utilisateur?.prenom}</h2>
          <p>Demandez la matière au dépôt, suivez les OF, versez le produit fini dans les tanks et signalez les pannes.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Rapport production',
              compartiment: 'Production',
              colonnes: ['N°', 'Produit', 'Ligne', 'Prévu', 'Statut'],
              lignes: d.ofEnCours.map((o) => [o.numero, o.produit?.designation ?? '', o.ligne?.libelle ?? '—', o.quantitePrevue, o.statut]),
              nomFichier: 'rapport-production.pdf',
            }}
          />
          <Link className="btn btn-primary" to="/production/ordres">
            <Factory size={16} />
            Voir les OF
          </Link>
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <Kpi label="OF ouverts" value={d.ofOuverts} />
        <Kpi label="OF en attente" value={d.ofAttente} alert={d.ofAttente > 0} hint="Panne ou manque matière" />
        <Kpi label="OF en cours" value={d.ofEnCours.length} />
        <Kpi label="Matières actives" value={d.nbMatieres} />
      </div>
      {d.series && (
        <CourbesEvolution
          series={d.series}
          titreActivite="Ordres de fabrication par mois"
          titreVolume="Quantités conformes par mois"
        />
      )}
      <div className="card">
        <div className="card-h">
          <h3>Fabrication en cours</h3>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Produit</th>
                <th>Ligne</th>
                <th>Prévu</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {d.ofEnCours.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/production/ordres/${o.id}`} className="mono">
                      {o.numero}
                    </Link>
                  </td>
                  <td>{o.produit?.designation}</td>
                  <td>{o.ligne?.libelle ?? '—'}</td>
                  <td>{o.quantitePrevue}</td>
                  <td>
                    <Badge valeur={o.statut} />
                  </td>
                </tr>
              ))}
              {d.ofEnCours.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aucun ordre en cours.
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

export function ListeOfPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<OrdreFabrication> | null>(null);
  const [statut, setStatut] = useState('');
  useEffect(() => {
    metier.ofs({ statut: statut || undefined }).then(setPage);
  }, [statut]);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Ordres de fabrication</h2>
          <p>Brouillon → planifié → en cours → contrôle → clôturé. Une machine hors service bloque le démarrage.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Ordres de fabrication',
              compartiment: 'Production',
              colonnes: ['N°', 'Produit', 'Ligne', 'Prévu', 'Conforme', 'Rejet', 'Statut'],
              lignes: (page?.donnees ?? []).map((o) => [
                o.numero,
                o.produit?.designation ?? '',
                o.ligne?.libelle ?? '—',
                o.quantitePrevue,
                o.quantiteConforme,
                o.quantiteRejetee,
                o.statut,
              ]),
              nomFichier: 'rapport-ordres-fabrication.pdf',
            }}
          />
        {aPermission('of.creer') && (
          <Link className="btn btn-primary" to="/production/ordres/nouveau">
            <Plus size={16} />
            Nouvel OF
          </Link>
        )}
        </div>
      </div>
      <div className="toolbar">
        <Selecteur value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {['BROUILLON', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE', 'CONTROLE', 'CLOTURE', 'ANNULE'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Selecteur>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Produit</th>
              <th>Ligne</th>
              <th>Prévu</th>
              <th>Conforme</th>
              <th>Rejet</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/production/ordres/${o.id}`} className="mono">
                    {o.numero}
                  </Link>
                </td>
                <td>
                  {o.produit?.refProduit} — {o.produit?.designation}
                </td>
                <td>{o.ligne?.libelle ?? '—'}</td>
                <td>{o.quantitePrevue}</td>
                <td>{o.quantiteConforme}</td>
                <td>{o.quantiteRejetee}</td>
                <td>
                  <Badge valeur={o.statut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NouvelOfPage() {
  const nav = useNavigate();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [noms, setNoms] = useState<Nomenclature[]>([]);
  const [lignes, setLignes] = useState<LigneProduction[]>([]);
  const [form, setForm] = useState({ produitId: '', quantitePrevue: '', nomenclatureId: '', ligneId: '', datePlanifiee: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    metier.produits({ type: 'PRODUIT_FINI', limite: 200 }).then((p) => setProduits(p.donnees));
    metier.nomenclatures().then(setNoms);
    metier.lignesProduction().then(setLignes);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const of = await metier.creerOf({
        produitId: Number(form.produitId),
        quantitePrevue: Number(form.quantitePrevue),
        nomenclatureId: form.nomenclatureId ? Number(form.nomenclatureId) : undefined,
        ligneId: form.ligneId ? Number(form.ligneId) : undefined,
        datePlanifiee: form.datePlanifiee || undefined,
      });
      nav(`/production/ordres/${of.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-h">
        <h3>Nouvel ordre de fabrication</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b form-grid">
        {err && <div className="alert alert-err full">{err}</div>}
        <label className="field">
          Produit à fabriquer
          <Selecteur required value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
            <option value="">Sélectionner…</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.refProduit} — {p.designation}
              </option>
            ))}
          </Selecteur>
        </label>
        <label className="field">
          Quantité prévue
          <input required type="number" min="0.001" step="0.001" value={form.quantitePrevue} onChange={(e) => setForm({ ...form, quantitePrevue: e.target.value })} />
        </label>
        <label className="field">
          Nomenclature
          <Selecteur value={form.nomenclatureId} onChange={(e) => setForm({ ...form, nomenclatureId: e.target.value })}>
            <option value="">—</option>
            {noms.map((n) => (
              <option key={n.id} value={n.id}>
                {n.code} — {n.libelle}
              </option>
            ))}
          </Selecteur>
        </label>
        <label className="field">
          Ligne / machine
          <Selecteur value={form.ligneId} onChange={(e) => setForm({ ...form, ligneId: e.target.value })}>
            <option value="">—</option>
            {lignes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code} — {l.libelle}
                {l.equipement ? ` (${l.equipement.statut})` : ''}
              </option>
            ))}
          </Selecteur>
        </label>
        <label className="field">
          Date planifiée
          <input type="date" value={form.datePlanifiee} onChange={(e) => setForm({ ...form, datePlanifiee: e.target.value })} />
        </label>
        <div className="full">
          <button className="btn btn-primary">
            <Plus size={16} />
            Créer l’OF
          </button>
        </div>
      </div>
    </form>
  );
}

export function FicheOfPage() {
  const { id } = useParams();
  const { aPermission } = useAuth();
  const [of, setOf] = useState<OrdreFabrication | null>(null);
  const [err, setErr] = useState('');
  const [motif, setMotif] = useState('');
  const [controle, setControle] = useState({ quantiteConforme: '', quantiteRejetee: '0', emplacement: '' });
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [remplissage, setRemplissage] = useState({ tankId: '', volumeLitres: '' });
  const [okTank, setOkTank] = useState('');

  function charger() {
    if (id) metier.of(Number(id)).then(setOf);
    metier.tanks().then(setTanks).catch(() => setTanks([]));
  }
  useEffect(() => {
    charger();
  }, [id]);

  async function run(fn: () => Promise<OrdreFabrication>) {
    try {
      setErr('');
      setOf(await fn());
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!of) {
    return (
      <div className="page-head">
        <div>
          <h2>Ordre de fabrication</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="mono">{of.numero}</h2>
          <p>
            {of.produit?.refProduit} — {of.produit?.designation} · prévu {of.quantitePrevue} {of.produit?.unite}
          </p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <Badge valeur={of.statut} />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {of.machineDisponible === false && (
        <div className="alert alert-err">
          La machine de la ligne n’est pas en service. La production ne peut pas démarrer tant que la maintenance n’a
          pas remis l’équipement disponible.
        </div>
      )}
      <div className="toolbar">
        {aPermission('of.executer') && of.statut === 'BROUILLON' && (
          <button className="btn btn-primary" onClick={() => run(() => metier.statutOf(of.id, { statut: 'PLANIFIE' }))}>
            Planifier
          </button>
        )}
        {aPermission('of.executer') && of.statut === 'PLANIFIE' && (
          <button className="btn btn-ok" onClick={() => run(() => metier.statutOf(of.id, { statut: 'EN_COURS' }))}>
            <Play size={15} />
            Démarrer (consomme les matières)
          </button>
        )}
        {aPermission('of.executer') && of.statut === 'EN_COURS' && (
          <>
            <input placeholder="Motif d’attente" value={motif} onChange={(e) => setMotif(e.target.value)} />
            <button className="btn btn-ghost" onClick={() => run(() => metier.statutOf(of.id, { statut: 'EN_ATTENTE', motif }))}>
              <Pause size={15} />
              Mettre en attente
            </button>
            <button className="btn btn-gold" onClick={() => run(() => metier.statutOf(of.id, { statut: 'CONTROLE' }))}>
              Envoyer au contrôle
            </button>
          </>
        )}
        {aPermission('of.executer') && of.statut === 'EN_ATTENTE' && (
          <button className="btn btn-ok" onClick={() => run(() => metier.statutOf(of.id, { statut: 'EN_COURS' }))}>
            <Play size={15} />
            Reprendre
          </button>
        )}
        {aPermission('of.executer') && (of.statut === 'BROUILLON' || of.statut === 'PLANIFIE') && (
          <button className="btn btn-danger" onClick={() => run(() => metier.statutOf(of.id, { statut: 'ANNULE' }))}>
            Annuler
          </button>
        )}
        {aPermission('of.cloturer') && of.statut === 'CONTROLE' && (
          <button className="btn btn-primary" onClick={() => run(() => metier.statutOf(of.id, { statut: 'CLOTURE' }))}>
            Clôturer l’OF
          </button>
        )}
      </div>
      <div className="card">
        <div className="card-h">
          <h3>Détail</h3>
        </div>
        <div className="card-b">
          <p>
            Ligne : <strong>{of.ligne?.libelle ?? '—'}</strong>
            {of.ligne?.equipement && (
              <>
                {' '}
                · Machine {of.ligne.equipement.codeEquipement} <Badge valeur={of.ligne.equipement.statut} />
              </>
            )}
          </p>
          <p>Conforme : {of.quantiteConforme} · Rejet : {of.quantiteRejetee}</p>
          {Number(of.quantitePrevue) > 0 && (
            <p>
              Rendement d’extraction :{' '}
              <strong>{((Number(of.quantiteConforme) / Number(of.quantitePrevue)) * 100).toFixed(2)} %</strong>
              {' · '}
              Perte :{' '}
              <strong>
                {(Number(of.quantitePrevue) - Number(of.quantiteConforme)).toFixed(3)} {of.produit?.unite ?? ''}
              </strong>
            </p>
          )}
          {of.motifAttente && <p>Motif d’attente : {of.motifAttente}</p>}
          {of.nomenclature?.lignes && of.nomenclature.lignes.length > 0 && (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Composant</th>
                    <th>Qté unitaire</th>
                    <th>Besoin OF</th>
                  </tr>
                </thead>
                <tbody>
                  {of.nomenclature.lignes.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.composant?.refProduit} — {l.composant?.designation}
                      </td>
                      <td>
                        {l.quantite} {l.composant?.unite}
                      </td>
                      <td>{(Number(l.quantite) * Number(of.quantitePrevue)).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {aPermission('of.executer') && (of.statut === 'EN_COURS' || of.statut === 'CONTROLE') && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            setOkTank('');
            run(async () => {
              const tank = await metier.remplirTankOf(of.id, {
                tankId: Number(remplissage.tankId),
                volumeLitres: Number(remplissage.volumeLitres),
              });
              setOkTank(
                `Tank ${tank.code} mis à jour : ${tank.stockLitres} L / ${tank.capaciteLitres} L.`,
              );
              setRemplissage({ ...remplissage, volumeLitres: '' });
              return of;
            });
          }}
        >
          <div className="card-h">
            <h3>Remplissage tank</h3>
          </div>
          <div className="card-b form-grid">
            {okTank && <div className="alert alert-ok full">{okTank}</div>}
            <Selecteur label="Tank de destination" value={remplissage.tankId} onChange={(e) => setRemplissage({ ...remplissage, tankId: e.target.value })}>
              <option value="">—</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.stockLitres} / {t.capaciteLitres} L
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Volume versé (L)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={remplissage.volumeLitres}
                onChange={(e) => setRemplissage({ ...remplissage, volumeLitres: e.target.value })}
              />
            </label>
            <div className="full">
              <button className="btn btn-primary">Verser dans le tank</button>
            </div>
          </div>
        </form>
      )}
      {aPermission('of.cloturer') && (of.statut === 'EN_COURS' || of.statut === 'CONTROLE') && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              metier.controleOf(of.id, {
                quantiteConforme: Number(controle.quantiteConforme),
                quantiteRejetee: Number(controle.quantiteRejetee || 0),
                emplacement: controle.emplacement || undefined,
              }),
            );
          }}
        >
          <div className="card-h">
            <h3>Contrôle qualité → entrée stock produits finis</h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Quantité conforme
              <input required type="number" min="0" step="0.001" value={controle.quantiteConforme} onChange={(e) => setControle({ ...controle, quantiteConforme: e.target.value })} />
            </label>
            <label className="field">
              Quantité rejetée
              <input type="number" min="0" step="0.001" value={controle.quantiteRejetee} onChange={(e) => setControle({ ...controle, quantiteRejetee: e.target.value })} />
            </label>
            <label className="field">
              Emplacement PF
              <input value={controle.emplacement} onChange={(e) => setControle({ ...controle, emplacement: e.target.value })} placeholder="A-01" />
            </label>
            <div className="full">
              <button className="btn btn-ok">Valider et créer le lot</button>
            </div>
          </div>
        </form>
      )}
      {(of.lots ?? []).length > 0 && (
        <div className="card">
          <div className="card-h">
            <h3>Lots créés</h3>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Quantité</th>
                <th>Statut</th>
                <th>Emplacement</th>
              </tr>
            </thead>
            <tbody>
              {of.lots!.map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.numero}</td>
                  <td>{l.quantite}</td>
                  <td>
                    <Badge valeur={l.statut} />
                  </td>
                  <td>{l.emplacement ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function MatieresPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<Produit> | null>(null);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({ refProduit: '', designation: '', unite: 'kg', seuilReappro: '0' });
  const [err, setErr] = useState('');

  function charger() {
    metier.produits({ type: 'MATIERE_PREMIERE', recherche: recherche || undefined }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerProduit({ ...form, typeProduit: 'MATIERE_PREMIERE', seuilReappro: Number(form.seuilReappro) });
      setForm({ refProduit: '', designation: '', unite: 'kg', seuilReappro: '0' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Matières premières</h2>
          <p>Une matière principale suffit. Le stock augmente par les arrivages dans le dépôt.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Matières premières',
            compartiment: 'Production',
            colonnes: ['Réf.', 'Désignation', 'Stock', 'Seuil', 'Unité'],
            lignes: (page?.donnees ?? []).map((p) => [p.refProduit, p.designation, p.quantiteStock, p.seuilReappro, p.unite]),
            nomFichier: 'rapport-matieres.pdf',
          }}
        />
        </div>
      </div>
      {aPermission('production.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle matière</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Référence
              <input required value={form.refProduit} onChange={(e) => setForm({ ...form, refProduit: e.target.value })} />
            </label>
            <label className="field">
              Désignation
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </label>
            <label className="field">
              Unité
              <input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} />
            </label>
            <label className="field">
              Seuil
              <input type="number" value={form.seuilReappro} onChange={(e) => setForm({ ...form, seuilReappro: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">
                <Plus size={16} />
                Créer
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="toolbar">
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Référence ou désignation" />
        <button className="btn btn-ghost" onClick={charger}>
          <Search size={15} />
          Rechercher
        </button>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Désignation</th>
              <th>Stock</th>
              <th>Seuil</th>
              <th>Unité</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.refProduit}</td>
                <td>{p.designation}</td>
                <td>{p.quantiteStock}</td>
                <td>{p.seuilReappro}</td>
                <td>{p.unite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NomenclaturesPage() {
  const { aPermission } = useAuth();
  const [noms, setNoms] = useState<Nomenclature[]>([]);
  const [pf, setPf] = useState<Produit[]>([]);
  const [mp, setMp] = useState<Produit[]>([]);
  const [form, setForm] = useState({ code: '', libelle: '', produitId: '', composantId: '', quantite: '' });
  const [err, setErr] = useState('');

  function charger() {
    metier.nomenclatures().then(setNoms);
    metier.produits({ type: 'PRODUIT_FINI', limite: 200 }).then((p) => setPf(p.donnees));
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setMp(p.donnees));
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerNomenclature({
        code: form.code,
        libelle: form.libelle,
        produitId: Number(form.produitId),
        lignes: [{ composantId: Number(form.composantId), quantite: Number(form.quantite) }],
      });
      setForm({ code: '', libelle: '', produitId: '', composantId: '', quantite: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Nomenclatures</h2>
          <p>Recette de fabrication : quelles matières, en quelle quantité, pour un produit fini.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        </div>
      </div>
      {aPermission('production.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle nomenclature (une première ligne)</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label className="field">
              Libellé
              <input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            </label>
            <label className="field">
              Produit fini
              <Selecteur required value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
                <option value="">—</option>
                {pf.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.refProduit}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Matière
              <Selecteur required value={form.composantId} onChange={(e) => setForm({ ...form, composantId: e.target.value })}>
                <option value="">—</option>
                {mp.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.refProduit}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Quantité unitaire
              <input required type="number" min="0.001" step="0.001" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">Créer</button>
            </div>
          </div>
        </form>
      )}
      {noms.map((n) => (
        <div className="card" key={n.id}>
          <div className="card-h">
            <h3>
              {n.code} — {n.libelle}
            </h3>
            <span>{n.produit?.designation}</span>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Composant</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {n.lignes?.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.composant?.refProduit} — {l.composant?.designation}
                  </td>
                  <td>
                    {l.quantite} {l.composant?.unite}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export function LignesPage() {
  const { aPermission } = useAuth();
  const [lignes, setLignes] = useState<LigneProduction[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [form, setForm] = useState({ code: '', libelle: '', equipementId: '' });
  const [panne, setPanne] = useState({ ligneId: 0, description: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  function charger() {
    metier.lignesProduction().then(setLignes);
    metier.equipements({ limite: 200 }).then((p) => setEquipements(p.donnees)).catch(() => undefined);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerLigneProduction({
        code: form.code,
        libelle: form.libelle,
        equipementId: form.equipementId ? Number(form.equipementId) : undefined,
      });
      setForm({ code: '', libelle: '', equipementId: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  async function signaler(e: FormEvent) {
    e.preventDefault();
    const ligne = lignes.find((l) => l.id === panne.ligneId);
    if (!ligne?.equipementId) {
      setErr('Cette ligne n’a pas de machine reliée.');
      return;
    }
    try {
      const d = await metier.creerDemande({
        equipementId: ligne.equipementId,
        description: panne.description,
        urgence: 'P1_URGENT',
        arretProduction: true,
      });
      setOk(`Demande ${d.numero} envoyée à la maintenance.`);
      setPanne({ ligneId: 0, description: '' });
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Lignes et machines</h2>
          <p>Pont production ↔ maintenance : une panne machine bloque le démarrage des OF de la ligne.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
      {aPermission('production.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle ligne</h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label className="field">
              Libellé
              <input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
            </label>
            <label className="field">
              Machine (parc maintenance)
              <Selecteur value={form.equipementId} onChange={(e) => setForm({ ...form, equipementId: e.target.value })}>
                <option value="">—</option>
                {equipements.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.codeEquipement} — {eq.designation}
                  </option>
                ))}
              </Selecteur>
            </label>
            <div className="full">
              <button className="btn btn-primary">Créer</button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Ligne</th>
              <th>Machine</th>
              <th>État machine</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.code} — {l.libelle}
                </td>
                <td>{l.equipement ? `${l.equipement.codeEquipement} — ${l.equipement.designation}` : '—'}</td>
                <td>{l.equipement ? <Badge valeur={l.equipement.statut} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aPermission('demande.creer') && (
        <form className="card" onSubmit={signaler}>
          <div className="card-h">
            <h3>
              <AlertTriangle size={16} /> Signaler une panne à la maintenance
            </h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Ligne
              <Selecteur required value={panne.ligneId || ''} onChange={(e) => setPanne({ ...panne, ligneId: Number(e.target.value) })}>
                <option value="">—</option>
                {lignes.filter((l) => l.equipementId).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.libelle}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field full">
              Description
              <textarea required rows={3} value={panne.description} onChange={(e) => setPanne({ ...panne, description: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-gold">Envoyer une demande d’intervention</button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export function DepotPage() {
  const { aPermission } = useAuth();
  const [lots, setLots] = useState<LotDepot[]>([]);
  const [mp, setMp] = useState<Produit[]>([]);
  const [form, setForm] = useState({ libelle: '', produitId: '', capacite: '', emplacement: '' });
  const [err, setErr] = useState('');

  function charger() {
    metier.lotsDepot().then(setLots);
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setMp(p.donnees));
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await metier.creerLotDepot({
        libelle: form.libelle,
        produitId: Number(form.produitId),
        capacite: form.capacite ? Number(form.capacite) : undefined,
        emplacement: form.emplacement || undefined,
      });
      setForm({ libelle: '', produitId: form.produitId, capacite: '', emplacement: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dépôt</h2>
          <p>Créez les lots où la matière première est stockée. L’arrivage remplit ensuite ces lots.</p>
        </div>
        <div className="page-head-actions">
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Lots du dépôt',
              compartiment: 'Production',
              colonnes: ['N°', 'Lot', 'Matière', 'Quantité', 'Capacité', 'Emplacement'],
              lignes: lots.map((l) => [
                l.numero,
                l.libelle,
                l.produit?.designation ?? '',
                l.quantite,
                l.capacite ?? '—',
                l.emplacement ?? '—',
              ]),
              nomFichier: 'rapport-depot.pdf',
            }}
          />
        </div>
      </div>
      {aPermission('production.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouveau lot</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Nom du lot
              <input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Ex. Lot A, Silo 1" />
            </label>
            <label className="field">
              Matière première
              <Selecteur required value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
                <option value="">—</option>
                {mp.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.refProduit} — {p.designation}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Capacité
              <input type="number" min="0" step="0.001" value={form.capacite} onChange={(e) => setForm({ ...form, capacite: e.target.value })} placeholder="Optionnel" />
            </label>
            <label className="field">
              Emplacement
              <input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} placeholder="Zone, allée…" />
            </label>
            <div className="full">
              <button className="btn btn-primary">
                <Plus size={16} />
                Créer le lot
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Lot</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>Capacité</th>
              <th>Remplissage</th>
              <th>Emplacement</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => {
              const qte = Number(l.quantite);
              const cap = l.capacite != null ? Number(l.capacite) : null;
              const pct = cap && cap > 0 ? Math.round((1000 * qte) / cap) / 10 : null;
              return (
                <tr key={l.id}>
                  <td className="mono">{l.numero}</td>
                  <td>{l.libelle}</td>
                  <td>{l.produit?.designation ?? '—'}</td>
                  <td>
                    {l.quantite} {l.produit?.unite ?? ''}
                  </td>
                  <td>{l.capacite ?? '—'}</td>
                  <td>{pct != null ? `${pct} %` : '—'}</td>
                  <td>{l.emplacement ?? '—'}</td>
                </tr>
              );
            })}
            {lots.length === 0 && (
              <tr>
                <td colSpan={7}>Aucun lot. Créez-en un pour recevoir les arrivages.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ArrivagePage() {
  const { aPermission } = useAuth();
  const [lots, setLots] = useState<LotDepot[]>([]);
  const [arrivages, setArrivages] = useState<ArrivageMatiere[]>([]);
  const [form, setForm] = useState({ lotDepotId: '', quantite: '', referenceBl: '', commentaire: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  function charger() {
    metier.lotsDepot().then(setLots);
    metier.arrivages().then(setArrivages);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setOk('');
    try {
      await metier.creerArrivage({
        lotDepotId: Number(form.lotDepotId),
        quantite: Number(form.quantite),
        referenceBl: form.referenceBl || undefined,
        commentaire: form.commentaire || undefined,
      });
      setForm({ lotDepotId: form.lotDepotId, quantite: '', referenceBl: '', commentaire: '' });
      setOk('Arrivage enregistré. Le lot du dépôt a été mis à jour.');
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  const lotChoisi = lots.find((l) => String(l.id) === form.lotDepotId);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Arrivage</h2>
          <p>Enregistrez l’entrée de matière première dans un lot du dépôt.</p>
        </div>
        <div className="page-head-actions">
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Arrivages matière première',
              compartiment: 'Production',
              colonnes: ['N°', 'Date', 'Lot', 'Matière', 'Quantité', 'BL'],
              lignes: arrivages.map((a) => [
                a.numero,
                dateFr(a.dateArrivage),
                a.lotDepot?.libelle ?? a.lotDepot?.numero ?? '',
                a.produit?.designation ?? '',
                a.quantite,
                a.referenceBl ?? '—',
              ]),
              nomFichier: 'rapport-arrivages.pdf',
            }}
          />
        </div>
      </div>
      {aPermission('production.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvel arrivage</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            {ok && <div className="alert alert-ok full">{ok}</div>}
            <label className="field">
              Lot du dépôt
              <Selecteur required value={form.lotDepotId} onChange={(e) => setForm({ ...form, lotDepotId: e.target.value })}>
                <option value="">—</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.numero} — {l.libelle}
                    {l.produit ? ` (${l.produit.designation})` : ''}
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Quantité {lotChoisi?.produit?.unite ? `(${lotChoisi.produit.unite})` : ''}
              <input required type="number" min="0.001" step="0.001" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
            </label>
            <label className="field">
              N° bon / BL
              <input value={form.referenceBl} onChange={(e) => setForm({ ...form, referenceBl: e.target.value })} />
            </label>
            <label className="field full">
              Commentaire
              <input value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">
                <Plus size={16} />
                Enregistrer l’arrivage
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Lot</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>BL</th>
            </tr>
          </thead>
          <tbody>
            {arrivages.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.numero}</td>
                <td>{dateFr(a.dateArrivage)}</td>
                <td>
                  {a.lotDepot?.numero} {a.lotDepot?.libelle}
                </td>
                <td>{a.produit?.designation ?? '—'}</td>
                <td>
                  {a.quantite} {a.produit?.unite ?? ''}
                </td>
                <td>{a.referenceBl ?? '—'}</td>
              </tr>
            ))}
            {arrivages.length === 0 && (
              <tr>
                <td colSpan={6}>Aucun arrivage enregistré.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
