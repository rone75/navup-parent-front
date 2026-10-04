import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Injector, PLATFORM_ID, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage, motifRefus, suiteRefus } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { canalRdv, canauxEcrits, capitale, minutesEcrites, momentEcrit } from '../../core/format';
import { CanalRdv, Creneau, Prise } from '../../core/models';
import { PublicApiService } from '../../core/public-api.service';
import { Icon } from '../../shared/icon';
import { PriseRdv } from '../../shared/prise-rdv';

/**
 * La prise d'un rendez-vous découverte, dans la feuille « Prenons le temps d'échanger… » de la page publique :
 * un créneau, puis quelques mots sur soi, puis l'annonce de l'e-mail qui confirme.
 * - La page est écrite au build : les créneaux se lisent dans le navigateur, une fois la page affichée, comme le prix.
 * - Tant qu'ils ne sont pas lus, si rien n'est proposé ou si l'appel échoue, la feuille garde son lien vers l'adresse
 *   de contact : rien ne casse.
 * - La réponse de l'API est la même que l'adresse soit connue ou non : l'écran final dit qu'un e-mail vient de partir
 *   et rappelle le créneau choisi, rien de plus.
 */
@Component({
  selector: 'app-rdv-decouverte',
  imports: [FormsModule, RouterLink, Icon, PriseRdv],
  host: { class: 'rdv-prise', '[attr.data-etape]': 'etape()' },
  template: `
    @switch (etape()) {
      @case ('saisie') {
        <h3 id="titre-prise">Prenez rendez-vous !</h3>
        <p>{{ modalites() }} Choisissez un jour, puis une heure.</p>
        @if (refusCreneau(); as r) {
          <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
        }
        <app-prise-rdv [prise]="prise()" [creneau]="creneau()" (choisi)="choisir($event)" />

        @if (creneau(); as c) {
          <form class="rdv-saisie" (ngSubmit)="reserver()" novalidate aria-labelledby="titre-prise">
            <div class="champs-2">
              <label class="champ">
                <span>Prénom</span>
                <input type="text" name="prenom" [(ngModel)]="prenom" autocomplete="given-name" maxlength="100" required />
              </label>
              <label class="champ">
                <span>Nom</span>
                <input type="text" name="nom" [(ngModel)]="nom" autocomplete="family-name" maxlength="100" required />
              </label>
            </div>
            <label class="champ">
              <span>E-mail</span>
              <input type="email" name="email" [(ngModel)]="email" autocomplete="email" inputmode="email" maxlength="255" required aria-describedby="aide-email-rdv" />
              <small id="aide-email-rdv">C'est à cette adresse que part l'e-mail de confirmation.</small>
            </label>

            @if (canaux().length > 1) {
              <fieldset>
                <legend>Comment préférez-vous échanger ?</legend>
                @for (k of canaux(); track k) {
                  <label class="case">
                    <input type="radio" name="canal" [value]="k" [(ngModel)]="canal" />
                    <span>{{ dire(k) }}</span>
                  </label>
                }
              </fieldset>
            }
            @if (canal === 'telephone') {
              <label class="champ">
                <span>Téléphone</span>
                <input type="tel" name="telephone" [(ngModel)]="telephone" autocomplete="tel" inputmode="tel" maxlength="30" required aria-describedby="aide-tel-rdv" />
                <small id="aide-tel-rdv">Le numéro où vous joindre à l'heure du rendez-vous.</small>
              </label>
            }
            <label class="champ">
              <span>Ce que vous aimeriez aborder <span class="secondaire">(facultatif)</span></span>
              <textarea name="note" [(ngModel)]="note" rows="3" maxlength="500" aria-describedby="aide-note-rdv"></textarea>
              <small id="aide-note-rdv">500 caractères au plus.</small>
            </label>

            <!-- Champ leurre : un parent ne le voit pas, un robot le remplit et rien n'est enregistré -->
            <div class="leurre" aria-hidden="true">
              <label>Site <input type="text" name="site" [(ngModel)]="site" tabindex="-1" autocomplete="off" /></label>
            </div>

            <label class="case">
              <input type="checkbox" name="confidentialite" [(ngModel)]="confidentialite" />
              <span>J'ai lu la <a routerLink="/confidentialite" target="_blank">politique de confidentialité</a>.</span>
            </label>

            @if (refus(); as r) {
              <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
            }
            <p class="rdv-rappel">
              <app-icon nom="agenda" />
              <span><strong>{{ quand(c) }}</strong>, {{ ecrire(canal) }}. <span class="secondaire">Heure de Paris.</span></span>
            </p>
            <button class="btn btn-grand btn-bloc" type="submit" [disabled]="occupe()">Réserver ce rendez-vous</button>
          </form>
        }
      }
      @case ('envoye') {
        <div class="rdv-envoye" role="status">
          <h3 #confirmation tabindex="-1">Un e-mail vient de partir</h3>
          <p>À <strong class="adresse">{{ envoye()?.email }}</strong>. C'est lui qui confirme votre rendez-vous ; il contient le lien pour le déplacer ou l'annuler.</p>
          <p class="rdv-rappel">
            <app-icon nom="agenda" />
            <span>Créneau choisi : <strong>{{ envoye()?.quand }}</strong>, {{ envoye()?.canal }}. <span class="secondaire">Heure de Paris.</span></span>
          </p>
          <p class="petit secondaire">Rien reçu ? Écrivez-nous : <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
        </div>
      }
      @default {
        <!-- Aucun créneau lu (page écrite au build, lecture en cours), rien de proposé, ou l'appel a échoué : l'adresse de contact -->
        @if (refusCreneau(); as r) {
          <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
        }
        <p class="actions">
          <a class="btn" [href]="'mailto:' + contact + '?subject=Rendez-vous%20découverte'"><app-icon nom="enveloppe" /> Prenez rendez-vous !</a>
        </p>
        <p class="petit">Écrivez-nous vos disponibilités : nous vous répondons avec un créneau.</p>
      }
    }
  `,
})
export class RdvDecouverte {
  private readonly api = inject(PublicApiService);
  private readonly injector = inject(Injector);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly confirmation = viewChild<ElementRef<HTMLElement>>('confirmation');

