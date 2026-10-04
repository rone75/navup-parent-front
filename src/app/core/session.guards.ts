import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/**
 * Espace personnel : attend que l'API ait reconnu le jeton gardé, sinon renvoie à la connexion (avec le retour).
 * La landing page n'attend rien : la session ne se relit qu'ici.
 */
export const espaceGuard: CanActivateFn = async (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);
  await session.charger();
  if (session.connecte()) {
    return true;
  }
  const retour = state.url.startsWith('/espace/') ? state.url : null;
  return router.createUrlTree(['/connexion'], retour ? { queryParams: { retour } } : {});
};

/** Connexion : un parent déjà connecté va droit à son espace. */
export const visiteurGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  await session.charger();
  return session.connecte() ? router.createUrlTree(['/espace']) : true;
};
