import * as argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/** Hachage Argon2id (CDC section 14). */
export async function hasherMotDePasse(clair: string): Promise<string> {
  return argon2.hash(clair, { type: argon2.argon2id });
}

export async function verifierMotDePasse(hash: string, clair: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, clair);
  } catch {
    return false;
  }
}

export function hasherJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex');
}

export function genererJetonAleatoire(octets = 48): string {
  return randomBytes(octets).toString('hex');
}

export function comparaisonConstante(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Politique de complexité paramétrable (valeurs par défaut industrielles).
 * Minimum 10 caractères, majuscule, minuscule, chiffre, caractère spécial.
 */
export function validerComplexiteMotDePasse(mdp: string): string | null {
  if (mdp.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.';
  if (!/[A-Z]/.test(mdp)) return 'Le mot de passe doit contenir une majuscule.';
  if (!/[a-z]/.test(mdp)) return 'Le mot de passe doit contenir une minuscule.';
  if (!/[0-9]/.test(mdp)) return 'Le mot de passe doit contenir un chiffre.';
  if (!/[^A-Za-z0-9]/.test(mdp)) return 'Le mot de passe doit contenir un caractère spécial.';
  return null;
}
