import { FormEvent, useEffect, useState } from 'react';
import { Check, Plus, Send, X } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Demande, Equipement, ReponsePaginee } from '../../types';

export function ListeDemandesPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<Demande> | null>(null);
  useEffect(() => {
    metier.demandes().then(setPage);
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Demandes d\'intervention</h2>
          <p>Une DI n\'est pas un ordre de travail. Seule la conversion crée un OT numéroté.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: "Demandes d'intervention",
              compartiment: 'Maintenance',
              colonnes: ['N°', 'Équipement', 'Urgence', 'Arrêt', 'Statut'],
              lignes: (page?.donnees ?? []).map((d) => [
                d.numero,
                d.equipement?.codeEquipement ?? '',
                d.urgence,
                d.arretProduction ? 'Oui' : 'Non',
                d.statut,
              ]),
              nomFichier: 'rapport-demandes.pdf',
            }}
          />
        {aPermission('demande.creer') && (
          <Link className="btn btn-primary" to="/demandes/nouvelle">
            <Plus size={16} />
            Nouvelle demande
          </Link>
        )}
        </div>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Équipement</th>
              <th>Urgence</th>
              <th>Arrêt</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link to={`/demandes/${d.id}`} className="mono">
                    {d.numero}
                  </Link>
                </td>
                <td>
                  {d.equipement?.codeEquipement} — {d.equipement?.designation}
                </td>
                <td>
                  <Badge valeur={d.urgence} />
                </td>
                <td>{d.arretProduction ? 'Oui' : 'Non'}</td>
                <td>
                  <Badge valeur={d.statut} />
                </td>
                <td>{dateFr(d.dateDemande)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NouvelleDemandePage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    equipementId: sp.get('equipementId') ?? '',
    description: '',
    urgence: 'P3_NORMALE',
    arretProduction: false,
  });

  useEffect(() => {
    metier.equipements({ limite: 200 }).then((p) => setEquipements(p.donnees));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const d = await metier.creerDemande({
        equipementId: Number(form.equipementId),
        description: form.description,
        urgence: form.urgence,
        arretProduction: form.arretProduction,
      });
      nav(`/demandes/${d.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-h">
        <h3>Signaler une anomalie</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b">
        {err && <div className="alert alert-err">{err}</div>}
        <div className="form-grid">
          <label className="field full">
            Équipement
            <Selecteur
              required
              value={form.equipementId}
              onChange={(e) => setForm({ ...form, equipementId: e.target.value })}
            >
              <option value="">Sélectionner…</option>
              {equipements.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.codeEquipement} — {eq.designation}
                </option>
              ))}
            </Selecteur>
          </label>
          <label className="field full">
            Description du problème
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="field">
            Urgence perçue
            <Selecteur value={form.urgence} onChange={(e) => setForm({ ...form, urgence: e.target.value })}>
              <option value="P1_URGENT">P1 — arrêt / HSE</option>
              <option value="P2_HAUTE">P2 — haute</option>
              <option value="P3_NORMALE">P3 — normale</option>
              <option value="P4_BASSE">P4 — basse</option>
            </Selecteur>
          </label>
          <label className="field">
            Arrêt de production
            <Selecteur
              value={form.arretProduction ? '1' : '0'}
              onChange={(e) => setForm({ ...form, arretProduction: e.target.value === '1' })}
            >
              <option value="0">Non</option>
              <option value="1">Oui</option>
            </Selecteur>
          </label>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary">
            <Send size={16} />
            Envoyer la demande
          </button>
        </div>
      </div>
    </form>
  );
}

export function DetailDemandePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { aPermission } = useAuth();
  const [d, setD] = useState<Demande | null>(null);
  const [motif, setMotif] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (id) metier.demande(Number(id)).then(setD);
  }, [id]);

  async function convertir() {
    try {
      const r = await metier.convertirDemande(Number(id));
      nav(`/ordres-travail/${r.ordreTravail.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }
  async function rejeter() {
    try {
      setD(await metier.rejeterDemande(Number(id), motif));
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!d) return <p>Chargement…</p>;
  return (
    <div className="card">
      <div className="card-h">
        <h3 className="mono">{d.numero}</h3>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <Badge valeur={d.statut} />
        </div>
      </div>
      <div className="card-b">
        {err && <div className="alert alert-err">{err}</div>}
        <p>
          <strong>Équipement :</strong> {d.equipement?.codeEquipement} — {d.equipement?.designation}
        </p>
        <p>
          <strong>Urgence :</strong> <Badge valeur={d.urgence} /> · Arrêt production : {d.arretProduction ? 'Oui' : 'Non'}
        </p>
        <p>{d.description}</p>
        {d.motifRejet && <div className="alert alert-err">Rejet : {d.motifRejet}</div>}
        {d.statut === 'NOUVELLE' && aPermission('demande.valider') && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn btn-ok" onClick={convertir}>
              <Check size={16} />
              Accepter et créer l'OT
            </button>
            <input
              placeholder="Motif de rejet obligatoire"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
            <button className="btn btn-danger" onClick={rejeter}>
              <X size={16} />
              Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
