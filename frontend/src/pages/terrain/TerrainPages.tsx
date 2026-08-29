import { FormEvent, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';

/** Lot 1 : résolution QR par saisie du code. Le scan caméra + IndexedDB arrivent au Lot 2. */
export function ScanPage() {
  const nav = useNavigate();
  const [code, setCode] = useState('ABJ-POM-001');
  const [err, setErr] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const eq = await metier.equipementQr(code.trim());
      nav(`/equipements/${eq.id}`);
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-h">
        <h3>Scanner une machine</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b">
        {err && <div className="alert alert-err">{err}</div>}
        <p>
          Saisissez le code de l\'étiquette (identique au QR). La caméra et le mode hors ligne
          IndexedDB sont prévus au Lot 2.
        </p>
        <label className="field">
          Code QR / code équipement
          <input className="mono" value={code} onChange={(e) => setCode(e.target.value)} required />
        </label>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-gold">
            <FolderOpen size={16} />
            Ouvrir la fiche
          </button>
        </div>
      </div>
    </form>
  );
}

export function SyncPage() {
  return (
    <div className="card">
      <div className="card-h">
        <h3>Synchronisation terrain</h3>
        <BoutonRecherche />
          <BoutonActualiser />
      </div>
      <div className="card-b">
        <p>
          Module Lot 2 : file d\'attente IndexedDB, envoi <code>POST /v1/sync</code>, conservation
          jusqu\'à accusé serveur, arbitrage des conflits.
        </p>
        <p>
          En Lot 1, toutes les saisies passent encore par l\'API en ligne. L\'architecture (client_uuid,
          dates terrain / sync) est déjà prévue en base.
        </p>
      </div>
    </div>
  );
}
