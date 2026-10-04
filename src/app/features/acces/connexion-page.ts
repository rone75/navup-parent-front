import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';
import { PorteHaut } from '../../shared/porte-haut';

/** Connexion à l'espace personnel : e-mail et mot de passe. Pas d'inscription ici : le compte naît du paiement. */
@Component({
  selector: 'app-connexion-page',
  imports: [FormsModule, RouterLink, PorteHaut, Icon],
  template: `
    <div class="frigo">
      <app-porte-haut><a routerLink="/">Découvrir le programme</a></app-porte-haut>
      <main class="porte porte-grande seule">
        <section class="feuille aimantee" aria-labelledby="titre-connexion">
          <span class="aimant" aria-hidden="true"></span>
          <h1 id="titre-connexion">Votre espace NavUp</h1>
          <form (ngSubmit)="connecter()" novalidate>
            <label class="champ">
              <span>E-mail</span>
              <input type="email" name="email" [(ngModel)]="email" autocomplete="username" inputmode="email" required />
            </label>
            <label class="champ">
              <span>Mot de passe</span>
              <input type="password" name="pass" [(ngModel)]="motDePasse" autocomplete="current-password" required />
            </label>
            @if (refus(); as r) {
              <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
            }
            <button class="btn btn-bloc" type="submit" [disabled]="occupe()">Me connecter</button>
          </form>
          <p class="actions">
            <a class="lien" routerLink="/mot-de-passe-oublie">Mot de passe oublié, ou première connexion ?</a>
          </p>
        </section>
      </main>
    </div>
  `,
})
export class ConnexionPage {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Page de l'espace demandée avant la connexion (paramètre d'adresse). */
  readonly retour = input<string>();

  email = '';
  motDePasse = '';
  readonly refus = signal('');
  readonly occupe = signal(false);

  async connecter(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (this.email.trim() === '' || this.motDePasse === '') {
      this.refus.set('Saisissez votre e-mail et votre mot de passe.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      await this.session.connexion(this.email.trim(), this.motDePasse);
      const retour = this.retour();
      // Le retour ne mène que dans l'espace : jamais vers une adresse venue d'ailleurs
      await this.router.navigateByUrl(retour && retour.startsWith('/espace/') ? retour : '/espace');
    } catch (err) {
      this.refus.set(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }
}
