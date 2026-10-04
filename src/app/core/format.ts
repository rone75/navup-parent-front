// Mise en forme de ce que l'API sert : numéros, durées, dates, heures, montants, libellés. Aucun calcul métier ici.

import { CanalRdv, EtatRdv, TypeRdv } from './models';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

/** Espace insécable : « 9 h 30 » et « 30 minutes » ne se coupent pas en fin de ligne. */
const INSECABLE = '\u00a0';

/** Numéro d'un sujet sur deux chiffres : « 08 ». */
export function numero(n: number): string {
  return String(n).padStart(2, '0');
}

/** Durée d'un audio en toutes lettres : « 8 min », « 8 min 20 », « 45 s ». Chaîne vide si elle est inconnue. */
export function duree(secondes: number | null): string {
  if (secondes === null || secondes <= 0) {
    return '';
  }
  const min = Math.floor(secondes / 60);
  const s = secondes % 60;
  if (min === 0) {
    return `${s} s`;
  }
  return s === 0 ? `${min} min` : `${min} min ${String(s).padStart(2, '0')}`;
}

/** Position d'écoute au format d'une horloge : « 3:07 ». */
export function horloge(secondes: number): string {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Date AAAA-MM-JJ écrite dans une phrase : « 9 octobre », « 1er janvier 2027 » avec l'année. Sans conversion de fuseau. */
export function jourEcrit(date: string, avecAnnee = false): string {
  const [a, m, j] = date.slice(0, 10).split('-').map(Number);
  if (!a || !m || !j) {
    return date;
  }
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]}${avecAnnee ? ' ' + a : ''}`;
}

/** Montant en centimes écrit en euros : « 299 € », « 99,68 € ». Jamais de calcul sur un montant. */
export function euros(centimes: number): string {
  const entier = Math.trunc(centimes / 100);
  const reste = Math.abs(centimes % 100);
  const milliers = String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return reste === 0 ? `${milliers} €` : `${milliers},${String(reste).padStart(2, '0')} €`;
}

// ---------- Rendez-vous : jours, heures, libellés ----------
// Les dates et les heures sont celles de Paris, écrites par l'API : elles se lisent comme des chaînes, jamais avec
// le fuseau de l'appareil. Le jour de la semaine est un calcul de calendrier (UTC des deux côtés), pas une conversion.

function rang(date: string): number | null {
  const [a, m, j] = date.slice(0, 10).split('-').map(Number);
  if (!a || !m || !j) {
    return null;
  }
  return new Date(Date.UTC(a, m - 1, j)).getUTCDay();
}

/** Jour AAAA-MM-JJ avec son nom : « mardi 6 octobre », « mardi 6 octobre 2026 » avec l'année. */
export function jourComplet(date: string, avecAnnee = false): string {
  const r = rang(date);
  return r === null ? date : `${JOURS[r]} ${jourEcrit(date, avecAnnee)}`;
}

/** Les trois mots d'une case de calendrier : « mar. », 6, « oct. ». */
export function jourCase(date: string): { semaine: string; numero: number; mois: string } {
  const r = rang(date);
  const [, m, j] = date.slice(0, 10).split('-').map(Number);
  return r === null ? { semaine: '', numero: 0, mois: '' } : { semaine: JOURS_COURTS[r], numero: j, mois: MOIS_COURTS[m - 1] };
}

/** Heure HH:MM écrite à la française : « 9 h », « 9 h 30 », « 14 h 05 ». */
export function heureEcrite(heure: string): string {
  const [h, m] = heure.slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return heure;
  }
  return m === 0 ? `${h}${INSECABLE}h` : `${h}${INSECABLE}h${INSECABLE}${String(m).padStart(2, '0')}`;
}

/** Jour et heure d'un rendez-vous (« AAAA-MM-JJ HH:MM:SS », ou un jour et une heure) : « mardi 6 octobre à 9 h 30 ». */
export function momentEcrit(date: string, heure = date.slice(11, 16), avecAnnee = false): string {
  return `${jourComplet(date, avecAnnee)} à ${heureEcrite(heure)}`;
}

/** Durée d'un rendez-vous, donnée en minutes : « 30 minutes », « 1 heure », « 1 h 30 ». */
export function minutesEcrites(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) {
    return `${m}${INSECABLE}minutes`;
  }
  return m === 0 ? `${h}${INSECABLE}${h > 1 ? 'heures' : 'heure'}` : `${h}${INSECABLE}h${INSECABLE}${String(m).padStart(2, '0')}`;
}

/** Première lettre en capitale : pour une date placée en titre. */
export function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

const TYPES_RDV: Record<TypeRdv, string> = {
  decouverte: 'Rendez-vous découverte',
  suivi: "Rendez-vous d'accompagnement",
  bilan: 'Rendez-vous de bilan',
  autre: 'Rendez-vous',
};
const CANAUX_RDV: Record<CanalRdv, string> = { visio: 'en visio', telephone: 'par téléphone', presentiel: 'en personne' };
const ETATS_RDV: Record<EtatRdv, string> = { confirme: 'confirmé', a_confirmer: 'à confirmer', annule: 'annulé', passe: 'passé' };

/** « Rendez-vous découverte », « Rendez-vous d'accompagnement »… Un type inconnu se dit « Rendez-vous ». */
export function typeRdv(type: string): string {
  return TYPES_RDV[type as TypeRdv] ?? TYPES_RDV.autre;
}

/** « en visio », « par téléphone », « en personne ». Un canal inconnu ne s'écrit pas. */
export function canalRdv(canal: string): string {
  return CANAUX_RDV[canal as CanalRdv] ?? '';
}

/** « confirmé », « à confirmer », « annulé », « passé » : l'état vient de l'API, il s'écrit seulement ici. */
export function etatRdv(etat: string): string {
  return ETATS_RDV[etat as EtatRdv] ?? '';
}

/** « en visio ou par téléphone » : les façons de se parler proposées, dans une phrase. */
export function canauxEcrits(canaux: string[]): string {
  const mots = canaux.map(canalRdv).filter((m) => m !== '');
  return mots.length <= 1 ? mots.join('') : `${mots.slice(0, -1).join(', ')} ou ${mots[mots.length - 1]}`;
}
