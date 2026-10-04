import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { accesRefuse, apiErrorMessage, motifRefus, suiteRefus } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { telechargerInvitation } from '../../core/fichier';
import { canalRdv, canauxEcrits, capitale, etatRdv, minutesEcrites, momentEcrit, typeRdv } from '../../core/format';
import { CanalRdv, Creneau, Prise, Rdv, VueRdvEspace } from '../../core/models';
import { RdvEspace } from '../../core/rdv-espace';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { PriseRdv } from '../../shared/prise-rdv';
import { RdvDetail } from '../../shared/rdv-detail';

/**
 * Les rendez-vous du parent inscrit : ceux qui viennent, avec leurs gestes (déplacer, annuler, agenda, visio), la
 * prise d'un rendez-vous d'accompagnement, et ceux d'avant.
 * - Les rendez-vous vivent dans la Tour de contrôle : la page les lit et les modifie avec un billet que l'API des
 *   parents délivre à la session (`RdvEspace`, déclaré ici : le billet vit et disparaît avec la page).
 * - Tout vient de l'API : ce qui est à venir ou passé, ce qui est permis, s'il est possible d'en prendre un
 *   (`peut_prendre`), si le téléphone est déjà connu. Un rendez-vous d'avant se dit « passé » ou « annulé », rien d'autre.
 */
@Component({
  selector: 'app-rendez-vous-espace-page',
  imports: [FormsModule, Icon, PriseRdv, RdvDetail],
  providers: [RdvEspace],
  template: `
    <header><h1>Rendez-vous</h1></header>

    @if (erreur(); as e) {
      <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ e }}</span></p>
      <button class="btn btn-feuille" type="button" (click)="charger()">Réessayer</button>
    } @else if (vue(); as v) {
      <div class="accueil" data-rdv="vue">
        <div class="cote">
          @for (r of v.avenir; track r.id_rdv) {
            <section class="feuille aimantee" data-rdv="avenir">
              <span class="aimant" aria-hidden="true"></span>
              <app-rdv-detail
                [rdv]="r"
                [prise]="prises()[r.id_rdv] ?? null"
                [priseAttente]="attentePrise() === r.id_rdv"
                [delai]="v.delai_heures"
                [occupe]="occupe()"
                [refus]="refusRdv()?.id === r.id_rdv ? refusRdv()!.texte : ''"
                (creneauxDemandes)="lireCreneaux(r)"
                (deplace)="deplacer(r, $event)"
                (annule)="annuler(r)"
                (agenda)="agenda(r)"
              />
            </section>
          }

          @if (v.peut_prendre || !v.prise.ouvert) {
            <section class="feuille aimantee" aria-labelledby="titre-prendre" data-rdv="prendre">
              <span class="aimant jaune" aria-hidden="true"></span>
              <h2 id="titre-prendre" class="h3">Prendre un rendez-vous d'accompagnement</h2>
              @if (v.peut_prendre) {
                <p>Choisissez un jour, puis une heure.</p>
              }
              @if (refusCreneau(); as r) {
                <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
              }
              <app-prise-rdv [prise]="v.peut_prendre ? v.prise : null" [creneau]="creneau()" (choisi)="choisir($event)" />

              @if (v.peut_prendre && creneau(); as c) {
                <form class="rdv-saisie" (ngSubmit)="reserver()" novalidate aria-labelledby="titre-prendre">
                  @if (v.prise.canaux.length > 1) {
                    <fieldset>
                      <legend>Comment préférez-vous échanger ?</legend>
                      @for (k of v.prise.canaux; track k) {
                        <label class="case">
                          <input type="radio" name="canal" [value]="k" [(ngModel)]="canal" />
                          <span>{{ dire(k) }}</span>
                        </label>
                      }
                    </fieldset>
                  }
                  @if (canal === 'telephone') {
                    @if (v.telephone_connu) {
                      <p class="petit secondaire">Nous vous appelons au numéro de votre dossier.</p>
                    } @else {
                      <label class="champ">
                        <span>Téléphone</span>
                        <input type="tel" name="telephone" [(ngModel)]="telephone" autocomplete="tel" inputmode="tel" maxlength="30" required aria-describedby="aide-tel" />
                        <small id="aide-tel">Le numéro où vous joindre à l'heure du rendez-vous.</small>
                      </label>
                    }
                  }
                  <label class="champ">
                    <span>Sujet à aborder <span class="secondaire">(facultatif)</span></span>
                    <textarea name="note" [(ngModel)]="note" rows="3" maxlength="500" aria-describedby="aide-note"></textarea>
                    <small id="aide-note">500 caractères au plus.</small>
                  </label>
                  @if (refus(); as r) {
                    <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
                  }
                  <p class="rdv-rappel">
                    <app-icon nom="agenda" />
                    <span><strong>{{ quand(c) }}</strong>, {{ ecrire(canal) }}. <span class="secondaire">Heure de Paris.</span></span>
                  </p>
                  <button class="btn btn-bloc" type="submit" [disabled]="occupe()">Réserver ce rendez-vous</button>
                </form>
              }
            </section>
          }
        </div>

        <div class="cote">
          <section class="feuille note" aria-labelledby="titre-reperes">
            <h2 id="titre-reperes" class="sr-only">Repères</h2>
            @if (modalites(v); as m) {
              <p>
                <strong>Un rendez-vous d'accompagnement dure {{ m }}.</strong>
              </p>
            }
            <p>
              Vous pouvez le déplacer ou l'annuler ici jusqu'à {{ v.delai_heures }} heures avant. Ensuite, écrivez-nous&nbsp;:
              <a [href]="'mailto:' + contact">{{ contact }}</a>.
            </p>
            @if (!v.peut_prendre && v.prise.ouvert) {
              <p>Vous avez déjà un rendez-vous d'accompagnement à venir : pour un autre moment, déplacez-le.</p>
            }
          </section>

          @if (v.avant.length > 0) {
            <section class="feuille" aria-labelledby="titre-avant" data-rdv="avant">
              <h2 id="titre-avant" class="h3">Rendez-vous précédents</h2>
              <ul class="lignes">
                @for (r of v.avant; track r.id_rdv) {
                  <li class="rdv-ligne">
                    <span>
                      <strong>{{ moment(r) }}</strong>
                      <span class="etiquette-meta">{{ quoi(r) }}</span>
                    </span>
                    <span class="semaine-etat">{{ etat(r.etat) }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      </div>
    } @else {
      <div class="attente" aria-hidden="true"><span></span><span></span><span></span></div>
    }
  `,
})
export class RendezVousEspacePage implements OnInit {
  private readonly rdv = inject(RdvEspace);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  readonly contact = CONTACT;
  readonly etat = etatRdv;
  readonly ecrire = canalRdv;

