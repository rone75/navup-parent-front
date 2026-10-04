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
