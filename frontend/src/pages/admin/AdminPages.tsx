import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { BoutonActualiser } from '../../components/ui/BoutonActualiser';
import { BoutonRecherche } from '../../components/ui/BoutonRecherche';
import { BoutonPdf } from '../../components/ui/BoutonPdf';
import { Selecteur } from '../../components/ui/Selecteur';
import { dateFr } from '../../lib/libelles';
import { messageApi } from '../../lib/api';
import { metier } from '../../services/metier.service';
import type { Technicien } from '../../types';

export function UtilisateursPage() {
  const [page, setPage] = useState<{ donnees: Array<Record<string, unknown>> } | null>(null);
  const [roles, setRoles] = useState<Array<{ id: number; code: string; libelle: string }>>([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ email: '', nom: '', prenom: '', roleId: '' });

  function charger() {
    metier.utilisateurs().then(setPage);
    metier.roles().then(setRoles);
  }
  useEffect(() => {
    charger();
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    try {
      await metier.creerUtilisateur({ ...form, roleId: Number(form.roleId) });
      setForm({ email: '', nom: '', prenom: '', roleId: '' });
      charger();
    } catch (ex) {
      setErr(messageApi(ex));
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Comptes utilisateurs</h2>
          <p>Désactivation logique uniquement — l\'historique reste attribué (RG-20).</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Utilisateurs',
            compartiment: 'Administration',
            colonnes: ['Nom', 'E-mail', 'Rôle', 'Actif'],
            lignes: (page?.donnees ?? []).map((u) => [
              `${u.prenom ?? ''} ${u.nom ?? ''}`,
              String(u.email ?? ''),
              String((u.role as { libelle?: string } | null)?.libelle ?? ''),
              u.actif ? 'Oui' : 'Non',
            ]),
            nomFichier: 'rapport-utilisateurs.pdf',
          }}
        />
        </div>
      </div>
      <form className="card" onSubmit={creer}>
        <div className="card-h">
          <h3>Créer un compte</h3>
        </div>
        <div className="card-b form-grid">
          {err && <div className="alert alert-err full">{err}</div>}
          <label className="field">
            E-mail
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            Nom
            <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </label>
          <label className="field">
            Prénom
            <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </label>
          <label className="field">
            Rôle
            <Selecteur required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">—</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.libelle}
                </option>
              ))}
            </Selecteur>
          </label>
          <div className="full">
            <button className="btn btn-primary">Créer (mot de passe temporaire ChangeMoi@2026!)</button>
          </div>
        </div>
      </form>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Rôle</th>
              <th>Actif</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((u) => (
              <tr key={String(u.id)}>
                <td>
                  {String(u.prenom ?? '')} {String(u.nom)}
                </td>
                <td>{String(u.email)}</td>
                <td>{(u.role as { libelle?: string } | null)?.libelle}</td>
                <td>{u.actif ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AuditPage() {
  const [page, setPage] = useState<{ donnees: Array<Record<string, unknown>> } | null>(null);
  useEffect(() => {
    metier.audit().then(setPage);
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Journal d\'audit</h2>
          <p>Lecture seule. Aucune modification n\'est possible depuis l\'application.</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: "Journal d'audit",
            compartiment: 'Administration',
            colonnes: ['Date', 'Action', 'Utilisateur', 'Cible', 'IP'],
            lignes: (page?.donnees ?? []).map((a) => [
              String(a.dateAction ?? ''),
              String(a.action ?? ''),
              String((a.utilisateur as { nom?: string } | null)?.nom ?? '—'),
              String(a.tableConcernee ?? ''),
              String(a.adresseIp ?? ''),
            ]),
            nomFichier: 'rapport-audit.pdf',
          }}
        />
        </div>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Cible</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {page?.donnees.map((a) => (
              <tr key={String(a.id)}>
                <td>{dateFr(String(a.dateAction))}</td>
                <td>
                  <Badge valeur={String(a.action)} />
                </td>
                <td>
                  {(a.utilisateur as { nom?: string } | null)?.nom ?? '—'}
                </td>
                <td className="mono">{String(a.tableConcernee ?? '')}</td>
                <td className="mono">{String(a.adresseIp ?? '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TechniciensPage() {
  const [liste, setListe] = useState<Technicien[]>([]);
  useEffect(() => {
    metier.techniciens().then(setListe);
  }, []);
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Techniciens</h2>
          <p>Matricules repris de la base Access (S010 à S036).</p>
        </div>
        <div className="page-head-actions">
          <BoutonRecherche />
          <BoutonActualiser />
        <BoutonPdf
          compact
          rapport={{
            titre: 'Techniciens / agents',
            compartiment: 'Maintenance',
            colonnes: ['Matricule', 'Nom', 'Spécialité', 'Taux', 'Statut'],
            lignes: liste.map((t) => [t.matricule, t.nomPrenom, t.specialite?.libelle ?? '', t.coutHoraire, t.statut]),
            nomFichier: 'rapport-techniciens.pdf',
          }}
        />
        </div>
      </div>
      <div className="card">
        <table className="data">
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom</th>
              <th>Spécialité</th>
              <th>Taux horaire</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.matricule}</td>
                <td>{t.nomPrenom}</td>
                <td>{t.specialite?.libelle ?? '—'}</td>
                <td>{t.coutHoraire} FCFA/h</td>
                <td>
                  <Badge valeur={t.statut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
