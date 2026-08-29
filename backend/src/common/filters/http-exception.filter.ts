import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Normalise toutes les erreurs API au format CDC :
 * { statutCode, code, message (français), horodatage }
 * Les piles d'exécution ne sont jamais exposées hors développement.
 */
@Catch()
export class FiltreExceptionsHttp implements ExceptionFilter {
  private readonly journal = new Logger(FiltreExceptionsHttp.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reponse = ctx.getResponse<Response>();
    const requete = ctx.getRequest<Request>();

    let statut = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur interne est survenue. L\'incident a été enregistré.';
    let code = 'ERREUR_INTERNE';

    if (exception instanceof HttpException) {
      statut = exception.getStatus();
      const corps = exception.getResponse();
      if (typeof corps === 'string') {
        message = corps;
      } else if (typeof corps === 'object' && corps) {
        const objet = corps as { message?: string | string[]; code?: string; error?: string };
        if (Array.isArray(objet.message)) {
          message = objet.message.join(' ; ');
        } else if (objet.message) {
          message = objet.message;
        }
        if (objet.code) code = objet.code;
      }
      if (statut === HttpStatus.UNAUTHORIZED) code = code === 'ERREUR_INTERNE' ? 'NON_AUTHENTIFIE' : code;
      if (statut === HttpStatus.FORBIDDEN) code = code === 'ERREUR_INTERNE' ? 'ACCES_REFUSE' : code;
      if (statut === HttpStatus.NOT_FOUND) code = code === 'ERREUR_INTERNE' ? 'INTROUVABLE' : code;
      if (statut === HttpStatus.BAD_REQUEST) code = code === 'ERREUR_INTERNE' ? 'DONNEES_INVALIDES' : code;
      if (statut === HttpStatus.CONFLICT) code = code === 'ERREUR_INTERNE' ? 'CONFLIT' : code;
    } else {
      this.journal.error(exception instanceof Error ? exception.stack : exception);
    }

    reponse.status(statut).json({
      statutCode: statut,
      code,
      message,
      chemin: requete.url,
      horodatage: new Date().toISOString(),
    });
  }
}
