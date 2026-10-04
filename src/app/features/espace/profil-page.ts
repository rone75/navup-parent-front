import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { jourEcrit } from '../../core/format';
import { LecteurService } from '../../core/lecteur.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

/** Longueur minimale d'un mot de passe : la même que navup-parent-api, qui fait foi. */
const LONGUEUR_MIN = 10;

/**
 * Profil : l'identité du parent (tenue par NavUp, donc en lecture), les dates de son programme, sa préférence
 * d'e-mail, son mot de passe, la déconnexion. Le profil reste lisible quel que soit l'état de l'accès.
 */
@Component({
  selector: 'app-profil-page',
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <header><h1>Profil</h1></header>

    @if (moi(); as m) {
      <div class="profil">
        <section class="feuille" aria-labelledby="titre-vous">
          <h2 id="titre-vous" class="h3">Vous</h2>
          <dl class="kv">
            <dt>Prénom</dt>
            <dd>{{ m.prenom || '—' }}</dd>
            <dt>Nom</dt>
            <dd>{{ m.nom }}</dd>
            <dt>E-mail</dt>
            <!-- Une adresse longue se coupe après l'arobase, pas au milieu d'un mot -->
            <dd>{{ adresse()[0] }}@<wbr />{{ adresse()[1] }}</dd>
          </dl>
          <p class="petit secondaire suite">Une erreur, un changement d'adresse ? Écrivez-nous : <a [href]="'mailto:' + contact">{{ contact }}</a>.</p>
        </section>

        <section class="feuille" aria-labelledby="titre-programme">
          <h2 id="titre-programme" class="h3">Votre programme</h2>
          <dl class="kv">
            <dt>Programme</dt>
            <dd>{{ m.formation }}</dd>
            <dt>Début</dt>
            <dd>{{ jour(m.acces.date_debut) }}</dd>
            <dt>Dernière semaine</dt>
            <dd>jusqu'au {{ jour(m.acces.date_fin) }}</dd>
            <dt>Accès</dt>
            <dd>{{ ecrireAcces() }}</dd>
          </dl>
        </section>

        <section class="feuille" aria-labelledby="titre-emails">
          <h2 id="titre-emails" class="h3">E-mails</h2>
          <label class="case">
            <input type="checkbox" [checked]="m.annonce_semaine" [disabled]="occupe()" (change)="annonce($event)" />
            <span>Me prévenir par e-mail quand une nouvelle semaine s'ouvre</span>
          </label>
          <p class="petit secondaire">Les e-mails de paiement et de mot de passe, eux, partent toujours.</p>
        </section>

        <section class="feuille" aria-labelledby="titre-mdp">
          <h2 id="titre-mdp" class="h3">Mot de passe</h2>
          <form (ngSubmit)="changer()" novalidate>
            <label class="champ">
              <span>Mot de passe actuel</span>
              <input type="password" name="actuel" [(ngModel)]="actuel" autocomplete="current-password" required />
            </label>
            <label class="champ">
              <span>Nouveau mot de passe</span>
              <input type="password" name="nouveau" [(ngModel)]="nouveau" autocomplete="new-password" required aria-describedby="regle-nouveau" />
              <small id="regle-nouveau">{{ longueur }} caractères au moins. Vos autres appareils seront déconnectés.</small>
            </label>
            @if (refus(); as r) {
              <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
            }
            <button class="btn btn-feuille" type="submit" [disabled]="occupe()">Changer mon mot de passe</button>
          </form>
        </section>

        <section class="feuille" aria-labelledby="titre-navup">
          <h2 id="titre-navup" class="h3">NavUp</h2>
          <ul class="lignes">
            <li><a [href]="'mailto:' + contact">Nous écrire : {{ contact }}</a></li>
            <li><a routerLink="/cgv">Conditions générales de vente</a></li>
            <li><a routerLink="/confidentialite">Politique de confidentialité</a></li>
            <li><a routerLink="/mentions-legales">Mentions légales</a></li>
          </ul>
          <p class="petit secondaire suite">Pour supprimer votre compte et vos données, écrivez-nous : nous le faisons à votre demande.</p>
        </section>
      </div>

      <p class="actions">
        <button class="btn btn-feuille" type="button" (click)="deconnecter()"><app-icon nom="sortie" /> Me déconnecter</button>
      </p>
    }
  `,
})
export class ProfilPage {
  private readonly session = inject(SessionService);
  private readonly lecteur = inject(LecteurService);
  private readonly toast = inject(ToastService);

  readonly moi = this.session.moi;
  readonly contact = CONTACT;
  readonly longueur = LONGUEUR_MIN;
  readonly refus = signal('');
  readonly occupe = signal(false);

  actuel = '';
  nouveau = '';

  /** L'e-mail en deux morceaux, de part et d'autre de l'arobase. */
  readonly adresse = computed(() => {
    const [nom, ...domaine] = (this.moi()?.email ?? '').split('@');
    return [nom, domaine.join('@')];
  });

  /** L'état de l'accès, écrit : il vient de l'API, rien n'est comparé ici. */
  readonly ecrireAcces = computed(() => {
    const a = this.moi()?.acces;
    if (!a) {
      return '';
    }
    switch (a.etat) {
      case 'suspendu':
        return 'suspendu';
      case 'pas_commence':
        return `ouvre le ${jourEcrit(a.date_debut, true)}`;
      case 'ferme':
        return `terminé le ${jourEcrit(a.date_fin_acces, true)}`;
      default:
        return `ouvert jusqu'au ${jourEcrit(a.date_fin_acces, true)}`;
    }
  });

  jour(date: string): string {
    return jourEcrit(date, true);
  }

  async annonce(evenement: Event): Promise<void> {
    const case_ = evenement.target as HTMLInputElement;
    this.occupe.set(true);
    try {
      await this.session.preferences({ annonce_semaine: case_.checked });
      this.toast.success(case_.checked ? 'Vous serez prévenu à chaque nouvelle semaine.' : 'Plus d’e-mail à chaque nouvelle semaine.');
    } catch (err) {
      case_.checked = !case_.checked;
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }

  async changer(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (this.actuel === '' || this.nouveau.length < LONGUEUR_MIN) {
      this.refus.set(`Saisissez votre mot de passe actuel, puis un nouveau d'au moins ${LONGUEUR_MIN} caractères.`);
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      await this.session.changerMotDePasse(this.actuel, this.nouveau);
      this.actuel = '';
      this.nouveau = '';
      this.toast.success('Votre mot de passe est changé.');
    } catch (err) {
      this.refus.set(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }

  deconnecter(): void {
    this.lecteur.arreter();
    this.session.deconnexion();
  }
}
