import { Component, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { CONTACT } from '../../core/config';
import { EspaceApiService } from '../../core/espace-api.service';
import { telechargerDonnees } from '../../core/fichier';
import { PublicApiService } from '../../core/public-api.service';
import { jourEcrit } from '../../core/format';
import { LecteurService } from '../../core/lecteur.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

/** Longueur minimale d'un mot de passe : la même que navup-parent-api, qui fait foi. */
const LONGUEUR_MIN = 10;

/**
 * Profil : l'identité du parent (tenue par NavUp, donc en lecture), les dates de son programme, sa préférence
 * d'e-mail, son mot de passe, ses droits sur ses données (les télécharger, supprimer son compte), la déconnexion.
 * Le profil reste lisible quel que soit l'état de l'accès.
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
        </section>

        <section class="feuille" aria-labelledby="titre-donnees" data-bloc="donnees">
          <h2 id="titre-donnees" class="h3">Vos données</h2>
          @switch (geste()) {
            @case ('telecharger') {
              <form (ngSubmit)="telecharger()" novalidate>
                <p>Un fichier avec ce que NavUp garde à votre sujet : ce que vous nous avez dit de votre famille, vos achats et paiements, vos rendez-vous, les e-mails reçus, votre progression.</p>
                <label class="champ">
                  <span>Votre mot de passe, pour confirmer</span>
                  <input id="mdp-donnees" type="password" name="pass" [(ngModel)]="motDePasse" autocomplete="current-password" required />
                </label>
                @if (refus(); as r) {
                  <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
                }
                <div class="donnees-gestes">
                  <button class="btn" type="submit" [disabled]="occupe()">Télécharger</button>
                  <button class="lien" type="button" (click)="fermer()">Annuler</button>
                </div>
              </form>
            }
            @case ('supprimer') {
              <form (ngSubmit)="supprimer()" novalidate>
                <p><strong>Supprimer votre compte&nbsp;?</strong></p>
                <dl class="kv">
                  <dt>Tout de suite</dt>
                  <dd>Votre espace se ferme, sur tous vos appareils, et votre mot de passe est effacé.</dd>
                  <dt>Dans le mois</dt>
                  <dd>NavUp efface ce que vous nous avez confié sur votre famille, nos échanges, vos rendez-vous et votre progression.</dd>
                  <dt>Ce qui reste</dt>
                  <dd>Vos achats et paiements, le temps que la loi impose de garder les pièces comptables (10 ans), puis votre nom avec eux.</dd>
                </dl>
                <p class="petit secondaire suite">Vous voulez garder une copie de vos données&nbsp;? Téléchargez-les d’abord : ensuite, ce ne sera plus possible.</p>
                <label class="champ">
                  <span>Votre mot de passe, pour confirmer</span>
                  <input id="mdp-suppression" type="password" name="pass" [(ngModel)]="motDePasse" autocomplete="current-password" required />
                </label>
                @if (refus(); as r) {
                  <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
                }
                <div class="donnees-gestes">
                  <button class="btn btn-alerte" type="submit" [disabled]="occupe()">Supprimer mon compte</button>
                  <button class="lien" type="button" (click)="fermer()">Garder mon compte</button>
                </div>
              </form>
            }
            @default {
              <p>NavUp garde ce que vous nous avez confié pour vous accompagner. Vous pouvez en recevoir une copie, ou supprimer votre compte.</p>
              <div class="donnees-gestes">
                <button class="btn btn-feuille" type="button" (click)="ouvrir('telecharger')">Télécharger mes données</button>
                <button class="lien" type="button" (click)="ouvrir('supprimer')">Supprimer mon compte</button>
              </div>
            }
          }
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

  private readonly espace = inject(EspaceApiService);
  private readonly publique = inject(PublicApiService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly moi = this.session.moi;
  /** Geste ouvert sur les données ; le mot de passe retapé ne sert qu'à lui et s'efface aussitôt. */
  readonly geste = signal<'telecharger' | 'supprimer' | null>(null);
  motDePasse = '';
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

  ouvrir(g: 'telecharger' | 'supprimer'): void {
    this.motDePasse = '';
    this.refus.set('');
    this.geste.set(g);
    const id = g === 'telecharger' ? 'mdp-donnees' : 'mdp-suppression';
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }

  fermer(): void {
    this.motDePasse = '';
    this.refus.set('');
    this.geste.set(null);
  }

  /** Billet de l'API des parents (mot de passe retapé), puis les données, lues une fois chez NavUp et remises en fichier. */
  async telecharger(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (this.motDePasse === '') {
      this.refus.set('Saisissez votre mot de passe.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      const billet = await firstValueFrom(this.espace.billetDonnees(this.motDePasse));
      this.motDePasse = '';
      const donnees = await firstValueFrom(this.publique.donnees(billet));
      telechargerDonnees(donnees, new Date().toISOString().slice(0, 10));
      this.geste.set(null);
      this.toast.success('Vos données sont téléchargées.');
    } catch (err) {
      this.motDePasse = '';
      this.refus.set(apiErrorMessage(err));
    } finally {
      this.occupe.set(false);
    }
  }

  async supprimer(): Promise<void> {
    if (this.occupe()) {
      return;
    }
    if (this.motDePasse === '') {
      this.refus.set('Saisissez votre mot de passe.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    try {
      await firstValueFrom(this.espace.supprimerCompte(this.motDePasse));
      this.motDePasse = '';
      // L'API a fermé toutes les sessions : on oublie la nôtre, sans lui redemander de la fermer
      this.lecteur.arreter();
      this.session.vider();
      this.toast.success('Votre demande est enregistrée et votre espace est fermé. NavUp efface vos données dans le mois.');
      void this.router.navigateByUrl('/connexion');
    } catch (err) {
      this.motDePasse = '';
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
