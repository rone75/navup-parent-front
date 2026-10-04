import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { PublicApiService } from '../../core/public-api.service';
import { Icon } from '../../shared/icon';
import { PorteHaut } from '../../shared/porte-haut';

/**
 * Demande d'un lien d'accès par e-mail : mot de passe oublié, ou première connexion d'un parent déjà inscrit.
 * La réponse est la même que l'adresse ait un compte ou non : la page ne dit jamais qui est inscrit.
 */
@Component({
  selector: 'app-oubli-page',
  imports: [FormsModule, RouterLink, PorteHaut, Icon],
  template: `
    <div class="frigo">
      <app-porte-haut><a routerLink="/connexion">Se connecter</a></app-porte-haut>
      <main class="porte porte-grande seule">
        <section class="feuille aimantee" aria-live="polite">
          <span class="aimant" aria-hidden="true"></span>
          @if (envoye()) {
            <h1>Regardez votre boîte</h1>
            <p>
              Si cette adresse est celle d'un parent inscrit, un e-mail vient de partir. Il contient le lien pour choisir votre mot de passe ; il ne sert qu'une fois.
            </p>
            <p class="secondaire">Rien reçu après quelques minutes ? Regardez les courriers indésirables, ou écrivez-nous : <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
            <p class="actions"><a class="btn btn-feuille" routerLink="/connexion">Revenir à la connexion</a></p>
          } @else {
            <h1>Recevoir un lien par e-mail</h1>
            <p>Pour un mot de passe oublié, ou pour entrer la première fois : indiquez l'e-mail de votre inscription.</p>
            <form (ngSubmit)="demander()" novalidate>
              <label class="champ">
                <span>E-mail</span>
                <input type="email" name="email" [(ngModel)]="email" autocomplete="email" inputmode="email" required />
              </label>
              @if (refus(); as r) {
                <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
              }
              <button class="btn btn-bloc" type="submit" [disabled]="occupe()">Recevoir mon lien</button>
            </form>
          }
        </section>
      </main>
    </div>
  `,
})
export class OubliPage {
  private readonly api = inject(PublicApiService);

  readonly contact = CONTACT;
  readonly envoye = signal(false);
  readonly refus = signal('');
  readonly occupe = signal(false);
  email = '';

  async demander(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.refus.set('Saisissez votre adresse e-mail.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      await firstValueFrom(this.api.demanderLien(this.email.trim()));
      this.envoye.set(true);
    } catch (err) {
      this.refus.set(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }
}
