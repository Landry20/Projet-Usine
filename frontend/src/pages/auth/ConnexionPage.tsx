import { FormEvent, useState } from 'react';
import { ArrowLeft, LogIn, Mail } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChampMotDePasse } from '../../components/ui/ChampMotDePasse';
import { ChampTexte } from '../../components/ui/ChampTexte';
import { useAuth } from '../../hooks/useAuth';
import { messageApi } from '../../lib/api';

export function ConnexionPage() {
  const { connexion, utilisateur, chargement } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);

  if (!chargement && utilisateur) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErreur('');
    try {
      const u = await connexion(email, motDePasse);
      nav(u.doitChangerMdp ? '/changer-mot-de-passe' : '/');
    } catch (err) {
      setErreur(messageApi(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-simple">
      <form className="login-box" onSubmit={onSubmit}>
        <img src="/logo.svg" alt="Usine industrielle" className="login-app-icon" />
        <h2>Connexion</h2>
        <p className="sub">Compte professionnel</p>
        {erreur && <div className="alert alert-err">{erreur}</div>}
        <ChampTexte
          label="Adresse e-mail"
          icone={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          autoComplete="username"
        />
        <div style={{ height: 12 }} />
        <ChampMotDePasse
          label="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div style={{ height: 18 }} />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={16} />
          {busy ? 'Vérification…' : 'Se connecter'}
        </button>
        <Link to="/" className="login-back">
          <ArrowLeft size={14} />
          Retour à la présentation
        </Link>
      </form>
    </div>
  );
}
