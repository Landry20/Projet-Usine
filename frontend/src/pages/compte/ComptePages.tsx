import { FormEvent, useState } from 'react';
import { Bell, KeyRound, Mail, Phone, Save, Shield, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { ChampMotDePasse } from '../../components/ui/ChampMotDePasse';
import { ChampTexte } from '../../components/ui/ChampTexte';
import { useAuth } from '../../hooks/useAuth';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { authService } from '../../services/auth.service';

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await authService.majProfil(form);
      await rafraichirProfil();
      setMsg('Profil enregistré.');
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  if (!utilisateur) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Mon profil</h2>
          <p>Vos informations personnelles. L’e-mail et le rôle sont gérés par l’administrateur.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
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
              <button className="btn btn-primary">
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ParametresPage() {
  const { utilisateur } = useAuth();
  const [notif, setNotif] = useState(localStorage.getItem('gmao.notif') !== '0');
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function changerMdp(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const r = await authService.changerMotDePasse(ancien, nouveau);
      setMsg(r.message);
      setAncien('');
      setNouveau('');
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Paramètres</h2>
          <p>Préférences du compte et sécurité.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
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
          {err && <div className="alert alert-err full">{err}</div>}
          {msg && <div className="alert alert-ok full">{msg}</div>}
          <ChampMotDePasse label="Mot de passe actuel" value={ancien} onChange={(e) => setAncien(e.target.value)} required />
          <ChampMotDePasse label="Nouveau mot de passe" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required />
          <div className="full">
            <button className="btn btn-primary">
              <Shield size={16} />
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>
      </form>
      <div className="card">
        <div className="card-h">
          <h3>Compte</h3>
        </div>
        <div className="card-b">
          <p>
            Connecté en tant que <strong>{utilisateur?.email}</strong> — {utilisateur?.role?.libelle}.
          </p>
          <Link to="/profil" className="btn btn-ghost">
            <UserRound size={16} />
            Ouvrir mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
