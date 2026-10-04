---
name: NavUp, l'appli des parents
description: La porte du frigo familial, où l'on aimante ce qui compte cette semaine.
colors:
  porte: "#c2dcff"
  bleu: "#2e4ed2"
  orange: "#ffbd59"
  jaune: "#ffdf7c"
  feuille: "#f7f8ef"
  blanc: "#ffffff"
  encre: "#172033"
  porte-2: "#a9ccfa"
  feuille-2: "#e9eede"
  encre-2: "#3d4a68"
  bleu-2: "#2340b5"
  alerte: "#a8261c"
  alerte-fond: "#fde6e1"
typography:
  display:
    fontFamily: "'Tropika', 'Londrina Solid', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 1.5rem + 4.8vw, 5.25rem)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "0.005em"
  headline:
    fontFamily: "'Tropika', 'Londrina Solid', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "0.005em"
  title:
    fontFamily: "'Tropika', 'Londrina Solid', 'Archivo', system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "0.005em"
  chiffre:
    fontFamily: "'Tropika', 'Londrina Solid', 'Archivo', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 900
    lineHeight: 1
  body:
    fontFamily: "'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 420
    lineHeight: 1.55
  chapo:
    fontFamily: "'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 420
    lineHeight: 1.55
  label:
    fontFamily: "'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
    lineHeight: 1.3
rounded:
  piece: "6px"
  petit: "12px"
  feuille: "18px"
  porte: "28px"
  pilule: "999px"
spacing:
  joint: "0.6rem"
  aimant: "2.25rem"
  cible: "2.75rem"
  barre: "4.25rem"
components:
  porte:
    backgroundColor: "{colors.porte}"
    textColor: "{colors.encre}"
    rounded: "{rounded.porte}"
  feuille:
    backgroundColor: "{colors.feuille}"
    textColor: "{colors.encre}"
    rounded: "{rounded.feuille}"
    padding: "clamp(1.25rem, 0.9rem + 1.4vw, 2.25rem)"
  feuille-note:
    backgroundColor: "{colors.jaune}"
    textColor: "{colors.encre}"
    rounded: "{rounded.feuille}"
  aimant:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.encre}"
    rounded: "{rounded.pilule}"
    size: "{spacing.aimant}"
  aimant-bleu:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
  aimant-jaune:
    backgroundColor: "{colors.jaune}"
  aimant-blanc:
    backgroundColor: "{colors.feuille}"
  button-primary:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.pilule}"
    padding: "0.55rem 1.4rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.bleu-2}"
  button-primary-disabled:
    backgroundColor: "{colors.feuille-2}"
    textColor: "{colors.encre-2}"
  button-grand:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.pilule}"
    padding: "0.7rem 1.9rem"
    height: "3.6rem"
  button-feuille:
    backgroundColor: "{colors.feuille}"
    textColor: "{colors.encre}"
    rounded: "{rounded.pilule}"
  button-feuille-hover:
    backgroundColor: "{colors.feuille-2}"
  button-orange:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.encre}"
    rounded: "{rounded.pilule}"
  button-orange-hover:
    backgroundColor: "{colors.jaune}"
  button-rond:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.pilule}"
    size: "{spacing.cible}"
  champ:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.encre}"
    rounded: "{rounded.petit}"
    padding: "0.6rem 0.85rem"
    height: "3rem"
  etiquette:
    textColor: "{colors.encre}"
    padding: "0.6rem 0.25rem"
    height: "3.5rem"
  etiquette-hover:
    backgroundColor: "{colors.feuille-2}"
  poste:
    backgroundColor: "{colors.jaune}"
    textColor: "{colors.encre}"
    rounded: "{rounded.feuille}"
    padding: "1rem"
  ticket:
    backgroundColor: "{colors.blanc}"
    textColor: "{colors.encre}"
    rounded: "{rounded.piece}"
    padding: "2rem 1.4rem 1.25rem"
  prix-etiquette:
    backgroundColor: "{colors.jaune}"
    textColor: "{colors.encre}"
    rounded: "8px"
    padding: "0.35rem 0.9rem"
  rail-lien-actif:
    backgroundColor: "{colors.bleu}"
    textColor: "{colors.blanc}"
    rounded: "{rounded.pilule}"
  refus:
    backgroundColor: "{colors.alerte-fond}"
    textColor: "{colors.alerte}"
    rounded: "{rounded.petit}"
    padding: "0.75rem 1rem"
