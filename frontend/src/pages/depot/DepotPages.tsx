import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, ChevronDown, Eye, Pencil, Plus, Printer, Trash2, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Bouton } from '../../components/ui/Bouton';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { ConfirmModale } from '../../components/ui/ConfirmModale';
import { Modale } from '../../components/ui/Modale';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { imprimerEtiquetteLot } from '../../lib/etiquette-lot';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type {
  ArrivageMatiere,
  DashboardDepot,
  DemandeAchat,
  DemandeMatiere,
  DepotZone,
  Fournisseur,
  LotDepot,
  MouvementLotDepot,
  Produit,
  ReponsePaginee,
} from '../../types';

function Entete({ titre, texte, extra }: { titre: string; texte: string; extra?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{titre}</h2>
        <p>{texte}</p>
      </div>
      <div className="page-head-actions">
        <BoutonActualiser />
        {extra}
      </div>
    </div>
  );
}

function peutGererDepot(aPermission: (c: string) => boolean) {
  return aPermission('depot.gerer') || aPermission('production.gerer') || aPermission('quart.saisir');
}

const ZONE_VIDE = { code: '', libelle: '', capaciteMaxLots: '4' };
const PAGE_VIDE = { donnees: [] as DemandeMatiere[], page: 1, limite: 100, total: 0, pages: 0 };
const DASH_VIDE: DashboardDepot = {
  nbLots: 0,
  stockTotal: '0',
  demandesEnAttente: 0,
  alertes: [],
  parDepot: [],
  lots: [],
};

