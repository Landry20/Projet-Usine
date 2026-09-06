import { FormEvent, useEffect, useState } from 'react';
import { ClipboardPlus, Plus, Save, Search } from 'lucide-react';
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
import type { Equipement, ReponsePaginee } from '../../types';

export function ListeEquipementsPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<Equipement> | null>(null);
  const [recherche, setRecherche] = useState('');

  function charger(p = 1, r = recherche) {
    metier.equipements({ page: p, recherche: r || undefined }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Parc machines</h2>
          <p>Codification SITE-FAMILLE-NNN · étiquette QR identique au code.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Parc équipements',
              compartiment: 'Maintenance',
              colonnes: ['Code', 'Désignation', 'Criticité', 'Statut'],
              lignes: (page?.donnees ?? []).map((e) => [e.codeEquipement, e.designation, e.criticite, e.statut]),
              nomFichier: 'rapport-equipements.pdf',
            }}
          />
        {aPermission('equipement.creer') && (
          <Link className="btn btn-primary" to="/equipements/nouveau">
            <Plus size={16} />
            Nouvel équipement
          </Link>
        )}
        </div>
      </div>
      <div className="toolbar">
        <input
          placeholder="Rechercher un code, une désignation, un QR…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && charger(1, recherche)}
        />
        <button className="btn btn-ghost" onClick={() => charger(1, recherche)}>
          <Search size={15} />
          Filtrer
        </button>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>Famille</th>
              <th>Criticité</th>
              <th>Statut</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link to={`/equipements/${e.id}`} className="mono">
                    {e.codeEquipement}
                  </Link>
                </td>
                <td>{e.designation}</td>
                <td>{e.famille?.libelle ?? '—'}</td>
                <td>
                  <Badge valeur={e.criticite} />
                </td>
                <td>
                  <Badge valeur={e.statut} />
                </td>
                <td>{e.localisation?.libelle ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FicheEquipementPage() {
  const { id } = useParams();
  const [e, setE] = useState<Equipement | null>(null);
  useEffect(() => {
    if (id) metier.equipement(Number(id)).then(setE);
  }, [id]);
  if (!e) {
    return (
      <div className="page-head">
        <div>
          <h2>Équipement</h2>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="page-head">
        <div>
          <h2 className="mono">{e.codeEquipement}</h2>
          <p>{e.designation}</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <Link className="btn btn-primary" to={`/demandes/nouvelle?equipementId=${e.id}`}>
            <ClipboardPlus size={16} />
            Nouvelle demande
          </Link>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi">
          <div className="label">Criticité</div>
          <div className="value">
            <Badge valeur={e.criticite} />
          </div>
        </div>
        <div className="kpi">
          <div className="label">Statut</div>
          <div className="value">
            <Badge valeur={e.statut} />
          </div>
        </div>
        <div className="kpi">
          <div className="label">Compteur</div>
          <div className="value">
            {e.compteurActuel} {e.uniteCompteur}
          </div>
        </div>
        <div className="kpi">
          <div className="label">Coût cumulé</div>
          <div className="value">{fcfa(e.coutCumule)}</div>
        </div>
      </div>
      <div className="card">
        <div className="card-h">
          <h3>Identification</h3>
        </div>
        <div className="card-b form-grid">
          <div>
            <strong>QR / étiquette</strong>
            <div className="mono">{e.qrCode}</div>
          </div>
          <div>
            <strong>Marque / modèle</strong>
            <div>
              {e.marque ?? '—'} {e.modele ?? ''}
            </div>
          </div>
          <div>
            <strong>N° série</strong>
            <div>{e.numeroSerie ?? '—'}</div>
          </div>
          <div>
            <strong>Localisation</strong>
            <div>
              {e.localisation?.site?.libelle} · {e.localisation?.libelle}
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-h">
          <h3>Historique des OT</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Priorité</th>
            </tr>
          </thead>
          <tbody>
            {(e.historique ?? []).map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/ordres-travail/${o.id}`} className="mono">
                    {o.numero}
                  </Link>
                </td>
                <td>{o.typeMaintenance}</td>
                <td>
                  <Badge valeur={o.statut} />
                </td>
                <td>
                  <Badge valeur={o.priorite} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NouvelEquipementPage() {
  const nav = useNavigate();
  const { aPermission } = useAuth();
  const [familles, setFamilles] = useState<{ id: number; libelle: string }[]>([]);
  const [locs, setLocs] = useState<{ id: number; libelle: string }[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    designation: '',
    familleId: '',
    localisationId: '',
    criticite: 'C',
    marque: '',
    modele: '',
  });

  useEffect(() => {
    metier.familles().then(setFamilles);
    metier.localisations().then(setLocs);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const cree = await metier.creerEquipement({
        designation: form.designation,
        familleId: form.familleId ? Number(form.familleId) : undefined,
        localisationId: form.localisationId ? Number(form.localisationId) : undefined,
        criticite: form.criticite,
        marque: form.marque || undefined,
        modele: form.modele || undefined,
      });
      nav(`/equipements/${cree.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!aPermission('equipement.creer')) return <div className="alert alert-err">Droit insuffisant.</div>;

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-h">
        <h3>Créer un équipement</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b">
        {err && <div className="alert alert-err">{err}</div>}
        <p>Le code SITE-FAMILLE-NNN et le QR sont proposés par le serveur (RG-02).</p>
        <div className="form-grid">
          <label className="field full">
            Désignation
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} required />
          </label>
          <label className="field">
            Famille
            <Selecteur value={form.familleId} onChange={(e) => setForm({ ...form, familleId: e.target.value })}>
              <option value="">—</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.libelle}
                </option>
              ))}
            </Selecteur>
          </label>
          <label className="field">
            Localisation
            <Selecteur value={form.localisationId} onChange={(e) => setForm({ ...form, localisationId: e.target.value })}>
              <option value="">—</option>
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.libelle}
                </option>
              ))}
            </Selecteur>
          </label>
          <label className="field">
            Criticité
            <Selecteur value={form.criticite} onChange={(e) => setForm({ ...form, criticite: e.target.value })}>
              <option value="A">A — arrêt / risque majeur</option>
              <option value="B">B — dégradation</option>
              <option value="C">C — sans impact immédiat</option>
            </Selecteur>
          </label>
          <label className="field">
            Marque
            <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />
          </label>
          <label className="field">
            Modèle
            <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} />
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>
    </form>
  );
}
