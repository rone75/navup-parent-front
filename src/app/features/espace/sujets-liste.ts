import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { duree, numero } from '../../core/format';
import { SujetLigne } from '../../core/models';
import { Icon } from '../../shared/icon';

/**
 * Les sujets d'une semaine, une étiquette par sujet : son numéro, son titre, sa durée, son état écrit.
 * Un sujet d'une semaine à venir est annoncé par son titre et ne s'ouvre pas.
 */
@Component({
  selector: 'app-sujets-liste',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <ul class="etiquettes">
      @for (s of sujets(); track s.id_sujet) {
        <li>
          @if (s.etat === 'verrouille') {
            <span class="etiquette verrou">
              <span class="etiquette-numero">{{ num(s.numero) }}</span>
              <span class="etiquette-titre">{{ s.titre }}</span>
              <span class="etiquette-etat"><app-icon nom="cadenas" /> <span class="sr-only">Pas encore disponible</span></span>
            </span>
          } @else {
            <a class="etiquette" [class.terminee]="s.etat === 'termine'" [routerLink]="['/espace/sujets', s.id_sujet]">
              <span class="etiquette-numero">{{ num(s.numero) }}</span>
              <span class="etiquette-titre">
                {{ s.titre }}
                @if (ecrireDuree(s.duree); as d) {
                  <span class="etiquette-meta">{{ d }}</span>
                }
              </span>
              <span class="etiquette-etat">
                @switch (s.etat) {
                  @case ('termine') {
                    <app-icon nom="etoile" /> Terminé
                  }
                  @case ('en_cours') {
                    En cours
                  }
                  @default {
                    <app-icon nom="chevron" /> <span class="sr-only">À commencer</span>
                  }
                }
              </span>
            </a>
          }
        </li>
      }
    </ul>
  `,
})
export class SujetsListe {
  readonly sujets = input.required<SujetLigne[]>();
  readonly num = numero;
  readonly ecrireDuree = duree;
}
