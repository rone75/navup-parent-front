---
version: 1
slug: "src-app-features-espace-espace-shell-ts"
primary_target: "src/app/features/espace/espace-shell.ts"
related_targets: []
---

# Espace personnel

**Portée et mode** : `/espace` (accueil, programme, sujet, profil), les pages d'accès (`/connexion`, `/mot-de-passe`, `/mot-de-passe-oublie`) et `/paiement`. Mode Operate : le parent inscrit reprend son programme en deux gestes, autant sur ordinateur que sur téléphone.

**Tâche, information, états** : « Continuer » mène au sujet à reprendre. Semaine terminée, disponible, verrouillée avec sa date. Sujet à commencer, en cours, terminé (geste du parent). Accès ouvert, pas commencé, suspendu, fermé, programme terminé. Écoute : lecture, pause, reprise à la dernière position, vitesse, ±15 s.

**Contraintes** : le serveur décide de tout ce qui est débloqué ; rien ne compte les jours manqués ; aucun point ni classement ; la fiche est le texte du client, mot pour mot, mis en page pour l'écran ; sa fiche d'origine (pages en images) et le PDF restent à un geste ; cibles de 44 px, texte de 16 px.

**Monde** : celui de la page publique (la porte du frigo), plus calme. La navigation est une colonne d'aimants à mots (l'aimant bleu pour la page en cours) : à gauche sur ordinateur, couchée en barre basse sur téléphone ; la poignée reste un décor sur le bord droit de la porte, comme sur la page publique. Une semaine est une feuille ; l'aimant dit son état (orange : en cours ; étoile : terminée ; feuille pâlie et cadenas : à venir). Le lecteur est le poste : sur ordinateur à côté de la fiche, sur téléphone en barre basse qui s'ouvre.

## Direction contract

THESIS: La même porte de frigo, côté famille : la feuille de la semaine en cours est celle qui porte l'aimant orange. Refuse le tableau de bord de cours en ligne : anneaux de progression, cartes de modules, pourcentages.

OWN-WORLD: Émail #C2DCFF, feuilles #F7F8EF au trait d'encre de 2 px, sans ombre ; aimants en aplat pour l'état ; étiquettes numérotées pour les sujets ; aimants de navigation, la page en cours en bleu ; titres Londrina Solid, texte Archivo.

STORY: Le parent ouvre, lit où il en est en une phrase, appuie sur « Continuer », écoute en lisant la fiche, marque terminé.

FIRST VIEWPORT: Accueil : « Bonjour Camille », la feuille de la semaine en cours sous son aimant orange avec ses sujets en étiquettes, le bouton « Continuer » en aimant bleu, la phrase de progression ; les aimants de navigation à gauche (barre basse sur téléphone).

FORM: La porte du frigo, 6e de la liste ; clé 511f413d (surface établie dans le monde de la page publique).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
