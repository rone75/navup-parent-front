# navup-parent-front

L'appli des parents de NavUp Academy : la **page publique** qui explique et vend le programme NavUp (douze semaines, quarante sujets, un audio et sa fiche pratique par sujet), et l'**espace personnel** où le parent inscrit le suit. Application Angular 21 (standalone, signaux, sans zone.js).

Elle parle à deux API : `navup-parent-api` (`/var/www/navup-parent-api`, l'espace personnel) et les endpoints publics de la Tour de contrôle (`/var/www/navup-api` : offre, commande, lien d'accès). Documents de référence : `PRODUCT.md` (le produit), `DESIGN.md` (le système visuel « La porte du frigo »), le cahier de l'écosystème (`~/Documents/nabil/Cahier de charges NavUp Academy.pdf`), les README des deux API.

Cette version : page publique avec achat, création du mot de passe par lien, connexion, accueil, programme, sujet (fiche et lecteur audio), progression, profil ; rendez-vous en ligne (découverte sur la page publique, gestion par lien, accompagnement dans l'espace). Restent à venir : annonces, ressources, communauté, notifications, hors-ligne.

## Démarrage

Prérequis : Node 20+, npm 10, les deux API servies par Apache (`http://localhost/navup-api/`, `http://localhost/navup-parent-api/`).

```bash
npm install                             # legacy-peer-deps est fixé dans .npmrc, ne pas le retirer
npm start                               # ng serve → http://localhost:4201/
npm run build                           # build de production dans dist/navup-parent-front/browser/
ng build --configuration development    # build de contrôle : il doit passer sans avertissement
npm test                                # tests unitaires Vitest
```

Les adresses des deux API viennent de `src/environments/` (`environment.production.ts` pour `npm run build`) ; celles du site et du contact restent dans `src/app/core/config.ts`. `public/.htaccess` porte la politique de contenu (`script-src 'self'`, sans script en ligne), les origines des API venant du vhost (`NAVUP_CONNECT`, voir `navup-api/deploiement/`).

## Rendu : des pages publiques écrites au build

La page publique et les trois pages légales sont **prérendues** (`@angular/ssr`, `outputMode: 'static'`, `src/app/app.routes.server.ts`) : le build écrit leur HTML, Apache le sert, l'appli le reprend dans le navigateur. Aucun serveur Node en production. Tout le reste (accès, espace personnel, retour de paiement) est rendu dans le navigateur ; `public/.htaccess`, qui part avec le build, y renvoie vers `index.csr.html`.

Conséquences à connaître :

- Le code d'une page publique s'exécute aussi au build, sans navigateur : ni `localStorage`, ni `window`, ni `Audio` hors d'un test de plateforme (`isPlatformBrowser`) ou d'`afterNextRender`.
- **Aucun prix dans le HTML prérendu** : l'offre est lue dans l'API une fois la page affichée.
- Le programme de la page (`features/public/programme-contenu.ts`) est du texte de vente écrit dans la page ; `npm run parcours` le compare aux titres de la formation.

## Organisation du code

```
src/
  styles.scss            le système visuel : jetons et classes globales (aucun style de composant)
  fonts/                 Archivo (texte) et Londrina Solid (titres, à la place de Tropika), licences OFL
  app/
    app.config.ts  app.routes.ts  app.routes.server.ts (ce qui est prérendu)
    core/                config (adresses), modèles, session (service, intercepteur, gardes), appels aux deux API,
                         le lecteur audio (lecteur.service), mise en forme (format), messages d'erreur
    shared/              icônes, notes volantes, la porte du haut, le poste (lecteur audio)
    features/
      public/            page publique, extrait audio, programme, retour de paiement, textes légaux
      acces/             connexion, choix du mot de passe par lien, demande d'un lien
      espace/            coque (navigation, poste), accueil, programme, sujet, profil, bienvenue, états de l'accès
public/                  logos, illustrations et pochettes du client, extrait audio, icônes, manifeste, .htaccess
outils/                  vérifications dans le navigateur (parcours, captures)
```

## Conventions

- **Composants standalone à fichier unique** : gabarit dans le `.ts`, aucun style de composant ni style en ligne, `@if` / `@for`, `input()`, `signal()` / `computed()`, appels par `firstValueFrom`.
- **Styles** : tout est dans `styles.scss`. Les règles du système visuel sont dans `DESIGN.md`.
- **L'API fait foi** : état de l'accès, semaine en cours, dates de déblocage, totaux, prix. Le front affiche, il ne compare aucune date et n'additionne rien.
- **Session** : le jeton est dans `localStorage['navup_parent_token']`, seule clé du stockage local. Elle n'est relue que par la garde de l'espace : la page publique n'attend rien. Un 401 de code 301 vide la session ; un 403 qui porte `acces` fait relire l'état de l'accès.
- **Lien d'accès** : son jeton arrive dans le fragment de l'adresse (`/mot-de-passe#…`), est retiré aussitôt de la barre d'adresse, n'est gardé que le temps de la page et ne part que dans le corps d'une requête.
- **Lecteur audio** (`core/lecteur.service.ts`) : un seul élément `<audio>` pour toute l'appli ; la lecture ne démarre que sur un geste ; la position est rendue au serveur toutes les quinze secondes, à la pause et au passage en arrière-plan ; une adresse de média expirée fait redemander le sujet. « Terminé » est un geste du parent.
- **Pas de boîte de dialogue du navigateur.** Un refus s'écrit dans la page, à côté de ce qui l'a causé.
- **Textes** : ceux de la page publique sont ceux fournis par NavUp, mot pour mot ; rien n'est inventé (ni témoignage, ni garantie). Tout est en français.

## Vérifier dans le navigateur

Deux scripts Playwright dans `outils/` pilotent un Chromium sans tête contre `ng serve` et les API locales. Playwright n'est pas une dépendance du projet : `outils/commun.js` réutilise celui d'un projet voisin (variable `PLAYWRIGHT_CORE`).

```bash
ng serve --host 127.0.0.1 --port 4201      # dans un autre terminal

npm run parcours       # contrôles fonctionnels, une ligne OK / ÉCHEC / IGNORÉ par contrôle
npm run captures       # captures à 390, 820 et 1440 px dans .impeccable/review/ (hors dépôt)
npm run captures -- captures/ mobile       # autre dossier, une seule largeur
```

Aucun identifiant n'est demandé : les scripts préparent leurs parents d'essai (`essai.…@navup.local`) et publient pour le temps du contrôle des sujets de la formation, avec trois scripts de la Tour de contrôle refusés en production (`essai-parent.php`, `essai-publication.php`, `purge-essais.php`), puis rendent tout à son état. Dans la Tour de contrôle, `$_APP_PARENTS_URL` et `$_URL_RETOUR_PAIEMENT` pointent vers `http://127.0.0.1:4201/`.

**Ce que ces scripts ne prouvent pas** : le son sur un vrai téléphone. Avant une ouverture, sur un iPhone et un Android :

1. Ouvrir un sujet, lancer la lecture : le son part au premier appui.
2. Verrouiller l'écran : la lecture continue ; l'écran verrouillé montre le titre et répond à pause, ±15 secondes.
3. Passer à une autre appli, revenir : la lecture a continué, la position est juste.
4. Mettre en pause, fermer l'onglet, rouvrir le lendemain : « Continuer » reprend au même endroit, le son repart.
5. Changer la vitesse, avancer dans la piste au doigt : la lecture suit.
6. « Ajouter à l'écran d'accueil », rouvrir depuis l'icône : l'espace s'ouvre, la session est gardée.
7. Lire une fiche en entier, puis « Ouvrir la fiche en PDF » : le PDF s'ouvre et se zoome.

## Déploiement

`npm run build`, puis le contenu de `dist/navup-parent-front/browser/` à la racine du site (le `.htaccess` en fait partie). Apache : `AllowOverride All`, `mod_rewrite`, `mod_headers`. Le front et ses deux API en https ; l'origine du front dans `$_CORS_ORIGINES` de navup-parent-api et dans `$_CORS_ORIGINES_PUBLIQUES` de navup-api.

## À fournir par NavUp avant l'ouverture

Conditions générales de vente (droit de rétractation et accès immédiat), politique de confidentialité, mentions légales ; validation de l'extrait audio et de la fiche montrés sur la page publique, des questions fréquentes, des textes des e-mails ; la police Tropika et sa licence ; les adresses des réseaux sociaux. Deux phrases du texte fourni sont à revoir avec NavUp : « chaque semaine, un nouvel audio et une fiche pratique » (ce sont trois ou quatre sujets) et « des rendez-vous collectifs » (rien de tel n'est construit).
