import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injecte l'utilisateur authentifié (posé par JwtGuard) dans le contrôleur. */
export const UtilisateurCourant = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const requete = ctx.switchToHttp().getRequest();
  return requete.user;
});