  readonly vue = signal<VueRdvEspace | null>(null);
  readonly erreur = signal('');
  readonly occupe = signal(false);

  /** Créneaux où déplacer chaque rendez-vous, lus quand le parent ouvre « Déplacer ». */
  readonly prises = signal<Record<number, Prise | null>>({});
  readonly attentePrise = signal<number | null>(null);
  /** Le refus d'un geste, écrit dans la feuille du rendez-vous concerné. */
  readonly refusRdv = signal<{ id: number; texte: string } | null>(null);

  /** La prise d'un rendez-vous d'accompagnement. */
  readonly creneau = signal<Creneau | null>(null);
  readonly refus = signal('');
  readonly refusCreneau = signal('');
  canal: CanalRdv | '' = '';
  telephone = '';
  note = '';

  // Une clé par demande, tirée à l'ouverture du formulaire et gardée d'un essai à l'autre
  private cle = '';

  private readonly telephoneConnu = computed(() => this.vue()?.telephone_connu ?? false);

  ngOnInit(): void {
    void this.charger();
  }

  async charger(): Promise<void> {
    this.erreur.set('');
    try {
      this.recevoir(await this.rdv.vue());
    } catch (err) {
      if (accesRefuse(err)) {
        await this.session.relire().catch(() => undefined);
        return;
      }
      this.erreur.set(apiErrorMessage(err));
    }
  }

  /** « 45 minutes, en visio ou par téléphone » : la durée et les canaux tels que l'API les annonce. */
  modalites(v: VueRdvEspace): string {
    return [v.prise.duree ? minutesEcrites(v.prise.duree) : '', canauxEcrits(v.prise.canaux)].filter((m) => m !== '').join(', ');
  }

  dire(canal: string): string {
    return capitale(canalRdv(canal));
  }

  quand(c: Creneau): string {
    return capitale(momentEcrit(c.date, c.heure));
  }

  moment(r: Rdv): string {
    return capitale(momentEcrit(r.date_debut, undefined, true));
  }

  quoi(r: Rdv): string {
    return `${typeRdv(r.type)} ${canalRdv(r.canal)}`.trim();
  }

  choisir(creneau: Creneau): void {
    this.creneau.set(creneau);
    this.refusCreneau.set('');
    if (this.cle === '') {
      this.cle = crypto.randomUUID();
    }
  }

