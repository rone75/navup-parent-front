import { RenderMode, ServerRoute } from '@angular/ssr';

// Pages publiques : écrites en HTML au build (référencement, aperçu d'un lien partagé), puis reprises par l'appli.
// Tout le reste (accès, espace personnel, retour de paiement, gestion d'un rendez-vous par son lien) dépend du
// parent connecté ou de l'adresse : rendu dans le navigateur seulement. La page /rendez-vous lit un jeton dans le
// fragment de l'adresse, que le build ne voit jamais : elle n'est pas prérendue.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'cgv', renderMode: RenderMode.Prerender },
  { path: 'confidentialite', renderMode: RenderMode.Prerender },
  { path: 'mentions-legales', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
