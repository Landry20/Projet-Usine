import { SetMetadata } from '@nestjs/common';

export const CLE_PERMISSIONS = 'permissions_requises';
export const CLE_PERMISSIONS_ANY = 'permissions_any';

/** Déclare les permissions nécessaires pour une route. Vérifiées côté serveur uniquement. */
export const Permissions = (...codes: string[]) => SetMetadata(CLE_PERMISSIONS, codes);

/** Au moins une des permissions suffit (ex. catalogue produits partagé prod / PF). */
export const PermissionsAny = (...codes: string[]) => SetMetadata(CLE_PERMISSIONS_ANY, codes);
