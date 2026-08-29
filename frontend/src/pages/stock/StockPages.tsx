import { FormEvent, useEffect, useState } from 'react';
import { Check, Package, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { fcfa } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Article, DemandePiece, Mouvement, ReponsePaginee } from '../../types';

export function ArticlesPage() {
  const { aPermission } = useAuth();
  const [page, setPage] = useState<ReponsePaginee<Article> | null>(null);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({ refArticle: '', designation: '', seuilReappro: '5', prixUnitaireMoyen: '0' });
  const [err, setErr] = useState('');

  function charger() {
    metier.articles({ recherche: recherche || undefined }).then(setPage);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerArticle(form);
      setForm({ refArticle: '', designation: '', seuilReappro: '5', prixUnitaireMoyen: '0' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Articles</h2>
          <p>La quantité n\'est jamais saisie à la main : elle résulte des mouvements.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Articles maintenance',
            compartiment: 'Maintenance',
            colonnes: ['Réf.', 'Désignation', 'Stock', 'Seuil', 'Unité'],
            lignes: (page?.donnees ?? []).map((a) => [a.refArticle, a.designation, a.quantiteStock, a.seuilReappro, a.unite]),
            nomFichier: 'rapport-articles.pdf',
          }}
        />
        </div>
      </div>
      {aPermission('stock.entrer') && (
        <form className="card" onSubmit={creer}>
          <div className="card-h">
            <h3>Nouvel article</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Référence
              <input required value={form.refArticle} onChange={(e) => setForm({ ...form, refArticle: e.target.value })} />
            </label>
            <label className="field">
              Désignation
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </label>
            <label className="field">
              Seuil
              <input type="number" value={form.seuilReappro} onChange={(e) => setForm({ ...form, seuilReappro: e.target.value })} />
            </label>
            <label className="field">
              Prix moyen
              <input type="number" value={form.prixUnitaireMoyen} onChange={(e) => setForm({ ...form, prixUnitaireMoyen: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">
                <Plus size={16} />
                Créer (stock à 0)
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
              <th>PUMP</th>
              <th>Critique</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.refArticle}</td>
                <td>{a.designation}</td>
                <td>{a.quantiteStock} {a.unite}</td>
                <td>{a.seuilReappro}</td>
                <td>{fcfa(a.prixUnitaireMoyen)}</td>
                <td>{a.pieceCritique ? 'Oui' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StockPage() {
  const { aPermission } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [mvts, setMvts] = useState<ReponsePaginee<Mouvement> | null>(null);
  const [demandes, setDemandes] = useState<DemandePiece[]>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ articleId: '', typeMvt: 'ENTREE', quantite: '1', prixUnitaire: '', motif: '' });

  async function charger() {
    const arts = await metier.articles({ limite: 200 });
    setArticles(arts.donnees);
    setMvts(await metier.mouvements());
    setDemandes(await metier.demandesPieces('EN_ATTENTE'));
  }
  useEffect(() => {
    charger();
  }, []);

  async function mvt(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerMouvement({
        articleId: Number(form.articleId),
        typeMvt: form.typeMvt,
        quantite: Number(form.quantite),
        prixUnitaire: form.prixUnitaire ? Number(form.prixUnitaire) : undefined,
        motif: form.motif || undefined,
      });
      await charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Magasin</h2>
          <p>Entrées, sorties, retours, ajustements et inventaires — stock avant / après tracé.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
          <BoutonPdf
            compact
            rapport={{
              titre: 'Mouvements stock pièces',
              compartiment: 'Maintenance',
              colonnes: ['Date', 'Article', 'Type', 'Qté', 'Motif'],
              lignes: (mvts?.donnees ?? []).map((m) => [
                m.dateMvt,
                m.article?.refArticle ?? '',
                m.typeMvt,
                m.quantite,
                m.motif ?? '—',
              ]),
              nomFichier: 'rapport-stock-pieces.pdf',
            }}
          />
        <Link className="btn btn-ghost" to="/articles">
          <Package size={15} />
          Catalogue
        </Link>
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}

      {demandes.length > 0 && (
        <div className="card">
          <div className="card-h">
            <h3>Demandes de pièces en attente</h3>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>OT</th>
                <th>Article</th>
                <th>Qté</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.ordreTravail?.numero}</td>
                  <td>
                    {d.article?.refArticle} — {d.article?.designation}
                  </td>
                  <td>{d.quantite}</td>
                  <td>
                    {aPermission('stock.sortir') && (
                      <>
                        <button className="btn btn-sm btn-ok" onClick={() => metier.validerPiece(d.id).then(charger).catch((e) => setErr(messageApi(e)))}>
                          <Check size={14} />
                          Valider
                        </button>{' '}
                        <button className="btn btn-sm btn-danger" onClick={() => metier.refuserPiece(d.id, 'Refus magasin').then(charger)}>
                          <X size={14} />
                          Refuser
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aPermission('stock.entrer') && (
        <form className="card" onSubmit={mvt}>
          <div className="card-h">
            <h3>Nouveau mouvement</h3>
          </div>
          <div className="card-b form-grid">
            <label className="field">
              Article
              <Selecteur required value={form.articleId} onChange={(e) => setForm({ ...form, articleId: e.target.value })}>
                <option value="">—</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.refArticle} (stock {a.quantiteStock})
                  </option>
                ))}
              </Selecteur>
            </label>
            <label className="field">
              Type
              <Selecteur value={form.typeMvt} onChange={(e) => setForm({ ...form, typeMvt: e.target.value })}>
                <option value="ENTREE">Entrée</option>
                <option value="SORTIE">Sortie</option>
                <option value="RETOUR">Retour</option>
                <option value="AJUSTEMENT">Ajustement</option>
                <option value="INVENTAIRE">Inventaire</option>
              </Selecteur>
            </label>
            <label className="field">
              Quantité {form.typeMvt === 'INVENTAIRE' || form.typeMvt === 'AJUSTEMENT' ? '(stock constaté)' : ''}
              <input type="number" min="0.01" step="0.01" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
            </label>
            <label className="field">
              Prix unitaire (entrées)
              <input value={form.prixUnitaire} onChange={(e) => setForm({ ...form, prixUnitaire: e.target.value })} />
            </label>
            <label className="field full">
              Motif (obligatoire pour ajustement)
              <input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn-primary">Enregistrer le mouvement</button>
            </div>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-h">
          <h3>Derniers mouvements</h3>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Article</th>
              <th>Qté</th>
              <th>Avant</th>
              <th>Après</th>
            </tr>
          </thead>
          <tbody>
            {mvts?.donnees.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.dateMvt).toLocaleString('fr-FR')}</td>
                <td>
                  <Badge valeur={m.typeMvt} />
                </td>
                <td>{m.article?.refArticle}</td>
                <td>{m.quantite}</td>
                <td>{m.stockAvant}</td>
                <td>{m.stockApres}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
