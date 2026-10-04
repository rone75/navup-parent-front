import { Component, inject, signal } from '@angular/core';
import { apiErrorMessage } from '../../core/api-error';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

/** Les mots de bienvenue de la première visite (cahier de l'écosystème §7.2). Lus une fois, ils ne reviennent plus. */
@Component({
  selector: 'app-bienvenue',
  imports: [Icon],
  template: `
    <section class="feuille aimantee bienvenue" aria-labelledby="titre-bienvenue">
      <span class="aimant" aria-hidden="true"></span>
      <h1 id="titre-bienvenue">Bienvenue dans NavUp{{ prenom() ? ', ' + prenom() : '' }}.</h1>
      <ul class="lignes coches">
        <li><app-icon nom="coche" /> <span>Votre programme dure 12 semaines.</span></li>
        <li><app-icon nom="coche" /> <span>Les contenus se débloquent progressivement.</span></li>
        <li><app-icon nom="coche" /> <span>Vous pouvez revenir sur les contenus déjà disponibles.</span></li>
      </ul>
      <p class="actions">
        <button class="btn btn-grand" type="button" (click)="commencer()" [disabled]="occupe()">Commencer mon parcours</button>
      </p>
    </section>
  `,
})
export class Bienvenue {
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  readonly prenom = () => this.session.moi()?.prenom ?? null;
  readonly occupe = signal(false);

  async commencer(): Promise<void> {
    this.occupe.set(true);
    try {
      await this.session.preferences({ accueil_lu: true });
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }
}
