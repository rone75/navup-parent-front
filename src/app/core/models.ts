// Ce que servent navup-parent-api (espace) et les endpoints publics de navup-api (offre, commande).
// Tout ce qui est calculé l'est par l'API : états, dates de déblocage, totaux. Le front affiche, il ne déduit pas.

export type EtatAcces = 'ouvert' | 'pas_commence' | 'suspendu' | 'ferme';

/** Accès d'un parent à ses contenus, pour aujourd'hui. */
export interface Acces {
  etat: EtatAcces;
  date_debut: string;
  date_fin: string;
  /** Dernier jour où les contenus restent consultables. */
  date_fin_acces: string;
  /** La dernière semaine est finie ; l'accès reste ouvert jusqu'à date_fin_acces. */
  programme_termine: boolean;
}

/** Le parent connecté. Son identité se lit ici, elle se modifie auprès de NavUp. */
export interface Moi {
  prenom: string | null;
  nom: string;
  email: string;
  formation: string;
  acces: Acces;
  /** Les écrans de bienvenue ont été lus. */
  accueil_lu: boolean;
  /** Recevoir un e-mail à chaque nouvelle semaine. */
  annonce_semaine: boolean;
}

export interface ReponseSession {
  success: true;
  token: string;
  moi: Moi;
}

export interface ReponseMoi {
  success: true;
  moi: Moi;
}

export type Pochette = 'jaune' | 'bleu';
export type EtatSujet = 'a_commencer' | 'en_cours' | 'termine' | 'verrouille';
export type EtatSemaine = 'terminee' | 'disponible' | 'verrouillee';

export interface SujetLigne {
  id_sujet: number;
  numero: number;
  titre: string;
  pochette: Pochette;
  /** Durée de l'audio, en secondes. */
  duree: number | null;
  etat: EtatSujet;
}

export interface SemaineProgramme {
  id_semaine: number;
  numero: number;
  titre: string | null;
  description: string | null;
  etat: EtatSemaine;
  date_deblocage: string;
  /** Sujets terminés de la semaine. */
  termines: number;
  sujets: SujetLigne[];
}

/** Sujet à reprendre depuis l'accueil. */
export interface SujetAReprendre {
  id_sujet: number;
  numero: number;
  titre: string;
  pochette: Pochette;
  semaine: number;
  etat: EtatSujet;
}

export interface Programme {
  aujourdhui: string;
  /** Dernière semaine débloquée. */
  semaine: number | null;
  /** Nombre de semaines du programme. */
  sur: number;
  /** Sujets terminés, et total des sujets publiés. */
  termines: number;
  sujets: number;
  continuer: SujetAReprendre | null;
  prochaine: { numero: number; date: string } | null;
  semaines: SemaineProgramme[];
}

export interface Progression {
  /** Secondes d'écoute. */
  position: number;
  version: number;
  termine: boolean;
  date_termine: string | null;
}

export interface Voisin {
  id_sujet: number;
  numero: number;
  titre: string;
  semaine: number;
  verrouille: boolean;
  date_deblocage: string;
}

export interface Sujet {
  id_sujet: number;
  numero: number;
  titre: string;
  description: string | null;
  pochette: Pochette;
  semaine: { numero: number; titre: string | null };
  /** Adresse signée, valable quelques heures : le sujet se redemande quand elle ne répond plus. */
  audio: { url: string; duree: number | null; taille: number } | null;
  fiche: { pages: string[]; largeur: number | null; hauteur: number | null; pdf: string } | null;
  progression: Progression;
  precedent: Voisin | null;
  suivant: Voisin | null;
}

export interface ReponseProgression {
  success: true;
  progression: Progression;
  /** Un autre appareil a écrit depuis : rien n'a été écrit, `progression` est celle du serveur. */
  conflit: boolean;
  termines: number;
  sujets: number;
}

/** Offre en vente et ses modalités de paiement (navup-api, v1/public/offre/). Montants en centimes. */
export interface Offre {
  libelle: string;
  prix: number;
  /** L'achat en ligne est ouvert. */
  ouvert: boolean;
  modalites: { fois: number; echeances: number[] }[];
}

export type SuiteCommande = { suite: 'paiement'; url: string } | { suite: 'email' };

export type EtatPaiement = 'ok' | 'annule' | 'regle' | 'invalide' | 'attente' | 'indisponible';

// ---------- Rendez-vous en ligne (étape 6b) ----------
// Dates et heures toujours de Paris, en chaînes telles que l'API les donne : aucune n'est convertie ici.

export type TypeRdv = 'decouverte' | 'suivi' | 'bilan' | 'autre';
export type CanalRdv = 'visio' | 'telephone' | 'presentiel';
export type EtatRdv = 'confirme' | 'a_confirmer' | 'annule' | 'passe';

/** Un créneau : un jour (AAAA-MM-JJ) et une heure (HH:MM), heure de Paris. */
export interface Creneau {
  date: string;
  heure: string;
}

/** Les créneaux proposés pour un type de rendez-vous (une « prise »). `ouvert` faux : rien n'est proposé. */
export interface Prise {
  ouvert: boolean;
  type: TypeRdv;
  /** Durée du rendez-vous, en minutes. */
  duree: number | null;
  canaux: CanalRdv[];
  fuseau: string;
  jours: { date: string; creneaux: string[] }[];
}

/** Un rendez-vous tel que le parent le voit : ni note, ni nom. L'état et les gestes permis viennent de l'API. */
export interface Rdv {
  id_rdv: number;
  type: TypeRdv;
  etat: EtatRdv;
  /** « AAAA-MM-JJ HH:MM:SS », heure de Paris. */
  date_debut: string;
  /** En minutes. */
  duree: number;
  canal: CanalRdv;
  /** Adresse de la visio d'un rendez-vous confirmé, s'il y en a une. */
  visio: string | null;
  annulable: boolean;
  deplacable: boolean;
}

/** Ce que rend le lien de gestion d'un rendez-vous (v1/public/rendez-vous/gestion/). */
export interface VueRdvLien {
  rdv: Rdv;
  /** Créneaux où le déplacer, tant qu'il est déplaçable. */
  prise: Prise | null;
  /** Annuler ou déplacer en ligne se fait jusqu'à ce nombre d'heures avant l'heure dite. */
  delai_heures: number;
}

/** Les rendez-vous d'un parent inscrit (v1/public/rendez-vous/espace/). */
export interface VueRdvEspace {
  avenir: Rdv[];
  avant: Rdv[];
  /** Créneaux d'un rendez-vous d'accompagnement. */
  prise: Prise;
  peut_prendre: boolean;
  /** Le dossier a déjà un numéro de téléphone : inutile de le redemander. */
  telephone_connu: boolean;
  delai_heures: number;
}

/** Invitation de calendrier d'un rendez-vous : le nom du fichier et son contenu (.ics). */
export interface Invitation {
  nom: string;
  ics: string;
}
