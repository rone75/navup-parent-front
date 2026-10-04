---
version: 1
slug: "src-app-features-espace-espace-shell-ts"
primary_target: "src/app/features/espace/espace-shell.ts"
related_targets: []
---

# Espace personnel

**Portée et mode** : `/espace` (accueil, programme, sujet, profil), les pages d'accès (`/connexion`, `/mot-de-passe`, `/mot-de-passe-oublie`) et `/paiement`. Mode Operate : le parent inscrit reprend son programme en deux gestes, autant sur ordinateur que sur téléphone.

**Tâche, information, états** : « Continuer » mène au sujet à reprendre. Semaine terminée, disponible, verrouillée avec sa date. Sujet à commencer, en cours, terminé (geste du parent). Accès ouvert, pas commencé, suspendu, fermé, programme terminé. Écoute : lecture, pause, reprise à la dernière position, vitesse, ±15 s.

**Contraintes** : le serveur décide de tout ce qui est débloqué ; rien ne compte les jours manqués ; aucun point ni classement ; la fiche est l'image du PDF du client, le PDF reste à un geste ; cibles de 44 px, texte de 16 px.

**Monde** : celui de la page publique (la porte du frigo), plus calme. La poignée de la porte est la navigation sur ordinateur, une barre basse sur téléphone. Une semaine est une feuille ; l'aimant dit son état (orange : en cours ; étoile : terminée ; feuille pâlie et cadenas : à venir). Le lecteur est le poste : sur ordinateur à côté de la fiche, sur téléphone en barre basse qui s'ouvre.

## Direction contract

THESIS: La même porte de frigo, côté famille : la feuille de la semaine en cours est celle qui porte l'aimant orange. Refuse le tableau de bord de cours en ligne : anneaux de progression, cartes de modules, pourcentages.

OWN-WORLD: Émail #C2DCFF, feuilles #F7F8EF au trait d'encre de 2 px, sans ombre ; aimants en aplat pour l'état ; étiquettes numérotées pour les sujets ; poignée-navigation ; titres Londrina Solid, texte Archivo.

STORY: Le parent ouvre, lit où il en est en une phrase, appuie sur « Continuer », écoute en lisant la fiche, marque terminé.

FIRST VIEWPORT: Accueil : « Bonjour Camille », la feuille de la semaine en cours sous son aimant orange avec ses sujets en étiquettes, le bouton « Continuer » en aimant bleu, la phrase de progression ; la poignée de navigation à gauche (barre basse sur téléphone).

FORM: La porte du frigo, 6e de la liste ; clé 511f413d (surface établie dans le monde de la page publique).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