  readonly contact = CONTACT;

  /** Les créneaux lus dans l'API ; null tant qu'ils ne le sont pas, ou si la lecture a échoué. */
  readonly prise = signal<Prise | null>(null);
  readonly creneau = signal<Creneau | null>(null);
  /** Ce que rappelle l'écran final : gardé le temps de la page, nulle part ailleurs. */
  readonly envoye = signal<{ email: string; quand: string; canal: string } | null>(null);
  readonly refus = signal('');
  /** Le créneau choisi vient d'être pris par quelqu'un d'autre : dit au-dessus des créneaux remis à jour. */
  readonly refusCreneau = signal('');
  readonly occupe = signal(false);

  readonly etape = computed<'contact' | 'saisie' | 'envoye'>(() => {
    if (this.envoye() !== null) {
      return 'envoye';
    }
    return this.prise()?.ouvert ? 'saisie' : 'contact';
  });
  readonly canaux = computed(() => this.prise()?.canaux ?? []);
  /** « 30 minutes, en visio ou par téléphone. » : la durée et les canaux tels que l'API les annonce. */
  readonly modalites = computed(() => {
    const p = this.prise();
    const mots = [p?.duree ? minutesEcrites(p.duree) : '', canauxEcrits(p?.canaux ?? [])].filter((m) => m !== '');
    return mots.length > 0 ? capitale(mots.join(', ')) + '.' : '';
  });

  prenom = '';
  nom = '';
  email = '';
  telephone = '';
  note = '';
  site = '';
  canal: CanalRdv | '' = '';
  confidentialite = false;

  // Une clé par demande, tirée à l'ouverture du formulaire et gardée d'un essai à l'autre : un envoi répété ne réserve pas deux fois
  private cle = '';

  constructor() {
    afterNextRender(() => void this.lire());
  }

  /** Lit les créneaux. Un échec ne se montre pas : la feuille garde son lien vers l'adresse de contact. */
  private async lire(): Promise<void> {
    try {
      this.ouvrir(await firstValueFrom(this.api.creneaux()));
    } catch {
      this.prise.set(null);
    }
  }

  private ouvrir(prise: Prise): void {
    this.prise.set(prise);
    if (!prise.canaux.includes(this.canal as CanalRdv)) {
      this.canal = prise.canaux[0] ?? '';
    }
  }

  readonly ecrire = canalRdv;

  dire(canal: string): string {
    return capitale(canalRdv(canal));
  }

  quand(c: Creneau): string {
    return capitale(momentEcrit(c.date, c.heure));
  }

  choisir(creneau: Creneau): void {
    this.creneau.set(creneau);
    this.refusCreneau.set('');
    if (this.cle === '' && this.navigateur) {
      this.cle = crypto.randomUUID();
    }
  }

  async reserver(): Promise<void> {
    const creneau = this.creneau();
    if (this.occupe() || creneau === null || this.canal === '' || !this.navigateur) {
      return;
    }
    if (this.prenom.trim() === '' || this.nom.trim() === '' || this.email.trim() === '') {
      this.refus.set('Indiquez votre prénom, votre nom et votre e-mail.');
      return;
    }
    if (this.canal === 'telephone' && this.telephone.trim() === '') {
      this.refus.set('Pour un rendez-vous par téléphone, indiquez le numéro où vous joindre.');
      return;
    }
    if (!this.confidentialite) {
      this.refus.set('Pour prendre rendez-vous, cochez la case de la politique de confidentialité.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    const email = this.email.trim();
    try {
      await firstValueFrom(
        this.api.prendreRdv({
          prenom: this.prenom.trim(),
          nom: this.nom.trim(),
          email,
          ...(this.canal === 'telephone' ? { telephone: this.telephone.trim() } : {}),
          canal: this.canal,
          date: creneau.date,
          heure: creneau.heure,
          ...(this.note.trim() !== '' ? { note: this.note.trim() } : {}),
          confidentialite: 1,
          cle_saisie: this.cle,
          site: this.site,
        }),
      );
      this.envoye.set({ email, quand: momentEcrit(creneau.date, creneau.heure), canal: canalRdv(this.canal) });
      this.cle = '';
      // L'écran change sous le bouton qui vient d'être actionné : le focus va au titre de l'annonce
      afterNextRender(() => this.confirmation()?.nativeElement.focus(), { injector: this.injector });
    } catch (err) {
      const suite = suiteRefus<{ prise: Prise }>(err);
      if (motifRefus(err) === 'creneau' && suite.prise) {
        // Le créneau vient d'être pris : les créneaux à jour remplacent les anciens, la saisie est gardée
        this.creneau.set(null);
        this.refusCreneau.set(apiErrorMessage(err));
        this.ouvrir(suite.prise);
      } else {
        this.refus.set(apiErrorMessage(err));
      }
    } finally {
      this.occupe.set(false);
    }
  }
}
