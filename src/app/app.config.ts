import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { sessionInterceptor } from './core/session.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Les liens de la page publique (« Le programme », « Rejoindre ») mènent à une ancre ; une page de l'espace s'ouvre en haut
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([sessionInterceptor])),
    // Les pages publiques arrivent déjà écrites (prérendu) : l'appli les reprend sans les redessiner
    // Sans relecture des événements (withEventReplay) : elle écrit des scripts en ligne dans les pages prérendues,
    // que la politique de contenu (script-src 'self', public/.htaccess) refuse. L'hydratation prend quelques millisecondes.
    provideClientHydration(),
    // Aucune session relue au démarrage : la page publique n'attend rien. La garde de l'espace s'en charge.
    { provide: LOCALE_ID, useValue: 'fr' },
  ],
};