  async reserver(): Promise<void> {
    const creneau = this.creneau();
    if (this.occupe() || creneau === null || this.canal === '') {
      return;
    }
    const telephone = this.telephone.trim();
    if (this.canal === 'telephone' && !this.telephoneConnu() && telephone === '') {
      this.refus.set('Pour un rendez-vous par téléphone, indiquez le numéro où vous joindre.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      this.recevoir(
        await this.rdv.reserver({
          date: creneau.date,
          heure: creneau.heure,
          canal: this.canal,
          ...(this.canal === 'telephone' && !this.telephoneConnu() ? { telephone } : {}),
          ...(this.note.trim() !== '' ? { note: this.note.trim() } : {}),
          cle_saisie: this.cle,
        }),
      );
      this.creneau.set(null);
      this.note = '';
      this.cle = '';
      this.toast.success('Votre rendez-vous est réservé. Un e-mail vous le confirme.');
    } catch (err) {
      const motif = motifRefus(err);
      if (this.suivre(err) && (motif === 'creneau' || motif === 'complet')) {
        // Créneau pris entre-temps, ou un rendez-vous d'accompagnement est déjà à venir : la vue est à jour, la saisie gardée
        this.creneau.set(null);
        this.refusCreneau.set(apiErrorMessage(err));
      } else {
        this.refus.set(apiErrorMessage(err));
      }
    } finally {
      this.occupe.set(false);
    }
  }

  /** Lit les créneaux où déplacer ce rendez-vous (ils excluent le sien, et tiennent sa durée). */
  async lireCreneaux(r: Rdv): Promise<void> {
    this.attentePrise.set(r.id_rdv);
    try {
      const prise = await this.rdv.creneaux(r.id_rdv);
      this.prises.update((p) => ({ ...p, [r.id_rdv]: prise }));
    } catch (err) {
      this.refusRdv.set({ id: r.id_rdv, texte: apiErrorMessage(err) });
    } finally {
      this.attentePrise.set(null);
    }
  }

  deplacer(r: Rdv, creneau: Creneau): Promise<void> {
    return this.geste(r, () => this.rdv.deplacer(r.id_rdv, creneau), 'Votre rendez-vous est déplacé. Un e-mail vous le confirme.');
  }

  annuler(r: Rdv): Promise<void> {
    return this.geste(r, () => this.rdv.annuler(r.id_rdv), 'Votre rendez-vous est annulé. Un e-mail vous le confirme.');
  }

  /** Télécharge l'invitation de calendrier (.ics) que l'API vient de rendre. */
  async agenda(r: Rdv): Promise<void> {
    if (this.occupe()) {
      return;
    }
    this.occupe.set(true);
    this.refusRdv.set(null);
    try {
      telechargerInvitation(await this.rdv.invitation(r.id_rdv));
    } catch (err) {
      this.refusRdv.set({ id: r.id_rdv, texte: apiErrorMessage(err) });
    } finally {
      this.occupe.set(false);
    }
  }

  private async geste(r: Rdv, appel: () => Promise<VueRdvEspace>, fait: string): Promise<void> {
    if (this.occupe()) {
      return;
    }
    this.occupe.set(true);
    this.refusRdv.set(null);
    try {
      this.recevoir(await appel());
      this.toast.success(fait);
    } catch (err) {
      this.refusRdv.set({ id: r.id_rdv, texte: apiErrorMessage(err) });
      // Créneau pris entre-temps : la vue est à jour, les créneaux où déplacer ce rendez-vous se relisent
      if (this.suivre(err) && motifRefus(err) === 'creneau') {
        void this.lireCreneaux(r);
      }
    } finally {
      this.occupe.set(false);
    }
  }

  /** Un refus des rendez-vous rend la vue à jour : elle remplace l'ancienne. Rend faux si le refus n'en porte pas. */
  private suivre(err: unknown): boolean {
    const suite = suiteRefus<VueRdvEspace>(err);
    if (!suite.avenir || !suite.avant || !suite.prise) {
      return false;
    }
    this.recevoir({
      avenir: suite.avenir,
      avant: suite.avant,
      prise: suite.prise,
      peut_prendre: suite.peut_prendre ?? false,
      telephone_connu: suite.telephone_connu ?? this.telephoneConnu(),
      delai_heures: suite.delai_heures ?? this.vue()?.delai_heures ?? 12,
    });
    return true;
  }

  private recevoir(vue: VueRdvEspace): void {
    this.vue.set(vue);
    this.prises.set({});
    if (!vue.prise.canaux.includes(this.canal as CanalRdv)) {
      this.canal = vue.prise.canaux[0] ?? '';
    }
  }
}
