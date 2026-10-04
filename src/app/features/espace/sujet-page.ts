import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { accesRefuse, apiErrorMessage, dateDeblocage } from '../../core/api-error';
import { EspaceApiService } from '../../core/espace-api.service';
import { jourEcrit, numero } from '../../core/format';
import { LecteurService } from '../../core/lecteur.service';
import { Sujet } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Poste } from '../../shared/poste';

/**
 * Un sujet : sa fiche pratique à l'écran, et le poste qui joue son audio (à côté de la fiche sur un écran large,
 * en barre au bas de l'écran sur un téléphone). La fiche est le PDF de NavUp, montré tel quel : ses pages sont des
 * images, le PDF reste à un geste.
 * Les adresses de la fiche et de l'audio sont signées et ne valent que quelques heures : une image qui ne répond
 * plus fait redemander le sujet, une fois.
 */
@Component({
  selector: 'app-sujet-page',
  imports: [RouterLink, Icon, Poste],
  template: `
    <a class="retour" routerLink="/espace/programme"><app-icon nom="fleche-gauche" /> Programme</a>

    @if (refus(); as r) {
      <section class="feuille aimantee">
        <span class="aimant bleu" aria-hidden="true"><app-icon nom="cadenas" /></span>
        <h1 class="h2">{{ r.titre }}</h1>
        <p>{{ r.texte }}</p>
        <p class="actions"><a class="btn btn-feuille" routerLink="/espace/programme">Revenir au programme</a></p>
      </section>
    } @else if (sujet(); as s) {
      <header>
        <h1><span class="chiffre">{{ num(s.numero) }}</span> · {{ s.titre }}</h1>
        <p class="secondaire">Semaine {{ s.semaine.numero }}{{ s.semaine.titre ? ' · ' + s.semaine.titre : '' }}</p>
      </header>

      <div class="sujet">
        <article aria-label="Fiche pratique">
          @if (s.fiche; as f) {
            @if (f.pages.length > 0) {
              <div class="fiche-pages">
                @for (page of f.pages; track $index) {
                  <img
                    [src]="page"
                    [alt]="'Fiche pratique, page ' + ($index + 1) + ' sur ' + f.pages.length"
                    [attr.width]="f.largeur"
                    [attr.height]="f.hauteur"
                    [attr.loading]="$index === 0 ? 'eager' : 'lazy'"
                    [attr.decoding]="$index === 0 ? 'sync' : 'async'"
                    (error)="rafraichir()"
                  />
                }
              </div>
            }
            <p class="actions">
              <a class="lien" [href]="f.pdf" target="_blank" rel="noopener"><app-icon nom="externe" /> Ouvrir la fiche en PDF</a>
              <span class="secondaire petit">Pour zoomer, ou pour la lecture d'écran.</span>
            </p>
          } @else {
            <p class="secondaire">La fiche de ce sujet arrive bientôt.</p>
          }
        </article>

        <aside class="sujet-cote">
          @if (s.audio) {
            <app-poste mode="plein" />
          } @else {
            <p class="secondaire">L'audio de ce sujet arrive bientôt.</p>
          }

          <section class="feuille" aria-live="polite">
            @if (s.progression.termine) {
              <p class="termine-dit"><app-icon nom="etoile" /> <strong>Sujet terminé</strong></p>
              <button class="lien" type="button" (click)="marquer(false)" [disabled]="occupe()">Je préfère y revenir</button>
            } @else {
              <button class="btn btn-orange btn-bloc" type="button" (click)="marquer(true)" [disabled]="occupe()">
                <app-icon nom="coche" /> Marquer comme terminé
              </button>
              <p class="petit secondaire terminer-aide">Quand vous le décidez : l'écoute seule ne termine rien.</p>
            }
          </section>

          <nav class="voisins" aria-label="Sujets voisins">
            @if (s.suivant; as v) {
              @if (v.verrouille) {
                <span>
                  <span class="petit secondaire">Sujet suivant, disponible le {{ jour(v.date_deblocage) }}</span>
                  <strong>{{ num(v.numero) }} · {{ v.titre }}</strong>
                </span>
              } @else {
                <a [routerLink]="['/espace/sujets', v.id_sujet]">
                  <span class="petit secondaire">Sujet suivant</span>
                  <strong>{{ num(v.numero) }} · {{ v.titre }}</strong>
                </a>
              }
            }
            @if (s.precedent; as v) {
              <a [routerLink]="['/espace/sujets', v.id_sujet]">
                <span class="petit secondaire">Sujet précédent</span>
                <strong>{{ num(v.numero) }} · {{ v.titre }}</strong>
              </a>
            }
          </nav>
        </aside>
      </div>
    } @else {
      <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
    }
  `,
})
export class SujetPage {
  private readonly api = inject(EspaceApiService);
  private readonly lecteur = inject(LecteurService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  /** Identifiant du sujet (paramètre de route). */
  readonly id = input.required<string>();

  readonly sujet = signal<Sujet | null>(null);
  readonly refus = signal<{ titre: string; texte: string } | null>(null);
  readonly occupe = signal(false);

  private seq = 0;
  private rafraichi = false;

  readonly num = numero;
  readonly jour = jourEcrit;

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => void this.charger(id));
    });
  }

  private async charger(id: number): Promise<void> {
    const seq = ++this.seq;
    // Un sujet se vide dès qu'on en demande un autre
    this.sujet.set(null);
    this.refus.set(null);
    this.rafraichi = false;
    try {
      const s = await firstValueFrom(this.api.sujet(id));
      if (seq !== this.seq) {
        return;
      }
      this.sujet.set(s);
      this.lecteur.charger(s);
    } catch (err) {
      if (seq !== this.seq) {
        return;
      }
      if (accesRefuse(err)) {
        await this.session.relire().catch(() => undefined);
        return;
      }
      const date = dateDeblocage(err);
      if (date !== null) {
        this.refus.set({ titre: `Disponible le ${jourEcrit(date)}`, texte: "Ce sujet fait partie d'une semaine qui n'est pas encore ouverte. Il vous attendra ici." });
      } else if (err instanceof HttpErrorResponse && err.status === 404) {
        this.refus.set({ titre: "Ce sujet n'est plus proposé", texte: 'Il a pu être retiré du programme, ou son adresse est incomplète.' });
      } else {
        this.refus.set({ titre: "Le sujet ne s'ouvre pas", texte: apiErrorMessage(err) });
      }
    }
  }

  /** Une page de la fiche ne répond plus (adresse expirée) : le sujet est redemandé, une seule fois. */
  async rafraichir(): Promise<void> {
    const courant = this.sujet();
    if (courant === null || this.rafraichi) {
      return;
    }
    this.rafraichi = true;
    try {
      const s = await firstValueFrom(this.api.sujet(courant.id_sujet));
      if (this.sujet()?.id_sujet === s.id_sujet) {
        this.sujet.set({ ...s, progression: this.sujet()!.progression });
      }
    } catch {
      /* la page garde ce qu'elle a : le PDF reste proposé */
    }
  }

  async marquer(termine: boolean): Promise<void> {
    const s = this.sujet();
    if (s === null || this.occupe()) {
      return;
    }
    this.occupe.set(true);
    try {
      const courant = this.lecteur.sujet();
      const depart = courant?.id_sujet === s.id_sujet ? courant.progression : s.progression;
      const progression = await this.lecteur.marquer(s.id_sujet, depart, termine);
      this.sujet.set({ ...s, progression });
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }
}
