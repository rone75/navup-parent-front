import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { CONTACT } from '../core/config';
import { canalRdv, capitale, etatRdv, minutesEcrites, momentEcrit, typeRdv } from '../core/format';
import { Creneau, Prise, Rdv } from '../core/models';
import { Icon } from './icon';
import { PriseRdv } from './prise-rdv';

/**
 * Un rendez-vous et ses gestes, tels que le parent les voit : par son lien de gestion ou dans son espace.
 * - Tout vient de l'API : l'état (« confirmé », « à confirmer », « annulé », « passé »), ce qui est encore permis
 *   (`annulable`, `deplacable`), le jour et l'heure, de Paris. Rien n'est déduit d'une date ici.
 * - Ce composant n'appelle aucune API : il émet le geste, la page l'exécute avec son jeton ou son billet, puis lui
 *   rend le rendez-vous à jour, un refus ou un mot de confirmation.
 * - Annuler se confirme en ligne, sans boîte de dialogue.
 */
@Component({
  selector: 'app-rdv-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, PriseRdv],
  host: { class: 'rdv', '[attr.data-etat]': 'rdv().etat' },
  template: `
    <div class="semaine-tete">
      <h2 class="h3">{{ quand() }}</h2>
      <span class="semaine-etat">{{ etat() }}</span>
    </div>
    <p class="rdv-quoi">{{ quoi() }}. <span class="secondaire">Heure de Paris.</span></p>

    @if (message(); as m) {
      <p class="refus info" role="status"><app-icon nom="coche" /> <span>{{ m }}</span></p>
    }
    @if (refus(); as r) {
      <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
    }

    @switch (geste()) {
      @case ('deplacer') {
        <div class="rdv-geste" role="group" aria-label="Déplacer ce rendez-vous">
          <p><strong>Choisissez un nouveau créneau.</strong> L'actuel reste le vôtre tant que vous n'avez pas confirmé.</p>
          <app-prise-rdv [prise]="prise()" [attente]="priseAttente()" [creneau]="creneau()" (choisi)="creneau.set($event)" />
          <p class="actions">
            <button class="btn" type="button" [disabled]="creneau() === null || occupe()" (click)="confirmerDeplacement()">
              {{ nouveau() ? 'Déplacer au ' + nouveau() : 'Déplacer' }}
            </button>
            <button class="lien" type="button" (click)="geste.set('aucun')">Garder le créneau actuel</button>
          </p>
        </div>
      }
      @case ('annuler') {
        <div class="rdv-geste" role="group" aria-label="Annuler ce rendez-vous">
          <p><strong>Annuler ce rendez-vous ?</strong> Un e-mail vous le confirmera.</p>
          <p class="actions">
            <button class="btn" type="button" [disabled]="occupe()" (click)="annule.emit()">Oui, annuler ce rendez-vous</button>
            <button class="lien" type="button" (click)="geste.set('aucun')">Non, le garder</button>
          </p>
        </div>
      }
      @default {
        @if (tient()) {
          @if (rdv().visio || rdv().etat === 'confirme' || rdv().deplacable || rdv().annulable) {
            <p class="actions">
              @if (rdv().visio; as visio) {
                <a class="btn" [href]="visio" target="_blank" rel="noopener noreferrer"><app-icon nom="externe" /> Rejoindre la visio</a>
              }
              @if (rdv().etat === 'confirme') {
                <button class="btn btn-feuille" type="button" [disabled]="occupe()" (click)="agenda.emit()"><app-icon nom="agenda" /> Ajouter à mon agenda</button>
              }
              @if (rdv().deplacable) {
                <button class="lien" type="button" (click)="ouvrirDeplacement()">Déplacer</button>
              }
              @if (rdv().annulable) {
                <button class="lien" type="button" (click)="geste.set('annuler')">Annuler</button>
              }
            </p>
          }
          @if (!rdv().annulable) {
            <p class="petit secondaire rdv-note">
              À moins de {{ delai() }} heures de l'heure dite, un rendez-vous ne se modifie plus en ligne. Un empêchement ? Écrivez-nous :
              <a [href]="'mailto:' + contact">{{ contact }}</a>.
            </p>
          } @else if (!rdv().deplacable) {
            <p class="petit secondaire rdv-note">Pour le déplacer, écrivez-nous&nbsp;: <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
          }
        }
        <ng-content />
      }
    }
  `,
})
export class RdvDetail {
  readonly rdv = input.required<Rdv>();
  /** Créneaux où le déplacer ; null : aucun. */
  readonly prise = input<Prise | null>(null);
  /** Ces créneaux sont en cours de lecture (dans l'espace, ils se demandent à l'ouverture). */
  readonly priseAttente = input(false);
  /** Délai, en heures, en deçà duquel un rendez-vous ne se modifie plus en ligne. */
  readonly delai = input(12);
  /** Écrire l'année dans la date (lien de gestion : il peut être rouvert longtemps après). */
  readonly annee = input(false);
  /** Un geste est en cours d'envoi. */
  readonly occupe = input(false);
  /** Le refus du dernier geste, et le mot qui confirme le dernier geste réussi. */
  readonly refus = input('');
  readonly message = input('');

  /** Le parent ouvre « Déplacer » : à la page de fournir les créneaux si elle ne les a pas. */
  readonly creneauxDemandes = output<void>();
  readonly deplace = output<Creneau>();
  readonly annule = output<void>();
  readonly agenda = output<void>();

  readonly contact = CONTACT;

  /** Le geste ouvert. Il se referme quand le rendez-vous change (déplacé, annulé) ou qu'il n'est plus permis. */
  readonly geste = linkedSignal<string, 'aucun' | 'deplacer' | 'annuler'>({
    source: () => {
      const r = this.rdv();
      return `${r.id_rdv}/${r.date_debut}/${r.etat}/${r.deplacable}/${r.annulable}`;
    },
    computation: () => 'aucun',
  });
  /** Le nouveau créneau choisi ; oublié quand le rendez-vous change ou que les créneaux proposés ne le contiennent plus. */
  readonly creneau = linkedSignal<{ cle: string; prise: Prise | null }, Creneau | null>({
    source: () => ({ cle: `${this.rdv().id_rdv}/${this.rdv().date_debut}`, prise: this.prise() }),
    computation: (source, avant) => {
      const c = avant?.value ?? null;
      const tenu = c !== null && avant?.source.cle === source.cle && (source.prise?.jours.some((j) => j.date === c.date && j.creneaux.includes(c.heure)) ?? false);
      return tenu ? c : null;
    },
  });

  /** Le rendez-vous tient : confirmé ou à confirmer (état donné par l'API). */
  readonly tient = computed(() => this.rdv().etat === 'confirme' || this.rdv().etat === 'a_confirmer');
  readonly quand = computed(() => capitale(momentEcrit(this.rdv().date_debut, undefined, this.annee())));
  readonly etat = computed(() => etatRdv(this.rdv().etat));
  readonly quoi = computed(() => {
    const r = this.rdv();
    return [`${typeRdv(r.type)} ${canalRdv(r.canal)}`.trim(), minutesEcrites(r.duree)].join(', ');
  });
  readonly nouveau = computed(() => {
    const c = this.creneau();
    return c === null ? '' : momentEcrit(c.date, c.heure);
  });

  ouvrirDeplacement(): void {
    this.geste.set('deplacer');
    this.creneauxDemandes.emit();
  }

  confirmerDeplacement(): void {
    const c = this.creneau();
    if (c !== null) {
      this.deplace.emit(c);
    }
  }
}
