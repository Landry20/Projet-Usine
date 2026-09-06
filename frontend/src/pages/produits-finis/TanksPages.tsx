import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Bouton } from '../../components/ui/Bouton';
import { ConfirmModale } from '../../components/ui/ConfirmModale';
import { Modale } from '../../components/ui/Modale';
import { Selecteur } from '../../components/ui/Selecteur';
import { TankVisuel } from '../../components/tanks/TankVisuel';
import { useAuth } from '../../hooks/useAuth';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Produit, Site, Tank } from '../../types';

const FORM_VIDE = {
  code: '',
  libelle: '',
  capaciteLitres: '',
  produitId: '',
  siteId: '',
  seuilHautPct: '90',
  seuilBasPct: '10',
};

export function TanksPage() {
  const { aPermission } = useAuth();
  const gerer = aPermission('tank.gerer');
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [choisi, setChoisi] = useState<Tank | null>(null);
  const [modale, setModale] = useState<'creer' | 'modifier' | null>(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [jauge, setJauge] = useState({ h: '', volume: '', ajuster: true });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<'sauver' | 'jauger' | 'supprimer' | ''>('');
  const [aSupprimer, setASupprimer] = useState<Tank | null>(null);

  function charger() {
    metier.tanks().then(setTanks);
  }
  useEffect(() => {
    charger();
    metier.produits({ type: 'PRODUIT_FINI', limite: 200 }).then((p) => setProduits(p.donnees)).catch(() => setProduits([]));
    metier.usines().then(setSites).catch(() => setSites([]));
  }, []);

  async function ouvrir(t: Tank) {
    setErr('');
    setJauge({ h: '', volume: '', ajuster: true });
    try {
      setChoisi({ ...t, ...(await metier.tank(t.id)) });
    } catch {
      setChoisi(t);
    }
  }

  function ouvrirForm(mode: 'creer' | 'modifier', tank?: Tank) {
    setErr('');
    setModale(mode);
    if (mode === 'modifier' && tank) {
      setForm({
        code: tank.code,
        libelle: tank.libelle ?? '',
        capaciteLitres: String(tank.capaciteLitres),
        produitId: tank.produit?.id ? String(tank.produit.id) : '',
        siteId: tank.site?.id ? String(tank.site.id) : tank.siteId ? String(tank.siteId) : '',
        seuilHautPct: String(tank.seuilHautPct ?? 90),
        seuilBasPct: String(tank.seuilBasPct ?? 10),
      });
    } else {
      setForm(FORM_VIDE);
    }
  }

  async function enregistrerTank(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy('sauver');
    try {
      const payload = {
        code: form.code,
        libelle: form.libelle || undefined,
        capaciteLitres: Number(form.capaciteLitres),
        produitId: form.produitId ? Number(form.produitId) : undefined,
        siteId: form.siteId ? Number(form.siteId) : undefined,
        seuilHautPct: Number(form.seuilHautPct),
        seuilBasPct: Number(form.seuilBasPct),
      };
      if (modale === 'modifier' && choisi) {
        const maj = await metier.modifierTank(choisi.id, payload);
        setChoisi({ ...choisi, ...maj });
      } else {
        await metier.creerTank(payload);
      }
      setModale(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  async function supprimer(t: Tank) {
    setBusy('supprimer');
    setErr('');
    try {
      await metier.supprimerTank(t.id);
      if (choisi?.id === t.id) setChoisi(null);
      setASupprimer(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  async function jauger() {
    if (!choisi) return;
    const hauteur = jauge.h.trim() === '' ? undefined : Number(jauge.h);
    const volume = jauge.volume.trim() === '' ? undefined : Number(jauge.volume);
    if (hauteur == null && volume == null) {
      setErr('Indiquez une hauteur (cm) ou un volume (L).');
      return;
    }
    setBusy('jauger');
    setErr('');
    try {
      await metier.jaugerTank(choisi.id, {
        ...(hauteur != null && Number.isFinite(hauteur) ? { hauteurCm: hauteur } : {}),
        ...(volume != null && Number.isFinite(volume) ? { volumeLitres: volume } : {}),
        ajusterStock: jauge.ajuster,
      });
      charger();
      setChoisi(await metier.tank(choisi.id));
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Parc de tanks</h2>
          <p>Cliquez un tank pour ouvrir ses détails en grand écran. L’huile montre le niveau réel.</p>
        </div>
        {gerer && (
          <Bouton onClick={() => ouvrirForm('creer')}>
            <Plus size={16} /> Créer un tank
          </Bouton>
        )}
      </div>
      {err && !choisi && !modale && <div className="alert alert-err">{err}</div>}
      <div className="parc-tanks-grille">
        {tanks.map((t) => (
          <article key={t.id} className="tank-carte">
            <button type="button" className="tank-carte-vue" onClick={() => ouvrir(t)}>
              <TankVisuel tank={t} taille="m" />
              <h3>{t.code}</h3>
              <p>{t.libelle}</p>
              <p>
                {t.stockLitres} / {t.capaciteLitres} L
              </p>
            </button>
            {gerer && (
              <div className="tank-carte-actions">
                <Bouton variante="ghost" onClick={() => { setChoisi(t); ouvrirForm('modifier', t); }}>
                  <Pencil size={14} /> Modifier
                </Bouton>
                <Bouton variante="danger" onClick={() => setASupprimer(t)}>
                  <Trash2 size={14} /> Supprimer
                </Bouton>
              </div>
            )}
          </article>
        ))}
      </div>
      {!tanks.length && <p>Aucun tank. Créez le premier avec le bouton ci-dessus.</p>}

      {choisi && !modale && (
        <div className="tank-ecran">
          <div className="tank-ecran-h">
            <div>
              <h2>{choisi.code}</h2>
              <p>{choisi.libelle} · {choisi.produit?.designation ?? 'Aucun produit'}</p>
            </div>
            <div className="page-head-actions">
              {gerer && (
                <>
                  <Bouton variante="ghost" onClick={() => ouvrirForm('modifier', choisi)}>
                    <Pencil size={15} /> Modifier
                  </Bouton>
                  <Bouton variante="danger" onClick={() => setASupprimer(choisi)}>
                    <Trash2 size={15} /> Supprimer
                  </Bouton>
                </>
              )}
              <button type="button" className="icon-btn" aria-label="Fermer" onClick={() => setChoisi(null)}>
                <X size={18} />
              </button>
            </div>
          </div>
          {err && <div className="alert alert-err">{err}</div>}
          <div className="tank-ecran-corps">
            <div className="tank-ecran-dessin">
              <TankVisuel tank={choisi} taille="xl" />
              <Badge valeur={choisi.statut} />
            </div>
            <div className="tank-ecran-infos">
              <div className="tank-stats">
                <div className="tank-stat">
                  <div className="k">Stock</div>
                  <div className="v">{choisi.stockLitres} L</div>
                </div>
                <div className="tank-stat">
                  <div className="k">Capacité</div>
                  <div className="v">{choisi.capaciteLitres} L</div>
                </div>
                <div className="tank-stat">
                  <div className="k">Masse</div>
                  <div className="v">{choisi.stockKg} kg</div>
                </div>
                <div className="tank-stat">
                  <div className="k">Disponible</div>
                  <div className="v">{choisi.disponibleLitres ?? choisi.stockLitres} L</div>
                </div>
                <div className="tank-stat">
                  <div className="k">Réservé</div>
                  <div className="v">{choisi.litresReserves} L</div>
                </div>
                <div className="tank-stat">
                  <div className="k">Remplissage</div>
                  <div className="v">{choisi.remplissagePct ?? 0} %</div>
                </div>
              </div>
              {gerer && (
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-h">
                    <h3>Jaugeage</h3>
                  </div>
                  <div className="card-b form-grid">
                    <label className="field">
                      Volume observé (L)
                      <input type="number" min="0" step="0.01" value={jauge.volume} onChange={(e) => setJauge({ ...jauge, volume: e.target.value })} />
                    </label>
                    <label className="field">
                      Hauteur (cm)
                      <input type="number" min="0" step="0.1" value={jauge.h} onChange={(e) => setJauge({ ...jauge, h: e.target.value })} />
                    </label>
                    <label className="field">
                      <input type="checkbox" checked={jauge.ajuster} onChange={(e) => setJauge({ ...jauge, ajuster: e.target.checked })} />
                      {' '}Mettre à jour le niveau
                    </label>
                    <div className="full">
                      <Bouton chargement={busy === 'jauger'} onClick={jauger}>
                        Enregistrer le jaugeage
                      </Bouton>
                    </div>
                  </div>
                </div>
              )}
              {(choisi.mouvements ?? []).length > 0 && (
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-h">
                    <h3>Mouvements</h3>
                  </div>
                  <ul className="card-b">
                    {choisi.mouvements!.slice(0, 8).map((m) => (
                      <li key={m.id}>
                        <Badge valeur={m.typeMvt} /> {m.quantiteLitres} L · {dateFr(m.dateMvt)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modale && (
        <Modale
          titre={modale === 'creer' ? 'Nouveau tank' : `Modifier ${form.code}`}
          texte="Capacité, produit fini et seuils d’alerte."
          onFermer={() => setModale(null)}
        >
          <form className="form-grid" onSubmit={enregistrerTank}>
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TK-03" />
            </label>
            <label className="field">
              Libellé
              <input value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Tank huile 3" />
            </label>
            <label className="field">
              Capacité (L)
              <input required type="number" min="1" step="1" value={form.capaciteLitres} onChange={(e) => setForm({ ...form, capaciteLitres: e.target.value })} />
            </label>
            <Selecteur label="Produit fini" value={form.produitId} onChange={(e) => setForm({ ...form, produitId: e.target.value })}>
              <option value="">—</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.refProduit} — {p.designation}
                </option>
              ))}
            </Selecteur>
            <Selecteur label="Usine / site" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
              <option value="">—</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.libelle}
                </option>
              ))}
            </Selecteur>
            <label className="field">
              Seuil haut (%)
              <input type="number" min="1" max="100" value={form.seuilHautPct} onChange={(e) => setForm({ ...form, seuilHautPct: e.target.value })} />
            </label>
            <label className="field">
              Seuil bas (%)
              <input type="number" min="0" max="99" value={form.seuilBasPct} onChange={(e) => setForm({ ...form, seuilBasPct: e.target.value })} />
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
          texte={`Supprimer le tank ${aSupprimer.code} ? Cette action est irréversible.`}
          chargement={busy === 'supprimer'}
          onAnnuler={() => setASupprimer(null)}
          onConfirmer={() => supprimer(aSupprimer)}
        />
      )}
    </div>
  );
}
