import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CONTACT } from '../../core/config';
import { jourEcrit } from '../../core/format';
import { Acces } from '../../core/models';

/**
 * Ce que lit un parent dont les contenus ne sont pas ouverts : son programme n'a pas commencé, son accès est
 * suspendu, ou la période d'accès est finie. Une phrase dit ce qu'il en est, une autre ce qu'il peut faire.
 * L'état vient de l'API : rien n'est déduit des dates ici.
 */
@Component({
  selector: 'app-etat-acces',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="feuille aimantee" [attr.data-acces]="acces().etat">
      <span class="aimant bleu" aria-hidden="true"></span>
      @switch (acces().etat) {
        @case ('pas_commence') {
          <h1>Votre programme commence le {{ jour(acces().date_debut) }}</h1>
          <p>Ce jour-là, votre première semaine s'ouvre ici. D'ici là, il n'y a rien à faire.</p>
        }
        @case ('suspendu') {
          <h1>Votre accès est suspendu</h1>
          <p>Vos contenus ne sont pas accessibles pour le moment. Votre progression est conservée.</p>
        }
        @case ('ferme') {
          <h1>Votre accès s'est terminé le {{ jour(acces().date_fin_acces) }}</h1>
          <p>Merci d'avoir suivi le programme NavUp jusqu'ici.</p>
        }
      }
      <p>Une question ? Écrivez-nous : <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
    </section>
  `,
})
export class EtatAcces {
  readonly acces = input.required<Acces>();
  readonly contact = CONTACT;

  jour(date: string): string {
    return jourEcrit(date, true);
  }
}
