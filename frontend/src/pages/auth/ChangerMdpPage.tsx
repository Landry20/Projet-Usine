import { FormEvent, useState } from 'react';
import { Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogoManuPro } from '../../components/brand/LogoManuPro';
import { ChampMotDePasse } from '../../components/ui/ChampMotDePasse';
import { authService } from '../../services/auth.service';
import { messageApi } from '../../lib/api';

export function ChangerMdpPage() {
  const nav = useNavigate();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const r = await authService.changerMotDePasse(ancien, nouveau);
      setMsg(r.message);
      setTimeout(() => nav('/connexion'), 1200);
    } catch (e2) {
      setErr(messageApi(e2));
    }
  }

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <LogoManuPro className="login-app-icon" />
        <div className="brand-kicker">Sécurité</div>
        <h1>Changement de mot de passe</h1>
        <p>Obligatoire à la première connexion. Complexité contrôlée côté serveur.</p>
      </section>
      <section className="login-panel">
        <form className="login-box" onSubmit={onSubmit}>
          <h2>Nouveau mot de passe</h2>
          {err && <div className="alert alert-err">{err}</div>}
          {msg && <div className="alert alert-ok">{msg}</div>}
          <ChampMotDePasse
            label="Mot de passe actuel"
            value={ancien}
            onChange={(e) => setAncien(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div style={{ height: 12 }} />
          <ChampMotDePasse
            label="Nouveau mot de passe"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            required
            autoComplete="new-password"
          />
          <div style={{ height: 18 }} />
          <button className="btn btn-primary" type="submit">
            <Save size={16} />
            Enregistrer
          </button>
        </form>
      </section>
    </div>
  );
}
