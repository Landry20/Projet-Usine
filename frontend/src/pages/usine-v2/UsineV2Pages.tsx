import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { FlaskConical, Plus, Scale, TestTube, Warehouse } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type {
  BulletinAnalyse,
  ClientUsine,
  DashboardDirection,
  DashboardLabo,
  DemandeMatiere,
  Echantillon,
  Expedition,
  JournalQuart,
  LigneProduction,
  NonConformite,
  ParametreAnalyse,
  PointPrelevement,
  Produit,
  ReponsePaginee,
  Tank,
} from '../../types';

function Entete({ titre, texte, extra }: { titre: string; texte: string; extra?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{titre}</h2>
        <p>{texte}</p>
      </div>
      <div className="page-head-actions">
        <BoutonRecherche />
        <BoutonActualiser />
        {extra}
      </div>
    </div>
  );
}

export function DemandesMatierePage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<DemandeMatiere> | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [lignes, setLignes] = useState<LigneProduction[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ produitId: '', quantiteDemandee: '', ligneId: '', quart: 'A' });
  const [service, setService] = useState<Record<number, { qte: string; motif: string }>>({});

  function charger() {
    metier.demandesMatiere().then(setPage);
  }
  useEffect(() => {
    charger();
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setProduits(p.donnees));
    metier.lignesProduction().then(setLignes);
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await metier.creerDemandeMatiere({
        produitId: Number(form.produitId),
        quantiteDemandee: Number(form.quantiteDemandee),
        ligneId: form.ligneId ? Number(form.ligneId) : undefined,
        quart: form.quart,
      });
      setForm({ ...form, quantiteDemandee: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

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
        titre="Demandes de matière première"
        texte="Le chef de quart demande. Le magasinier MP pèse et sert. L’écart exige un motif. Le stock baisse uniquement à ce moment (RG-31)."
      />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('quart.saisir') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle demande</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur
              label="Matière"
              value={form.produitId}
              onChange={(e) => setForm({ ...form, produitId: e.target.value })}
            >
              <option value="">Choisir…</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} — {p.designation} ({p.quantiteStock} {p.unite})
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Quantité (kg)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantiteDemandee}
                onChange={(e) => setForm({ ...form, quantiteDemandee: e.target.value })}
              />
            </label>
            <Selecteur label="Ligne" value={form.ligneId} onChange={(e) => setForm({ ...form, ligneId: e.target.value })}>
              <option value="">—</option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.libelle}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Quart" value={form.quart} onChange={(e) => setForm({ ...form, quart: e.target.value })}>
              <option value="A">Quart A</option>
              <option value="B">Quart B</option>
              <option value="C">Quart C</option>
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                <Plus size={16} /> Demander
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Matière</th>
                <th>Demandée</th>
                <th>Servie</th>
                <th>Quart</th>
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
                  <td>{d.quantiteDemandee}</td>
                  <td>{d.quantiteServie ?? '—'}</td>
                  <td>{d.quart ?? '—'}</td>
                  <td>
                    <Badge valeur={d.statut} />
                  </td>
                  <td>
                    {d.statut === 'DEMANDEE' && aPermission('quart.saisir') && (
                      <div className="page-head-actions">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Servie"
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
                          Servir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={7} className="empty">
                    Aucune demande.
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

export function JournauxQuartPage() {
  const { aPermission } = useAuth();
  const nav = useNavigate();
  const [page, setPage] = useState<ReponsePaginee<JournalQuart> | null>(null);
  const [lignes, setLignes] = useState<LigneProduction[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    dateJournee: new Date().toISOString().slice(0, 10),
    quart: 'A',
    ligneId: '',
  });

  useEffect(() => {
    metier.journaux().then(setPage);
    metier.lignesProduction().then(setLignes);
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const j = await metier.creerJournal({
        dateJournee: form.dateJournee,
        quart: form.quart,
        ligneId: Number(form.ligneId),
      });
      nav(`/production/journaux/${j.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete
        titre="Journaux de quart"
        texte="Cœur de la production : bilan matière quart par quart. Entrées = produit fini + sous-produits + écart (RG-30)."
      />
      <div className="kpis">
        <div className="kpi">
          <div className="label">Seuil alerte écart</div>
          <div className="value">1 %</div>
          <div className="hint">Commentaire obligatoire</div>
        </div>
        <div className="kpi warn">
          <div className="label">Seuil blocage</div>
          <div className="value">3 %</div>
          <div className="hint">Soumission refusée</div>
        </div>
        <div className="kpi">
          <div className="label">Arrêt machine</div>
          <div className="value">≥ 30 min</div>
          <div className="hint">Génère une DI (RG-35)</div>
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('quart.saisir') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Ouvrir un journal</h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Journée
              <input type="date" required value={form.dateJournee} onChange={(e) => setForm({ ...form, dateJournee: e.target.value })} />
            </label>
            <Selecteur label="Quart" value={form.quart} onChange={(e) => setForm({ ...form, quart: e.target.value })}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </Selecteur>
            <Selecteur label="Ligne" value={form.ligneId} onChange={(e) => setForm({ ...form, ligneId: e.target.value })}>
              <option value="">Choisir…</option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.libelle}
                </option>
              ))}
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                <Plus size={16} /> Créer le journal
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Jour</th>
                <th>Quart</th>
                <th>Ligne</th>
                <th>Entrées</th>
                <th>Écart</th>
                <th>Rendement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link className="mono" to={`/production/journaux/${j.id}`}>
                      {j.numero}
                    </Link>
                  </td>
                  <td>{dateFr(j.dateJournee)}</td>
                  <td>{j.quart}</td>
                  <td>{j.ligne?.libelle ?? '—'}</td>
                  <td>{j.totalEntreesKg} kg</td>
                  <td>
                    {j.ecartKg} kg ({j.ecartPct ?? '—'} %)
                  </td>
                  <td>{j.rendementPct ?? '—'} %</td>
                  <td>
                    <Badge valeur={j.statut} />
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={8} className="empty">
                    Aucun journal.
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

export function FicheJournalPage() {
  const { id } = useParams();
  const { aPermission } = useAuth();
  const [j, setJ] = useState<JournalQuart | null>(null);
  const [err, setErr] = useState('');
  const [dms, setDms] = useState<DemandeMatiere[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [entree, setEntree] = useState({ demandeMatiereId: '', quantiteKg: '', lotMatiere: '' });
  const [sortie, setSortie] = useState({ produitId: '', quantiteKg: '', tankId: '', destination: '' });
  const [arret, setArret] = useState({ typeArret: 'PANNE', dureeMin: '', cause: '' });
  const [commentaire, setCommentaire] = useState('');

  function charger() {
    if (!id) return;
    metier.journal(Number(id)).then(setJ);
  }
  useEffect(() => {
    charger();
    metier.demandesMatiere({ limite: 200 }).then((p) => setDms(p.donnees.filter((d) => d.statut === 'SERVIE' || d.statut === 'PARTIELLE')));
    metier.produits({ limite: 200 }).then((p) => setProduits(p.donnees));
    metier.tanks().then(setTanks).catch(() => setTanks([]));
  }, [id]);

  async function run(fn: () => Promise<JournalQuart>) {
    setErr('');
    try {
      setJ(await fn());
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!j) return <p>Chargement du journal…</p>;
  const saisissable = j.statut === 'BROUILLON' || j.statut === 'RETOURNE';

  return (
    <div>
      <Entete
        titre={`${j.numero} — quart ${j.quart}`}
        texte={`${dateFr(j.dateJournee)} · ${j.ligne?.libelle ?? ''} · ${j.chefQuart?.prenom ?? ''} ${j.chefQuart?.nom ?? ''}`}
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Entrées</div>
          <div className="value">{j.totalEntreesKg}</div>
        </div>
        <div className="kpi">
          <div className="label">Sorties</div>
          <div className="value">{j.totalSortiesKg}</div>
        </div>
        <div className={`kpi ${Math.abs(Number(j.ecartPct ?? 0)) >= 1 ? 'warn' : ''}`}>
          <div className="label">Écart</div>
          <div className="value">{j.ecartPct ?? '—'} %</div>
          <div className="hint">{j.ecartKg} kg</div>
        </div>
        <div className="kpi">
          <div className="label">Rendement</div>
          <div className="value">{j.rendementPct ?? '—'} %</div>
        </div>
      </div>
      <p>
        <Badge valeur={j.statut} />
      </p>

      {saisissable && aPermission('quart.saisir') && (
        <>
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              const dm = dms.find((d) => String(d.id) === entree.demandeMatiereId);
              run(() =>
                metier.ajouterEntreeJournal(j.id, {
                  produitId: dm?.produit?.id,
                  quantiteKg: Number(entree.quantiteKg || dm?.quantiteServie),
                  demandeMatiereId: Number(entree.demandeMatiereId),
                  lotMatiere: entree.lotMatiere || undefined,
                }),
              );
            }}
          >
            <div className="card-h">
              <h3>Entrée matière (demande déjà servie)</h3>
            </div>
            <div className="card-b form-grid">
              <Selecteur
                label="Demande servie"
                value={entree.demandeMatiereId}
                onChange={(e) => setEntree({ ...entree, demandeMatiereId: e.target.value })}
              >
                <option value="">Choisir…</option>
                {dms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numero} — {d.produit?.designation} ({d.quantiteServie} kg)
                  </option>
                ))}
              </Selecteur>
              <label className="field">
                Quantité (kg)
                <input type="number" step="0.01" value={entree.quantiteKg} onChange={(e) => setEntree({ ...entree, quantiteKg: e.target.value })} />
              </label>
              <label className="field">
                Lot matière
                <input value={entree.lotMatiere} onChange={(e) => setEntree({ ...entree, lotMatiere: e.target.value })} />
              </label>
              <div className="full">
                <button className="btn btn-primary" type="submit">
                  Ajouter l’entrée
                </button>
              </div>
            </div>
          </form>
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                metier.ajouterSortieJournal(j.id, {
                  produitId: Number(sortie.produitId),
                  quantiteKg: Number(sortie.quantiteKg),
                  tankId: sortie.tankId ? Number(sortie.tankId) : undefined,
                  destination: sortie.destination || undefined,
                }),
              );
            }}
          >
            <div className="card-h">
              <h3>Sortie (PF vers tank ou sous-produit)</h3>
            </div>
            <div className="card-b form-grid">
              <Selecteur label="Produit" value={sortie.produitId} onChange={(e) => setSortie({ ...sortie, produitId: e.target.value })}>
                <option value="">Choisir…</option>
                {produits
                  .filter((p) => p.typeProduit === 'PRODUIT_FINI' || p.typeProduit === 'SOUS_PRODUIT')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.refProduit} — {p.designation}
                    </option>
                  ))}
              </Selecteur>
              <label className="field">
                Quantité (kg)
                <input required type="number" min="0" step="0.01" value={sortie.quantiteKg} onChange={(e) => setSortie({ ...sortie, quantiteKg: e.target.value })} />
              </label>
              <Selecteur label="Tank (si PF)" value={sortie.tankId} onChange={(e) => setSortie({ ...sortie, tankId: e.target.value })}>
                <option value="">—</option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.libelle}
                  </option>
                ))}
              </Selecteur>
              <label className="field">
                Destination
                <input value={sortie.destination} onChange={(e) => setSortie({ ...sortie, destination: e.target.value })} />
              </label>
              <div className="full">
                <button className="btn btn-primary" type="submit">
                  Ajouter la sortie
                </button>
              </div>
            </div>
          </form>
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                metier.ajouterArretJournal(j.id, {
                  typeArret: arret.typeArret,
                  dureeMin: Number(arret.dureeMin),
                  cause: arret.cause || undefined,
                }),
              );
            }}
          >
            <div className="card-h">
              <h3>Arrêt machine</h3>
            </div>
            <div className="card-b form-grid">
              <Selecteur label="Type" value={arret.typeArret} onChange={(e) => setArret({ ...arret, typeArret: e.target.value })}>
                {['PANNE', 'REGLAGE', 'ENERGIE', 'MP', 'NETTOYAGE'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Selecteur>
              <label className="field">
                Durée (min)
                <input required type="number" min="1" value={arret.dureeMin} onChange={(e) => setArret({ ...arret, dureeMin: e.target.value })} />
              </label>
              <label className="field">
                Cause
                <input value={arret.cause} onChange={(e) => setArret({ ...arret, cause: e.target.value })} />
              </label>
              <div className="full">
                <button className="btn" type="submit">
                  Déclarer l’arrêt
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      <div className="card">
        <div className="card-h">
          <h3>Lignes du journal</h3>
        </div>
        <div className="card-b">
          <p>
            <strong>Entrées</strong>
          </p>
          <ul>
            {(j.entrees ?? []).map((e) => (
              <li key={e.id}>
                {e.produit?.designation} — {e.quantiteKg} kg {e.demandeMatiere ? `(${e.demandeMatiere.numero})` : ''}
              </li>
            ))}
            {!j.entrees?.length && <li>Aucune entrée.</li>}
          </ul>
          <p>
            <strong>Sorties</strong>
          </p>
          <ul>
            {(j.sorties ?? []).map((s) => (
              <li key={s.id}>
                {s.produit?.designation} — {s.quantiteKg} kg {s.tank ? `→ ${s.tank.code}` : ''}
              </li>
            ))}
            {!j.sorties?.length && <li>Aucune sortie.</li>}
          </ul>
          <p>
            <strong>Arrêts</strong>
          </p>
          <ul>
            {(j.arrets ?? []).map((a) => (
              <li key={a.id}>
                {a.typeArret} {a.dureeMin} min {a.demandeIntervention ? `→ ${a.demandeIntervention.numero}` : ''}
              </li>
            ))}
            {!j.arrets?.length && <li>Aucun arrêt.</li>}
          </ul>
        </div>
      </div>

      {saisissable && aPermission('quart.saisir') && (
        <div className="card">
          <div className="card-b form-grid">
            <label className="field full">
              Commentaire d’écart (obligatoire dès 1 %)
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} />
            </label>
            <div className="full">
              <button className="btn btn-primary" type="button" onClick={() => run(() => metier.soumettreJournal(j.id, commentaire || undefined))}>
                Soumettre le rapport
              </button>
            </div>
          </div>
        </div>
      )}
      {j.statut === 'SOUMIS' && aPermission('quart.valider') && (
        <div className="page-head-actions">
          <button className="btn btn-ok" type="button" onClick={() => run(() => metier.verifierJournal(j.id))}>
            Vérifier
          </button>
          <button className="btn" type="button" onClick={() => run(() => metier.retournerJournal(j.id, window.prompt('Motif de retour') || 'À compléter'))}>
            Retourner
          </button>
        </div>
      )}
      {j.statut === 'VERIFIE' && aPermission('quart.valider') && (
        <button className="btn btn-ok" type="button" onClick={() => run(() => metier.approuverJournal(j.id))}>
          Approuver (entrée tanks)
        </button>
      )}
    </div>
  );
}

export function TanksPage() {
  const { aPermission } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [err, setErr] = useState('');
  const [jauge, setJauge] = useState<Record<number, { h: string; ajuster: boolean }>>({});

  function charger() {
    metier.tanks().then(setTanks);
  }
  useEffect(() => {
    charger();
  }, []);

  async function jauger(id: number) {
    setErr('');
    try {
      await metier.jaugerTank(id, {
        hauteurCm: Number(jauge[id]?.h),
        ajusterStock: Boolean(jauge[id]?.ajuster),
      });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete
        titre="Tanks et jaugeage"
        texte="Le produit fini entre en tank depuis la production, se jauge, se réserve, puis sort au chargement."
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="landing-grid2">
        {tanks.map((t) => (
          <article key={t.id} className={`card ${t.alerteHaut || t.alerteBas ? 'warn' : ''}`}>
            <div className="card-h">
              <h3>
                <Warehouse size={16} /> {t.code} — {t.libelle}
              </h3>
            </div>
            <div className="card-b">
              <p>
                Stock {t.stockLitres} L / {t.capaciteLitres} L ({t.remplissagePct} %) · {t.stockKg} kg
              </p>
              <p>
                Produit : {t.produit?.designation ?? '—'} · <Badge valeur={t.statut} />
              </p>
              {aPermission('tank.gerer') && (
                <div className="form-grid">
                  <label className="field">
                    Hauteur (cm)
                    <input
                      type="number"
                      value={jauge[t.id]?.h ?? ''}
                      onChange={(e) => setJauge({ ...jauge, [t.id]: { h: e.target.value, ajuster: jauge[t.id]?.ajuster ?? false } })}
                    />
                  </label>
                  <label className="field">
                    <input
                      type="checkbox"
                      checked={jauge[t.id]?.ajuster ?? false}
                      onChange={(e) => setJauge({ ...jauge, [t.id]: { h: jauge[t.id]?.h ?? '', ajuster: e.target.checked } })}
                    />{' '}
                    Ajuster le stock
                  </label>
                  <div className="full">
                    <button type="button" className="btn" onClick={() => jauger(t.id)}>
                      Jaugeage
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
        {!tanks.length && <p>Aucun tank. Relancez le seed pour TK-01 / TK-02.</p>}
      </div>
    </div>
  );
}

export function ExpeditionsPage() {
  const { aPermission } = useAuth();
  const nav = useNavigate();
  const [page, setPage] = useState<ReponsePaginee<Expedition> | null>(null);
  const [clients, setClients] = useState<ClientUsine[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ clientId: '', destination: '', transporteur: '' });

  useEffect(() => {
    metier.expeditions().then(setPage);
    metier.clients().then(setClients).catch(() => setClients([]));
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const exp = await metier.creerExpedition({
        clientId: Number(form.clientId),
        destination: form.destination || undefined,
        transporteur: form.transporteur || undefined,
      });
      nav(`/produits-finis/expeditions/${exp.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete titre="Expéditions / empotage" texte="Conteneur, flexitank unique, pesée pont bascule. Bulletin obligatoire avant clôture (RG-39)." />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('pf.expedier') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle expédition</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Choisir…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.raisonSociale}
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Destination
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </label>
            <label className="field">
              Transporteur
              <input value={form.transporteur} onChange={(e) => setForm({ ...form, transporteur: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                Créer
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Client</th>
                <th>Date</th>
                <th>kg</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link className="mono" to={`/produits-finis/expeditions/${e.id}`}>
                      {e.numero}
                    </Link>
                  </td>
                  <td>{e.client?.raisonSociale}</td>
                  <td>{dateFr(e.dateExpedition)}</td>
                  <td>{e.totalKg}</td>
                  <td>
                    <Badge valeur={e.statut} />
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aucune expédition.
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

export function FicheExpeditionPage() {
  const { id } = useParams();
  const [e, setE] = useState<Expedition | null>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [bulletins, setBulletins] = useState<BulletinAnalyse[]>([]);
  const [err, setErr] = useState('');
  const [ch, setCh] = useState({
    tankId: '',
    numeroConteneur: '',
    numeroFlexitank: '',
    quantiteLitres: '',
    bulletinAnalyseId: '',
    poidsTareKg: '',
    poidsBrutKg: '',
  });

  function charger() {
    if (!id) return;
    metier.expedition(Number(id)).then(setE);
  }
  useEffect(() => {
    charger();
    metier.tanks().then(setTanks).catch(() => setTanks([]));
    metier.bulletins({ limite: 50 }).then((p) => setBulletins(p.donnees)).catch(() => setBulletins([]));
  }, [id]);

  async function run(fn: () => Promise<Expedition>) {
    setErr('');
    try {
      setE(await fn());
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!e) return <p>Chargement…</p>;

  return (
    <div>
      <Entete titre={e.numero} texte={`${e.client?.raisonSociale ?? ''} · ${e.destination ?? ''}`} />
      {err && <div className="alert alert-err">{err}</div>}
      <p>
        <Badge valeur={e.statut} /> · {e.totalLitres} L · {e.totalKg} kg
      </p>
      {e.statut === 'BROUILLON' && (
        <form
          className="card"
          onSubmit={(ev) => {
            ev.preventDefault();
            run(() =>
              metier.ajouterChargement(e.id, {
                tankId: Number(ch.tankId),
                numeroConteneur: ch.numeroConteneur,
                numeroFlexitank: ch.numeroFlexitank,
                quantiteLitres: Number(ch.quantiteLitres),
                bulletinAnalyseId: ch.bulletinAnalyseId ? Number(ch.bulletinAnalyseId) : undefined,
                poidsTareKg: ch.poidsTareKg ? Number(ch.poidsTareKg) : undefined,
                poidsBrutKg: ch.poidsBrutKg ? Number(ch.poidsBrutKg) : undefined,
              }),
            );
          }}
        >
          <div className="card-h">
            <h3>Empotage</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Tank" value={ch.tankId} onChange={(ev) => setCh({ ...ch, tankId: ev.target.value })}>
              <option value="">Choisir…</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} ({t.stockLitres} L)
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Conteneur
              <input required value={ch.numeroConteneur} onChange={(ev) => setCh({ ...ch, numeroConteneur: ev.target.value })} />
            </label>
            <label className="field">
              Flexitank
              <input required value={ch.numeroFlexitank} onChange={(ev) => setCh({ ...ch, numeroFlexitank: ev.target.value })} />
            </label>
            <label className="field">
              Litres
              <input required type="number" min="0.01" step="0.01" value={ch.quantiteLitres} onChange={(ev) => setCh({ ...ch, quantiteLitres: ev.target.value })} />
            </label>
            <label className="field">
              Tare pont (kg)
              <input type="number" value={ch.poidsTareKg} onChange={(ev) => setCh({ ...ch, poidsTareKg: ev.target.value })} />
            </label>
            <label className="field">
              Brut pont (kg)
              <input type="number" value={ch.poidsBrutKg} onChange={(ev) => setCh({ ...ch, poidsBrutKg: ev.target.value })} />
            </label>
            <Selecteur label="Bulletin" value={ch.bulletinAnalyseId} onChange={(ev) => setCh({ ...ch, bulletinAnalyseId: ev.target.value })}>
              <option value="">À lier plus tard</option>
              {bulletins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.numero} — {b.conclusion}
                </option>
              ))}
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                Enregistrer le chargement
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Conteneur</th>
                <th>Flexitank</th>
                <th>Tank</th>
                <th>L</th>
                <th>Net pont</th>
                <th>Bulletin</th>
              </tr>
            </thead>
            <tbody>
              {(e.chargements ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="mono">{c.numeroConteneur}</td>
                  <td className="mono">{c.numeroFlexitank}</td>
                  <td>{c.tank?.code}</td>
                  <td>{c.quantiteLitres}</td>
                  <td>{c.poidsNetKg ?? '—'}</td>
                  <td>{c.bulletinAnalyse?.numero ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {e.statut === 'BROUILLON' && (
        <button className="btn btn-ok" type="button" onClick={() => run(() => metier.cloturerExpedition(e.id))}>
          Clôturer l’expédition
        </button>
      )}
    </div>
  );
}

export function DashboardLaboPage() {
  const [d, setD] = useState<DashboardLabo | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardLabo().then(setD).catch(() => setErr('Impossible de charger le laboratoire.'));
  }, []);
  if (err) return <div className="alert alert-err">{err}</div>;
  if (!d) return <p>Chargement…</p>;
  return (
    <div>
      <Entete
        titre="Laboratoire et qualité"
        texte="Un bulletin d’analyse conditionne le départ d’un conteneur. Sans bulletin conforme, l’expédition ne se clôture pas (RG-39)."
      />
      <div className="kpis">
        <div className="kpi">
          <div className="label">Échantillons</div>
          <div className="value">{d.echantillons}</div>
        </div>
        <div className="kpi">
          <div className="label">Bulletins en cours</div>
          <div className="value">{d.bulletinsEnCours}</div>
        </div>
        <div className="kpi ok">
          <div className="label">Taux de conformité</div>
          <div className="value">{d.tauxConformite == null ? '—' : `${d.tauxConformite} %`}</div>
        </div>
        <div className={`kpi ${d.ncOuvertes ? 'alert' : ''}`}>
          <div className="label">Non-conformités ouvertes</div>
          <div className="value">{d.ncOuvertes}</div>
        </div>
      </div>
    </div>
  );
}

export function EchantillonsPage() {
  const { aPermission } = useAuth();
  const nav = useNavigate();
  const [page, setPage] = useState<ReponsePaginee<Echantillon> | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [points, setPoints] = useState<PointPrelevement[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ produitId: '', pointId: '', tankId: '', observation: '' });

  useEffect(() => {
    metier.echantillons().then(setPage);
    metier.produits({ limite: 200 }).then((p) => setProduits(p.donnees));
    metier.pointsPrelevement().then(setPoints);
    metier.tanks().then(setTanks).catch(() => setTanks([]));
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const ech = await metier.creerEchantillon({
        produitId: Number(form.produitId),
        pointId: form.pointId ? Number(form.pointId) : undefined,
        tankId: form.tankId ? Number(form.tankId) : undefined,
        observation: form.observation || undefined,
      });
      nav(`/laboratoire/echantillons/${ech.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <Entete titre="Échantillons" texte="Prélèvements MP, process, tank ou chargement. Numéro ECH-AAAA-NNNNN." />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('labo.saisir') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>
              <TestTube size={16} /> Nouveau prélèvement
            </h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Produit" value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
              <option value="">Choisir…</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} — {p.designation}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Point" value={form.pointId} onChange={(e) => setForm({ ...form, pointId: e.target.value })}>
              <option value="">—</option>
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.libelle}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Tank" value={form.tankId} onChange={(e) => setForm({ ...form, tankId: e.target.value })}>
              <option value="">—</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}
                </option>
              ))}
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                Prélever
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Produit</th>
                <th>Point</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link className="mono" to={`/laboratoire/echantillons/${e.id}`}>
                      {e.numero}
                    </Link>
                  </td>
                  <td>{e.produit?.designation}</td>
                  <td>{e.point?.libelle ?? '—'}</td>
                  <td>{dateFr(e.datePrelevement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FicheEchantillonPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { aPermission } = useAuth();
  const [e, setE] = useState<Echantillon | null>(null);
  const [params, setParams] = useState<ParametreAnalyse[]>([]);
  const [err, setErr] = useState('');
  const [ligne, setLigne] = useState({ parametreId: '', valeurNumerique: '' });

  useEffect(() => {
    if (!id) return;
    metier.echantillon(Number(id)).then(setE);
    metier.parametresAnalyse().then(setParams);
  }, [id]);

  if (!e) return <p>Chargement…</p>;

  return (
    <div>
      <Entete titre={e.numero} texte={`${e.produit?.designation ?? ''} · ${e.point?.libelle ?? ''}`} />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('labo.saisir') && (
        <form
          className="card"
          onSubmit={async (ev) => {
            ev.preventDefault();
            setErr('');
            try {
              setE(await metier.saisirAnalyse(e.id, { parametreId: Number(ligne.parametreId), valeurNumerique: Number(ligne.valeurNumerique) }));
            } catch (ex) {
              setErr(messageApi(ex));
            }
          }}
        >
          <div className="card-h">
            <h3>Résultat d’analyse</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Paramètre" value={ligne.parametreId} onChange={(ev) => setLigne({ ...ligne, parametreId: ev.target.value })}>
              <option value="">Choisir…</option>
              {params.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.libelle}
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Valeur
              <input required type="number" step="0.0001" value={ligne.valeurNumerique} onChange={(ev) => setLigne({ ...ligne, valeurNumerique: ev.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Paramètre</th>
              <th>Valeur</th>
              <th>Conforme</th>
            </tr>
          </thead>
          <tbody>
            {(e.analyses ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.parametre?.libelle}</td>
                <td>
                  {a.valeurNumerique ?? a.valeurTexte} {a.parametre?.unite}
                </td>
                <td>{a.conforme == null ? '—' : a.conforme ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aPermission('labo.saisir') && !e.bulletin && (
        <button
          className="btn btn-primary"
          type="button"
          onClick={async () => {
            const b = await metier.creerBulletin({ echantillonId: e.id });
            nav(`/laboratoire/bulletins/${b.id}`);
          }}
        >
          Créer le bulletin
        </button>
      )}
      {e.bulletin && (
        <p>
          Bulletin : <Link to={`/laboratoire/bulletins/${e.bulletin.id}`}>{e.bulletin.numero}</Link>
        </p>
      )}
    </div>
  );
}

export function BulletinsPage() {
  const [page, setPage] = useState<ReponsePaginee<BulletinAnalyse> | null>(null);
  useEffect(() => {
    metier.bulletins().then(setPage);
  }, []);
  return (
    <div>
      <Entete
        titre="Bulletins d’analyse"
        texte="Saisie → vérification → approbation. Le même utilisateur ne valide pas deux étapes de suite."
      />
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Échantillon</th>
                <th>Conclusion</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link className="mono" to={`/laboratoire/bulletins/${b.id}`}>
                      {b.numero}
                    </Link>
                  </td>
                  <td>{b.echantillon?.numero}</td>
                  <td>
                    <Badge valeur={b.conclusion} />
                  </td>
                  <td>
                    <Badge valeur={b.statut} />
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={4} className="empty">
                    Aucun bulletin.
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

export function FicheBulletinPage() {
  const { id } = useParams();
  const { aPermission } = useAuth();
  const [b, setB] = useState<BulletinAnalyse | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (id) metier.bulletin(Number(id)).then(setB);
  }, [id]);

  async function run(fn: () => Promise<BulletinAnalyse>) {
    setErr('');
    try {
      setB(await fn());
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!b) return <p>Chargement…</p>;
  return (
    <div>
      <Entete titre={b.numero} texte={b.echantillon?.produit?.designation ?? ''} extra={<FlaskConical size={18} />} />
      {err && <div className="alert alert-err">{err}</div>}
      <p>
        <Badge valeur={b.statut} /> <Badge valeur={b.conclusion} />
      </p>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Paramètre</th>
              <th>Valeur</th>
              <th>Conforme</th>
            </tr>
          </thead>
          <tbody>
            {(b.echantillon?.analyses ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.parametre?.libelle}</td>
                <td>{a.valeurNumerique ?? a.valeurTexte}</td>
                <td>{a.conforme == null ? '—' : a.conforme ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="page-head-actions">
        {b.statut === 'BROUILLON' && aPermission('labo.saisir') && (
          <button className="btn btn-primary" type="button" onClick={() => run(() => metier.soumettreBulletin(b.id))}>
            Soumettre
          </button>
        )}
        {b.statut === 'SOUMIS' && aPermission('labo.valider') && (
          <button className="btn btn-ok" type="button" onClick={() => run(() => metier.verifierBulletin(b.id))}>
            Vérifier
          </button>
        )}
        {b.statut === 'VERIFIE' && aPermission('labo.valider') && (
          <>
            <button className="btn btn-ok" type="button" onClick={() => run(() => metier.approuverBulletin(b.id))}>
              Approuver
            </button>
            <button className="btn" type="button" onClick={() => run(() => metier.approuverBulletin(b.id, { derogation: true }))}>
              Approuver avec dérogation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function NonConformitesPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<NonConformite> | null>(null);
  const [err, setErr] = useState('');
  const [desc, setDesc] = useState('');

  function charger() {
    metier.nonConformites().then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  return (
    <div>
      <Entete titre="Non-conformités" texte="Blocage, déclassement ou dérogation. Une NC ouverte peut bloquer un tank." />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('labo.saisir') && (
        <form
          className="card"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await metier.creerNc({ description: desc });
              setDesc('');
              charger();
            } catch (ex) {
              setErr(messageApi(ex));
            }
          }}
        >
          <div className="card-b form-grid">
            <label className="field full">
              Description
              <textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            </label>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                Ouvrir une NC
              </button>
            </div>
          </div>
        </form>
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>N°</th>
                <th>Description</th>
                <th>Décision</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((n) => (
                <tr key={n.id}>
                  <td className="mono">{n.numero}</td>
                  <td>{n.description}</td>
                  <td>{n.decision ?? '—'}</td>
                  <td>
                    <Badge valeur={n.statut} />
                  </td>
                  <td>
                    {n.statut === 'OUVERTE' && aPermission('labo.valider') && (
                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          const decision = window.prompt('Décision : BLOCAGE, DECLASSEMENT ou DEROGATION', 'BLOCAGE');
                          const justification = window.prompt('Justification') || '';
                          if (!decision) return;
                          try {
                            await metier.decisionNc(n.id, { decision, justification });
                            charger();
                          } catch (ex) {
                            setErr(messageApi(ex));
                          }
                        }}
                      >
                        Décider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aucune non-conformité.
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

export function DashboardDirectionPage() {
  const [d, setD] = useState<DashboardDirection | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardDirection().then(setD).catch(() => setErr('Impossible de charger le pilotage direction.'));
  }, []);
  if (err) return <div className="alert alert-err">{err}</div>;
  if (!d) return <p>Chargement…</p>;
  return (
    <div>
      <Entete
        titre="Pilotage direction"
        texte="Vue consolidée : production, produit fini, laboratoire et maintenance. Calculs uniquement côté serveur."
      />
      <div className="kpis">
        <div className="kpi">
          <div className="label">Rendement extraction</div>
          <div className="value">{d.rendementExtraction == null ? '—' : `${d.rendementExtraction} %`}</div>
        </div>
        <div className="kpi">
          <div className="label">Stock tanks</div>
          <div className="value">{d.stockTanksKg} kg</div>
        </div>
        <div className="kpi">
          <div className="label">Conformité labo</div>
          <div className="value">{d.conformiteLabo == null ? '—' : `${d.conformiteLabo} %`}</div>
        </div>
        <div className="kpi">
          <div className="label">Disponibilité machines</div>
          <div className="value">{d.disponibiliteMachines == null ? '—' : `${d.disponibiliteMachines} %`}</div>
        </div>
      </div>
      <div className="landing-grid2">
        <article className="card">
          <div className="card-h">
            <h3>Documents en attente de signature</h3>
          </div>
          <div className="card-b">
            <p>{d.documentsEnAttente} document(s) : {d.journauxEnAttente} journal(aux), {d.bulletinsEnAttente} bulletin(s).</p>
            <p>{d.ncOuvertes} non-conformité(s) ouverte(s).</p>
          </div>
        </article>
        <article className="card">
          <div className="card-h">
            <h3>
              <Scale size={16} /> Chaîne de valeur
            </h3>
          </div>
          <div className="card-b">
            <p>Arrêt machine → DI maintenance. Sortie de quart → tank. Bulletin → départ conteneur.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
