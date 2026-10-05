# CLAUDE.md

Guide pour Claude Code sur ce dépôt : front Angular 21 de l'appli des parents de NavUp Academy (page publique de vente et espace personnel).
API : `/var/www/navup-parent-api` (espace personnel) et les endpoints publics de `/var/www/navup-api` (Tour de contrôle) ; lire leurs `CLAUDE.md`. Outil interne : `~/Documents/_DEV/navup-front`, dont ce dépôt reprend les conventions.

## Feuille de route

Première livraison (faite) : page publique avec achat, accès par lien, connexion, accueil, programme, sujet (fiche et lecteur), progression, profil. Étape 6b (faite, avec la Tour de contrôle) : rendez-vous découverte pris sur la page publique, page `/rendez-vous` de gestion par le lien de l'e-mail, rendez-vous d'accompagnement dans l'espace (`espace/rendez-vous`, rappel sur l'accueil). Ensuite : annonces, ressources, communauté, notifications, hors-ligne ; suppression du compte en libre-service à l'étape 8.

## À lire avant de toucher à l'interface

- `PRODUCT.md` : les deux visiteurs (le parent qui hésite, le parent inscrit), les engagements de marque, ce qui est fourni et ce qui ne l'est pas.
- `DESIGN.md` : le système visuel « La porte du frigo ». Toute nouvelle page s'y conforme ; le design se travaille avec le skill `impeccable` (briefs de surface dans `.impeccable/surfaces/`).
- `README.md` : rendu, conventions, vérification.

## Règles

- Angular 21 sans zone.js, sans librairie UI. Composants standalone à fichier unique, signaux, `inject()`, formulaires `ngModel`.
- Un seul `src/styles.scss` à jetons ; aucun style de composant, aucun attribut `style`.
- **Prérendu** : la page publique et les pages légales s'exécutent aussi au build. Pas de `localStorage`, `window`, `document`, `Audio` hors d'`isPlatformBrowser` ou d'`afterNextRender`. Une nouvelle page publique s'ajoute à `app.routes.server.ts`.
- **Aucun prix ni montant écrit dans le front** : l'offre vient de `v1/public/offre/`, lue dans le navigateur ; `euros()` (`core/format.ts`) l'affiche ; le front n'additionne rien et renvoie `prix_affiche` avec la commande.
- **L'API décide** : état de l'accès, semaine en cours, dates, totaux, « terminé ». Le front n'en déduit aucun, et ne lit jamais l'horloge de l'appareil pour débloquer quoi que ce soit.
- Le jeton de session est dans `localStorage['navup_parent_token']` : c'est la seule clé du stockage local. Aucune donnée du parent ni du programme n'y entre, ni dans l'URL.
- Un jeton de lien d'accès ne reste jamais dans une adresse : lu dans le fragment, retiré par `history.replaceState`, envoyé dans un corps de requête.
- Le son : un seul élément `<audio>` (`LecteurService`), jamais de `play()` hors d'un geste, « terminé » jamais déduit de l'écoute.
- Jamais de `alert`, `confirm` ou `prompt`. Aucun compteur de jours manqués, point, classement ni relance culpabilisante.
- Textes de la page publique : ceux de NavUp, mot pour mot. Ne rien inventer : ni témoignage, ni garantie, ni présentation du fondateur, ni texte légal.
- **Rendez-vous** : créneaux, règles (délai, déplacements, un seul à venir) et états viennent de navup-api ; le front les affiche, il ne les déduit pas. Dates et heures de Paris en chaînes, jamais converties par le fuseau de l'appareil, et « heure de Paris » toujours écrit. La réponse d'une réservation publique ne dit rien d'un dossier : l'écran de confirmation n'affirme rien de plus que l'e-mail parti. Le jeton du lien de gestion (fragment, retiré de l'adresse) et le billet de l'espace (`RdvEspace`, redemandé une fois sur 401) ne se gardent nulle part. Un rendez-vous passé se dit « passé », jamais « absent ». Sans créneau ou sur erreur, la page publique garde le lien vers l'adresse de contact.
- **Vos données** (profil) : « Télécharger mes données » demande un billet à l'API des parents (mot de passe retapé), puis le fichier à navup-api ; le fichier se fabrique dans la page (`telechargerDonnees`), rien n'est gardé. « Supprimer mon compte » dit ce qui part et ce qui reste, puis ferme la session locale.
- **Politique de contenu** (`public/.htaccess`) : `script-src 'self'`, sans exception. Donc aucun script en ligne : pas de relecture des événements à l'hydratation (`provideClientHydration()` seul), pas de CSS critique en ligne (`inlineCritical: false`). Adresses des API : `src/environments/`, jamais en dur ; toute nouvelle origine s'ajoute aussi à `NAVUP_CONNECT` du vhost.
- Une sortie de composant (`output()`) ne porte jamais le nom d'un événement du navigateur.
- Tout en français : libellés, messages, commentaires.

## Vérifier

```bash
ng build --configuration development   # sans avertissement ; « Prerendered 4 static routes »
npm test                               # Vitest
```

Puis, avec `ng serve --host 127.0.0.1 --port 4201` lancé (aucun identifiant à fournir) :

```bash
npm run parcours    # contrôles fonctionnels (outils/parcours.js)
npm run captures    # captures à 390, 820 et 1440 px dans .impeccable/review/ (outils/captures.js)
```

Ouvrir les captures des trois largeurs avant de conclure. Chaque nouvelle page ajoute ses captures à `outils/captures.js` et ses contrôles à `outils/parcours.js`. L'audio sur un vrai téléphone se contrôle à la main (liste dans le README).
