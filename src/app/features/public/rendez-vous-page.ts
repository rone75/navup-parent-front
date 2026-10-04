import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationSkipped, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { apiErrorMessage, suiteRefus } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { telechargerInvitation } from '../../core/fichier';
import { Creneau, VueRdvLien } from '../../core/models';
import { GesteLien, PublicApiService } from '../../core/public-api.service';
import { Icon } from '../../shared/icon';
import { PorteHaut } from '../../shared/porte-haut';
import { RdvDetail } from '../../shared/rdv-detail';

/**
 * Gestion d'un rendez-vous par le lien reçu par e-mail : le voir, le déplacer, l'annuler, l'ajouter à son agenda.
 * Le jeton du lien tient lieu d'identité. Il arrive dans le fragment de l'adresse (#…), que le navigateur n'envoie à
 * aucun serveur : il est lu, retiré aussitôt de la barre d'adresse, gardé le temps de la page (jamais dans le
 * stockage), et envoyé à l'API dans le corps des demandes.
 * L'état du rendez-vous et ce qui est encore permis viennent de l'API ; le lien suit un rendez-vous déplacé.
 *
 * Un autre lien ouvert dans le même onglet ne recharge pas la page : seul le fragment change, et le routeur le remet
 * dans l'adresse en fin de navigation. Le jeton est donc relu, et retiré, à chaque fin de navigation du routeur.
 */
