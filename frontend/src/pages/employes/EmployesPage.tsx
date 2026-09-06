import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Bouton } from '../../components/ui/Bouton';
import { ConfirmModale } from '../../components/ui/ConfirmModale';
import { Modale } from '../../components/ui/Modale';
import { Selecteur } from '../../components/ui/Selecteur';
import { COMPARTIMENTS, type CodeCompartiment } from '../../hooks/useCompartiment';
import { useAuth } from '../../hooks/useAuth';
import { useUsine } from '../../hooks/useUsine';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { RoleResume, Utilisateur } from '../../types';

const FORM_VIDE = {
  email: '',
  nom: '',
  prenom: '',
  roleId: '',
  siteId: '',
  compartiments: [] as CodeCompartiment[],
};

export function EmployesPage() {
  const { utilisateur } = useAuth();
  const { usineId, usines } = useUsine();
  const admin = utilisateur?.role?.code === 'ADMIN';
  const [liste, setListe] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<RoleResume[]>([]);
  const [form, setForm] = useState(FORM_VIDE);
  const [modale, setModale] = useState<'creer' | 'modifier' | null>(null);
  const [choisi, setChoisi] = useState<Utilisateur | null>(null);
  const [aSupprimer, setASupprimer] = useState<Utilisateur | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const usine = usines.find((u) => u.id === usineId) ?? usines.find((u) => u.id === utilisateur?.siteId);

  function charger() {
    metier
      .utilisateurs({ limite: 200 })
      .then((p) => setListe((p.donnees ?? []) as Utilisateur[]))
      .catch(() => setListe([]));
    metier.roles().then(setRoles).catch(() => setRoles([]));
  }
  useEffect(() => {
    charger();
  }, [usineId]);

  const rolesVisibles = admin ? roles : roles.filter((r) => !['ADMIN', 'DIRECTION_GENERALE', 'DIRECTION'].includes(r.code));

  function ouvrir(mode: 'creer' | 'modifier', u?: Utilisateur) {
    setErr('');
    setModale(mode);
    if (mode === 'modifier' && u) {
      setChoisi(u);
      setForm({
        email: u.email,
        nom: u.nom,
        prenom: u.prenom ?? '',
        roleId: u.role?.id ? String(u.role.id) : '',
        siteId: u.siteId ? String(u.siteId) : usineId ? String(usineId) : '',
        compartiments: (u.compartiments ?? []) as CodeCompartiment[],
      });
    } else {
      setChoisi(null);
      setForm({
        ...FORM_VIDE,
        siteId: usineId ? String(usineId) : utilisateur?.siteId ? String(utilisateur.siteId) : '',
      });
    }
  }

  function toggleComp(c: CodeCompartiment) {
    setForm((f) => ({
      ...f,
      compartiments: f.compartiments.includes(c) ? f.compartiments.filter((x) => x !== c) : [...f.compartiments, c],
    }));
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setBusy('sauver');
    setErr('');
    try {
      const payload = {
        email: form.email,
        nom: form.nom,
        prenom: form.prenom || undefined,
        roleId: Number(form.roleId),
        siteId: form.siteId ? Number(form.siteId) : usineId ?? undefined,
        compartiments: form.compartiments,
      };
      if (modale === 'modifier' && choisi) {
        await metier.modifierUtilisateur(choisi.id, payload);
      } else {
        await metier.creerUtilisateur(payload);
      }
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
      await metier.desactiverUtilisateur(aSupprimer.id);
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
      <div className="page-head">
        <div>
          <h2>Employés</h2>
          <p>
            {usine
              ? `Personnes de ${usine.libelle}. ${admin ? 'Changez d’usine dans la barre pour voir une autre usine.' : 'Vous gérez uniquement votre usine.'}`
              : 'Choisissez une usine dans la barre pour voir ses employés.'}
          </p>
        </div>
        <Bouton onClick={() => ouvrir('creer')}>
          <Plus size={16} /> {admin ? 'Ajouter un employé / directeur' : 'Ajouter un employé'}
        </Bouton>
      </div>
      {err && !modale && <div className="alert alert-err">{err}</div>}
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th>Usine</th>
              <th>Compartiments</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.prenom} {u.nom}
                </td>
                <td>{u.email}</td>
                <td>{u.role?.libelle}</td>
                <td>{u.site?.libelle ?? '—'}</td>
                <td>{(u.compartiments ?? []).map((c) => COMPARTIMENTS.find((x) => x.code === c)?.label ?? c).join(', ') || '—'}</td>
                <td>
                  <div className="page-head-actions">
                    <Bouton variante="ghost" onClick={() => ouvrir('modifier', u)}>
                      <Pencil size={14} /> Modifier
                    </Bouton>
                    {u.id !== utilisateur?.id && (
                      <Bouton variante="danger" onClick={() => setASupprimer(u)}>
                        <Trash2 size={14} /> Supprimer
                      </Bouton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr>
                <td colSpan={6}>Aucun employé sur cette usine.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modale && (
        <Modale
          titre={modale === 'creer' ? 'Nouvel employé' : 'Modifier l’employé'}
          texte={admin ? 'Un directeur se crée ici, rattaché à un site. Il pourra ensuite ajouter les employés de son usine.' : 'L’employé n’aura accès qu’à cette usine et aux compartiments cochés.'}
          onFermer={() => setModale(null)}
        >
          <form className="form-grid" onSubmit={enregistrer}>
            {err && <div className="alert alert-err full">{err}</div>}
            <label className="field">
              E-mail
              <input required type="email" value={form.email} disabled={modale === 'modifier'} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="field">
              Nom
              <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </label>
            <label className="field">
              Prénom
              <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </label>
            <Selecteur label="Rôle" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">—</option>
              {rolesVisibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.libelle}
                </option>
              ))}
            </Selecteur>
            {admin && (
              <Selecteur label="Site d’usine" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                <option value="">—</option>
                {usines.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.libelle}
                  </option>
                ))}
              </Selecteur>
            )}
            <div className="full">
              <p>Compartiments visibles à la connexion</p>
              <div className="comp-checks">
                {COMPARTIMENTS.map((c) => (
                  <label key={c.code} className="check-ligne">
                    <input type="checkbox" checked={form.compartiments.includes(c.code)} onChange={() => toggleComp(c.code)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            {modale === 'creer' && (
              <p className="full">Mot de passe temporaire : ChangeMoi@2026!</p>
            )}
            <div className="full page-head-actions">
              <Bouton variante="ghost" onClick={() => setModale(null)}>
                Annuler
              </Bouton>
              <Bouton type="submit" chargement={busy === 'sauver'}>
                <Users size={16} /> Enregistrer
              </Bouton>
            </div>
          </form>
        </Modale>
      )}

      {aSupprimer && (
        <ConfirmModale
          texte={`Désactiver ${aSupprimer.prenom ?? ''} ${aSupprimer.nom} ?`}
          chargement={busy === 'supprimer'}
          onAnnuler={() => setASupprimer(null)}
          onConfirmer={supprimer}
        />
      )}
    </div>
  );
}
