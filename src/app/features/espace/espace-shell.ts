import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { LecteurService } from '../../core/lecteur.service';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';
import { Poste } from '../../shared/poste';
import { Toasts } from '../../shared/toasts';
import { Bienvenue } from './bienvenue';
import { EtatAcces } from './etat-acces';

/**
 * Coque de l'espace personnel : la porte, sa poignée (la navigation : rail à gauche sur un écran large, barre basse
 * sur un téléphone) et le poste, qui joue d'une page à l'autre.
 * Elle décide de ce qui se montre : les mots de bienvenue à la première visite, l'état de l'accès quand il n'est pas
 * ouvert (le profil reste lisible), sinon la page demandée.
 */
@Component({
  selector: 'app-espace-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Poste, Toasts, Bienvenue, EtatAcces],
  template: `
    <div class="frigo" [class.sur-sujet]="surSujet()">
      <div class="porte espace">
        <aside class="rail">
          <a class="logo" routerLink="/espace" aria-label="NavUp, accueil de votre espace">
            <img src="images/pochette-jaune.webp" alt="" width="512" height="512" />
          </a>
          <nav aria-label="Votre espace">
            <a routerLink="/espace" routerLinkActive="ici" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">
              <app-icon nom="maison" /> Accueil
            </a>
            <a routerLink="/espace/programme" routerLinkActive="ici" ariaCurrentWhenActive="page" [class.ici]="surSujet()">
              <app-icon nom="liste" /> Programme
            </a>
            <a routerLink="/espace/profil" routerLinkActive="ici" ariaCurrentWhenActive="page"> <app-icon nom="personne" /> Profil </a>
          </nav>
        </aside>

        <main class="espace-page">
          @if (moi(); as m) {
            @if (!m.accueil_lu) {
              <app-bienvenue />
            } @else if (m.acces.etat !== 'ouvert' && !surProfil()) {
              <app-etat-acces [acces]="m.acces" />
            } @else {
              <router-outlet />
            }
          }
        </main>
      </div>
      <app-poste mode="barre" />
      <app-toasts />
    </div>
  `,
})
export class EspaceShell {
  private readonly session = inject(SessionService);
  private readonly lecteur = inject(LecteurService);
  private readonly router = inject(Router);

  readonly moi = this.session.moi;

  private readonly adresse = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  /** Sur la page d'un sujet, un écran large montre le poste à côté de la fiche : la barre s'efface. */
  readonly surSujet = computed(() => this.adresse().startsWith('/espace/sujets/'));
  readonly surProfil = computed(() => this.adresse().startsWith('/espace/profil'));

  constructor() {
    // L'accès se ferme, ou la session se termine : le poste se tait
    effect(() => {
      const m = this.moi();
      if (m === null || m.acces.etat !== 'ouvert') {
        this.lecteur.arreter();
      }
    });
  }
}