@Component({
  selector: 'app-rendez-vous-page',
  imports: [RouterLink, PorteHaut, Icon, RdvDetail],
  template: `
    <div class="frigo">
      <app-porte-haut>
        <a class="facultatif" routerLink="/">Le programme</a>
        <a routerLink="/connexion">Se connecter</a>
      </app-porte-haut>
      <main class="porte porte-grande seule">
        <section class="feuille aimantee" [attr.data-page]="etat()" [attr.aria-busy]="etat() === 'lecture'">
          <span class="aimant" [class.bleu]="!tient()" aria-hidden="true"></span>
          @switch (etat()) {
            @case ('lecture') {
              <h1>Un instant…</h1>
              <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
            }
            @case ('invalide') {
              <h1>Ce lien n'est plus valable</h1>
              <p>
                Si vous avez reçu un e-mail plus récent de NavUp, utilisez le lien qu'il contient. Sinon, écrivez-nous&nbsp;:
                <a [href]="'mailto:' + contact">{{ contact }}</a>.
              </p>
              <p class="actions"><a class="btn btn-feuille" routerLink="/">Revenir au programme</a></p>
            }
            @case ('erreur') {
              <h1>Votre rendez-vous</h1>
              <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ refus() }}</span></p>
              <button class="btn btn-feuille" type="button" (click)="lire()">Réessayer</button>
            }
            @case ('vue') {
              @if (vue(); as v) {
                <h1>Votre rendez-vous</h1>
                <app-rdv-detail
                  [rdv]="v.rdv"
                  [prise]="v.prise"
                  [delai]="v.delai_heures"
                  [annee]="true"
                  [occupe]="occupe()"
                  [refus]="refus()"
                  [message]="message()"
                  (deplace)="deplacer($event)"
                  (annule)="annuler()"
                  (agenda)="agenda()"
                >
                  @if (v.rdv.etat === 'annule') {
                    @if (message() === '') {
                      <p>Ce rendez-vous a été annulé.</p>
                    }
                    @switch (v.rdv.type) {
                      @case ('decouverte') {
                        <p class="actions"><a class="btn btn-feuille" routerLink="/" fragment="rendez-vous">Prendre un autre rendez-vous</a></p>
                      }
                      @case ('suivi') {
                        <p class="actions"><a class="btn btn-feuille" routerLink="/espace/rendez-vous">Prendre un autre rendez-vous</a></p>
                      }
                      @default {
                        <p class="petit secondaire">Pour en convenir d'un autre, écrivez-nous&nbsp;: <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
                      }
                    }
                  } @else if (v.rdv.etat === 'passe') {
                    <p>Ce rendez-vous est passé.</p>
                  }
                </app-rdv-detail>
              }
            }
          }
        </section>
      </main>
    </div>
  `,
})
export class RendezVousPage {
  private readonly api = inject(PublicApiService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  // Le jeton du lien : en mémoire de la page seulement
  private jeton = '';

  readonly contact = CONTACT;
  readonly etat = signal<'lecture' | 'invalide' | 'erreur' | 'vue'>('lecture');
  readonly vue = signal<VueRdvLien | null>(null);
  readonly refus = signal('');
  readonly message = signal('');
  readonly occupe = signal(false);

  /** L'aimant est orange tant que le rendez-vous tient (état donné par l'API), bleu sinon. */
  readonly tient = computed(() => {
    const etat = this.etat();
    const rdv = this.vue()?.rdv.etat;
    return etat === 'lecture' || (etat === 'vue' && (rdv === 'confirme' || rdv === 'a_confirmer'));
  });

  constructor() {
    if (!this.navigateur) {
      return;
    }
    this.ouvrir(true);
    // Le fragment a changé sans rechargement (autre lien, ou le même, ouvert dans cet onglet) : même lecture
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd || e instanceof NavigationSkipped),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.ouvrir());
  }

  /** Lit le jeton dans le fragment, le retire de l'adresse, puis demande le rendez-vous. */
  private ouvrir(arrivee = false): void {
    const fragment = location.hash.replace(/^#/, '');
    if (fragment === '' && !arrivee) {
      return;
    }
    // Le jeton ne reste ni dans la barre d'adresse ni dans l'historique
    history.replaceState(null, '', location.pathname);
    this.vue.set(null);
    this.message.set('');
    this.refus.set('');
    if (!/^[a-f0-9]{48}$/.test(fragment)) {
      this.jeton = '';
      this.etat.set('invalide');
      return;
    }
    this.jeton = fragment;
    void this.lire();
  }

  async lire(): Promise<void> {
    this.etat.set('lecture');
    this.refus.set('');
    try {
      this.vue.set(await firstValueFrom(this.api.rdvDuLien(this.jeton)));
      this.etat.set('vue');
    } catch (err) {
      this.refuser(err, 'erreur');
    }
  }

  deplacer(creneau: Creneau): Promise<void> {
    return this.geste({ geste: 'deplacer', date: creneau.date, heure: creneau.heure }, 'Votre rendez-vous est déplacé. Un e-mail vous le confirme.');
  }

  annuler(): Promise<void> {
    return this.geste({ geste: 'annuler' }, 'Votre rendez-vous est annulé. Un e-mail vous le confirme.');
  }

  /** Télécharge l'invitation de calendrier (.ics) que l'API vient de rendre. */
  async agenda(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      telechargerInvitation(await firstValueFrom(this.api.invitationDuLien(this.jeton)));
    } catch (err) {
      this.refuser(err, 'vue');
    } finally {
      this.occupe.set(false);
    }
  }

  private async geste(geste: GesteLien, fait: string): Promise<void> {
    if (this.occupe()) {
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    this.message.set('');
    try {
      this.vue.set(await firstValueFrom(this.api.gesteDuLien(this.jeton, geste)));
      this.message.set(fait);
    } catch (err) {
      // Créneau pris entre-temps, ou délai dépassé : le refus rend le rendez-vous et ses créneaux à jour
      const suite = suiteRefus<VueRdvLien>(err);
      const avant = this.vue();
      if (suite.rdv && avant !== null) {
        this.vue.set({ rdv: suite.rdv, prise: suite.prise ?? null, delai_heures: suite.delai_heures ?? avant.delai_heures });
      }
      this.refuser(err, 'vue');
    } finally {
      this.occupe.set(false);
    }
  }

  /** Un lien que l'API ne connaît plus (404) vaut « invalide » ; tout autre refus s'écrit dans la page. */
  private refuser(err: unknown, sinon: 'erreur' | 'vue'): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.jeton = '';
      this.etat.set('invalide');
      return;
    }
    this.refus.set(apiErrorMessage(err));
    this.etat.set(sinon);
  }
}
