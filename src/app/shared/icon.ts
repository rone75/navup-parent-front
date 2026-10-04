import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'play'
  | 'pause'
  | 'moins-15'
  | 'plus-15'
  | 'cadenas'
  | 'coche'
  | 'etoile'
  | 'chevron'
  | 'fleche-gauche'
  | 'maison'
  | 'liste'
  | 'personne'
  | 'sortie'
  | 'enveloppe'
  | 'casque'
  | 'feuille'
  | 'crayon'
  | 'externe'
  | 'alerte'
  | 'croix'
  | 'agrandir'
  | 'agenda';

/**
 * Icônes de l'appli : dessinées ici, d'un seul trait de 2 (le trait des feuilles), bouts ronds.
 * Décoratives par défaut (aria-hidden) : le libellé est toujours écrit à côté, ou porté par le bouton.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ico', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      @switch (nom()) {
        @case ('play') {
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        }
        @case ('pause') {
          <path d="M8 5v14M16 5v14" stroke-width="3.5" />
        }
        @case ('moins-15') {
          <path d="M4 12a8 8 0 1 0 2.6-5.9" />
          <path d="M4 3.5v4h4" />
          <text x="12.3" y="15.6" font-size="7.5" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="inherit">15</text>
        }
        @case ('plus-15') {
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20 3.5v4h-4" />
          <text x="11.7" y="15.6" font-size="7.5" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="inherit">15</text>
        }
        @case ('cadenas') {
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        }
        @case ('coche') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('etoile') {
          <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" fill="currentColor" />
        }
        @case ('chevron') {
          <path d="m9 6 6 6-6 6" />
        }
        @case ('fleche-gauche') {
          <path d="M19 12H5M11 6l-6 6 6 6" />
        }
        @case ('maison') {
          <path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
        }
        @case ('liste') {
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="3" />
        }
        @case ('personne') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        }
        @case ('sortie') {
          <path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H10" />
        }
        @case ('enveloppe') {
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m4 7.5 8 6 8-6" />
        }
        @case ('casque') {
          <path d="M4 15v-2a8 8 0 0 1 16 0v2" />
          <rect x="3" y="14" width="4.5" height="6.5" rx="1.5" />
          <rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5" />
        }
        @case ('feuille') {
          <path d="M7 3.5h7l4 4V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
          <path d="M9.5 12h5M9.5 16h5" />
        }
        @case ('crayon') {
          <path d="m5 19 1-4L16.5 4.5l3 3L9 18z" />
        }
        @case ('externe') {
          <path d="M14 5h5v5M19 5l-8 8M11 6H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-5" />
        }
        @case ('alerte') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5h.01" />
        }
        @case ('croix') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('agrandir') {
          <path d="m6 15 6-6 6 6" />
        }
        @case ('agenda') {
          <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
          <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly nom = input.required<IconName>();
}
