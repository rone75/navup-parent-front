import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { CONTACT, SITE } from '../../core/config';
import { euros, numero } from '../../core/format';
import { Offre } from '../../core/models';
import { PublicApiService } from '../../core/public-api.service';
import { Icon } from '../../shared/icon';
import { PorteHaut } from '../../shared/porte-haut';
import { Extrait } from './extrait';
import { PILIERS, SEMAINES } from './programme-contenu';
import { RdvDecouverte } from './rdv-decouverte';

const TITRE = 'NavUp, l’accompagnement parental moderne';
const DESCRIPTION =
  'Un programme de 12 semaines pour les parents d’adolescents : 40 audios courts et leurs fiches pratiques, pour avancer pas à pas. Sans abonnement.';

/**
 * La page publique : elle explique le programme et le vend. Écrite en HTML au build (prérendu), puis reprise par
 * l'appli dans le navigateur.
 * - Les textes de présentation sont ceux fournis par NavUp (« pages internet.pdf »), mot pour mot.
 * - Le prix et les modalités ne sont jamais écrits ici : ils sont lus dans l'API (v1/public/offre/) une fois la page
 *   affichée, et la commande renvoie le prix lu, refusé s'il a changé.
 * - Les questions fréquentes sont provisoires, à faire valider par NavUp.
 * - Le rendez-vous découverte se prend dans la feuille « Prenons le temps d'échanger… » (rdv-decouverte.ts) : ses
 *   créneaux, comme le prix, sont lus dans le navigateur ; sans eux, la feuille renvoie à l'adresse de contact.
 */
