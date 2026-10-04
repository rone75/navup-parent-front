# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 21 sans zone.js, composants standalone à fichier unique, un seul `src/styles.scss` à jetons, aucune librairie UI. Pages publiques prérendues en statique au build (`@angular/ssr`, `outputMode: 'static'`), servies par Apache sans serveur Node ; l'espace personnel est rendu dans le navigateur. Deux API : `navup-parent-api` (espace personnel) et les endpoints publics de `navup-api` (offre, commande, lien d'accès). Décidé par Erwan le 4 octobre 2026.

## Users

**Des parents d'adolescents** (collège, lycée), confirmés par Erwan le 4 octobre 2026. Ils viennent quand la relation se tend : devoirs, téléphone, insolence, fréquentations, décrochage. Ils ne cherchent pas un cours, ils cherchent quoi faire cette semaine.

Deux moments, deux visiteurs :

- **Le parent qui hésite**, sur la page publique : il ne connaît pas NavUp, il a peut-être reçu le lien d'un autre parent ou d'un réseau social. Il veut comprendre ce que c'est, ce que ça coûte, et juger sur pièces avant de payer.
- **Le parent inscrit**, dans son espace : il revient plusieurs fois par semaine, pour un audio de six à huit minutes et sa fiche pratique. **Autant sur ordinateur que sur téléphone** (confirmé par Erwan : l'écran large compte autant que le petit).

Le client de l'agence est Nabil Berkouche (NavUp Academy), seul au lancement. Il gère la formation et les dossiers depuis la Tour de contrôle (`navup-front`), pas ici.

## Product Purpose

Vendre le programme NavUp et le faire suivre : douze semaines, quarante sujets, chacun avec un audio et une fiche pratique. Les semaines se débloquent une à une à partir du jour du paiement.

- La page publique explique le programme et le vend : 299 € TTC, comptant ou en trois fois, sans abonnement ni renouvellement automatique.
- L'espace personnel fait suivre le programme : la semaine en cours, le sujet à reprendre, l'audio et sa fiche, ce qui est terminé.

Réussite : un parent qui hésite comprend en une minute ce qu'il achète ; un parent inscrit reprend son programme en deux gestes (« Accueil → Continuer → contenu », dit le cahier), sans jamais se sentir en retard.

## Positioning

Un programme parental qui **ne promet pas de solution miracle** et le dit (« Le programme ne promet pas de solution miracle. Il vous accompagne pour construire, dans la durée, une relation plus sereine avec votre enfant. »). Il avance par petites prises hebdomadaires : un audio court, une fiche à appliquer, un défi de la semaine. Pas de cours magistral, pas de forum, pas de classement.

## Operating Context

- Le compte n'existe qu'après paiement : pas d'inscription libre. Le parent reçoit un e-mail, choisit son mot de passe par un lien, se connecte avec son e-mail.
- Le serveur décide de ce qui est débloqué, jamais l'horloge de l'appareil. Une semaine verrouillée montre son titre et sa date, ses sujets ne s'ouvrent pas.
- Un sujet se lit et s'écoute en même temps : la fiche à l'écran, l'audio qui joue. L'écoute reprend où elle s'était arrêtée, d'un appareil à l'autre.
- « Terminé » est un geste du parent, jamais une déduction.
- Après la douzième semaine, les contenus restent consultables trente jours (réglable par dossier), puis l'accès se ferme.
- Le paiement se fait sur la page de Stripe ; l'appli ne voit jamais une carte.

## Capabilities and Constraints

- Première livraison : page publique avec achat, création du mot de passe, connexion, accueil, programme, sujet (fiche et lecteur audio), progression, profil.
- Étape 6b (4 octobre 2026) : le visiteur choisit lui-même un créneau de rendez-vous découverte sur la page publique (confirmation par e-mail, invitation de calendrier, lien pour déplacer ou annuler jusqu'à 12 h avant) ; le parent inscrit prend son rendez-vous d'accompagnement depuis son espace, un seul à venir à la fois. Durées (30 et 45 min) et canaux (visio, téléphone) restent à confirmer par Nabil.
- Reportés : annonces, ressources, communauté, notifications push, hors-ligne, application native.
- La fiche est le PDF officiel du client, montré tel quel : ses pages sont rendues en images, et le PDF s'ouvre à côté. Son texte ne se réécrit pas.
- Les montants viennent de l'API : la page n'écrit aucun prix en dur.
- Tout est en français.
- Non tranché par le client : la durée d'accès après la fin (trente jours par défaut), une seule session par compte, le texte définitif des e-mails.

## Brand Commitments

- **Noms** : « NavUp Academy » pour l'identité d'ensemble, « NavUp » pour le programme parental.
- **Palette du client** (cahier de l'écosystème §2.2), contraignante : bleu clair `#C2DCFF` (« fond majeur »), jaune clair `#FFDF7C`, bleu fort du logo `#2E4ED2`, jaune-orange du logo `#FFBD59`, blanc `#FFFFFF` et blanc cassé `#F7F8EF` pour les zones de lecture, texte `#172033`.
- **Typographie** : Tropika (« AyrTropikaIsland ») pour les titres de marque et les numéros de semaine, une police lisible pour le texte long. **Le fichier et sa licence ne sont pas fournis** : une police de repli tient sa place en attendant.
- **Logos** : NavUp Academy, NavUp, symbole « N » ; jamais étirés ni redessinés.
- **Pochettes** des sujets : deux variantes, jaune et bleu clair, sans titre incrusté.
- **Ton** : « premium, humaine, claire », « sans pression ni culpabilisation ». Aucun point, classement, série de jours ni rappel du type « vous n'êtes pas revenu depuis… ». Pas de publicité ni de pression commerciale pendant le programme.
- **Référence citée par le client** : Poolsuite, pour la personnalité d'un lecteur audio central et de micro-interactions ; ne pas copier, ne pas adopter une esthétique rétro qui nuirait à la lisibilité.
- **Repères du cahier** : grille de 8 px, cibles tactiles de 44 px, texte de 16 px au moins, rayons de 12 à 24 px, respect de « réduire les animations ».

## Evidence on Hand

Dans `/home/erwan/Documents/nabil/` :

- Textes du site : `pages internet.pdf` (accroche, cinq arguments, présentation, prix, contenu de l'offre), `Lettre nouveaux adhérents.pdf`.
- Les quarante fiches (`Fiches pratiques pour application/1.pdf` à `40.pdf`) et les quarante audios, déjà chargés dans la Tour de contrôle ; la répartition officielle des sujets sur douze semaines (cahier §10) et leurs cinq piliers.
- Quatorze illustrations de familles (`Illustrations /1.png` à `14.png`), une bannière (`Couverture .png`), les logos, les pictogrammes des cinq piliers et des réseaux sociaux.
- **Autorisé par Erwan le 4 octobre 2026 pour la page publique** : une vraie page de fiche, et un extrait audio du programme (le sujet et la coupe sont à faire valider par Nabil avant l'ouverture).

Absents, à ne pas inventer : témoignages, présentation et photo du fondateur, FAQ, CGV, mentions légales, politique de confidentialité, adresses des réseaux sociaux, garantie de remboursement, fichier de la police Tropika.

Deux phrases du texte fourni ne correspondent pas à ce qui est construit et sont à signaler à Nabil : « chaque semaine, un nouvel audio et une fiche » (ce sont trois ou quatre sujets par semaine) et « des rendez-vous collectifs ».

## Product Principles

1. **Juger sur pièces.** La page publique montre le vrai programme (une fiche, un extrait, les sujets) plutôt que d'en parler.
2. **Jamais en retard.** Rien ne compte les jours manqués ; ce qui est débloqué attend le parent.
3. **Deux gestes.** De l'ouverture de l'espace au contenu de la semaine : « Continuer », et c'est là.
4. **La fiche est celle du client.** On la montre telle qu'elle est écrite, on ne la résume pas.
5. **Dire ce qui est vrai.** Pas de promesse de résultat, pas de preuve fabriquée, un prix lu dans l'outil.

## Accessibility & Inclusion

Texte de 16 px au moins, contraste suffisant sur les fonds pastel, commandes du lecteur utilisables au clavier et annoncées aux lecteurs d'écran, information jamais portée par la seule couleur, animations coupées quand le système le demande. Les pages d'une fiche sont des images de texte : le PDF d'origine reste à un geste, pour le zoom et la lecture d'écran.
