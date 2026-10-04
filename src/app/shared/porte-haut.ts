import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * La porte du haut : le logo NavUp, et à droite ce que la page y place (liens, bouton).
 * Commune aux pages publiques et aux pages d'accès ; l'espace personnel a sa propre navigation.
 * Elle reste en haut de l'écran pendant le défilement : l'hôte est une bande de la couleur de la porte, sous
 * laquelle la page passe ; la porte elle-même est dessinée dedans.
 */
@Component({
  selector: 'app-porte-haut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'haut', role: 'banner' },
  template: `
    <div class="porte porte-haut">
      <a class="logo" routerLink="/" aria-label="NavUp, retour à l'accueil">
        <img src="images/logo-navup.webp" alt="NavUp" width="640" height="318" />
      </a>
      <nav aria-label="Navigation">
        <ng-content />
      </nav>
    </div>
  `,
})
export class PorteHaut {}