@Component({
  selector: 'app-landing-page',
  imports: [FormsModule, RouterLink, PorteHaut, Icon, Extrait, RdvDecouverte],
  template: `
    <div class="frigo">
      <app-porte-haut>
        <a class="facultatif" routerLink="/" fragment="programme">Le programme</a>
        <a class="facultatif" routerLink="/" fragment="prix">Le prix</a>
        <a class="btn btn-feuille" routerLink="/connexion">Se connecter</a>
      </app-porte-haut>

      <main class="porte porte-grande">
        <span class="poignee" aria-hidden="true"></span>

        <section class="une" aria-labelledby="titre-une">
          <div class="feuille aimantee feuille-titre">
            <span class="aimant" aria-hidden="true"></span>
            <h1 id="titre-une">L'accompagnement parental moderne</h1>
            <p>
              NavUp est un programme d'accompagnement parental qui vous aide à avancer pas à pas grâce à des contenus pratiques, des outils concrets et un suivi
              régulier.
            </p>
            <p class="actions">
              <a class="btn btn-grand" routerLink="/" fragment="rejoindre">Rejoindre le programme</a>
              @if (offre(); as o) {
                <span class="prix-etiquette"><span class="chiffre">{{ prix(o.prix) }}</span> sans abonnement</span>
              }
            </p>
          </div>

          <div class="pieces">
            <figure class="piece fiche se-pose">
              <span class="aimant bleu" aria-hidden="true"></span>
              <img
                src="images/fiche-01-page-1.webp"
                alt="Première page d'une fiche pratique du programme : « Comprendre la transformation corporelle de son adolescent »."
                width="1100"
                height="1555"
                fetchpriority="high"
              />
            </figure>
            <figure class="piece photo se-pose retard-1">
              <span class="aimant jaune" aria-hidden="true"></span>
              <img src="images/photo-parents-ado.webp" alt="Deux parents entourent leur adolescent, bras croisés." width="900" height="900" />
            </figure>
            <app-extrait class="se-pose retard-2" />
          </div>
        </section>

        <section class="rubrique deux" aria-labelledby="titre-pourquoi">
          <div class="feuille aimantee">
            <span class="aimant jaune gauche" aria-hidden="true"></span>
            <h2 id="titre-pourquoi">Pourquoi choisir NavUp</h2>
            <ul class="lignes coches">
              <li><app-icon nom="coche" /> <span>Comprendre son enfant sans culpabiliser.</span></li>
              <li><app-icon nom="coche" /> <span>Retrouver un cadre serein.</span></li>
              <li><app-icon nom="coche" /> <span>Mieux communiquer au quotidien.</span></li>
              <li><app-icon nom="coche" /> <span>Être accompagné pas à pas.</span></li>
              <li><app-icon nom="coche" /> <span>Avancer à son rythme.</span></li>
            </ul>
          </div>
          <div class="propos">
            <h2 class="h3">Un accompagnement parental conçu pour durer</h2>
            <p>Être parent ne vient avec aucun mode d'emploi.</p>
            <p>
              Lorsque les difficultés apparaissent, il n'est pas toujours facile de comprendre son enfant, de poser des limites ou de garder une relation apaisée.
            </p>
            <p>
              Le programme ne promet pas de solution miracle. Il vous accompagne pour construire, dans la durée, une relation plus sereine avec votre enfant.
            </p>
          </div>
        </section>

        <section class="rubrique deux" aria-labelledby="titre-semaine">
          <div class="feuille aimantee semainier">
            <span class="aimant jaune gauche" aria-hidden="true"></span>
            <h2 id="titre-semaine">Une semaine avec NavUp</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Semaine 1</th>
                  <th scope="col">Écouter</th>
                  <th scope="col">Lire</th>
                  <th scope="col">Essayer</th>
                </tr>
              </thead>
              <tbody>
                @for (s of semaines[0].sujets; track s.numero) {
                  <tr>
                    <th scope="row">
                      <span class="sujet-semainier">
                        <span class="chiffre">{{ num(s.numero) }}</span> <span>{{ s.titre }}</span>
                      </span>
                    </th>
                    <td><span class="a-cocher" aria-hidden="true"></span><span class="sr-only">à écouter</span></td>
                    <td><span class="a-cocher" aria-hidden="true"></span><span class="sr-only">à lire</span></td>
                    <td><span class="a-cocher" aria-hidden="true"></span><span class="sr-only">à essayer</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <dl class="gestes">
            <dt>Écouter</dt>
            <dd>Un audio de six à huit minutes par sujet, à écouter quand vous avez un moment. Trois ou quatre sujets s'ouvrent chaque semaine.</dd>
            <dt>Lire</dt>
            <dd>La fiche pratique du sujet : ce qu'il faut comprendre, les signes qui peuvent être normaux, ceux qui méritent votre vigilance.</dd>
            <dt>Essayer</dt>
            <dd>Comment l'accompagner cette semaine, le défi de la semaine, et une question de réflexion pour vous.</dd>
          </dl>
        </section>

        <section class="rubrique" id="programme" aria-labelledby="titre-programme">
          <h2 id="titre-programme">Douze semaines, quarante sujets</h2>
          <p class="chapo">Les semaines s'ouvrent une à une à partir de votre inscription. Ce qui est ouvert reste à vous, sans date à tenir.</p>
          <ul class="piliers" aria-label="Les cinq piliers du programme">
            @for (p of piliers; track p.numero) {
              <li><span class="pastille" [style.--p]="p.couleur" aria-hidden="true"></span> {{ p.nom }}</li>
            }
          </ul>
          <div class="semaines">
            @for (w of semaines; track w.numero) {
              <section class="feuille aimantee" [attr.aria-labelledby]="'semaine-' + w.numero">
                <span class="aimant gauche" [style.background]="couleur(w.sujets[0].pilier)" aria-hidden="true"></span>
                <h3 [id]="'semaine-' + w.numero">Semaine {{ w.numero }}</h3>
                <ol>
                  @for (s of w.sujets; track s.numero) {
                    <li>
                      <span>{{ num(s.numero) }}</span> <span>{{ s.titre }}</span>
                    </li>
                  }
                </ol>
              </section>
            }
          </div>
        </section>

        <section class="rubrique deux" id="prix" aria-labelledby="titre-prix">
          <div class="propos">
            <h2 id="titre-prix">Rejoignez NavUp</h2>
            <p class="chapo">
              Un accompagnement parental complet pour mieux comprendre, mieux communiquer et mieux accompagner son enfant au quotidien.
            </p>
            <p>
              Pendant 12 semaines, avancez à votre rythme. Chaque semaine, un nouvel audio et une fiche pratique se débloquent automatiquement pour vous
              accompagner pas à pas.
            </p>
            <figure class="piece photo penche-gauche">
              <span class="aimant bleu" aria-hidden="true"></span>
              <img src="images/photo-famille.webp" alt="Une famille de trois générations, côte à côte." width="900" height="900" loading="lazy" />
            </figure>
          </div>
          <div class="ticket" aria-label="Ce que comprend le programme, et son prix">
            <span class="aimant" aria-hidden="true"></span>
            <p><strong>Le programme comprend :</strong></p>
            <ul>
              <li>40 audios progressifs</li>
              <li>Des fiches pratiques</li>
              <li>Des questions de réflexion</li>
              <li>Des défis hebdomadaires</li>
              <li>Des rendez-vous collectifs</li>
              <li>Un accompagnement sur 12 semaines</li>
            </ul>
            @if (offre(); as o) {
              <p class="ticket-total">
                <span>Programme complet</span> <span class="chiffre">{{ prix(o.prix) }}</span>
              </p>
              @for (m of o.modalites; track m.fois) {
                @if (m.fois > 1) {
                  <p class="ticket-suite">Paiement possible en {{ m.fois }} fois : {{ detail(m.echeances) }}.</p>
                }
              }
            } @else {
              <p class="ticket-total"><span>Programme complet</span></p>
              <p class="ticket-suite">Paiement possible en plusieurs fois.</p>
            }
            <p class="ticket-suite">Sans abonnement. Sans renouvellement automatique.</p>
          </div>
        </section>

        <section class="rubrique deux inverse" id="rejoindre" aria-labelledby="titre-rejoindre">
          <div class="propos">
            <h2 id="titre-rejoindre">{{ ferme() ? 'NavUp arrive bientôt' : 'Votre inscription' }}</h2>
            @if (ferme()) {
              <p class="chapo">Les inscriptions ne sont pas encore ouvertes. Pour être prévenu de l'ouverture, ou pour poser une question, écrivez-nous.</p>
              <p class="actions">
                <a class="btn" [href]="'mailto:' + contact">Écrire à {{ contact }}</a>
              </p>
            } @else {
              <p>
                Le paiement se fait sur la page sécurisée de Stripe. Aussitôt après, un e-mail vous donne le lien pour choisir votre mot de passe : votre première
                semaine est ouverte.
              </p>
              <p class="secondaire">
                Une question avant de vous inscrire ? <a [href]="'mailto:' + contact">{{ contact }}</a>
              </p>
            }
          </div>

          @if (!ferme()) {
            <div class="feuille aimantee">
              <span class="aimant bleu" aria-hidden="true"></span>
              @if (suite() === 'email') {
                <div role="status">
                  <h3>Merci</h3>
                  <p>Un e-mail vous attend à cette adresse pour la suite.</p>
                </div>
              } @else {
                <form (ngSubmit)="commander()" novalidate>
                  <div class="champs-2">
                    <label class="champ">
                      <span>Prénom</span>
                      <input type="text" name="prenom" [(ngModel)]="prenom" autocomplete="given-name" maxlength="100" required />
                    </label>
                    <label class="champ">
                      <span>Nom</span>
                      <input type="text" name="nom" [(ngModel)]="nom" autocomplete="family-name" maxlength="100" required />
                    </label>
                  </div>
                  <label class="champ">
                    <span>E-mail</span>
                    <input type="email" name="email" [(ngModel)]="email" autocomplete="email" inputmode="email" maxlength="255" required aria-describedby="aide-email" />
                    <small id="aide-email">Ce sera l'identifiant de votre espace : c'est là qu'arrive votre lien d'accès.</small>
                  </label>
                  <label class="champ">
                    <span>Téléphone <span class="secondaire">(facultatif)</span></span>
                    <input type="tel" name="telephone" [(ngModel)]="telephone" autocomplete="tel" inputmode="tel" />
                  </label>

                  <!-- Champ leurre : un parent ne le voit pas, un robot le remplit et rien n'est enregistré -->
                  <div class="leurre" aria-hidden="true">
                    <label>Site <input type="text" name="site" [(ngModel)]="site" tabindex="-1" autocomplete="off" /></label>
                  </div>

                  <fieldset>
                    <legend>Paiement</legend>
                    @if (offre(); as o) {
                      @for (m of o.modalites; track m.fois) {
                        <label class="case">
                          <input type="radio" name="fois" [value]="m.fois" [(ngModel)]="fois" />
                          <span>
                            @if (m.fois === 1) {
                              En une fois : {{ prix(m.echeances[0]) }}
                            } @else {
                              En {{ m.fois }} fois : {{ prix(m.echeances[0]) }} aujourd'hui, puis {{ suivantes(m.echeances) }} prélevés chaque mois sur la même carte
                            }
                          </span>
                        </label>
                      }
                    } @else if (offreErreur()) {
                      <p class="refus" role="alert">
                        <app-icon nom="alerte" />
                        <span>Le prix ne s'affiche pas. <button class="lien" type="button" (click)="lireOffre()">Réessayer</button></span>
                      </p>
                    } @else {
                      <div class="attente" aria-hidden="true"><span></span><span></span></div>
                    }
                  </fieldset>

                  <fieldset>
                    <legend>Avant de payer</legend>
                    <label class="case">
                      <input type="checkbox" name="cgv" [(ngModel)]="cgv" />
                      <span>J'accepte les <a routerLink="/cgv" target="_blank">conditions générales de vente</a>.</span>
                    </label>
                    <label class="case">
                      <input type="checkbox" name="confidentialite" [(ngModel)]="confidentialite" />
                      <span>J'ai lu la <a routerLink="/confidentialite" target="_blank">politique de confidentialité</a>.</span>
                    </label>
                    <label class="case">
                      <input type="checkbox" name="communications" [(ngModel)]="communications" />
                      <span>Je veux bien recevoir les nouvelles de NavUp Academy <span class="secondaire">(facultatif)</span>.</span>
                    </label>
                  </fieldset>

                  @if (refus(); as r) {
                    <p class="refus" role="alert"><app-icon nom="alerte" /> <span>{{ r }}</span></p>
                  }
                  <button class="btn btn-grand btn-bloc" type="submit" [disabled]="occupe() || offre() === null">Continuer vers le paiement</button>
                </form>
              }
            </div>
          }
        </section>

        <section class="rubrique deux" id="rendez-vous" aria-labelledby="titre-echange">
          <div class="feuille note aimantee">
            <span class="aimant bleu gauche" aria-hidden="true"></span>
            <h2 id="titre-echange">Prenons le temps d'échanger…</h2>
            <p>Chaque famille est différente.</p>
            <p>
              Avant de rejoindre NavUp, nous vous proposons un rendez-vous afin de vous présenter le programme, répondre à vos questions et vérifier qu'il
              correspond à vos besoins.
            </p>
            <p>Cet échange est gratuit, sans engagement et sans obligation d'achat.</p>
            <!-- Les créneaux du rendez-vous découverte, lus dans le navigateur ; sans eux, le lien vers l'adresse de contact -->
            <app-rdv-decouverte />
          </div>
          <figure class="piece photo penche-droite">
            <span class="aimant" aria-hidden="true"></span>
            <img src="images/photo-echange.webp" alt="Deux hommes se serrent la main." width="900" height="900" loading="lazy" />
          </figure>
        </section>

        <section class="rubrique questions" aria-labelledby="titre-questions">
          <h2 id="titre-questions">Questions fréquentes</h2>
          <!-- À retirer quand NavUp aura validé ces réponses : elles sont écrites d'après son cahier, pas par lui -->
          <p class="provisoire">Réponses provisoires, en attente de validation par NavUp.</p>
          <details>
            <summary>Comment se déroule le programme ? <app-icon nom="chevron" /></summary>
            <p>
              Il dure douze semaines. Chaque semaine, trois ou quatre nouveaux sujets s'ouvrent dans votre espace : pour chacun, un audio et sa fiche pratique.
              Les semaines déjà ouvertes restent accessibles.
            </p>
          </details>
          <details>
            <summary>Combien de temps faut-il y consacrer ? <app-icon nom="chevron" /></summary>
            <p>Un audio dure de six à huit minutes, et sa fiche se lit en quelques minutes. Vous avancez à votre rythme : rien ne compte les jours.</p>
          </details>
          <details>
            <summary>À qui s'adresse NavUp ? <app-icon nom="chevron" /></summary>
            <p>Aux parents d'adolescents, au moment où leur enfant grandit, change et cherche sa place : scolarité, écrans, fréquentations, cadre à la maison.</p>
          </details>
          <details>
            <summary>Y a-t-il un abonnement ? <app-icon nom="chevron" /></summary>
            <p>Non. Le programme se paie une fois, comptant ou en plusieurs fois, sans abonnement ni renouvellement automatique.</p>
          </details>
          <details>
            <summary>Comment accéder à mon espace après le paiement ? <app-icon nom="chevron" /></summary>
            <p>
              Vous recevez un e-mail avec un lien pour choisir votre mot de passe. Vous vous connectez ensuite avec votre e-mail, sur téléphone comme sur
              ordinateur.
            </p>
          </details>
        </section>
      </main>

      <footer class="porte plinthe">
        <img src="images/logo-academy.webp" alt="NavUp Academy" width="640" height="373" loading="lazy" />
        <p>
          Contactez-nous pour en savoir plus : <a [href]="'mailto:' + contact">{{ contact }}</a>
        </p>
        <ul>
          <li><a routerLink="/cgv">Conditions générales de vente</a></li>
          <li><a routerLink="/confidentialite">Confidentialité</a></li>
          <li><a routerLink="/mentions-legales">Mentions légales</a></li>
        </ul>
      </footer>
    </div>
  `,
})
export class LandingPage {
  private readonly api = inject(PublicApiService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  readonly contact = CONTACT;
  readonly piliers = PILIERS;
  readonly semaines = SEMAINES;
  readonly num = numero;
  readonly prix = euros;

  /** L'offre lue dans l'API, une fois la page affichée (jamais au prérendu : un prix ne se fige pas dans le HTML). */
  readonly offre = signal<Offre | null>(null);
  readonly offreErreur = signal(false);
  /** L'achat en ligne est fermé (réglage de la Tour de contrôle) : la page présente le programme sans vendre. */
  readonly ferme = signal(false);
  readonly suite = signal<'saisie' | 'email'>('saisie');
  readonly refus = signal('');
  readonly occupe = signal(false);

  prenom = '';
  nom = '';
  email = '';
  telephone = '';
  site = '';
  fois = 1;
  cgv = false;
  confidentialite = false;
  communications = false;

  // Une clé par commande : un double appui ou un envoi répété rouvre la même page de paiement
  private cle = '';

  constructor() {
    const titre = inject(Title);
    const meta = inject(Meta);
    titre.setTitle(TITRE);
    meta.updateTag({ name: 'description', content: DESCRIPTION });
    meta.updateTag({ property: 'og:title', content: TITRE });
    meta.updateTag({ property: 'og:description', content: DESCRIPTION });
    meta.updateTag({ property: 'og:type', content: 'website' });
    meta.updateTag({ property: 'og:url', content: SITE });
    meta.updateTag({ property: 'og:image', content: SITE + 'images/partage.jpg' });
    meta.updateTag({ property: 'og:locale', content: 'fr_FR' });
    meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

    afterNextRender(() => void this.lireOffre());
  }

  async lireOffre(): Promise<void> {
    this.offreErreur.set(false);
    try {
      const offre = await firstValueFrom(this.api.offre());
      this.offre.set(offre);
      this.ferme.set(!offre.ouvert);
    } catch {
      this.offreErreur.set(true);
    }
  }

  couleur(pilier: number): string {
    return PILIERS[pilier - 1].couleur;
  }

  /** « 99,68 €, puis 99,66 € et 99,66 € » : chaque échéance telle que l'API la donne, sans rien additionner. */
  detail(echeances: number[]): string {
    const [premiere, ...autres] = echeances.map(euros);
    return autres.length === 0 ? premiere : `${premiere}, puis ${this.enumerer(autres)}`;
  }

  suivantes(echeances: number[]): string {
    return this.enumerer(echeances.slice(1).map(euros));
  }

  private enumerer(montants: string[]): string {
    return montants.length <= 1 ? montants.join('') : `${montants.slice(0, -1).join(', ')} et ${montants[montants.length - 1]}`;
  }

  async commander(): Promise<void> {
    const offre = this.offre();
    if (this.occupe() || offre === null || !this.navigateur) {
      return;
    }
    if (this.prenom.trim() === '' || this.nom.trim() === '' || this.email.trim() === '') {
      this.refus.set('Indiquez votre prénom, votre nom et votre e-mail.');
      return;
    }
    if (!this.cgv || !this.confidentialite) {
      this.refus.set('Pour continuer, acceptez les conditions générales de vente et la politique de confidentialité.');
      return;
    }
    this.occupe.set(true);
    this.refus.set('');
    if (this.cle === '') {
      this.cle = crypto.randomUUID();
    }
    try {
      const reponse = await firstValueFrom(
        this.api.commander({
          prenom: this.prenom.trim(),
          nom: this.nom.trim(),
          email: this.email.trim(),
          ...(this.telephone.trim() !== '' ? { telephone: this.telephone.trim() } : {}),
          fois: this.fois,
          cgv: 1,
          confidentialite: 1,
          communications: this.communications ? 1 : 0,
          site: this.site,
          cle_saisie: this.cle,
          prix_affiche: offre.prix,
        }),
      );
      if (reponse.suite === 'paiement') {
        location.assign(reponse.url);
        return;
      }
      // Rien à payer ici (une inscription existe déjà pour cette adresse) : la réponse ne dit rien du dossier
      this.suite.set('email');
      this.cle = '';
    } catch (err) {
      this.refus.set(apiErrorMessage(err));
      // Le prix a pu changer : il est relu, la page montre le bon
      void this.lireOffre();
    }
    this.occupe.set(false);
  }
}
