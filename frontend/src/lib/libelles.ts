/** Libellés français — affichage uniquement, jamais une règle métier. */

export const LIB_STATUT_OT: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  REALISE: 'Réalisé',
  CLOTURE: 'Clôturé',
  ANNULE: 'Annulé',
};

export const LIB_PRIORITE: Record<string, string> = {
  P1_URGENT: 'P1 Urgent',
  P2_HAUTE: 'P2 Haute',
  P3_NORMALE: 'P3 Normale',
  P4_BASSE: 'P4 Basse',
};

export const LIB_DI: Record<string, string> = {
  NOUVELLE: 'Nouvelle',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
  CONVERTIE: 'Convertie',
};

export const LIB_STATUT_EQ: Record<string, string> = {
  EN_SERVICE: 'En service',
  A_L_ARRET: "À l'arrêt",
  EN_PANNE: 'En panne',
  EN_REPARATION: 'En réparation',
  REFORME: 'Réformé',
};

export function fcfa(n: number | string | null | undefined) {
  return `${Math.round(Number(n ?? 0)).toLocaleString('fr-FR')} FCFA`;
}

export function dateFr(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR');
}

export const LIB_STATUT_OF: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  CONTROLE: 'Contrôle qualité',
  CLOTURE: 'Clôturé',
  ANNULE: 'Annulé',
};

export const LIB_STATUT_LOT: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  BLOQUE: 'Bloqué',
  REJETE: 'Rejeté',
  EXPEDIE: 'Expédié',
};

export const LIB_TYPE_PRODUIT: Record<string, string> = {
  MATIERE_PREMIERE: 'Matière première',
  SEMI_FINI: 'Semi-fini',
  PRODUIT_FINI: 'Produit fini',
  SOUS_PRODUIT: 'Sous-produit',
  CONSOMMABLE: 'Consommable',
};

export const LIB_VALIDATION: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMIS: 'Soumis',
  VERIFIE: 'Vérifié',
  APPROUVE: 'Approuvé',
  DIFFUSE: 'Diffusé',
  RETOURNE: 'Retourné',
  ANNULE: 'Annulé',
};

export const LIB_DM: Record<string, string> = {
  DEMANDEE: 'Demandée',
  SERVIE: 'Servie',
  PARTIELLE: 'Partielle',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
};

export const LIB_CONCLUSION: Record<string, string> = {
  CONFORME: 'Conforme',
  NON_CONFORME: 'Non conforme',
  DEROGATION: 'Dérogation',
  EN_COURS: 'En cours',
};

export function libelleStatut(v?: string | null) {
  if (!v) return '—';
  return (
    LIB_STATUT_OT[v] ||
    LIB_STATUT_OF[v] ||
    LIB_STATUT_LOT[v] ||
    LIB_TYPE_PRODUIT[v] ||
    LIB_PRIORITE[v] ||
    LIB_DI[v] ||
    LIB_STATUT_EQ[v] ||
    LIB_VALIDATION[v] ||
    LIB_DM[v] ||
    LIB_CONCLUSION[v] ||
    v.replaceAll('_', ' ')
  );
}
