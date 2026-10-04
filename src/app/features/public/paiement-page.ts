import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT } from '../../core/config';
import { EtatPaiement } from '../../core/models';
import { PorteHaut } from '../../shared/porte-haut';

interface Message {
  titre: string;
  texte: string;
  suite: 'connexion' | 'rejoindre' | 'aucune';
}

// Les six états que rend v1/public/retour/ de la Tour de contrôle ; tout autre paramètre vaut « invalide »
const MESSAGES: Record<EtatPaiement, Message> = {
  ok: {
    titre: 'Merci, votre paiement est bien reçu',
    texte: 'Un e-mail vient de partir à votre adresse. Il contient le lien pour choisir votre mot de passe et entrer dans votre espace : votre première semaine vous y attend.',
    suite: 'connexion',
  },
  annule: {
    titre: "Le paiement n'a pas été effectué",
    texte: "Rien n'a été débité. Vous pouvez reprendre quand vous le souhaitez.",
    suite: 'rejoindre',
  },
  regle: {
    titre: 'Tout est déjà réglé',
    texte: "Il n'y a plus rien à payer avec ce lien. Merci.",
    suite: 'connexion',
  },
  invalide: {
    titre: "Ce lien n'est plus valable",
    texte: 'Écrivez-nous pour en recevoir un nouveau.',
    suite: 'aucune',
  },
  attente: {
    titre: 'Un paiement est déjà en cours',
    texte: 'Son résultat sera connu dans quelques minutes : il est inutile de payer une seconde fois.',
    suite: 'aucune',
  },
  indisponible: {
    titre: 'Le paiement en ligne est momentanément indisponible',
    texte: 'Réessayez dans quelques minutes. Rien n’a été débité.',
    suite: 'rejoindre',
  },
};

/** Retour de la page de paiement de Stripe : la Tour de contrôle y renvoie le parent avec l'issue (?paiement=…). */
@Component({
  selector: 'app-paiement-page',
  imports: [RouterLink, PorteHaut],
  template: `
    <div class="frigo">
      <app-porte-haut><a routerLink="/connexion">Se connecter</a></app-porte-haut>
      <main class="porte porte-grande seule">
        <section class="feuille aimantee" [attr.data-etat]="etat()">
          <span class="aimant" [class.bleu]="etat() !== 'ok'" aria-hidden="true"></span>
          <h1>{{ message().titre }}</h1>
          <p>{{ message().texte }}</p>
          <p class="secondaire">Une question ? <a [href]="'mailto:' + contact">{{ contact }}</a></p>
          <p class="actions">
            @switch (message().suite) {
              @case ('connexion') {
                <a class="btn" routerLink="/connexion">Aller à la connexion</a>
              }
              @case ('rejoindre') {
                <a class="btn" routerLink="/" fragment="rejoindre">Revenir au programme</a>
              }
              @default {
                <a class="btn btn-feuille" routerLink="/">Revenir au programme</a>
              }
            }
          </p>
        </section>
      </main>
    </div>
  `,
})
export class PaiementPage {
  /** Issue du paiement (paramètre d'adresse posé par la Tour de contrôle). */
  readonly paiement = input<string>();

  readonly contact = CONTACT;
  readonly etat = computed<EtatPaiement>(() => {
    const p = this.paiement();
    return p !== undefined && p in MESSAGES ? (p as EtatPaiement) : 'invalide';
  });
  readonly message = computed(() => MESSAGES[this.etat()]);
}
