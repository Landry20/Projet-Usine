import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Plus, Printer, Warehouse } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { imprimerEtiquetteLot } from '../../lib/etiquette-lot';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type {
  ArrivageMatiere,
  DashboardDepot,
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

export function DashboardDepotPage() {
  const { aPermission } = useAuth();
  const [d, setD] = useState<DashboardDepot | null>(null);
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

  if (!d) return err ? <div className="alert alert-err">{err}</div> : <p>Chargement du dépôt…</p>;

  return (
    <div>
      <Entete
        titre="Dépôts & matières premières"
        texte="Stock par zone et par lot. Une alerte apparaît dès qu’une matière passe sous son seuil critique."
      />
      {err && <div className="alert alert-err">{err}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Lots en stock</div>
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
                      <button type="button" className="btn btn-gold" onClick={() => demanderAchat(a.produitId)}>
                        Demander un achat
                      </button>
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
          <h3>Stock par dépôt</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Lots</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            {d.parDepot.map((p) => (
              <tr key={p.depot.id}>
                <td>{p.depot.libelle}</td>
                <td>{p.nbLots}</td>
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
  const [zones, setZones] = useState<DepotZone[]>([]);
  const [form, setForm] = useState({ code: '', libelle: '', type: 'STOCKAGE' });
  const [err, setErr] = useState('');

  function charger() {
    metier.depots().then(setZones);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await metier.creerDepot(form);
      setForm({ code: '', libelle: '', type: form.type });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete titre="Zones de dépôt" texte="Créez les espaces de stockage (réception, magasin central, zone brute…)." />
      {peutGererDepot(aPermission) && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle zone</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="REC" />
            </label>
            <label className="field">
              Libellé
              <input required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Dépôt de réception" />
            </label>
            <Selecteur label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="RECEPTION">Réception</option>
              <option value="PRODUCTION">Production</option>
              <option value="CENTRAL">Magasin central</option>
              <option value="BRUTE">Zone brute</option>
              <option value="STOCKAGE">Stockage</option>
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary">
                <Plus size={16} /> Créer la zone
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Zone</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="mono">{z.code}</td>
                <td>{z.libelle}</td>
                <td>
                  <Badge valeur={z.type} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReceptionPage() {
  const { aPermission } = useAuth();
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

  function charger() {
    metier.depots().then(setZones);
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setMp(p.donnees));
    metier.fournisseurs().then(setFourns).catch(() => setFourns([]));
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
      setOk(`Réception ${a.numero} — lot ${a.lotDepot?.numero ?? ''} créé.`);
      if (a.lotDepot) imprimerEtiquetteLot(a.lotDepot);
      setForm({ ...form, numeroCamion: '', poidsBrut: '', referenceBl: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete
        titre="Réception matière première"
        texte="Saisissez le camion : un numéro de lot LOT-MP-AAAAMMJJ-001 est généré et l’étiquette s’imprime."
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
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouveau camion</h3>
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
            <Selecteur label="Dépôt de destination" value={form.depotId} onChange={(e) => setForm({ ...form, depotId: e.target.value })}>
              <option value="">—</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.libelle}
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
            <div className="full">
              <button className="btn btn-primary">Enregistrer et imprimer l’étiquette</button>
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
  const [dest, setDest] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');

  function charger() {
    metier.lotsDepot().then(setLots);
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

  return (
    <div>
      <Entete
        titre="Lots & stock"
        texte="Quantités disponibles par lot. Transférez un lot d’une zone vers une autre (réception → production)."
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Lot</th>
              <th>Matière</th>
              <th>Dépôt</th>
              <th>Quantité</th>
              <th>État</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
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
                    <button type="button" className="btn btn-ghost" onClick={() => imprimerEtiquetteLot(l)}>
                      <Printer size={15} /> Étiquette
                    </button>
                    {peutGererDepot(aPermission) && Number(l.quantite) > 0 && (
                      <>
                        <Selecteur value={dest[l.id] ?? ''} onChange={(e) => setDest({ ...dest, [l.id]: e.target.value })}>
                          <option value="">Transférer vers…</option>
                          {zones
                            .filter((z) => z.id !== l.depotId)
                            .map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.libelle}
                              </option>
                            ))}
                        </Selecteur>
                        <button type="button" className="btn btn-primary" disabled={!dest[l.id]} onClick={() => transferer(l.id)}>
                          Transférer
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {lots.length === 0 && (
              <tr>
                <td colSpan={6}>Aucun lot. Enregistrez une réception pour en créer.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MouvementsDepotPage() {
  const [mvts, setMvts] = useState<MouvementLotDepot[]>([]);
  useEffect(() => {
    metier.mouvementsLotsDepot().then(setMvts);
  }, []);
  return (
    <div>
      <Entete titre="Entrées / sorties" texte="Historique des réceptions, sorties vers la production et transferts entre dépôts." />
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
  const [page, setPage] = useState<ReponsePaginee<DemandeMatiere> | null>(null);
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
    <div>
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
            {page?.donnees.map((d) => (
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
                      <button type="button" className="btn btn-ok" onClick={() => servir(d.id)}>
                        Servir le lot
                      </button>
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
  const [liste, setListe] = useState<import('../../types').DemandeAchat[]>([]);
  const [motif, setMotif] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');

  function charger() {
    metier.demandesAchat().then(setListe).catch(() => setErr('Impossible de charger les demandes d’achat.'));
  }
  useEffect(() => {
    charger();
  }, []);

  async function valider(id: number) {
    setErr('');
    try {
      await metier.validerDemandeAchat(id);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }
  async function rejeter(id: number) {
    setErr('');
    try {
      await metier.rejeterDemandeAchat(id, motif[id] || 'Rejet direction');
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete titre="Demandes d’achat" texte="Alertes de stock bas envoyées par le dépôt. Validez pour lancer la commande fournisseur." />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>N°</th>
              <th>Matière</th>
              <th>Quantité</th>
              <th>Motif</th>
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
                <td>{d.motif ?? '—'}</td>
                <td>
                  <Badge valeur={d.statut} />
                </td>
                <td>
                  {d.statut === 'EN_ATTENTE' && (aPermission('achat.valider') || aPermission('direction.lire')) && (
                    <div className="page-head-actions">
                      <button type="button" className="btn btn-ok" onClick={() => valider(d.id)}>
                        Valider
                      </button>
                      <input
                        placeholder="Motif rejet"
                        value={motif[d.id] ?? ''}
                        onChange={(e) => setMotif({ ...motif, [d.id]: e.target.value })}
                      />
                      <button type="button" className="btn btn-danger" onClick={() => rejeter(d.id)}>
                        Rejeter
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={6}>Aucune demande d’achat.</td>
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
