import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { FlaskConical, Plus, Scale, TestTube } from 'lucide-react';
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
  LotDepot,
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
  const [lots, setLots] = useState<LotDepot[]>([]);
  const [form, setForm] = useState({ produitId: '', lotDepotId: '', quantiteDemandee: '', ligneId: '', quart: 'A' });
  const [service, setService] = useState<Record<number, { qte: string; motif: string }>>({});

  function charger() {
    metier.demandesMatiere().then(setPage);
  }
  useEffect(() => {
    charger();
    metier.produits({ type: 'MATIERE_PREMIERE', limite: 200 }).then((p) => setProduits(p.donnees));
    metier.lignesProduction().then(setLignes);
    metier.lotsDepot().then(setLots).catch(() => setLots([]));
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      await metier.creerDemandeMatiere({
        produitId: Number(form.produitId),
        lotDepotId: form.lotDepotId ? Number(form.lotDepotId) : undefined,
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
        titre="Demandes de matiÃ¨re premiÃ¨re"
        texte="Le chef de ligne demande un lot au dÃ©pÃ´t. Le magasinier sert : le stock du lot passe en transformation."
      />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('quart.saisir') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle demande</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur
              label="MatiÃ¨re"
              value={form.produitId}
              onChange={(e) => setForm({ ...form, produitId: e.target.value, lotDepotId: '' })}
            >
              <option value="">Choisirâ€¦</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} â€” {p.designation} ({p.quantiteStock} {p.unite})
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Lot dÃ©pÃ´t" value={form.lotDepotId} onChange={(e) => setForm({ ...form, lotDepotId: e.target.value })}>
              <option value="">Premier lot disponible</option>
              {lots
                .filter((l) => !form.produitId || String(l.produitId) === form.produitId)
                .filter((l) => Number(l.quantite) > 0)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.numero} â€” {l.quantite} {l.produit?.unite ?? ''} ({l.depot?.libelle ?? 'dÃ©pÃ´t'})
                  </option>
                ))}
            </Selecteur>
            <label className="field">
              QuantitÃ© (kg)
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
              <option value="">â€”</option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} â€” {l.libelle}
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
                <th>NÂ°</th>
                <th>MatiÃ¨re</th>
                <th>Lot</th>
                <th>DemandÃ©e</th>
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
                    {d.produit?.refProduit} â€” {d.produit?.designation}
                  </td>
                  <td className="mono">{d.lotDepot?.numero ?? 'â€”'}</td>
                  <td>{d.quantiteDemandee}</td>
                  <td>{d.quantiteServie ?? 'â€”'}</td>
                  <td>{d.quart ?? 'â€”'}</td>
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
                          placeholder="Motif si Ã©cart"
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
                  <td colSpan={8} className="empty">
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
        texte="CÅ“ur de la production : bilan matiÃ¨re quart par quart. EntrÃ©es = produit fini + sous-produits + Ã©cart (RG-30)."
      />
      <div className="kpis">
        <div className="kpi">
          <div className="label">Seuil alerte Ã©cart</div>
          <div className="value">1 %</div>
          <div className="hint">Commentaire obligatoire</div>
        </div>
        <div className="kpi warn">
          <div className="label">Seuil blocage</div>
          <div className="value">3 %</div>
          <div className="hint">Soumission refusÃ©e</div>
        </div>
        <div className="kpi">
          <div className="label">ArrÃªt machine</div>
          <div className="value">â‰¥ 30 min</div>
          <div className="hint">GÃ©nÃ¨re une DI (RG-35)</div>
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
              JournÃ©e
              <input type="date" required value={form.dateJournee} onChange={(e) => setForm({ ...form, dateJournee: e.target.value })} />
            </label>
            <Selecteur label="Quart" value={form.quart} onChange={(e) => setForm({ ...form, quart: e.target.value })}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </Selecteur>
            <Selecteur label="Ligne" value={form.ligneId} onChange={(e) => setForm({ ...form, ligneId: e.target.value })}>
              <option value="">Choisirâ€¦</option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} â€” {l.libelle}
                </option>
              ))}
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                <Plus size={16} /> CrÃ©er le journal
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
                <th>NÂ°</th>
                <th>Jour</th>
                <th>Quart</th>
                <th>Ligne</th>
                <th>EntrÃ©es</th>
                <th>Ã‰cart</th>
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
                  <td>{j.ligne?.libelle ?? 'â€”'}</td>
                  <td>{j.totalEntreesKg} kg</td>
                  <td>
                    {j.ecartKg} kg ({j.ecartPct ?? 'â€”'} %)
                  </td>
                  <td>{j.rendementPct ?? 'â€”'} %</td>
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

  if (!j) {
    return (
      <div className="page-head">
        <div>
          <h2>Journal de quart</h2>
        </div>
      </div>
    );
  }
  const saisissable = j.statut === 'BROUILLON' || j.statut === 'RETOURNE';

  return (
    <div>
      <Entete
        titre={`${j.numero} â€” quart ${j.quart}`}
        texte={`${dateFr(j.dateJournee)} Â· ${j.ligne?.libelle ?? ''} Â· ${j.chefQuart?.prenom ?? ''} ${j.chefQuart?.nom ?? ''}`}
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">EntrÃ©es</div>
          <div className="value">{j.totalEntreesKg}</div>
        </div>
        <div className="kpi">
          <div className="label">Sorties</div>
          <div className="value">{j.totalSortiesKg}</div>
        </div>
        <div className={`kpi ${Math.abs(Number(j.ecartPct ?? 0)) >= 1 ? 'warn' : ''}`}>
          <div className="label">Ã‰cart</div>
          <div className="value">{j.ecartPct ?? 'â€”'} %</div>
          <div className="hint">{j.ecartKg} kg</div>
        </div>
        <div className="kpi">
          <div className="label">Rendement</div>
          <div className="value">{j.rendementPct ?? 'â€”'} %</div>
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
              <h3>EntrÃ©e matiÃ¨re (demande dÃ©jÃ  servie)</h3>
            </div>
            <div className="card-b form-grid">
              <Selecteur
                label="Demande servie"
                value={entree.demandeMatiereId}
                onChange={(e) => setEntree({ ...entree, demandeMatiereId: e.target.value })}
              >
                <option value="">Choisirâ€¦</option>
                {dms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.numero} â€” {d.produit?.designation} ({d.quantiteServie} kg)
                  </option>
                ))}
              </Selecteur>
              <label className="field">
                QuantitÃ© (kg)
                <input type="number" step="0.01" value={entree.quantiteKg} onChange={(e) => setEntree({ ...entree, quantiteKg: e.target.value })} />
              </label>
              <label className="field">
                Lot matiÃ¨re
                <input value={entree.lotMatiere} onChange={(e) => setEntree({ ...entree, lotMatiere: e.target.value })} />
              </label>
              <div className="full">
                <button className="btn btn-primary" type="submit">
                  Ajouter lâ€™entrÃ©e
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
                <option value="">Choisirâ€¦</option>
                {produits
                  .filter((p) => p.typeProduit === 'PRODUIT_FINI' || p.typeProduit === 'SOUS_PRODUIT')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.refProduit} â€” {p.designation}
                    </option>
                  ))}
              </Selecteur>
              <label className="field">
                QuantitÃ© (kg)
                <input required type="number" min="0" step="0.01" value={sortie.quantiteKg} onChange={(e) => setSortie({ ...sortie, quantiteKg: e.target.value })} />
              </label>
              <Selecteur label="Tank (si PF)" value={sortie.tankId} onChange={(e) => setSortie({ ...sortie, tankId: e.target.value })}>
                <option value="">â€”</option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} â€” {t.libelle}
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
              <h3>ArrÃªt de ligne</h3>
            </div>
            <p className="card-b" style={{ paddingBottom: 0 }}>
              Une panne mÃ©canique ou Ã©lectrique crÃ©e automatiquement une demande dâ€™intervention vers la Maintenance.
            </p>
            <div className="card-b form-grid">
              <Selecteur label="Type" value={arret.typeArret} onChange={(e) => setArret({ ...arret, typeArret: e.target.value })}>
                <option value="PANNE">Panne mÃ©ca / Ã©lec</option>
                <option value="REGLAGE">RÃ©glage</option>
                <option value="ENERGIE">Ã‰nergie</option>
                <option value="MP">Manque de matiÃ¨re</option>
                <option value="NETTOYAGE">Nettoyage</option>
              </Selecteur>
              <label className="field">
                DurÃ©e (min)
                <input required type="number" min="1" value={arret.dureeMin} onChange={(e) => setArret({ ...arret, dureeMin: e.target.value })} />
              </label>
              <label className="field">
                Cause
                <input value={arret.cause} onChange={(e) => setArret({ ...arret, cause: e.target.value })} />
              </label>
              <div className="full">
                <button className="btn" type="submit">
                  DÃ©clarer lâ€™arrÃªt
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
            <strong>EntrÃ©es</strong>
          </p>
          <ul>
            {(j.entrees ?? []).map((e) => (
              <li key={e.id}>
                {e.produit?.designation} â€” {e.quantiteKg} kg {e.demandeMatiere ? `(${e.demandeMatiere.numero})` : ''}
              </li>
            ))}
            {!j.entrees?.length && <li>Aucune entrÃ©e.</li>}
          </ul>
          <p>
            <strong>Sorties</strong>
          </p>
          <ul>
            {(j.sorties ?? []).map((s) => (
              <li key={s.id}>
                {s.produit?.designation} â€” {s.quantiteKg} kg {s.tank ? `â†’ ${s.tank.code}` : ''}
              </li>
            ))}
            {!j.sorties?.length && <li>Aucune sortie.</li>}
          </ul>
          <p>
            <strong>ArrÃªts</strong>
          </p>
          <ul>
            {(j.arrets ?? []).map((a) => (
              <li key={a.id}>
                {a.typeArret} {a.dureeMin} min {a.demandeIntervention ? `â†’ ${a.demandeIntervention.numero}` : ''}
              </li>
            ))}
            {!j.arrets?.length && <li>Aucun arrÃªt.</li>}
          </ul>
        </div>
      </div>

      {saisissable && aPermission('quart.saisir') && (
        <div className="card">
          <div className="card-b form-grid">
            <label className="field full">
              Commentaire dâ€™Ã©cart (obligatoire dÃ¨s 1 %)
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
            VÃ©rifier
          </button>
          <button className="btn" type="button" onClick={() => run(() => metier.retournerJournal(j.id, window.prompt('Motif de retour') || 'Ã€ complÃ©ter'))}>
            Retourner
          </button>
        </div>
      )}
      {j.statut === 'VERIFIE' && aPermission('quart.valider') && (
        <button className="btn btn-ok" type="button" onClick={() => run(() => metier.approuverJournal(j.id))}>
          Approuver (entrÃ©e tanks)
        </button>
      )}
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
      <Entete titre="ExpÃ©ditions / empotage" texte="Conteneur, flexitank unique, pesÃ©e pont bascule. Bulletin obligatoire avant clÃ´ture (RG-39)." />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('pf.expedier') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle expÃ©dition</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Choisirâ€¦</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} â€” {c.raisonSociale}
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
                CrÃ©er
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
                <th>NÂ°</th>
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
                    Aucune expÃ©dition.
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

  if (!e) {
    return (
      <div className="page-head">
        <div>
          <h2>Expédition</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Entete titre={e.numero} texte={`${e.client?.raisonSociale ?? ''} Â· ${e.destination ?? ''}`} />
      {err && <div className="alert alert-err">{err}</div>}
      <p>
        <Badge valeur={e.statut} /> Â· {e.totalLitres} L Â· {e.totalKg} kg
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
              <option value="">Choisirâ€¦</option>
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
              <option value="">Ã€ lier plus tard</option>
              {bulletins.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.numero} â€” {b.conclusion}
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
                  <td>{c.poidsNetKg ?? 'â€”'}</td>
                  <td>{c.bulletinAnalyse?.numero ?? 'â€”'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {e.statut === 'BROUILLON' && (
        <button className="btn btn-ok" type="button" onClick={() => run(() => metier.cloturerExpedition(e.id))}>
          ClÃ´turer lâ€™expÃ©dition
        </button>
      )}
    </div>
  );
}

export function DashboardLaboPage() {
  const [d, setD] = useState<DashboardLabo>({
    echantillons: 0,
    bulletinsEnCours: 0,
    tauxConformite: null,
    ncOuvertes: 0,
  });
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardLabo().then(setD).catch(() => setErr('Impossible de charger le laboratoire.'));
  }, []);
  return (
    <div>
      <Entete
        titre="Laboratoire et qualitÃ©"
        texte="Un bulletin dâ€™analyse conditionne le dÃ©part dâ€™un conteneur. Sans bulletin conforme, lâ€™expÃ©dition ne se clÃ´ture pas (RG-39)."
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Ã‰chantillons</div>
          <div className="value">{d.echantillons}</div>
        </div>
        <div className="kpi">
          <div className="label">Bulletins en cours</div>
          <div className="value">{d.bulletinsEnCours}</div>
        </div>
        <div className="kpi ok">
          <div className="label">Taux de conformitÃ©</div>
          <div className="value">{d.tauxConformite == null ? 'â€”' : `${d.tauxConformite} %`}</div>
        </div>
        <div className={`kpi ${d.ncOuvertes ? 'alert' : ''}`}>
          <div className="label">Non-conformitÃ©s ouvertes</div>
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
      <Entete titre="Ã‰chantillons" texte="PrÃ©lÃ¨vements MP, process, tank ou chargement. NumÃ©ro ECH-AAAA-NNNNN." />
      {err && <div className="alert alert-err">{err}</div>}
      {aPermission('labo.saisir') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>
              <TestTube size={16} /> Nouveau prÃ©lÃ¨vement
            </h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="Produit" value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
              <option value="">Choisirâ€¦</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} â€” {p.designation}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Point" value={form.pointId} onChange={(e) => setForm({ ...form, pointId: e.target.value })}>
              <option value="">â€”</option>
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} â€” {p.libelle}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Tank" value={form.tankId} onChange={(e) => setForm({ ...form, tankId: e.target.value })}>
              <option value="">â€”</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}
                </option>
              ))}
            </Selecteur>
            <div className="full">
              <button className="btn btn-primary" type="submit">
                PrÃ©lever
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
                <th>NÂ°</th>
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
                  <td>{e.point?.libelle ?? 'â€”'}</td>
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

  if (!e) {
    return (
      <div className="page-head">
        <div>
          <h2>Échantillon</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Entete titre={e.numero} texte={`${e.produit?.designation ?? ''} Â· ${e.point?.libelle ?? ''}`} />
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
            <h3>RÃ©sultat dâ€™analyse</h3>
          </div>
          <div className="card-b form-grid">
            <Selecteur label="ParamÃ¨tre" value={ligne.parametreId} onChange={(ev) => setLigne({ ...ligne, parametreId: ev.target.value })}>
              <option value="">Choisirâ€¦</option>
              {params.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} â€” {p.libelle}
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
              <th>ParamÃ¨tre</th>
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
                <td>{a.conforme == null ? 'â€”' : a.conforme ? 'Oui' : 'Non'}</td>
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
          CrÃ©er le bulletin
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
        titre="Bulletins dâ€™analyse"
        texte="Saisie â†’ vÃ©rification â†’ approbation. Le mÃªme utilisateur ne valide pas deux Ã©tapes de suite."
      />
      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>NÂ°</th>
                <th>Ã‰chantillon</th>
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

  if (!b) {
    return (
      <div className="page-head">
        <div>
          <h2>Bulletin d’analyse</h2>
        </div>
      </div>
    );
  }
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
              <th>ParamÃ¨tre</th>
              <th>Valeur</th>
              <th>Conforme</th>
            </tr>
          </thead>
          <tbody>
            {(b.echantillon?.analyses ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.parametre?.libelle}</td>
                <td>{a.valeurNumerique ?? a.valeurTexte}</td>
                <td>{a.conforme == null ? 'â€”' : a.conforme ? 'Oui' : 'Non'}</td>
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
            VÃ©rifier
          </button>
        )}
        {b.statut === 'VERIFIE' && aPermission('labo.valider') && (
          <>
            <button className="btn btn-ok" type="button" onClick={() => run(() => metier.approuverBulletin(b.id))}>
              Approuver
            </button>
            <button className="btn" type="button" onClick={() => run(() => metier.approuverBulletin(b.id, { derogation: true }))}>
              Approuver avec dÃ©rogation
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
      <Entete titre="Non-conformitÃ©s" texte="Blocage, dÃ©classement ou dÃ©rogation. Une NC ouverte peut bloquer un tank." />
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
                <th>NÂ°</th>
                <th>Description</th>
                <th>DÃ©cision</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {page?.donnees.map((n) => (
                <tr key={n.id}>
                  <td className="mono">{n.numero}</td>
                  <td>{n.description}</td>
                  <td>{n.decision ?? 'â€”'}</td>
                  <td>
                    <Badge valeur={n.statut} />
                  </td>
                  <td>
                    {n.statut === 'OUVERTE' && aPermission('labo.valider') && (
                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          const decision = window.prompt('DÃ©cision : BLOCAGE, DECLASSEMENT ou DEROGATION', 'BLOCAGE');
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
                        DÃ©cider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!page?.donnees.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aucune non-conformitÃ©.
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
  const [d, setD] = useState<DashboardDirection>({
    rendementExtraction: null,
    stockTanksKg: 0,
    conformiteLabo: null,
    disponibiliteMachines: null,
    documentsEnAttente: 0,
    journauxEnAttente: 0,
    bulletinsEnAttente: 0,
    ncOuvertes: 0,
  });
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardDirection().then(setD).catch(() => setErr('Impossible de charger le pilotage direction.'));
  }, []);
  return (
    <div>
      <Entete
        titre="Pilotage direction"
        texte="Vue consolidÃ©e : production, produit fini, laboratoire et maintenance. Calculs uniquement cÃ´tÃ© serveur."
      />
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <div className="kpi">
          <div className="label">Rendement extraction</div>
          <div className="value">{d.rendementExtraction == null ? 'â€”' : `${d.rendementExtraction} %`}</div>
        </div>
        <div className="kpi">
          <div className="label">Stock tanks</div>
          <div className="value">{d.stockTanksKg} kg</div>
        </div>
        <div className="kpi">
          <div className="label">ConformitÃ© labo</div>
          <div className="value">{d.conformiteLabo == null ? 'â€”' : `${d.conformiteLabo} %`}</div>
        </div>
        <div className="kpi">
          <div className="label">DisponibilitÃ© machines</div>
          <div className="value">{d.disponibiliteMachines == null ? 'â€”' : `${d.disponibiliteMachines} %`}</div>
        </div>
      </div>
      <div className="landing-grid2">
        <article className="card">
          <div className="card-h">
            <h3>Documents en attente de signature</h3>
          </div>
          <div className="card-b">
            <p>{d.documentsEnAttente} document(s) : {d.journauxEnAttente} journal(aux), {d.bulletinsEnAttente} bulletin(s).</p>
            <p>{d.ncOuvertes} non-conformitÃ©(s) ouverte(s).</p>
          </div>
        </article>
        <article className="card">
          <div className="card-h">
            <h3>
              <Scale size={16} /> ChaÃ®ne de valeur
            </h3>
          </div>
          <div className="card-b">
            <p>ArrÃªt machine â†’ DI maintenance. Sortie de quart â†’ tank. Bulletin â†’ dÃ©part conteneur.</p>
          </div>
        </article>
      </div>
    </div>
  );
}
