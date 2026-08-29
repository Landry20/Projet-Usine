import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';
import { JournalAudit } from '../../database/entities';
import { extraireIp } from '../utils/numero.util';

const METHODES_AUDIT = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * RG-18 : toute création / modification / suppression métier est journalisée
 * avec utilisateur, date, IP. Le journal n'a pas d'endpoint de modification.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly ds: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    if (!METHODES_AUDIT.has(req.method)) return next.handle();

    const utilisateurId = req.user?.id ?? null;
    const ip = extraireIp(req);
    const action = req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE';

    return next.handle().pipe(
      tap({
        next: (corps) => {
          const id = (corps as { id?: number; numero?: string })?.id ?? (corps as { numero?: string })?.numero;
          void this.ds.getRepository(JournalAudit).save({
            utilisateurId,
            action,
            tableConcernee: String(req.path || '').slice(0, 60),
            enregistrementId: id != null ? String(id) : null,
            valeursApres: this.sanitiser(corps),
            adresseIp: ip,
          });
        },
      }),
    );
  }

  private sanitiser(corps: unknown): unknown {
    if (!corps || typeof corps !== 'object') return null;
    const copie = { ...(corps as Record<string, unknown>) };
    delete copie.motDePasse;
    delete copie.mot_de_passe;
    delete copie.refreshToken;
    return copie;
  }
}
