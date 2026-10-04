import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, output, signal } from '@angular/core';
import { CONTACT } from '../core/config';
import { heureEcrite, jourCase, jourComplet } from '../core/format';
import { Creneau, Prise } from '../core/models';

/** Nombre de jours montrés d'abord, puis ajoutés par « Voir plus de jours » : deux rangs de quatre, ou un rang de huit. */
const PAS = 8;

/**
 * Choix d'un créneau : les jours proposés, puis les heures du jour choisi. Le même partout où un rendez-vous se
 * prend ou se déplace (page publique, lien de gestion, espace personnel).
 * - Il reçoit une « prise » (les créneaux tels que l'API les propose) et le créneau déjà choisi ; il émet `choisi`.
 * - Jours et heures sont ceux de Paris, écrits tels que l'API les donne : rien n'est converti, rien n'est calculé
 *   d'après l'horloge de l'appareil.
 * - Chaque jour et chaque heure est un bouton (`aria-pressed`), atteint au clavier, de 44 px au moins.
 */
@Component({
  selector: 'app-prise-rdv',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'prise' },
  template: `
    @if (attente()) {
      <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="sr-only" role="status">Les créneaux arrivent.</p>
    } @else if (jours().length === 0) {
      <p class="prise-vide">Aucun créneau n'est proposé pour le moment. Écrivez-nous, nous trouverons un moment : <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
    } @else {
      <div class="prise-jours" role="group" aria-label="Jours proposés">
        @for (j of visibles(); track j.date) {
          <button type="button" class="prise-jour" [attr.aria-pressed]="j.date === jour()" [attr.aria-label]="j.complet" (click)="choisirJour(j.date)">
            <span>{{ j.semaine }}</span>
            <span class="chiffre">{{ j.numero }}</span>
            <span>{{ j.mois }}</span>
          </button>
        }
      </div>
      @if (reste() > 0) {
        <button type="button" class="lien" (click)="montrerPlus()">Voir plus de jours</button>
      }

      @if (jour(); as d) {
        <p class="prise-quand" aria-live="polite">
          <strong>{{ complet(d) }}</strong>, <span class="secondaire">heure de Paris</span>
        </p>
        @for (partie of parties(); track partie.nom) {
          <div class="prise-partie" role="group" [attr.aria-label]="partie.nom + ', ' + complet(d)">
            <span class="prise-partie-nom" aria-hidden="true">{{ partie.nom }}</span>
            <div class="prise-heures">
              @for (h of partie.heures; track h) {
                <button type="button" class="prise-heure" [attr.aria-pressed]="estChoisie(d, h)" (click)="choisi.emit({ date: d, heure: h })">
                  {{ heure(h) }}
                </button>
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class PriseRdv {
  private readonly hote: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  /** Les créneaux proposés ; null ou `ouvert` faux : aucun. */
  readonly prise = input.required<Prise | null>();
  /** Les créneaux sont en cours de lecture. */
  readonly attente = input(false);
  /** Le créneau choisi, tenu par la page. */
  readonly creneau = input<Creneau | null>(null);
  readonly choisi = output<Creneau>();

  readonly contact = CONTACT;
  readonly heure = heureEcrite;
  readonly complet = jourComplet;

  private readonly jourVoulu = signal<string | null>(null);
  private readonly pages = signal(1);

  readonly jours = computed(() => {
    const p = this.prise();
    return p !== null && p.ouvert ? p.jours.filter((j) => j.creneaux.length > 0) : [];
  });

  /** Le jour dont on montre les heures : celui qu'on vient de toucher, sinon celui du créneau choisi, sinon le premier. */
  readonly jour = computed(() => {
    const jours = this.jours();
    const voulu = this.jourVoulu() ?? this.creneau()?.date ?? null;
    return jours.some((j) => j.date === voulu) ? voulu : (jours[0]?.date ?? null);
  });

  /** Les jours montrés : par rangs de huit, toujours jusqu'au jour choisi. */
  private readonly combien = computed(() => {
    const rang = this.jours().findIndex((j) => j.date === this.jour());
    return Math.max(this.pages(), Math.ceil((rang + 1) / PAS)) * PAS;
  });
  readonly visibles = computed(() =>
    this.jours()
      .slice(0, this.combien())
      .map((j) => ({ date: j.date, complet: jourComplet(j.date), ...jourCase(j.date) })),
  );
  readonly reste = computed(() => Math.max(0, this.jours().length - this.combien()));

  /** Les heures du jour choisi, rangées par moment de la journée : une lecture plus rapide qu'une seule suite. */
  readonly parties = computed(() => {
    const heures = this.jours().find((j) => j.date === this.jour())?.creneaux ?? [];
    return [
      { nom: 'Matin', heures: heures.filter((h) => h < '12:00') },
      { nom: 'Après-midi', heures: heures.filter((h) => h >= '12:00' && h < '18:00') },
      { nom: 'Soir', heures: heures.filter((h) => h >= '18:00') },
    ].filter((p) => p.heures.length > 0);
  });

  estChoisie(date: string, heure: string): boolean {
    const c = this.creneau();
    return c !== null && c.date === date && c.heure === heure;
  }

  choisirJour(date: string): void {
    this.jourVoulu.set(date);
  }

  /** Huit jours de plus ; le premier d'entre eux prend le focus, pour que le clavier continue là où la liste s'allonge. */
  montrerPlus(): void {
    const premier = this.combien();
    this.pages.set(premier / PAS + 1);
    afterNextRender(() => this.hote.nativeElement.querySelectorAll<HTMLElement>('.prise-jour')[premier]?.focus(), { injector: this.injector });
  }
}
