import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';
import { PorteHaut } from '../../shared/porte-haut';

/** Longueur minimale d'un mot de passe : la même que navup-parent-api, qui fait foi ($_MDP_LONGUEUR_MIN). */
const LONGUEUR_MIN = 10;

/**
 * Choix du mot de passe par le lien reçu par e-mail (invitation, ou mot de passe oublié).
 * Le jeton arrive dans le fragment de l'adresse (#…), que le navigateur n'envoie à aucun serveur : il est lu,
 * retiré aussitôt de la barre d'adresse, gardé le temps de la page, et envoyé à l'API dans le corps des demandes.
 */
@Component({
  selector: 'app-mot-de-passe-page',
  imports: [FormsModule, RouterLink, PorteHaut, Icon],
  template: `
    <div class="frigo">
      <app-porte-haut><a routerLink="/connexion">Se connecter</a></app-porte-haut>
      <main class="porte porte-grande seule">
        <section class="feuille aimantee" aria-live="polite">
          <span class="aimant" aria-hidden="true"></span>
          @switch (etat()) {
            @case ('lecture') {
              <h1>Un instant…</h1>
              <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
            }
            @case ('invalide') {
              <h1>Ce lien n'est plus valable</h1>
              <p>Un lien ne sert qu'une fois, et pour un temps limité. Demandez-en un nouveau : il arrive par e-mail en quelques instants.</p>
              <p class="actions"><a class="btn" routerLink="/mot-de-passe-oublie">Recevoir un nouveau lien</a></p>
            }
            @case ('saisie') {
              <h1>{{ motif() === 'creation' ? 'Bienvenue' : 'Nouveau mot de passe' }}{{ prenom() ? ', ' + prenom() : '' }}</h1>
              <p>
                {{ motif() === 'creation' ? 'Choisissez le mot de passe de votre espace NavUp.' : 'Choisissez votre nouveau mot de passe.' }}
                Vous vous connecterez ensuite avec votre e-mail.
              </p>
              <form (ngSubmit)="valider()" novalidate>
                <label class="champ">
                  <span>Mot de passe</span>
                  <input [type]="visible ? 'text' : 'password'" name="pass" [(ngModel)]="motDePasse" autocomplete="new-password" required aria-describedby="regle-mdp" />
                  <small id="regle-mdp">{{ longueur }} caractères au moins. Une phrase courte convient très bien.</small>
                </label>
                <label class="case">
                  <input type="checkbox" name="visible" [(ngModel)]="visible" />
                  <span>Afficher le mot de passe</span>
                </label>
                @if (refus(); as r) {
                  <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
                }
                <button class="btn btn-bloc" type="submit" [disabled]="occupe()">Enregistrer et entrer</button>
              </form>
            }
          }
        </section>
      </main>
    </div>
  `,
})
export class MotDePassePage implements OnInit {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private jeton = '';

  readonly etat = signal<'lecture' | 'invalide' | 'saisie'>('lecture');
  readonly prenom = signal<string | null>(null);
  readonly motif = signal<'creation' | 'reinitialisation'>('creation');
  readonly refus = signal('');
  readonly occupe = signal(false);
  readonly longueur = LONGUEUR_MIN;

  motDePasse = '';
  visible = false;

  async ngOnInit(): Promise<void> {
    if (!this.navigateur) {
      return;
    }
    this.jeton = location.hash.replace(/^#/, '');
    // Le jeton ne reste ni dans la barre d'adresse ni dans l'historique
    history.replaceState(null, '', location.pathname);
    if (!/^[A-Za-z0-9]{40}$/.test(this.jeton)) {
      this.etat.set('invalide');
      return;
    }
    try {
      const lien = await this.session.verifierLien(this.jeton);
      this.prenom.set(lien.prenom);
      this.motif.set(lien.motif);
      this.etat.set('saisie');
    } catch {
      this.etat.set('invalide');
    }
  }

  async valider(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (this.motDePasse.length < LONGUEUR_MIN) {
      this.refus.set(`Choisissez un mot de passe d'au moins ${LONGUEUR_MIN} caractères.`);
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      await this.session.choisirMotDePasse(this.jeton, this.motDePasse);
      this.jeton = '';
      await this.router.navigateByUrl('/espace');
    } catch (err) {
      this.refus.set(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }
}
