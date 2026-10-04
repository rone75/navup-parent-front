import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { accesRefuse, apiErrorMessage } from '../../core/api-error';
import { EspaceApiService } from '../../core/espace-api.service';
import { jourEcrit, numero } from '../../core/format';
import { Programme } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { Icon } from '../../shared/icon';
import { SujetsListe } from './sujets-liste';

/**
 * Accueil de l'espace : où le parent en est, et un seul geste pour reprendre (« Continuer »).
 * Tout ce qui s'affiche vient de l'API : la semaine en cours, les totaux, le sujet à reprendre, la prochaine date.
 * Rien ne compte les jours manqués.
 */
@Component({
  selector: 'app-accueil-page',
  imports: [RouterLink, Icon, SujetsListe],
  template: `
    <header>
      <h1>Bonjour{{ prenom() ? ' ' + prenom() : '' }}</h1>
      @if (programme(); as p) {
        @if (termine()) {
          <p>Votre programme est terminé. Vos contenus restent consultables jusqu'au {{ jour(finAcces(), true) }}.</p>
        } @else {
          <p>Vous en êtes à la semaine {{ p.semaine }} sur {{ p.sur }}.</p>
        }
        @if (p.continuer; as c) {
          <p class="actions">
            <a class="btn btn-grand" [routerLink]="['/espace/sujets', c.id_sujet]">
              <app-icon nom="play" /> {{ c.etat === 'en_cours' ? 'Continuer' : 'Commencer' }} : {{ num(c.numero) }} · {{ c.titre }}
            </a>
          </p>
        }
      }
    </header>

    @if (erreur(); as e) {
      <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ e }}</span></p>
      <button class="btn btn-feuille" type="button" (click)="charger()">Réessayer</button>
    } @else if (programme(); as p) {
      <div class="accueil">
        @if (semaine(); as w) {
          <section class="feuille aimantee" aria-labelledby="titre-semaine">
            <span class="aimant" aria-hidden="true"></span>
            <div class="semaine-tete">
              <h2 id="titre-semaine">{{ termine() ? 'Dernière semaine' : 'Cette semaine' }}</h2>
              <span class="semaine-etat">Semaine {{ w.numero }}{{ w.titre ? ' · ' + w.titre : '' }}</span>
            </div>
            @if (w.sujets.length > 0) {
              <app-sujets-liste [sujets]="w.sujets" />
            } @else {
              <p class="secondaire">Les contenus de cette semaine arrivent bientôt.</p>
            }
          </section>
        }

        <div class="cote">
          <section class="feuille note" aria-labelledby="titre-progression">
            <h2 id="titre-progression" class="sr-only">Votre progression</h2>
            <p>
              @if (p.termines === 0) {
                <strong>{{ p.sujets }} sujets ouverts ou à venir.</strong> Chacun se marque terminé quand vous le décidez.
              } @else {
                <strong>{{ p.termines }} {{ p.termines > 1 ? 'sujets terminés' : 'sujet terminé' }} sur {{ p.sujets }}.</strong>
              }
            </p>
            <ol class="rangee" aria-label="Les {{ p.sur }} semaines du programme">
              @for (w of p.semaines; track w.id_semaine) {
                <li [class]="w.etat" [class.courante]="w.numero === p.semaine && !termine()">
                  <span class="sr-only">Semaine </span>{{ w.numero }}<span class="sr-only">{{ ecrireEtat(w.etat) }}</span>
                </li>
              }
            </ol>
          </section>

          @if (p.prochaine; as n) {
            <section class="feuille attend">
              <h2 class="h3">Semaine {{ n.numero }}</h2>
              <p>Disponible le {{ jour(n.date) }}. D'ici là, tout ce qui est ouvert reste à vous.</p>
            </section>
          }
          <p class="actions"><a class="lien" routerLink="/espace/programme">Voir les {{ p.sur }} semaines <app-icon nom="chevron" /></a></p>
        </div>
      </div>
    } @else {
      <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
    }
  `,
})
export class AccueilPage implements OnInit {
  private readonly api = inject(EspaceApiService);
  private readonly session = inject(SessionService);

  readonly programme = signal<Programme | null>(null);
  readonly erreur = signal('');

  readonly prenom = computed(() => this.session.moi()?.prenom ?? null);
  /** Le programme est fini : l'accès reste ouvert quelque temps (état calculé par l'API). */
  readonly termine = computed(() => this.session.moi()?.acces.programme_termine ?? false);
  readonly finAcces = computed(() => this.session.moi()?.acces.date_fin_acces ?? '');
  /** La feuille de l'accueil : la dernière semaine débloquée. */
  readonly semaine = computed(() => {
    const p = this.programme();
    return p?.semaines.find((w) => w.numero === p.semaine) ?? null;
  });

  readonly num = numero;
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

  ecrireEtat(etat: string): string {
    return etat === 'terminee' ? ', terminée' : etat === 'verrouillee' ? ', à venir' : ', disponible';
  }
}
