import { FormEvent, useEffect, useState } from 'react';
import { Plus, Search, Truck } from 'lucide-react';
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
import { TankVisuel } from '../../components/tanks/TankVisuel';
import { Link } from 'react-router-dom';
import type { DashboardPf, LotProduit, MouvementProduit, Produit, ReponsePaginee, Tank } from '../../types';

function Kpi({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className={`kpi ${alert ? 'alert' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

export function DashboardPfPage() {
  const { utilisateur } = useAuth();
  const [d, setD] = useState<DashboardPf>({ lotsDisponibles: 0, lotsBloques: 0, stockPf: 0 });
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    metier.dashboardPf().then(setD).catch(() => setErr('Impossible de charger le pilotage produits finis.'));
    metier.tanks().then(setTanks).catch(() => setTanks([]));
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Bonjour {utilisateur?.prenom}</h2>
          <p>Qu’est-ce qui a été fabriqué, en quelle quantité, dans quel lot, et qu’est-ce qui est disponible ?</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Rapport produits finis',
            compartiment: 'Produits finis',
            colonnes: ['Indicateur', 'Valeur'],
            lignes: [
              ['Lots disponibles', d.lotsDisponibles],
              ['Lots bloqués', d.lotsBloques],
              ['Stock PF', d.stockPf],
            ],
            nomFichier: 'rapport-produits-finis.pdf',
          }}
        />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="kpis">
        <Kpi label="Lots disponibles" value={d.lotsDisponibles} />
        <Kpi label="Lots bloqués" value={d.lotsBloques} alert={d.lotsBloques > 0} />
        <Kpi label="Stock PF (unités)" value={d.stockPf} />
        <Kpi label="Traçabilité" value="OF → lot → expédition" />
      </div>
      {d.series && (
        <CourbesEvolution
          series={d.series}
          titreActivite="Lots créés par mois"
          titreVolume="Quantités entrées en stock PF"
        />
      )}
      {tanks.length > 0 && (
        <div className="card">
          <div className="card-h">
            <h3>Parc de tanks</h3>
            <Link to="/produits-finis/tanks" className="btn btn-ghost">
              Voir le détail
            </Link>
          </div>
          <div className="card-b parc-tanks-mini">
            {tanks.map((t) => (
              <Link key={t.id} to="/produits-finis/tanks" className="tank-carte" style={{ textDecoration: 'none' }}>
                <TankVisuel tank={t} taille="s" />
                <h3>{t.code}</h3>
                <p>
                  {t.stockLitres} / {t.capaciteLitres} L
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CataloguePfPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<Produit> | null>(null);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({ refProduit: '', designation: '', unite: 'U', seuilReappro: '0', dureeConservationJours: '' });
  const [err, setErr] = useState('');

  function charger() {
    metier.produits({ type: 'PRODUIT_FINI', recherche: recherche || undefined }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerProduit({
        ...form,
        typeProduit: 'PRODUIT_FINI',
        seuilReappro: Number(form.seuilReappro),
        dureeConservationJours: form.dureeConservationJours ? Number(form.dureeConservationJours) : undefined,
      });
      setForm({ refProduit: '', designation: '', unite: 'U', seuilReappro: '0', dureeConservationJours: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Catalogue produits finis</h2>
          <p>Les quantités n’entrent en stock qu’après contrôle qualité d’un OF.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Catalogue produits finis',
            compartiment: 'Produits finis',
            colonnes: ['Réf.', 'Désignation', 'Stock', 'Unité'],
            lignes: (page?.donnees ?? []).map((p) => [p.refProduit, p.designation, p.quantiteStock, p.unite]),
            nomFichier: 'rapport-catalogue-pf.pdf',
          }}
        />
        </div>
      </div>
      {aPermission('pf.gerer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvelle référence PF</h3>
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
            <label className="field">
              Conservation (jours)
              <input type="number" value={form.dureeConservationJours} onChange={(e) => setForm({ ...form, dureeConservationJours: e.target.value })} />
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
              <th>DLC (j)</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.refProduit}</td>
                <td>{p.designation}</td>
                <td>{p.quantiteStock} {p.unite}</td>
                <td>{p.dureeConservationJours ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LotsPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<LotProduit> | null>(null);
  const [statut, setStatut] = useState('');
  const [err, setErr] = useState('');

  function charger() {
    metier.lots({ statut: statut || undefined }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, [statut]);

  async function expedier(id: number) {
    try {
      await metier.expedierLot(id);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Lots et traçabilité</h2>
          <p>Chaque lot conforme est issu d’un ordre de fabrication contrôlé.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Lots produits finis',
            compartiment: 'Produits finis',
            colonnes: ['Lot', 'Produit', 'OF', 'Qté', 'Statut'],
            lignes: (page?.donnees ?? []).map((l) => [
              l.numero,
              l.produit?.refProduit ?? '',
              l.ordreFabrication?.numero ?? '—',
              l.quantite,
              l.statut,
            ]),
            nomFichier: 'rapport-lots.pdf',
          }}
        />
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      <div className="toolbar">
        <Selecteur value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous</option>
          {['DISPONIBLE', 'BLOQUE', 'REJETE', 'EXPEDIE'].map((s) => (
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
              <th>Lot</th>
              <th>Produit</th>
              <th>OF</th>
              <th>Qté</th>
              <th>Fab.</th>
              <th>Exp.</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((l) => (
              <tr key={l.id}>
                <td className="mono">{l.numero}</td>
                <td>
                  {l.produit?.refProduit} — {l.produit?.designation}
                </td>
                <td className="mono">{l.ordreFabrication?.numero ?? '—'}</td>
                <td>{l.quantite}</td>
                <td>{dateFr(l.dateFabrication)}</td>
                <td>{dateFr(l.dateExpiration)}</td>
                <td>
                  <Badge valeur={l.statut} />
                </td>
                <td>
                  {aPermission('pf.expedier') && l.statut === 'DISPONIBLE' && (
                    <button className="btn btn-sm btn-gold" onClick={() => expedier(l.id)}>
                      <Truck size={14} />
                      Expédier
                    </button>
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

export function MouvementsPfPage() {
  const [page, setPage] = useState<ReponsePaginee<MouvementProduit> | null>(null);
  useEffect(() => {
    metier.mouvementsProduits({ typeStock: 'PRODUIT_FINI' }).then(setPage);
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Mouvements stock PF</h2>
          <p>Entrées après contrôle OF, sorties d’expédition. Jamais de saisie manuelle du stock.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Mouvements produits finis',
            compartiment: 'Produits finis',
            colonnes: ['Date', 'Produit', 'Type', 'Qté', 'Motif'],
            lignes: (page?.donnees ?? []).map((m) => [m.dateMvt, m.produit?.refProduit ?? '', m.typeMvt, m.quantite, m.motif ?? '—']),
            nomFichier: 'rapport-mouvements-pf.pdf',
          }}
        />
        </div>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produit</th>
              <th>Type</th>
              <th>Qté</th>
              <th>Avant → après</th>
              <th>Motif</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((m) => (
              <tr key={m.id}>
                <td>{dateFr(m.dateMvt)}</td>
                <td>{m.produit?.refProduit}</td>
                <td>
                  <Badge valeur={m.typeMvt} />
                </td>
                <td>{m.quantite}</td>
                <td>
                  {m.stockAvant} → {m.stockApres}
                </td>
                <td>{m.motif ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ExpeditionsPage() {
  return <LotsPage />;
}