export function DashboardDepotPage() {
  const { aPermission } = useAuth();
  const [d, setD] = useState<DashboardDepot>(DASH_VIDE);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  function charger() {
    metier.dashboardDepot().then(setD).catch(() => setErr('Impossible de charger le dépôt.'));
  }
  useEffect(() => {
    charger();
  }, []);

  async function demanderAchat(produitId: number) {
    setErr('');
    setOk('');
    try {
      const da = await metier.creerDemandeAchat({ produitId });
      setOk(`Demande ${da.numero} envoyée à la Direction.`);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div className="page-fluide">
      <Entete
        titre="Dépôts & matières premières"
        texte="Stock par zone et par palette. Une alerte apparaît dès qu’une matière passe sous son seuil."
      />
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Palettes / lots</div>
          <div className="value">{d.nbLots}</div>
        </div>
        <div className="kpi">
          <div className="label">Quantité totale</div>
          <div className="value">{d.stockTotal}</div>
        </div>
        <div className={`kpi ${d.alertes.length ? 'alert' : ''}`}>
          <div className="label">Alertes seuil</div>
          <div className="value">{d.alertes.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Demandes production</div>
          <div className="value">{d.demandesEnAttente}</div>
        </div>
      </div>
      {d.alertes.length > 0 && (
        <div className="card">
          <div className="card-h">
            <h3>
              <AlertTriangle size={16} /> Stock sous le seuil
            </h3>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Stock</th>
                <th>Seuil</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.alertes.map((a) => (
                <tr key={a.produitId}>
                  <td>
                    {a.refProduit} — {a.designation}
                  </td>
                  <td>
                    {a.quantiteStock} {a.unite}
                  </td>
                  <td>
                    {a.seuilReappro} {a.unite}
                  </td>
                  <td>
                    {peutGererDepot(aPermission) && (
                      <Bouton variante="gold" onClick={() => demanderAchat(a.produitId)}>
                        Demander un achat
                      </Bouton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card">
        <div className="card-h">
          <h3>Occupation des zones</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Palettes</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            {d.parDepot.map((p) => (
              <tr key={p.depot.id}>
                <td>{p.depot.libelle}</td>
                <td>
                  {p.nbLots}
                  {p.depot.capaciteMaxLots != null ? ` / ${p.depot.capaciteMaxLots}` : ''}
                </td>
                <td>{p.quantite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ZonesDepotPage() {
  const { aPermission } = useAuth();
  const gerer = peutGererDepot(aPermission);
  const [zones, setZones] = useState<DepotZone[]>([]);
  const [form, setForm] = useState(ZONE_VIDE);
  const [modale, setModale] = useState<'creer' | 'modifier' | 'detail' | null>(null);
  const [choisi, setChoisi] = useState<DepotZone | null>(null);
  const [aSupprimer, setASupprimer] = useState<DepotZone | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  function charger() {
    metier.depots().then(setZones).catch(() => setZones([]));
  }
  useEffect(() => {
    charger();
  }, []);

  function ouvrirCreer() {
    setErr('');
    setForm(ZONE_VIDE);
    setChoisi(null);
    setModale('creer');
  }

  function ouvrirModifier(z: DepotZone) {
    setErr('');
    setChoisi(z);
    setForm({
      code: z.code,
      libelle: z.libelle,
      capaciteMaxLots: z.capaciteMaxLots != null ? String(z.capaciteMaxLots) : '',
    });
    setModale('modifier');
  }

  async function voirDetail(z: DepotZone) {
    setErr('');
    try {
      setChoisi(await metier.depot(z.id));
      setModale('detail');
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy('sauver');
    try {
      const payload = {
        code: form.code,
        libelle: form.libelle,
        type: 'STOCKAGE',
        capaciteMaxLots: form.capaciteMaxLots ? Number(form.capaciteMaxLots) : undefined,
      };
      if (modale === 'modifier' && choisi) await metier.modifierDepot(choisi.id, payload);
      else await metier.creerDepot(payload);
      setModale(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  async function supprimer() {
    if (!aSupprimer) return;
    setBusy('supprimer');
    setErr('');
    try {
      await metier.supprimerDepot(aSupprimer.id);
      setASupprimer(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page-fluide">
      <Entete
        titre="Zones de dépôt"
        texte="Un bouton pour créer. Le tableau montre les places occupées (0 / 4 si la zone peut contenir 4 lots)."
        extra={
          gerer ? (
            <Bouton onClick={ouvrirCreer}>
              <Plus size={16} /> Créer un dépôt
            </Bouton>
          ) : undefined
        }
      />
      {err && !modale && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom du dépôt</th>
              <th>Lots reçus</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="mono">{z.code}</td>
                <td>{z.libelle}</td>
                <td>
                  <strong>
                    {z.nbLotsOccupes ?? 0}
                    {z.capaciteMaxLots != null ? ` / ${z.capaciteMaxLots}` : ''}
                  </strong>
                </td>
                <td>
                  <div className="page-head-actions">
                    <Bouton variante="ghost" onClick={() => voirDetail(z)}>
                      <Eye size={14} /> Détails
                    </Bouton>
                    {gerer && (
                      <>
                        <Bouton variante="ghost" onClick={() => ouvrirModifier(z)}>
                          <Pencil size={14} /> Modifier
                        </Bouton>
                        <Bouton variante="danger" onClick={() => setASupprimer(z)}>
                          <Trash2 size={14} /> Supprimer
                        </Bouton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {zones.length === 0 && (
              <tr>
                <td colSpan={4}>Aucun dépôt. Créez le premier avec le bouton ci-dessus.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modale === 'creer' || modale === 'modifier') && (
        <Modale
          titre={modale === 'creer' ? 'Nouveau dépôt' : `Modifier ${form.code}`}
          texte="Nom, code et nombre de lots (palettes) que cette zone peut contenir."
          onFermer={() => setModale(null)}
        >
          <form className="form-grid" onSubmit={enregistrer}>
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Nom du dépôt
              <input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Dépôt A" />
            </label>
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DEP-A" />
            </label>
            <label className="field">
              Nombre de lots max.
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.capaciteMaxLots}
                onChange={(e) => setForm({ ...form, capaciteMaxLots: e.target.value })}
              />
            </label>
            <div className="full page-head-actions">
              <Bouton variante="ghost" onClick={() => setModale(null)}>
                Annuler
              </Bouton>
              <Bouton type="submit" chargement={busy === 'sauver'}>
                Enregistrer
              </Bouton>
            </div>
          </form>
        </Modale>
      )}

      {modale === 'detail' && choisi && (
        <Modale titre={choisi.libelle} texte={`Code ${choisi.code}`} onFermer={() => setModale(null)}>
          <p>
            Occupation : <strong>{choisi.nbLotsOccupes ?? 0}</strong>
            {choisi.capaciteMaxLots != null ? ` / ${choisi.capaciteMaxLots} lots` : ' lots'}
          </p>
          <table className="data">
            <thead>
              <tr>
                <th>Palette / lot</th>
                <th>Matière</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {(choisi.lots ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="mono">{l.numero}</td>
                  <td>{l.produit?.designation ?? l.libelle}</td>
                  <td>
                    {l.quantite} {l.produit?.unite ?? ''}
                  </td>
                </tr>
              ))}
              {(choisi.lots ?? []).length === 0 && (
                <tr>
                  <td colSpan={3}>Aucun lot dans cette zone.</td>
                </tr>
              )}
            </tbody>
          </table>
        </Modale>
      )}

      {aSupprimer && (
        <ConfirmModale
          texte={`Supprimer définitivement le dépôt « ${aSupprimer.libelle} » ? Cette action est irréversible.`}
          chargement={busy === 'supprimer'}
          onAnnuler={() => setASupprimer(null)}
          onConfirmer={supprimer}
        />
      )}
    </div>
  );
}

export function MatieresDepotPage() {
  const { aPermission } = useAuth();
  const gerer = peutGererDepot(aPermission);
  const [liste, setListe] = useState<Produit[]>([]);
  const [form, setForm] = useState({ refProduit: '', designation: '', unite: 'kg', seuilReappro: '0' });
  const [modale, setModale] = useState<'creer' | 'modifier' | null>(null);
  const [choisi, setChoisi] = useState<Produit | null>(null);
  const [aSupprimer, setASupprimer] = useState<Produit | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  function charger() {
    metier
      .produits({ type: 'MATIERE_PREMIERE', limite: 200 })
      .then((p) => setListe(p.donnees))
      .catch(() => setListe([]));
  }
  useEffect(() => {
    charger();
  }, []);

  function ouvrir(mode: 'creer' | 'modifier', p?: Produit) {
    setErr('');
    setModale(mode);
    if (mode === 'modifier' && p) {
      setChoisi(p);
      setForm({
        refProduit: p.refProduit,
        designation: p.designation,
        unite: p.unite,
        seuilReappro: String(p.seuilReappro ?? 0),
      });
    } else {
      setChoisi(null);
      setForm({ refProduit: '', designation: '', unite: 'kg', seuilReappro: '0' });
    }
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setBusy('sauver');
    setErr('');
    try {
      const payload = { ...form, typeProduit: 'MATIERE_PREMIERE', seuilReappro: Number(form.seuilReappro) };
      if (modale === 'modifier' && choisi) await metier.modifierProduit(choisi.id, payload);
      else await metier.creerProduit(payload);
      setModale(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  async function supprimer() {
    if (!aSupprimer) return;
    setBusy('supprimer');
    try {
      await metier.supprimerProduit(aSupprimer.id);
      setASupprimer(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }


  return (
    <div className="page-fluide">
      <Entete
        titre="Matières premières"
        texte="Référentiel des matières utilisées à l’usine. La réception crée ensuite un lot dans la zone choisie."
        extra={
          gerer ? (
            <Bouton onClick={() => ouvrir('creer')}>
              <Plus size={16} /> Enregistrer une matière
            </Bouton>
          ) : undefined
        }
      />
      {err && !modale && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Désignation</th>
              <th>Stock</th>
              <th>Seuil</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.refProduit}</td>
                <td>{p.designation}</td>
                <td>
                  {p.quantiteStock} {p.unite}
                </td>
                <td>
                  {p.seuilReappro} {p.unite}
                </td>
                <td>
                  {gerer && (
                    <div className="page-head-actions">
                      <Bouton variante="ghost" onClick={() => ouvrir('modifier', p)}>
                        <Pencil size={14} /> Modifier
                      </Bouton>
                      <Bouton variante="danger" onClick={() => setASupprimer(p)}>
                        <Trash2 size={14} /> Supprimer
                      </Bouton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={5}>Aucune matière. Enregistrez-en une pour pouvoir réceptionner.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {modale && (
        <Modale titre={modale === 'creer' ? 'Nouvelle matière première' : 'Modifier la matière'} onFermer={() => setModale(null)}>
          <form className="form-grid" onSubmit={enregistrer}>
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Référence
              <input required value={form.refProduit} onChange={(e) => setForm({ ...form, refProduit: e.target.value })} />
            </label>
            <label className="field">
              Nom
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </label>
            <label className="field">
              Unité
              <input value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })} />
            </label>
            <label className="field">
              Seuil de réappro
              <input type="number" min="0" value={form.seuilReappro} onChange={(e) => setForm({ ...form, seuilReappro: e.target.value })} />
            </label>
            <div className="full page-head-actions">
              <Bouton variante="ghost" onClick={() => setModale(null)}>
                Annuler
              </Bouton>
              <Bouton type="submit" chargement={busy === 'sauver'}>
                Enregistrer
              </Bouton>
            </div>
          </form>
        </Modale>
      )}
      {aSupprimer && (
        <ConfirmModale
          texte={`Supprimer la matière « ${aSupprimer.designation} » ?`}
          chargement={busy === 'supprimer'}
          onAnnuler={() => setASupprimer(null)}
          onConfirmer={supprimer}
        />
      )}
    </div>
  );
}

export function ReceptionPage() {
  const { aPermission } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [zones, setZones] = useState<DepotZone[]>([]);
  const [mp, setMp] = useState<Produit[]>([]);
  const [fourns, setFourns] = useState<Fournisseur[]>([]);
  const [arrivages, setArrivages] = useState<ArrivageMatiere[]>([]);
  const [form, setForm] = useState({
    produitId: '',
    depotId: '',
    fournisseurId: '',
    fournisseurNom: '',
    dateReception: new Date().toISOString().slice(0, 10),
    numeroCamion: '',
    poidsBrut: '',
    referenceBl: '',
  });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  function charger() {
    metier.depots().then(setZones);
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setMp(p.donnees)).catch(() => setMp([]));
    metier.fournisseurs().then(setFourns).catch(() => setFourns([]));
    metier.arrivages().then(setArrivages).catch(() => setArrivages([]));
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setOk('');
    setBusy(true);
    try {
      const a = await metier.creerArrivage({
        produitId: Number(form.produitId),
        depotId: Number(form.depotId),
        fournisseurId: form.fournisseurId ? Number(form.fournisseurId) : undefined,
        fournisseurNom: form.fournisseurNom || undefined,
        dateReception: form.dateReception,
        numeroCamion: form.numeroCamion || undefined,
        poidsBrut: Number(form.poidsBrut),
        referenceBl: form.referenceBl || undefined,
      });
      setOk(`Réception ${a.numero} — lot ${a.lotDepot?.numero ?? ''} créé dans ${a.depot?.libelle ?? 'la zone'}.`);
      if (a.lotDepot) imprimerEtiquetteLot(a.lotDepot);
      setForm({ ...form, numeroCamion: '', poidsBrut: '', referenceBl: '' });
      setOuvert(false);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="page-fluide">
      <Entete
        titre="Réception matière première"
        texte="C’est toujours une matière première. Le lot (palette) est créé dans la zone choisie."
        extra={
          <BoutonPdf
            compact
            rapport={{
              titre: 'Réceptions MP',
              compartiment: 'Dépôts',
              colonnes: ['N°', 'Date', 'Lot', 'Matière', 'Camion', 'Poids'],
              lignes: arrivages.map((a) => [
                a.numero,
                dateFr(a.dateReception ?? a.dateArrivage),
                a.lotDepot?.numero ?? '',
                a.produit?.designation ?? '',
                a.numeroCamion ?? '—',
                a.poidsBrut ?? a.quantite,
              ]),
              nomFichier: 'receptions-mp.pdf',
            }}
          />
        }
      />
      {peutGererDepot(aPermission) && (
        <div className="card">
          <button type="button" className={`pli-btn ${ouvert ? 'open' : ''}`} onClick={() => setOuvert((v) => !v)}>
            <span>
              <Plus size={16} /> Nouvelle réception
            </span>
            <ChevronDown size={18} />
          </button>
          {ouvert && (
            <form className="card-b form-grid" onSubmit={creer}>
              {err && <div className="alert alert-err full">{err}</div>}
              {ok && <div className="alert alert-ok full">{ok}</div>}
              <p className="full">Type : matière première (automatique).</p>
              <Selecteur label="Matière première" value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
                <option value="">—</option>
                {mp.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.refProduit} — {p.designation}
                  </option>
                ))}
              </Selecteur>
              <Selecteur label="Zone de dépôt" value={form.depotId} onChange={(e) => setForm({ ...form, depotId: e.target.value })}>
                <option value="">—</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.libelle}
                    {z.capaciteMaxLots != null ? ` (${z.nbLotsOccupes ?? 0}/${z.capaciteMaxLots})` : ''}
                  </option>
                ))}
              </Selecteur>
              <Selecteur label="Fournisseur" value={form.fournisseurId} onChange={(e) => setForm({ ...form, fournisseurId: e.target.value })}>
                <option value="">Saisie libre…</option>
                {fourns.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.raisonSociale}
                  </option>
                ))}
              </Selecteur>
              <label className="field">
                Fournisseur (si absent)
                <input value={form.fournisseurNom} onChange={(e) => setForm({ ...form, fournisseurNom: e.target.value })} />
              </label>
              <label className="field">
                Date
                <input required type="date" value={form.dateReception} onChange={(e) => setForm({ ...form, dateReception: e.target.value })} />
              </label>
              <label className="field">
                N° camion
                <input required value={form.numeroCamion} onChange={(e) => setForm({ ...form, numeroCamion: e.target.value })} />
              </label>
              <label className="field">
                Poids brut
                <input required type="number" min="0.001" step="0.001" value={form.poidsBrut} onChange={(e) => setForm({ ...form, poidsBrut: e.target.value })} />
              </label>
              <label className="field">
                N° BL
                <input value={form.referenceBl} onChange={(e) => setForm({ ...form, referenceBl: e.target.value })} />
              </label>
              <div className="full page-head-actions">
                <Bouton variante="ghost" onClick={() => setOuvert(false)}>
                  Masquer
                </Bouton>
                <Bouton type="submit" chargement={busy}>
                  Enregistrer le lot
                </Bouton>
              </div>
            </form>
          )}
        </div>
      )}
      {ok && !ouvert && <div className="alert alert-ok">{ok}</div>}
      {err && !ouvert && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Lot</th>
              <th>Matière</th>
              <th>Camion</th>
              <th>Poids</th>
              <th>Dépôt</th>
            </tr>
          </thead>
          <tbody>
            {arrivages.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.numero}</td>
                <td>{dateFr(a.dateReception ?? a.dateArrivage)}</td>
                <td className="mono">{a.lotDepot?.numero ?? '—'}</td>
                <td>{a.produit?.designation}</td>
                <td>{a.numeroCamion ?? '—'}</td>
                <td>{a.poidsBrut ?? a.quantite}</td>
                <td>{a.depot?.libelle ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LotsDepotPage() {
  const { aPermission } = useAuth();
  const [lots, setLots] = useState<LotDepot[]>([]);
  const [zones, setZones] = useState<DepotZone[]>([]);
  const [filtre, setFiltre] = useState<number | 'tous'>('tous');
  const [dest, setDest] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');

  function charger() {
    metier.lotsDepot().then(setLots).catch(() => setLots([]));
    metier.depots().then(setZones);
  }
  useEffect(() => {
    charger();
  }, []);

  async function transferer(id: number) {
    setErr('');
    try {
      await metier.transfererLotDepot(id, { depotDestinationId: Number(dest[id]) });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  const visibles = filtre === 'tous' ? lots : lots.filter((l) => l.depotId === filtre);
  const zoneFiltre = zones.find((z) => z.id === filtre);

  return (
    <div className="page-fluide">
      <Entete titre="Lots & palettes" texte="Faites glisser la liste des zones pour voir les palettes de chaque dépôt." />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="zone-slider" role="tablist" aria-label="Zones de dépôt">
        <button type="button" className={filtre === 'tous' ? 'active' : ''} onClick={() => setFiltre('tous')}>
          Toutes
          <span>{lots.length} palettes</span>
        </button>
        {zones.map((z) => (
          <button key={z.id} type="button" className={filtre === z.id ? 'active' : ''} onClick={() => setFiltre(z.id)}>
            {z.libelle}
            <span>
              {z.nbLotsOccupes ?? 0}
              {z.capaciteMaxLots != null ? ` / ${z.capaciteMaxLots}` : ''} palettes
            </span>
          </button>
        ))}
      </div>
      {zoneFiltre && (
        <p>
          {zoneFiltre.libelle} : {zoneFiltre.nbLotsOccupes ?? 0}
          {zoneFiltre.capaciteMaxLots != null ? ` / ${zoneFiltre.capaciteMaxLots}` : ''} places occupées.
        </p>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Palette / lot</th>
              <th>Matière</th>
              <th>Dépôt</th>
              <th>Quantité</th>
              <th>État</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => (
              <tr key={l.id}>
                <td className="mono">{l.numero}</td>
                <td>{l.produit?.designation}</td>
                <td>{l.depot?.libelle ?? l.emplacement ?? '—'}</td>
                <td>
                  {l.quantite} {l.produit?.unite ?? ''}
                </td>
                <td>
                  <Badge valeur={l.etat ?? 'EN_STOCK'} />
                </td>
                <td>
                  <div className="page-head-actions">
                    <Bouton variante="ghost" onClick={() => imprimerEtiquetteLot(l)}>
                      <Printer size={15} /> Étiquette
                    </Bouton>
                    {peutGererDepot(aPermission) && Number(l.quantite) > 0 && (
                      <>
                        <Selecteur value={dest[l.id] ?? ''} onChange={(e) => setDest({ ...dest, [l.id]: e.target.value })}>
                          <option value="">Transférer vers…</option>
                          {zones
                            .filter((z) => z.id !== l.depotId)
                            .map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.libelle}
                                {z.capaciteMaxLots != null ? ` (${z.nbLotsOccupes ?? 0}/${z.capaciteMaxLots})` : ''}
                              </option>
                            ))}
                        </Selecteur>
                        <Bouton disabled={!dest[l.id]} onClick={() => transferer(l.id)}>
                          Transférer
                        </Bouton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={6}>Aucune palette dans cette zone.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemandesMpPage() {
  const { aPermission } = useAuth();
  const [mp, setMp] = useState<Produit[]>([]);
  const [liste, setListe] = useState<DemandeAchat[]>([]);
  const [form, setForm] = useState({ produitId: '', quantite: '', motif: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  function charger() {
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setMp(p.donnees)).catch(() => setMp([]));
    metier.demandesAchat().then(setListe).catch(() => setListe([]));
  }
  useEffect(() => {
    charger();
  }, []);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setOk('');
    setBusy(true);
    try {
      const da = await metier.creerDemandeAchat({
        produitId: Number(form.produitId),
        quantite: form.quantite ? Number(form.quantite) : undefined,
        motif: form.motif || undefined,
      });
      setOk(`Demande ${da.numero} envoyée à la Direction.`);
      setForm({ produitId: '', quantite: '', motif: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="page-fluide">
      <Entete
        titre="Demande de matière première"
        texte="La Direction reçoit le dossier, le traite, puis peut commander chez le fournisseur."
      />
      {peutGererDepot(aPermission) && (
        <form className="card" onSubmit={envoyer}>
          <div className="card-h">
            <h3>Nouvelle demande</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            {ok && <div className="alert alert-ok full">{ok}</div>}
            <Selecteur label="Matière première" value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
              <option value="">—</option>
              {mp.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} — {p.designation}
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Quantité
              <input type="number" min="0.001" step="0.001" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
            </label>
            <label className="field full">
              Motif
              <input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder="Stock bas, commande prévue…" />
            </label>
            <div className="full">
              <Bouton type="submit" chargement={busy}>
                Envoyer à la Direction
              </Bouton>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.numero}</td>
                <td>{d.produit ? `${d.produit.refProduit} — ${d.produit.designation}` : d.libelle}</td>
                <td>{d.quantite ?? '—'}</td>
                <td>
                  <Badge valeur={d.statut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MouvementsDepotPage() {
  const [mvts, setMvts] = useState<MouvementLotDepot[]>([]);
  useEffect(() => {
    metier.mouvementsLotsDepot().then(setMvts).catch(() => setMvts([]));
  }, []);
  return (
    <div className="page-fluide">
      <Entete titre="Entrées / sorties" texte="Historique des réceptions, sorties vers la production et transferts." />
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Lot</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            {mvts.map((m) => (
              <tr key={m.id}>
                <td>{dateFr(m.dateMvt)}</td>
                <td>
                  <Badge valeur={m.typeMvt} />
                </td>
                <td className="mono">{m.lotDepot?.numero}</td>
                <td>{m.lotDepot?.produit?.designation}</td>
                <td>{m.quantite}</td>
                <td>{m.motif ?? '—'}</td>
              </tr>
            ))}
            {mvts.length === 0 && (
              <tr>
                <td colSpan={6}>Aucun mouvement.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemandesDepotPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<DemandeMatiere>>(PAGE_VIDE);
  const [service, setService] = useState<Record<number, { qte: string; motif: string }>>({});
  const [err, setErr] = useState('');

  function charger() {
    metier.demandesMatiere({ limite: 100 }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  async function servir(id: number) {
    const s = service[id];
    setErr('');
    try {
      await metier.servirDemandeMatiere(id, {
        quantiteServie: Number(s?.qte),
        motifEcart: s?.motif || undefined,
      });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div className="page-fluide">
      <Entete
        titre="Demandes de la production"
        texte="Validez le transfert : le lot passe de « en stock dépôt » à « en cours de transformation »."
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Matière</th>
              <th>Lot demandé</th>
              <th>Demandée</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {page.donnees.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.numero}</td>
                <td>
                  {d.produit?.refProduit} — {d.produit?.designation}
                </td>
                <td className="mono">{d.lotDepot?.numero ?? 'FIFO'}</td>
                <td>{d.quantiteDemandee}</td>
                <td>
                  <Badge valeur={d.statut} />
                </td>
                <td>
                  {d.statut === 'DEMANDEE' && peutGererDepot(aPermission) && (
                    <div className="page-head-actions">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={service[d.id]?.qte ?? d.quantiteDemandee}
                        onChange={(e) =>
                          setService({ ...service, [d.id]: { qte: e.target.value, motif: service[d.id]?.motif ?? '' } })
                        }
                      />
                      <input
                        placeholder="Motif si écart"
                        value={service[d.id]?.motif ?? ''}
                        onChange={(e) =>
                          setService({
                            ...service,
                            [d.id]: { qte: service[d.id]?.qte ?? d.quantiteDemandee, motif: e.target.value },
                          })
                        }
                      />
                      <Bouton variante="ok" onClick={() => servir(d.id)}>
                        Servir le lot
                      </Bouton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DemandesAchatPage() {
  const { aPermission } = useAuth();
  const traiter = aPermission('achat.valider') || aPermission('direction.lire');
  const [liste, setListe] = useState<DemandeAchat[]>([]);
  const [fourns, setFourns] = useState<Fournisseur[]>([]);
  const [motif, setMotif] = useState<Record<number, string>>({});
  const [fournId, setFournId] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState('');

  function charger() {
    metier.demandesAchat().then(setListe).catch(() => setListe([]));
    metier.fournisseurs().then(setFourns).catch(() => setFourns([]));
  }
  useEffect(() => {
    charger();
  }, []);

  async function valider(id: number) {
    setErr('');
    setBusy(`v-${id}`);
    try {
      await metier.validerDemandeAchat(id);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }
  async function rejeter(id: number) {
    setErr('');
    setBusy(`r-${id}`);
    try {
      await metier.rejeterDemandeAchat(id, motif[id] || 'Rejet direction');
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }
  async function commander(id: number) {
    setErr('');
    setOk('');
    setBusy(`c-${id}`);
    try {
      const r = await metier.commanderDemandeAchat(id, Number(fournId[id]));
      setOk(
        r.emailEnvoye
          ? `Commande ${r.numero} envoyée à ${r.fournisseur?.raisonSociale}.`
          : `Commande enregistrée. E-mail non envoyé : ${r.emailErreur ?? 'configurez SMTP_HOST'}.`,
      );
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="page-fluide">
      <Entete
        titre="Demandes de matières premières / commandes"
        texte="Traitez le dossier du dépôt, puis commandez chez le fournisseur (e-mail)."
        extra={
          traiter ? (
            <Link className="btn btn-ghost" to="/direction/fournisseurs">
              Gérer les fournisseurs
            </Link>
          ) : undefined
        }
      />
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.numero}</td>
                <td>{d.produit ? `${d.produit.refProduit} — ${d.produit.designation}` : d.libelle}</td>
                <td>{d.quantite ?? '—'}</td>
                <td>
                  <Badge valeur={d.statut} />
                  {d.emailEnvoye && <span> · e-mail envoyé</span>}
                </td>
                <td>
                  {traiter && d.statut !== 'REJETEE' && d.statut !== 'COMMANDEE' && (
                    <div className="page-head-actions">
                      {d.statut === 'EN_ATTENTE' && (
                        <>
                          <Bouton variante="ok" chargement={busy === `v-${d.id}`} onClick={() => valider(d.id)}>
                            Valider
                          </Bouton>
                          <input
                            placeholder="Motif rejet"
                            value={motif[d.id] ?? ''}
                            onChange={(e) => setMotif({ ...motif, [d.id]: e.target.value })}
                          />
                          <Bouton variante="danger" chargement={busy === `r-${d.id}`} onClick={() => rejeter(d.id)}>
                            Rejeter
                          </Bouton>
                        </>
                      )}
                      <Selecteur value={fournId[d.id] ?? ''} onChange={(e) => setFournId({ ...fournId, [d.id]: e.target.value })}>
                        <option value="">Choisir un fournisseur</option>
                        {fourns.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.raisonSociale}
                            {f.email ? '' : ' (sans e-mail)'}
                          </option>
                        ))}
                      </Selecteur>
                      <Bouton variante="gold" disabled={!fournId[d.id]} chargement={busy === `c-${d.id}`} onClick={() => commander(d.id)}>
                        Commander
                      </Bouton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={5}>Aucune demande d’achat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IconeDepot() {
  return <Warehouse size={16} />;
}
