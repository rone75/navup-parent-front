import { HttpErrorResponse } from '@angular/common/http';
import { Acces } from './models';

interface ApiErrorBody {
  success?: boolean;
  message?: string;
  code?: number;
  acces?: Acces;
  date_deblocage?: string;
}

function corps(err: unknown): ApiErrorBody | null {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object') {
    return err.error as ApiErrorBody;
  }
  return null;
}

/** Phrase à montrer au parent pour une erreur de l'API ({success:false, message, code}). */
export function apiErrorMessage(err: unknown): string {
  const body = corps(err);
  if (body && typeof body.message === 'string' && body.message) {
    return body.message;
  }
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'La connexion ne passe pas. Vérifiez votre réseau, puis réessayez.';
    }
    if (err.status >= 500) {
      return 'Un souci de notre côté. Réessayez dans un instant.';
    }
    return 'Cela n’a pas fonctionné. Réessayez dans un instant.';
  }
  return 'Cela n’a pas fonctionné. Réessayez dans un instant.';
}

/** Code applicatif de l'erreur (1 validation, 2 identifiants, 3 accès fermé, 301 session terminée). */
export function apiErrorCode(err: unknown): number | null {
  const body = corps(err);
  return body && typeof body.code === 'number' ? body.code : null;
}

/** État de l'accès joint à un refus 403 des contenus (suspendu, pas commencé, fermé), ou null. */
export function accesRefuse(err: unknown): Acces | null {
  const body = corps(err);
  return err instanceof HttpErrorResponse && err.status === 403 && body?.acces ? body.acces : null;
}

/** Date de déblocage jointe au refus d'un sujet pas encore disponible, ou null. */
export function dateDeblocage(err: unknown): string | null {
  return corps(err)?.date_deblocage ?? null;
}
