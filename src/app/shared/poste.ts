import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { horloge, numero } from '../core/format';
import { LecteurService, VITESSES } from '../core/lecteur.service';
import { Icon } from './icon';

/**
 * Le poste : le lecteur audio de l'espace.
 * - `plein` : à côté de la fiche d'un sujet, sur un écran large ;
 * - `barre` : collé au bas de l'écran, partout ailleurs ; un appui sur son titre l'ouvre en grand.
 * Une seule lecture pour toute l'appli (LecteurService) : les deux formes montrent le même sujet.
 */
@Component({
  selector: 'app-poste',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  template: `
    @if (lecteur.sujet(); as s) {
      @if (mode() === 'plein' || ouvert()) {
        <div [class.poste-ouvert]="mode() === 'barre'" [attr.role]="mode() === 'barre' ? 'dialog' : null" [attr.aria-label]="mode() === 'barre' ? 'Lecteur audio' : null">
          <section class="poste" aria-label="Lecteur audio">
            @if (mode() === 'barre') {
              <button class="lien" type="button" (click)="ouvert.set(false)"><app-icon nom="croix" /> Fermer le lecteur</button>
            }
            <div class="poste-tete">
              <img class="pochette" [src]="'images/pochette-' + s.pochette + '.webp'" alt="" width="512" height="512" />
              <div>
                <p class="poste-titre">
                  <span class="chiffre">{{ num(s.numero) }}</span> ·
                  @if (mode() === 'barre') {
                    <a [routerLink]="['/espace/sujets', s.id_sujet]" (click)="ouvert.set(false)">{{ s.titre }}</a>
                  } @else {
                    {{ s.titre }}
                  }
                </p>
              </div>
            </div>

            <div class="piste">
              <span>{{ heure(lecteur.position()) }}</span>
              <input
                type="range"
                min="0"
                [max]="lecteur.duree()"
                step="1"
                [value]="lecteur.position()"
                [style.--part]="lecteur.part() + '%'"
                aria-label="Position dans l'audio"
                [attr.aria-valuetext]="heure(lecteur.position()) + ' sur ' + heure(lecteur.duree())"
                (input)="aller($event)"
              />
              <span>{{ reste() }}</span>
            </div>

            <div class="poste-commandes">
              <button class="btn btn-feuille btn-rond" type="button" (click)="lecteur.sauter(-15)" aria-label="Reculer de 15 secondes">
                <app-icon nom="moins-15" />
              </button>
              <button class="btn btn-rond grand" type="button" (click)="lecteur.basculer()" [attr.aria-label]="lecteur.enLecture() ? 'Mettre en pause' : 'Lancer la lecture'">
                <app-icon [nom]="lecteur.enLecture() ? 'pause' : 'play'" />
              </button>
              <button class="btn btn-feuille btn-rond" type="button" (click)="lecteur.sauter(15)" aria-label="Avancer de 15 secondes">
                <app-icon nom="plus-15" />
              </button>
            </div>
            @if (lecteur.attente() && lecteur.enLecture()) {
              <p class="poste-attente petit secondaire" role="status">L'audio arrive…</p>
            }

            <div class="vitesses" role="group" aria-label="Vitesse de lecture">
              @for (v of vitesses; track v) {
                <button type="button" [attr.aria-pressed]="lecteur.vitesse() === v" (click)="lecteur.choisirVitesse(v)">{{ ecrireVitesse(v) }}</button>
              }
            </div>
          </section>
        </div>
      }

      @if (mode() === 'barre' && !ouvert()) {
        <div class="poste-barre" role="region" aria-label="Lecteur audio">
          <img class="pochette" [src]="'images/pochette-' + s.pochette + '.webp'" alt="" width="512" height="512" />
          <button class="poste-barre-titre" type="button" (click)="ouvert.set(true)" aria-label="Ouvrir le lecteur">
            <strong>{{ num(s.numero) }} · {{ s.titre }}</strong>
            <span class="petit">{{ heure(lecteur.position()) }} sur {{ heure(lecteur.duree()) }}</span>
          </button>
          <button class="btn btn-rond" type="button" (click)="lecteur.basculer()" [attr.aria-label]="lecteur.enLecture() ? 'Mettre en pause' : 'Lancer la lecture'">
            <app-icon [nom]="lecteur.enLecture() ? 'pause' : 'play'" />
          </button>
          <span class="poste-barre-avance" [style.--part]="lecteur.part() + '%'"></span>
        </div>
      }
    }
  `,
})
export class Poste {
  readonly lecteur = inject(LecteurService);

  readonly mode = input<'plein' | 'barre'>('barre');
  /** La barre est ouverte en grand par-dessus la page. */
  readonly ouvert = signal(false);

  readonly vitesses = VITESSES;
  readonly num = numero;
  readonly heure = horloge;

  /** Temps restant, écrit avec son signe : « −4:12 ». */
  readonly reste = computed(() => '−' + horloge(Math.max(0, this.lecteur.duree() - this.lecteur.position())));

  aller(evenement: Event): void {
    this.lecteur.aller(Number((evenement.target as HTMLInputElement).value));
  }

  ecrireVitesse(v: number): string {
    return String(v).replace('.', ',') + ' ×';
  }
}
