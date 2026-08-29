import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLE_PERMISSIONS, CLE_PERMISSIONS_ANY } from '../decorators/permissions.decorator';
import { CLE_PUBLIC } from '../decorators/public.decorator';

/**
 * Contrôle des droits sur CHAQUE route (CDC 4.3 et 14).
 * Un administrateur possède implicitement toutes les permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const estPublic = this.reflector.getAllAndOverride<boolean>(CLE_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublic) return true;

    const requises = this.reflector.getAllAndOverride<string[]>(CLE_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    const uneParmi = this.reflector.getAllAndOverride<string[]>(CLE_PERMISSIONS_ANY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if ((!requises || requises.length === 0) && (!uneParmi || uneParmi.length === 0)) return true;

    const utilisateur = context.switchToHttp().getRequest().user as {
      roleCode?: string;
      permissions?: string[];
    };
    if (!utilisateur) {
      throw new ForbiddenException({ code: 'ACCES_REFUSE', message: 'Authentification requise.' });
    }
    if (utilisateur.roleCode === 'ADMIN') return true;

    const possedees = utilisateur.permissions ?? [];
    const okToutes = !requises?.length || requises.every((p) => possedees.includes(p));
    const okUne = !uneParmi?.length || uneParmi.some((p) => possedees.includes(p));
    if (!okToutes || !okUne) {
      throw new ForbiddenException({
        code: 'ACCES_REFUSE',
        message: 'Vous n\'avez pas le droit d\'effectuer cette action.',
      });
    }
    return true;
  }
}
