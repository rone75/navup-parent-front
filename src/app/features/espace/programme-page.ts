import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { accesRefuse, apiErrorMessage } from '../../core/api-error';
import { EspaceApiService } from '../../core/espace-api.service';
import { jourEcrit } from '../../core/format';
import { Programme } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';
import { SujetsListe } from './sujets-liste';

/**
 * Les semaines du programme, une feuille par semaine. L'aimant dit l'état : orange pour la semaine en cours,
 * une étoile quand tout y est terminé ; une semaine à venir est une feuille pâlie qui porte sa date.
 */
@Component({
  selector: 'app-programme-page',
  imports: [Icon, SujetsListe],
  template: `
    <header>
      <h1>Votre programme</h1>
      @if (programme(); as p) {
        <p>{{ p.sur }} semaines. {{ p.termines }} {{ p.termines > 1 ? 'sujets terminés' : 'sujet terminé' }} sur {{ p.sujets }}.</p>
      }
    </header>

    @if (erreur(); as e) {
      <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ e }}</span></p>
      <button class="btn btn-feuille" type="button" (click)="charger()">Réessayer</button>
    } @else if (programme(); as p) {
      <div class="programme">
        @for (w of p.semaines; track w.id_semaine) {
          <section class="feuille aimantee" [class.attend]="w.etat === 'verrouillee'" [attr.aria-labelledby]="'semaine-' + w.numero" [attr.data-etat]="w.etat">
            <span class="aimant gauche" [class.blanc]="w.etat === 'verrouillee'" [class.jaune]="w.etat === 'disponible' && w.numero !== p.semaine" aria-hidden="true">
              @if (w.etat === 'terminee') {
                <app-icon nom="etoile" />
              } @else if (w.etat === 'verrouillee') {
                <app-icon nom="cadenas" />
              }
            </span>
            <div class="semaine-tete">
              <h2 [id]="'semaine-' + w.numero" class="h3">Semaine {{ w.numero }}</h2>
              <span class="semaine-etat">
                @switch (w.etat) {
                  @case ('terminee') {
                    Terminée
                  }
                  @case ('verrouillee') {
                    Disponible le {{ jour(w.date_deblocage) }}
                  }
                  @default {
                    {{ w.numero === p.semaine ? 'En cours' : 'Disponible' }}
                  }
                }
              </span>
            </div>
            @if (w.titre) {
              <p>{{ w.titre }}</p>
            }
            @if (w.sujets.length > 0) {
              <app-sujets-liste [sujets]="w.sujets" />
            } @else {
              <p class="secondaire">{{ w.etat === 'verrouillee' ? 'Ses sujets seront annoncés ici.' : 'Les contenus de cette semaine arrivent bientôt.' }}</p>
            }
          </section>
        }
      </div>
    } @else {
      <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
    }
  `,
})
export class ProgrammePage implements OnInit {
  private readonly api = inject(EspaceApiService);
  private readonly session = inject(SessionService);

  readonly programme = signal<Programme | null>(null);
  readonly erreur = signal('');
  readonly jour = jourEcrit;

  ngOnInit(): void {
    void this.charger();
  }

  async charger(): Promise<void> {
    this.erreur.set('');
    try {
      this.programme.set(await firstValueFrom(this.api.programme()));
    } catch (err) {
      if (accesRefuse(err)) {
        await this.session.relire().catch(() => undefined);
        return;
      }
      this.erreur.set(apiErrorMessage(err));
    }
  }
}
