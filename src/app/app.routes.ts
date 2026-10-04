import { Routes } from '@angular/router';
import { espaceGuard, visiteurGuard } from './core/session.guards';

export const routes: Routes = [
  // Pages publiques, écrites en HTML au build (voir app.routes.server.ts)
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/public/landing-page').then((m) => m.LandingPage) },
  {
    path: 'cgv',
    title: 'Conditions générales de vente · NavUp',
    data: { page: 'cgv' },
    loadComponent: () => import('./features/public/legal-page').then((m) => m.LegalPage),
  },
  {
    path: 'confidentialite',
    title: 'Politique de confidentialité · NavUp',
    data: { page: 'confidentialite' },
    loadComponent: () => import('./features/public/legal-page').then((m) => m.LegalPage),
  },
  {
    path: 'mentions-legales',
    title: 'Mentions légales · NavUp',
    data: { page: 'mentions-legales' },
    loadComponent: () => import('./features/public/legal-page').then((m) => m.LegalPage),
  },

  // Retour de la page de paiement, gestion d'un rendez-vous par son lien, accès : rendus dans le navigateur
  { path: 'paiement', title: 'Votre paiement · NavUp', loadComponent: () => import('./features/public/paiement-page').then((m) => m.PaiementPage) },
  { path: 'rendez-vous', title: 'Votre rendez-vous · NavUp', loadComponent: () => import('./features/public/rendez-vous-page').then((m) => m.RendezVousPage) },
  {
    path: 'connexion',
    title: 'Connexion · NavUp',
    canActivate: [visiteurGuard],
    loadComponent: () => import('./features/acces/connexion-page').then((m) => m.ConnexionPage),
  },
  { path: 'mot-de-passe', title: 'Votre mot de passe · NavUp', loadComponent: () => import('./features/acces/mot-de-passe-page').then((m) => m.MotDePassePage) },
  { path: 'mot-de-passe-oublie', title: 'Recevoir un lien · NavUp', loadComponent: () => import('./features/acces/oubli-page').then((m) => m.OubliPage) },

  // Espace personnel
  {
    path: 'espace',
    canActivate: [espaceGuard],
    loadComponent: () => import('./features/espace/espace-shell').then((m) => m.EspaceShell),
    children: [
      { path: '', pathMatch: 'full', title: 'Votre espace · NavUp', loadComponent: () => import('./features/espace/accueil-page').then((m) => m.AccueilPage) },
      { path: 'programme', title: 'Votre programme · NavUp', loadComponent: () => import('./features/espace/programme-page').then((m) => m.ProgrammePage) },
      { path: 'sujets/:id', title: 'Sujet · NavUp', loadComponent: () => import('./features/espace/sujet-page').then((m) => m.SujetPage) },
      {
        path: 'rendez-vous',
        title: 'Rendez-vous · NavUp',
        loadComponent: () => import('./features/espace/rendez-vous-page').then((m) => m.RendezVousEspacePage),
      },
      { path: 'profil', title: 'Profil · NavUp', loadComponent: () => import('./features/espace/profil-page').then((m) => m.ProfilPage) },
    ],
  },

  { path: '**', redirectTo: '' },
];
