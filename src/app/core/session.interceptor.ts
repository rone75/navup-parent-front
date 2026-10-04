import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { apiErrorCode } from './api-error';
import { API_ESPACE } from './config';
import { SessionService } from './session.service';

/**
 * Ajoute le jeton aux appels de l'espace personnel. Quand l'API ne le reconnaît plus (401, code 301 : session
 * terminée ou accès réinitialisé), la session est oubliée et le parent revient à la connexion.
 * Un mauvais mot de passe (401, code 2) n'est pas une session terminée : il reste à la page qui l'a envoyé.
 * Les endpoints publics de la Tour de contrôle ne reçoivent jamais le jeton.
 */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_ESPACE)) {
    return next(req);
  }

  const session = inject(SessionService);
  const router = inject(Router);

  const jeton = session.jeton();
  const requete = jeton ? req.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }) : req;

  return next(requete).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && apiErrorCode(err) === 301) {
        const etaitConnecte = session.connecte();
        session.vider();
        if (etaitConnecte) {
          void router.navigateByUrl('/connexion');
        }
      }
      return throwError(() => err);
    }),
  );
};
