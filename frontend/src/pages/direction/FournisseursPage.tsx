import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Truck } from 'lucide-react';
import { Bouton } from '../../components/ui/Bouton';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { Modale } from '../../components/ui/Modale';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Fournisseur } from '../../types';

const FORM_VIDE = { code: '', raisonSociale: '', contact: '', telephone: '', email: '' };

export function FournisseursPage() {
  const [liste, setListe] = useState<Fournisseur[]>([]);
  const [form, setForm] = useState(FORM_VIDE);
  const [modale, setModale] = useState<'creer' | 'modifier' | null>(null);
  const [choisi, setChoisi] = useState<Fournisseur | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  function charger() {
    metier.fournisseurs().then(setListe).catch(() => setListe([]));
  }
  useEffect(() => {
    charger();
  }, []);

  function ouvrir(mode: 'creer' | 'modifier', f?: Fournisseur) {
    setErr('');
    setModale(mode);
    if (mode === 'modifier' && f) {
      setChoisi(f);
      setForm({
        code: f.code,
        raisonSociale: f.raisonSociale,
        contact: f.contact ?? '',
        telephone: f.telephone ?? '',
        email: f.email ?? '',
      });
    } else {
      setChoisi(null);
      setForm(FORM_VIDE);
    }
  }

  async function sauver(e: FormEvent) {
    e.preventDefault();
    setBusy('sauver');
    setErr('');
    try {
      if (modale === 'modifier' && choisi) {
        await metier.modifierFournisseur(choisi.id, form);
      } else {
        await metier.creerFournisseur(form);
      }
      setModale(null);
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page-fluide">
      <div className="page-head">
        <div>
          <h2>Fournisseurs</h2>
          <p>Enregistrez les fournisseurs utilisés pour les commandes de matières premières.</p>
        </div>
        <div className="page-head-actions">
          <BoutonActualiser />
          <Bouton onClick={() => ouvrir('creer')}>
            <Plus size={16} /> Créer un fournisseur
          </Bouton>
        </div>
      </div>
      {err && !modale && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Raison sociale</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>E-mail</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((f) => (
              <tr key={f.id}>
                <td className="mono">{f.code}</td>
                <td>{f.raisonSociale}</td>
                <td>{f.contact || '—'}</td>
                <td>{f.telephone || '—'}</td>
                <td>{f.email || '—'}</td>
                <td>
                  <Bouton variante="ghost" onClick={() => ouvrir('modifier', f)}>
                    <Pencil size={14} /> Modifier
                  </Bouton>
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={6}>Aucun fournisseur pour le moment.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {modale && (
        <Modale
          titre={modale === 'modifier' ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          onFermer={() => setModale(null)}
        >
          <form className="form-grid" onSubmit={sauver}>
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              Code
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </label>
            <label className="field">
              Raison sociale
              <input required value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
            </label>
            <label className="field">
              Contact
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </label>
            <label className="field">
              Téléphone
              <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </label>
            <label className="field full">
              E-mail
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <div className="full">
              <Bouton type="submit" chargement={busy === 'sauver'}>
                <Truck size={16} /> Enregistrer le fournisseur
              </Bouton>
            </div>
          </form>
        </Modale>
      )}
    </div>
  );
}