---

# Design System: NavUp, l'appli des parents

## Overview

**Creative North Star: "La porte du frigo"**

Tout l'écran est la porte en émail bleu clair du frigo familial : l'endroit de la maison où l'on aimante ce qui compte cette semaine. Il y a deux portes, celle du haut (le logo, un lien) et la grande (le contenu), séparées par un joint. Sur la porte tiennent des feuilles, chacune sous son aimant ; les sujets y sont des étiquettes numérotées ; le lecteur audio est un petit poste jaune posé là. Le système tient dans un seul fichier, `src/styles.scss` : des jetons, puis des classes globales, aucun style de composant.

Tout est dessiné, rien n'imite la matière : un seul trait de 2 px à l'encre, des aplats, aucune ombre. La page publique et l'espace personnel sont la même porte. La première est plus bavarde (une vraie fiche et des photos posées de travers, un poste dont l'aiguille bouge avec le vrai son, un ticket de prix) ; le second est plus calme (les feuilles restent droites, la poignée devient la navigation, l'aimant dit l'état d'une semaine).

Le ton du produit commande le reste : « sans pression ni culpabilisation ». La progression se dit en une phrase et en une rangée d'aimants, jamais en pourcentage ; une semaine à venir est une feuille pâlie qui porte sa date, jamais un compte à rebours.

**Key Characteristics:**
- Deux portes et leur joint (0,6 rem), en pleine page, bordées du trait d'encre.
- Feuilles blanc cassé tenues par un aimant rond en aplat ; l'aimant dit aussi un état.
- Un seul trait (2 px, encre), des aplats, aucune ombre, aucun dégradé de teinte.
- Titres et numéros en Londrina Solid 900 (à la place de Tropika), texte en Archivo.
- Les pièces rapportées (fiche réelle, photos) penchent de 2 à 3° ; le texte reste droit.
- Un seul mouvement signé : les pièces « se posent » sur la porte.
- Cibles de 44 px, texte de lecture à 17 px (16 px sur téléphone), survols réservés aux pointeurs qui survolent.

## Colors

La palette est celle du client, contraignante (cahier de l'écosystème §2.2) : sept couleurs en aplat, plus quatre dérivés d'un ton et une paire d'alerte. Aucune autre teinte n'entre dans le système.

### Primary
- **Bleu du logo** (`bleu`) : l'action. Bouton principal, aimant de la fiche réelle, entrée active de la navigation, numéros des étiquettes, liens, partie écoulée d'une piste audio, anneau de focus.
- **Bleu appuyé** (`bleu-2`) : le même bleu au survol d'une action ou d'un lien.

### Secondary
- **Orange du logo** (`orange`) : l'aimant par défaut, donc « c'est ici, cette semaine ». Aimant de la semaine en cours, étoile et aimant d'une semaine terminée, curseur de la piste, bouton « Marquer comme terminé », surlignage de sélection, anneau de focus sur fond bleu.

### Tertiary
- **Jaune clair** (`jaune`) : ce qui est posé en plus sur la porte. Le poste, la feuille-note (progression, invitation à échanger), l'étiquette de prix, l'aimant d'une semaine disponible qui n'est pas la semaine en cours, la note d'information.

### Neutral
- **Émail de la porte** (`porte`) : le fond de toute page, en aplat, et le fond des deux portes.
- **Ombre de l'émail** (`porte-2`) : un ton sous la porte. Filets entre deux lignes hors feuille, pointillés du ticket, lignes d'attente, piste de la barre de défilement.
- **Blanc cassé de la feuille** (`feuille`) : tout ce qui se lit. Feuilles, poignée, bouton secondaire, cadran du poste.
- **Pli de la feuille** (`feuille-2`) : un ton sous la feuille. Survol d'une étiquette ou d'une entrée de navigation, filets entre deux lignes d'une feuille, bouton désactivé.
- **Blanc** (`blanc`) : les pièces rapportées (photo, fiche, ticket), les champs de saisie, les cases à cocher du semainier, le texte sur bleu.
- **Encre** (`encre`) : le texte et le trait, partout.
- **Encre délavée** (`encre-2`) : texte secondaire (durée, date, aide de champ, sujet pas encore ouvert). Teintée de l'encre, jamais un gris neutre.
- **Alerte** (`alerte` sur `alerte-fond`) : le refus d'une saisie ou d'un chargement, toujours avec son icône et sa phrase.

### Named Rules
**La règle de l'aplat.** Une couleur est posée pleine, d'un bord à l'autre de sa forme. Pas de dégradé de teinte, pas de transparence décorative. La seule coupe permise est franche : la piste audio est bleue jusqu'à la position de lecture, puis feuille.

**La règle de l'aimant qui parle.** Dans l'espace personnel, la couleur d'un aimant est un état, toujours doublé d'un mot écrit : orange nu pour la semaine en cours (« En cours »), orange à étoile pour une semaine terminée (« Terminée »), jaune pour une semaine disponible, couleur de feuille à cadenas pour une semaine à venir (« Disponible le… »). Sur la page publique, où rien n'a d'état, l'aimant d'une semaine prend la couleur de son pilier, et la légende des piliers est écrite au-dessus.

**La règle de l'attente pâle.** Ce qui n'est pas encore ouvert est plus pâle et en pointillés (feuille mêlée à 55 % de porte, trait en tirets), jamais grisé, jamais barré.

## Typography

**Display Font:** Londrina Solid 900 (à la place de Tropika, la police de la marque, dont le fichier et la licence ne sont pas fournis ; « Tropika » est déjà en tête de la pile : il suffira de la déclarer). Repli : Archivo, system-ui.
**Body Font:** Archivo variable (graisses 100 à 900, largeur normale), repli system-ui.

**Character:** Des titres ronds et épais, comme écrits au gros feutre sur une feuille aimantée ; un texte grotesque net et calme qui se lit longtemps. Les graisses du texte sont fines à régler (420 pour lire, 560 à 700 pour appuyer) : l'emphase se fait à la graisse, pas à la couleur.

### Hierarchy
- **Display** (900, `clamp(2.75rem, 1.5rem + 4.8vw, 5.25rem)`, 1.02) : le `h1` d'une page. La feuille-titre de la page publique le règle plus bas (`clamp(2.1rem, 0.6rem + 3.6vw, 4.25rem)`) pour que « L'accompagnement » tienne sur une ligne ; dans l'espace et sur les pages d'une seule feuille, le `h1` prend la taille Headline.
- **Headline** (900, `clamp(2rem, 1.3rem + 2.4vw, 3rem)`, 1.02) : titre d'une rubrique ou d'une feuille ; largeur bornée à 18ch en tête de rubrique.
- **Title** (900, 1.5rem, 1.15) : titre d'une semaine, d'un geste (« Écouter », « Lire », « Essayer »), d'un intertitre de texte long.
- **Chiffre** (900, de 1.25rem à 3.25rem selon la place, 1) : les numéros de sujet (toujours sur deux chiffres : « 01 ») et le prix. Même police que les titres, en bleu pour un numéro, à l'encre pour un prix.
- **Chapo** (420, 1.1875rem, 1.55) : la phrase sous un titre de page ou de rubrique, la liste à coches (560).
- **Body** (420, 1.0625rem, 1.55 ; 1rem sous 640 px) : le texte. Paragraphes bornés à 68ch, `text-wrap: pretty` ; titres en `text-wrap: balance`. Chiffres tabulaires partout.
- **Label** (650, 0.9375rem) : état d'une semaine ou d'un sujet, durée, temps du lecteur, aide d'un champ (420 pour une simple précision).

### Named Rules
**La règle du feutre.** La police des titres ne sert qu'aux titres, aux numéros et au prix. Jamais à une phrase, à un bouton, à un libellé de champ.

**La règle du texte droit.** Un titre ou un paragraphe ne penche jamais. Seules penchent les pièces rapportées, qui sont des images.

## Layout

La page est un cadre centré (`max-width: 82rem`) fait de portes empilées, séparées et entourées par le joint (0,6 rem ; 0,35 rem sous 640 px). La grande porte respire large (`padding` de 1,25 à 3,5 rem) ; ses rubriques sont espacées de 3,5 à 7 rem. Il n'y a pas d'échelle d'espacement en jetons : les intervalles sont écrits en `rem` ou en `clamp()` sur le pas de 8 px du cahier.

- **Deux colonnes inégales.** Les rubriques de la page publique et l'accueil de l'espace se partagent en 7/12 et 5/12 (ou l'inverse) : une feuille d'un côté, un propos ou une pièce de l'autre. La une est à parts égales : la feuille-titre à gauche, les pièces à droite (la fiche réelle sur deux rangs, la photo, et le poste qui déborde de 4,5 rem sur le coin de la fiche).
- **Feuilles en grille.** Les douze semaines se rangent en `auto-fill` (colonnes de 17,5 rem au moins sur la page publique, 21 rem dans l'espace), avec 2 rem entre deux rangs pour laisser la place aux aimants.
- **Page d'une seule feuille.** Accès, retour de paiement, textes légaux : une feuille aimantée centrée dans la grande porte, large de 32 rem (48 rem pour un texte long).
- **Espace personnel.** Une seule porte : un rail de 7,25 rem à gauche, séparé par le trait, puis la page (`max-width: 76rem`). La page d'un sujet met la fiche à gauche et, à droite, une colonne de 19 à 24 rem qui reste en vue (`sticky`) : le poste, le geste « terminé », les sujets voisins.

Trois seuils. Sous 992 px (62 rem), les deux colonnes s'empilent. Sous 900 px (56,25 rem), la navigation descend en barre basse et le poste aussi. Sous 640 px (40 rem), le texte passe à 16 px, les portes s'arrondissent moins (20 px), la poignée décorative disparaît, les grilles de semaines passent à une colonne, les liens facultatifs de la porte du haut s'effacent. L'écran large compte autant que le téléphone : aucune des deux mises en page n'est le repli de l'autre.

**La règle des 44 px.** Toute commande au doigt fait au moins 44 px (`--cible`) : boutons (48 px, 57 px en grand), liens-gestes, cases à cocher et leur ligne, vitesses du lecteur, curseur de piste, entrées de navigation.

## Elevation & Depth

Le système est plat, sans exception : aucune `box-shadow`, aucun `filter`, aucun flou. La profondeur se dit par recouvrement dessiné. Un aimant chevauche le bord haut de sa feuille de la moitié de son diamètre ; le poste recouvre le coin de la fiche ; une pièce penche. Ce qui est au-dessus est simplement dessiné par-dessus, avec le même trait.

Les plans fixes (barre de navigation, poste en barre, poste ouvert en grand, notes volantes) se détachent par leur aplat et leur trait, pas par une ombre portée.

### Named Rules
**La règle du trait unique.** Un seul trait : 2 px, plein, à l'encre (`--trait`). Il borde les portes, les feuilles, les aimants, les boutons, les champs, les pièces, le poste. Il ne change d'épaisseur nulle part ; il passe en tirets pour dire « à venir » ou pour les lignes du ticket, et en `porte-2` ou `feuille-2` pour un filet entre deux lignes. Les icônes sont dessinées du même trait de 2, bouts ronds.

**La règle sans ombre.** Si une forme a besoin d'une ombre pour se lire, c'est qu'il lui manque son trait ou son aplat.

## Shapes

Quatre rayons, du plus sec au plus rond, selon ce que l'objet est. Une pièce rapportée (photo, fiche, ticket, page de fiche) a des coins presque vifs (6 px) : c'est du papier coupé. Un petit objet (champ, pochette, cadran, refus, note volante) prend 12 px. Une feuille et le poste prennent 18 px. Une porte prend 28 px (20 px sous 640 px). Tout ce qui s'attrape est une pilule ou un disque (999 px, 50 %) : boutons, aimants, poignée, vitesses, pastilles.

L'aimant est un disque de 2,25 rem, centré sur le bord haut de sa feuille, ou calé à gauche (à 2,25 rem du bord) quand la feuille est une parmi d'autres. Une feuille aimantée descend d'un demi-aimant et gagne un tiers d'aimant de marge intérieure en haut, pour que le titre ne touche pas le disque.

**La règle des pièces penchées.** Une pièce rapportée penche de 2 à 3° (`--penche` : 2° pour la fiche, −3° ou ±2° pour une photo). Jamais plus, jamais une feuille de texte, jamais dans l'espace personnel, où la fiche se lit droite.

## Components

### Les portes et leur joint
- **Porte :** aplat `porte`, trait d'encre, rayon de 28 px. La porte du haut (4,5 rem de haut au moins) porte le logo à gauche et, à droite, des liens à l'encre (600, soulignés au survol) et un bouton feuille « Se connecter ». La plinthe, en bas de la page publique, est une troisième porte de même dessin.
- **La porte du haut reste à l'écran :** elle est collée en haut pendant le défilement (demande d'Erwan, 4 octobre 2026), dans une bande de la couleur de la porte qui va jusqu'aux bords du frigo et sous laquelle la page passe. La page n'est jamais tranchée net : le bord haut de la grande porte (son trait et ses deux arrondis) reste dessiné juste sous la bande, et le contenu glisse derrière lui, comme derrière le cadre d'une fenêtre. Une ancre s'arrête sous la bande (`scroll-padding-top`). Les hauteurs tiennent à trois jetons : `--haut` (4,5 rem ; 4,05 rem sous 640 px), `--joint`, `--r-porte`. La poignée, elle aussi, reste à sa place sur le bord de la grande porte pendant le défilement (à 2,5 rem sous son bord haut) : rien de ce qui appartient à la porte ne glisse sous la bande pour y être rogné.
- **Joint :** 0,6 rem de fond nu entre deux portes et autour d'elles.

### La poignée
- **Sur la page publique :** un décor. Une pilule verticale (1,1 rem sur 9 rem, aplat feuille, trait d'encre) à cheval sur le bord droit de la grande porte ; masquée sous 640 px.
- **Dans l'espace :** la navigation. Une pilule feuille au trait d'encre qui contient trois entrées (icône de 1,5 rem au-dessus de son mot : Accueil, Programme, Profil). L'entrée active est un aplat bleu à texte blanc ; survol en `feuille-2`. Au-dessus de 900 px, elle est verticale, dans le rail de gauche, sous la pochette-logo. En dessous, elle se couche en barre fixe en bas de l'écran (24 rem de large au plus, fond `porte`, trait en haut, marge de sécurité de l'appareil respectée).

### La feuille et son aimant
- **Feuille :** aplat `feuille`, trait d'encre, rayon de 18 px, marge intérieure de 1,25 à 2,25 rem. Variantes : **note** (aplat jaune, sans aimant ou avec aimant bleu) ; **attend** (pâlie, trait en tirets).
- **Aimant :** disque de 2,25 rem au trait d'encre, orange par défaut ; bleu, jaune ou couleur de feuille en variante. Il peut porter une icône de 1,15 rem (étoile, cadenas).
- **États d'une semaine (espace) :** en cours, aimant orange nu ; terminée, aimant orange à étoile ; disponible, aimant jaune ; à venir, feuille pâlie en tirets, aimant couleur de feuille à cadenas. L'état est toujours écrit en clair à droite du titre.
- **Rangée d'aimants :** les douze semaines en disques de 2 rem numérotés, sur la feuille-note de l'accueil. Orange : terminée ; feuille : disponible ; tirets sans fond : à venir ; contour doublé à 2 px d'écart : la semaine en cours.

### L'étiquette d'un sujet
- **Forme :** une ligne à trois colonnes (numéro, titre, état), haute de 3,5 rem au moins, séparée de la suivante par un filet `feuille-2`.
- **Numéro :** deux chiffres, police des titres, 1,75 rem, bleu.
- **Titre :** 620 ; la durée dessous en label `encre-2`.
- **État :** un chevron (à commencer), « En cours », ou une étoile orange et « Terminé ». Un sujet pas encore ouvert n'est pas un lien : texte et numéro en `encre-2`, un cadenas.
- **Survol :** fond `feuille-2` sur toute la ligne, et rien d'autre : aucun soulignement, ni du titre ni de la durée (demande d'Erwan, 4 octobre 2026).

### Boutons : des aimants à mots
- **Forme :** pilule au trait d'encre, 48 px de haut au moins, Archivo 680. Un bouton est un aimant sur lequel on a écrit.
- **Principal :** aplat bleu, texte blanc ; survol `bleu-2`. **Grand** (57 px, 1,1875 rem) pour le geste de la page : « Rejoindre le programme », « Continuer ».
- **Feuille :** aplat feuille, texte à l'encre ; pour un geste secondaire (« Se connecter », « Réessayer », ±15 s).
- **Orange :** aplat orange, texte à l'encre, survol jaune ; réservé à « Marquer comme terminé ».
- **Rond :** disque de 44 px (64 px pour lecture/pause), une icône, un `aria-label`.
- **Appui :** le bouton descend d'un pixel. **Désactivé :** aplat `feuille-2`, texte `encre-2`.
- **Focus :** contour de 3 px à 3 px d'écart, bleu ; orange sur un bouton ou sur fond bleu.
- **Lien-geste :** un lien souligné au trait, 650, bleu, dont la zone fait 44 px de haut ; pour un geste discret (« Voir les 12 semaines », « Ouvrir la fiche en PDF », « Je préfère y revenir »).

### Le poste
- **Corps :** aplat jaune, trait d'encre, rayon de 18 px. En tête, la pochette du sujet (carrée, rayon 12 px, bordée) et le titre précédé de son numéro.
- **Piste :** temps écoulé, curseur, temps restant (« −4:12 »). Piste en pilule bordée, bleue jusqu'à la position ; curseur en disque orange bordé ; zone de 44 px de haut.
- **Commandes :** −15 s et +15 s en boutons ronds feuille, lecture/pause en grand bouton rond bleu ; vitesses en pilules feuille, celle qui est choisie en aplat d'encre.
- **Trois tenues :** *plein*, à côté de la fiche, sur la page d'un sujet au-dessus de 900 px ; *barre*, partout ailleurs (pochette, titre et temps, lecture/pause, un liseré bleu d'avancement), fixée au-dessus de la navigation sur téléphone et rangée en bas à droite (24 rem) sur écran large ; *ouvert en grand*, par-dessus la page sur fond `porte`, quand on appuie sur le titre de la barre.
- **Cadran (page publique) :** l'extrait audio est le même poste, en petit, avec un cadran dessiné au trait (arc gradué, zone haute en bleu, pivot à l'encre). L'aiguille suit le niveau réel du signal : elle monte vite, retombe lentement, et reste au repos (−52°) à la pause ou quand « réduire les animations » est demandé. Elle ne bouge jamais sans son.

### Les pièces rapportées
- **Forme :** fond blanc, trait d'encre, coins de 6 px, penchée par `--penche`, tenue par un aimant.
- **Fiche :** la vraie première page d'une fiche du client, telle quelle. **Photo :** une illustration du client avec une marge blanche de 0,5 rem, comme un tirage.
- Dans l'espace, les pages d'une fiche sont des images bordées du trait, droites, empilées ; le PDF d'origine reste à un geste.

### Le semainier à cases
- Une feuille aimantée qui montre une semaine comme une grille à cocher : en ligne les sujets (numéro bleu, titre), en colonne les trois gestes (« Écouter », « Lire », « Essayer »), et dans chaque case un carré vide de 1,5 rem au trait (fond blanc, coins de 5 px). Les cases sont vides : c'est au parent de les cocher.

### Le ticket de prix
- **Ticket :** pièce blanche à coins de 6 px, tenue par un aimant orange ; les lignes de l'offre séparées par des tirets `porte-2` ; en bas, « Programme complet » et le prix en chiffre de 3,25 rem (2,75 rem sous 640 px) ; dessous, les modalités et « Sans abonnement » en label.
- **Étiquette de prix :** à côté du bouton de la une, un petit rectangle jaune bordé (coins de 8 px) : le prix en chiffre de 1,75 rem et « sans abonnement ».
- Le montant vient toujours de l'API. Tant qu'il n'est pas lu, le ticket n'affiche pas de chiffre et l'étiquette n'apparaît pas.

### Le choix d'un créneau
Composant `prise-rdv`, le même partout (page publique, lien de gestion, espace). Les jours en cases-aimants à bord d'encre (jour abrégé, quantième en chiffre de marque bleu, mois), huit au plus puis « Voir plus de jours » ; le jour choisi passe à l'encre pleine. Dessous, le jour écrit en toutes lettres suivi de « heure de Paris », puis les heures en pastilles rondes rangées « Matin » et « Après-midi ». Le geste final dit le créneau en toutes lettres (« Déplacer au vendredi 9 octobre à 11 h »). Un rendez-vous se montre sur une feuille à aimant : le moment en titre de marque, son état en toutes lettres à droite, ses gestes en liens (« Déplacer », « Annuler », confirmation en place) ; aucun état n'est mesuré du parent.

### Saisie
- **Champ :** libellé au-dessus (650), champ blanc au trait d'encre, rayon de 12 px, 48 px de haut ; aide dessous en label `encre-2`.
- **Case et bouton radio :** natifs, teintés de bleu (`accent-color`), 1,5 rem, dans une ligne de 44 px.
- **Groupe :** un `fieldset` ouvert par un filet `porte-2` et une légende en 700.
- **Refus :** un encadré `alerte` sur `alerte-fond`, icône et phrase. Sa variante d'information est jaune à l'encre.
- **Attente :** deux ou trois lignes vierges en pilules `porte-2`, de largeurs inégales. Pas de roue.
- **Note volante :** message bref en bas de l'écran, feuille bordée à coins de 12 px, qu'un appui referme.

### Listes et questions
- **Lignes réglées :** des lignes séparées par un filet de 2 px (`porte-2` sur la porte, `feuille-2` sur une feuille). La liste à coches met une coche bleue de 1,6 rem devant chaque ligne.
- **Questions :** des `details` séparés par le trait d'encre ; un chevron qui tourne d'un quart de tour à l'ouverture.

### Le mouvement
- **Se poser.** Le seul mouvement signé : à l'arrivée de la page publique, la fiche, la photo et le poste descendent de 1,1 rem en se redressant de 4° jusqu'à leur penché, en 0,7 s (`cubic-bezier(0.16, 1, 0.3, 1)`), l'un après l'autre (0, 0,12 et 0,24 s).
- Le reste est fonctionnel et bref : fond d'un bouton (0,15 s), chevron d'une question (0,2 s), aiguille du cadran. Avec « réduire les animations », rien ne se pose, les transitions sont coupées, l'aiguille reste au repos.

## Do's and Don'ts

### Do:
- **Do** poser tout contenu à lire sur une feuille (`feuille`, trait de 2 px, rayon de 18 px), et la tenir par un aimant quand elle ouvre une page ou une rubrique.
- **Do** garder un seul trait : 2 px, encre, plein ; en tirets seulement pour « à venir » et pour les lignes du ticket.
- **Do** écrire l'état à côté de sa couleur : « En cours », « Terminée », « Disponible le 9 octobre ». L'aimant, l'étoile et le cadenas ne portent jamais l'information seuls.
- **Do** dire la progression en une phrase (« 11 sujets terminés sur 40 ») et en une rangée d'aimants.
- **Do** écrire tout survol sous `@media (hover: hover)`, et donner 44 px à toute commande au doigt.
- **Do** garder le texte de lecture à 17 px (16 px sur téléphone) et le texte secondaire à 15 px au moins, en `encre` ou `encre-2`.
- **Do** lire le prix dans l'API et le passer par la fonction d'affichage ; sans réponse, ne pas montrer de chiffre.
- **Do** montrer les vraies pièces : la fiche du client telle qu'elle est écrite, un vrai extrait, les vrais titres des quarante sujets. Un texte provisoire se signale comme provisoire sur la page.
- **Do** réserver le penché et le mouvement « se poser » aux pièces rapportées de la page publique.
- **Do** respecter « réduire les animations » : rien ne se pose, rien ne glisse, l'aiguille reste au repos.

### Don't:
- **Don't** poser d'ombre, portée ou diffuse, ni de flou, sur quoi que ce soit.
- **Don't** fondre deux teintes en dégradé. La seule coupe de couleur admise est franche : la part écoulée d'une piste audio.
- **Don't** faire de cartes à icône (une icône, un titre, deux lignes, répétés en grille). Les arguments sont une liste à coches sur une seule feuille.
- **Don't** mettre de petit intitulé au-dessus d'un titre. Un titre se suffit ; une précision vient dessous ou à côté.
- **Don't** afficher de chiffre géant de progression, de pourcentage, d'anneau ou de jauge.
- **Don't** compter les jours : ni série, ni retard, ni « depuis votre dernière visite », ni compte à rebours. Une date de disponibilité s'écrit comme une date.
- **Don't** écrire un prix en dur dans une page.
- **Don't** inventer un texte ou une preuve : pas de témoignage, de garantie, de portrait du fondateur, de chiffre d'audience qui ne soit fourni par le client.
- **Don't** pencher un titre, un paragraphe ou une feuille de texte.
- **Don't** griser ce qui est verrouillé ; le pâlir et le mettre en tirets, avec sa date.
- **Don't** utiliser la police des titres pour une phrase, un bouton ou un libellé.
- **Don't** ajouter une teinte hors de la palette du client, ni un gris neutre : le texte secondaire est `encre-2`.
- **Don't** étirer ni redessiner les logos, ni incruster un titre sur une pochette.
