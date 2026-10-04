import { Component, computed, inject, input } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CONTACT } from '../../core/config';
import { PorteHaut } from '../../shared/porte-haut';

interface TexteLegal {
  titre: string;
  /** Ce que le texte doit couvrir : les rubriques, sans leur contenu, que NavUp doit fournir. */
  rubriques: string[];
}

// Structure des trois textes légaux. Leur contenu engage NavUp : il n'est pas rédigé ici.
const TEXTES: Record<string, TexteLegal> = {
  cgv: {
    titre: 'Conditions générales de vente',
    rubriques: [
      'Vendeur et coordonnées',
      'Le programme NavUp : ce qui est vendu, sa durée, la durée de l’accès',
      'Prix et modalités de paiement (comptant, en plusieurs fois)',
      'Accès immédiat au contenu numérique et droit de rétractation',
      'Impayé, suspension de l’accès',
      'Propriété des contenus et usage personnel',
      'Réclamations, médiation, droit applicable',
    ],
  },
  confidentialite: {
    titre: 'Politique de confidentialité',
    rubriques: [
      'Responsable du traitement et contact',
      'Données recueillies : identité, e-mail, paiement (par Stripe), progression dans le programme',
      'Pourquoi, et sur quelle base',
      'Durées de conservation',
      'Destinataires et sous-traitants',
      'Vos droits : accès, rectification, suppression, et comment les exercer',
      'Cookies et stockage du navigateur',
    ],
  },
  'mentions-legales': {
    titre: 'Mentions légales',
    rubriques: ['Éditeur du site', 'Directeur de la publication', 'Hébergeur', 'Propriété intellectuelle', 'Contact'],
  },
};

/**
 * Texte légal (conditions générales de vente, confidentialité, mentions légales).
 * Aucun de ces textes n'a été fourni : la page en montre le plan et dit qu'il reste à écrire. Tant que c'est le cas,
 * elle demande aux moteurs de recherche de ne pas l'indexer, et la vente ne doit pas ouvrir.
 */
@Component({
  selector: 'app-legal-page',
  imports: [RouterLink, PorteHaut],
  template: `
    <div class="frigo">
      <app-porte-haut><a routerLink="/">Le programme</a></app-porte-haut>
      <main class="porte porte-grande seule">
        <article class="feuille large texte-long">
          <h1>{{ texte().titre }}</h1>
          <p class="refus" role="note">Ce texte reste à fournir par NavUp. Il sera publié ici avant l'ouverture des inscriptions.</p>
          <p>Il traitera des points suivants :</p>
          <ol>
            @for (r of texte().rubriques; track r) {
              <li>{{ r }}</li>
            }
          </ol>
          <p>
            D'ici là, pour toute question : <a [href]="'mailto:' + contact">{{ contact }}</a>.
          </p>
        </article>
      </main>
    </div>
  `,
})
export class LegalPage {
  /** Le texte demandé (donnée de la route). */
  readonly page = input.required<string>();

  readonly contact = CONTACT;
  readonly texte = computed(() => TEXTES[this.page()] ?? TEXTES['mentions-legales']);

  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex' });
  }
}
