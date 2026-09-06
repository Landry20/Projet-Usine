import { FormEvent, useState, type ReactNode } from 'react';
import { Factory } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUsine } from '../../hooks/useUsine';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import { Bouton } from '../ui/Bouton';
import { ChampTexte } from '../ui/ChampTexte';
import { SquelettePage } from '../ui/SquelettePage';

export function PortailPremierSite({ children }: { children: ReactNode }) {
  const { utilisateur, rafraichirProfil } = useAuth();
  const { usines, pret, setUsineId, rafraichirUsines } = useUsine();
  const [form, setForm] = useState({ code: '', libelle: '', ville: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const admin = utilisateur?.role?.code === 'ADMIN';
  const manqueSite = admin && pret && usines.length === 0;

  async function creer(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const s = await metier.creerSite(form);
      await rafraichirUsines();
      setUsineId(s.id);
      await rafraichirProfil();
    } catch (ex) {
      setErr(messageApi(ex));
    } finally {
      setBusy(false);
    }
  }

  if (admin && !pret) return <SquelettePage />;
  if (!manqueSite) return <>{children}</>;

  return (
    <div className="portail-site">
      <form className="portail-carte" onSubmit={creer}>
        <Factory size={28} />
        <h2>Premier site d’usine</h2>
        <p>Avant d’entrer dans ManuPro, créez le site où vous travaillez. Vous serez connecté automatiquement à cette usine.</p>
        {err && <div className="alert alert-err">{err}</div>}
        <ChampTexte label="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="USI-A" />
        <ChampTexte label="Nom du site" required value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} placeholder="Usine A" />
        <ChampTexte label="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
        <Bouton type="submit" chargement={busy} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
          Enregistrer et entrer
        </Bouton>
      </form>
    </div>
  );
}
