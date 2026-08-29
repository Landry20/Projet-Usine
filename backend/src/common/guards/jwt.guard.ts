import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CLE_PUBLIC } from '../decorators/public.decorator';

/** Toutes les routes sont protégées par défaut, sauf celles marquées @Public(). */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const estPublic = this.reflector.getAllAndOverride<boolean>(CLE_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (estPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException({
        code: 'NON_AUTHENTIFIE',
        message: 'Session expirée ou jeton invalide. Veuillez vous reconnecter.',
      });
    }
    return user;
  }
}
