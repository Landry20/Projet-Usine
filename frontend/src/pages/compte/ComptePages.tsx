import { FormEvent, useEffect, useState } from 'react';
import { Bell, BookOpen, Factory, KeyRound, Mail, Phone, Save, Shield, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bouton } from '../../components/ui/Bouton';
import { ChampMotDePasse } from '../../components/ui/ChampMotDePasse';
import { ChampTexte } from '../../components/ui/ChampTexte';
import { Selecteur } from '../../components/ui/Selecteur';
import { useAuth } from '../../hooks/useAuth';
import { useUsine } from '../../hooks/useUsine';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { authService } from '../../services/auth.service';
import { metier } from '../../services/metier.service';
import type { Site } from '../../types';

function initiales(prenom?: string | null, nom?: string) {
  return `${(prenom ?? '').charAt(0)}${(nom ?? '').charAt(0)}`.toUpperCase() || 'U';
}

export function ProfilPage() {
  const { utilisateur, rafraichirProfil } = useAuth();
  const [form, setForm] = useState({
    nom: utilisateur?.nom ?? '',
    prenom: utilisateur?.prenom ?? '',
    telephone: utilisateur?.telephone ?? '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      await authService.majProfil(form);
      await rafraichirProfil();
      setMsg('Profil enregistré.');
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy(false);
    }
  }

  if (!utilisateur) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Mon profil</h2>
          <p>Identité personnelle. Ce n’est pas ici qu’on change d’usine ni le mot de passe — voyez Paramètres.</p>
        </div>
      </div>
      <div className="compte-grid">
        <aside className="card compte-carte">
          <div className="avatar avatar-lg">{initiales(utilisateur.prenom, utilisateur.nom)}</div>
          <strong>
            {utilisateur.prenom} {utilisateur.nom}
          </strong>
          <span>{utilisateur.role?.libelle}</span>
          <p className="compte-meta">
            <Mail size={14} /> {utilisateur.email}
          </p>
          <p className="compte-meta">Dernière connexion : {dateFr(utilisateur.derniereConnexion)}</p>
          <Link to="/parametres" className="btn btn-ghost">
            Ouvrir les paramètres
          </Link>
        </aside>
        <form className="card" onSubmit={onSubmit}>
          <div className="card-h">
            <h3>Identité</h3>
          </div>
          <div className="card-b form-grid">
            {err && <div className="alert alert-err full">{err}</div>}
            {msg && <div className="alert alert-ok full">{msg}</div>}
            <ChampTexte
              label="Nom"
              icone={<UserRound size={16} />}
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
            <ChampTexte
              label="Prénom"
              icone={<UserRound size={16} />}
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
            />
            <ChampTexte
              label="Téléphone"
              icone={<Phone size={16} />}
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            />
            <ChampTexte label="E-mail" icone={<Mail size={16} />} value={utilisateur.email} disabled />
            <div className="full">
              <Bouton type="submit" chargement={busy}>
                <Save size={16} />
                Enregistrer
              </Bouton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ParametresPage() {
  const { utilisateur, aPermission } = useAuth();
  const { usineId, usines, setUsineId, rafraichirUsines, peutChanger } = useUsine();
  const [sites, setSites] = useState<Site[]>(usines);
  const [notif, setNotif] = useState(localStorage.getItem('gmao.notif') !== '0');
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [siteForm, setSiteForm] = useState({ code: '', libelle: '', ville: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busyMdp, setBusyMdp] = useState(false);
  const [busySite, setBusySite] = useState(false);

  useEffect(() => {
    setSites(usines);
  }, [usines]);

  async function changerMdp(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusyMdp(true);
    try {
      const r = await authService.changerMotDePasse(ancien, nouveau);
      setMsg(r.message);
      setAncien('');
      setNouveau('');
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusyMdp(false);
    }
  }

  async function creerSite(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusySite(true);
    try {
      const s = await metier.creerSite(siteForm);
      await rafraichirUsines();
      setUsineId(s.id);
      setSites((liste) => [...liste, s]);
      setSiteForm({ code: '', libelle: '', ville: '' });
      setMsg(`Usine ${s.libelle} créée. Vous êtes maintenant sur ce site.`);
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusySite(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Paramètres</h2>
          <p>Usine de travail, guide d’utilisation et sécurité. Le profil (nom, téléphone) est une page à part.</p>
        </div>
      </div>
      {err && <div className="alert alert-err">{err}</div>}
      {msg && <div className="alert alert-ok">{msg}</div>}

      <div className="card">
        <div className="card-h">
          <h3>
            <Factory size={16} /> Site d’usine
          </h3>
        </div>
        <div className="card-b form-grid">
          <p className="full">
            Toutes les données (dépôts, tanks, stocks) sont filtrées par l’usine choisie. Le Super Admin peut toutes les voir.
          </p>
          <Selecteur
            label="Usine active"
            value={usineId ? String(usineId) : ''}
            onChange={(e) => setUsineId(e.target.value ? Number(e.target.value) : null)}
          >
            {peutChanger && <option value="">Toutes les usines</option>}
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle} {s.ville ? `— ${s.ville}` : ''}
              </option>
            ))}
          </Selecteur>
        </div>
      </div>

      {aPermission('referentiel.gerer') && (
        <form className="card" onSubmit={creerSite}>
          <div className="card-h">
            <h3>Créer une usine</h3>
          </div>
          <div className="card-b form-grid">
            <ChampTexte label="Code" required value={siteForm.code} onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value })} />
            <ChampTexte label="Nom" required value={siteForm.libelle} onChange={(e) => setSiteForm({ ...siteForm, libelle: e.target.value })} />
            <ChampTexte label="Ville" value={siteForm.ville} onChange={(e) => setSiteForm({ ...siteForm, ville: e.target.value })} />
            <div className="full">
              <Bouton type="submit" chargement={busySite}>
                Enregistrer l’usine
              </Bouton>
            </div>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-h">
          <h3>
            <BookOpen size={16} /> Guide d’utilisation
          </h3>
        </div>
        <div className="card-b">
          <ol className="guide-liste">
            <li>
              <strong>Dépôts</strong> — réceptionnez le camion : un lot et une étiquette QR sont créés.
            </li>
            <li>
              <strong>Production</strong> — demandez un lot au dépôt, lancez l’OF, versez le produit dans un tank.
            </li>
            <li>
              <strong>Laboratoire</strong> — prélevez, analysez, soumettez le dossier à la Direction.
            </li>
            <li>
              <strong>Direction</strong> — validez le dossier et les demandes d’achat.
            </li>
            <li>
              <strong>Produit fini</strong> — suivez les tanks, pesez, expédiez avec le BL.
            </li>
            <li>
              <strong>Maintenance</strong> — une panne de ligne crée une demande d’intervention.
            </li>
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>
            <Bell size={16} /> Notifications
          </h3>
        </div>
        <div className="card-b">
          <label className="check-ligne">
            <input
              type="checkbox"
              checked={notif}
              onChange={(e) => {
                setNotif(e.target.checked);
                localStorage.setItem('gmao.notif', e.target.checked ? '1' : '0');
              }}
            />
            Recevoir les alertes métier dans l’application
          </label>
        </div>
      </div>

      <form className="card" onSubmit={changerMdp}>
        <div className="card-h">
          <h3>
            <KeyRound size={16} /> Mot de passe
          </h3>
        </div>
        <div className="card-b form-grid">
          <ChampMotDePasse label="Mot de passe actuel" value={ancien} onChange={(e) => setAncien(e.target.value)} required />
          <ChampMotDePasse label="Nouveau mot de passe" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required />
          <div className="full">
            <Bouton type="submit" chargement={busyMdp}>
              <Shield size={16} />
              Mettre à jour le mot de passe
            </Bouton>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-h">
          <h3>Profil</h3>
        </div>
        <div className="card-b">
          <p>
            Connecté en tant que <strong>{utilisateur?.email}</strong> — {utilisateur?.role?.libelle}.
          </p>
          <Link to="/profil" className="btn btn-ghost">
            <UserRound size={16} />
            Modifier mon identité
          </Link>
        </div>
      </div>
    </div>
  );
}
