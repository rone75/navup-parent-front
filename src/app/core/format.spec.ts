import {
  canalRdv,
  canauxEcrits,
  capitale,
  duree,
  etatRdv,
  euros,
  heureEcrite,
  horloge,
  jourCase,
  jourComplet,
  jourEcrit,
  minutesEcrites,
  momentEcrit,
  numero,
  typeRdv,
} from './format';

describe('format', () => {
  it('écrit le numéro d’un sujet sur deux chiffres', () => {
    expect(numero(8)).toBe('08');
    expect(numero(40)).toBe('40');
  });

  it('écrit une durée en toutes lettres', () => {
    expect(duree(480)).toBe('8 min');
    expect(duree(503)).toBe('8 min 23');
    expect(duree(45)).toBe('45 s');
    expect(duree(null)).toBe('');
    expect(duree(0)).toBe('');
  });

  it('écrit une position d’écoute comme une horloge', () => {
    expect(horloge(187)).toBe('3:07');
    expect(horloge(0)).toBe('0:00');
    expect(horloge(-4)).toBe('0:00');
  });

  it('écrit une date sans conversion de fuseau', () => {
    expect(jourEcrit('2026-10-09')).toBe('9 octobre');
    expect(jourEcrit('2027-01-01', true)).toBe('1er janvier 2027');
    expect(jourEcrit('2026-12-31 23:59:00')).toBe('31 décembre');
  });

  it('écrit un montant en centimes sans le recalculer', () => {
    expect(euros(29900)).toBe('299 €');
    expect(euros(9968)).toBe('99,68 €');
    expect(euros(9905)).toBe('99,05 €');
    expect(euros(129900)).toBe('1 299 €');
  });

  it('nomme le jour de la semaine sans lire le fuseau de l’appareil', () => {
    expect(jourComplet('2026-10-06')).toBe('mardi 6 octobre');
    expect(jourComplet('2026-11-01', true)).toBe('dimanche 1er novembre 2026');
    // Minuit et 23 h 59 : le même jour, quel que soit le fuseau du poste qui lance les tests
    expect(jourComplet('2026-10-06 00:00:00')).toBe('mardi 6 octobre');
    expect(jourComplet('2026-10-06 23:59:00')).toBe('mardi 6 octobre');
    expect(jourComplet('2028-02-29')).toBe('mardi 29 février');
    expect(jourComplet('pas une date')).toBe('pas une date');
  });

  it('donne les trois mots d’une case de calendrier', () => {
    expect(jourCase('2026-10-06')).toEqual({ semaine: 'mar.', numero: 6, mois: 'oct.' });
    expect(jourCase('2027-01-01')).toEqual({ semaine: 'ven.', numero: 1, mois: 'janv.' });
  });

  it('écrit une heure à la française, en espaces insécables', () => {
    expect(heureEcrite('09:00')).toBe('9\u00a0h');
    expect(heureEcrite('09:30')).toBe('9\u00a0h\u00a030');
    expect(heureEcrite('14:05')).toBe('14\u00a0h\u00a005');
    expect(heureEcrite('00:00:00')).toBe('0\u00a0h');
  });

  it('écrit le jour et l’heure d’un rendez-vous tels que l’API les donne', () => {
    expect(momentEcrit('2026-10-06 09:30:00')).toBe('mardi 6 octobre à 9\u00a0h\u00a030');
    expect(momentEcrit('2026-10-06', '17:00')).toBe('mardi 6 octobre à 17\u00a0h');
    expect(momentEcrit('2026-10-06 09:00:00', undefined, true)).toBe('mardi 6 octobre 2026 à 9\u00a0h');
    expect(capitale(momentEcrit('2026-10-06 09:00:00'))).toBe('Mardi 6 octobre à 9\u00a0h');
  });

  it('écrit la durée d’un rendez-vous', () => {
    expect(minutesEcrites(30)).toBe('30\u00a0minutes');
    expect(minutesEcrites(60)).toBe('1\u00a0heure');
    expect(minutesEcrites(90)).toBe('1\u00a0h\u00a030');
    expect(minutesEcrites(120)).toBe('2\u00a0heures');
  });

  it('écrit le type, le canal et l’état d’un rendez-vous', () => {
    expect(typeRdv('decouverte')).toBe('Rendez-vous découverte');
    expect(typeRdv('suivi')).toBe("Rendez-vous d'accompagnement");
    expect(typeRdv('bilan')).toBe('Rendez-vous de bilan');
    expect(typeRdv('autre')).toBe('Rendez-vous');
    expect(typeRdv('inconnu')).toBe('Rendez-vous');
    expect(canalRdv('visio')).toBe('en visio');
    expect(canalRdv('telephone')).toBe('par téléphone');
    expect(canalRdv('presentiel')).toBe('en personne');
    expect(etatRdv('confirme')).toBe('confirmé');
    expect(etatRdv('a_confirmer')).toBe('à confirmer');
    expect(etatRdv('annule')).toBe('annulé');
    // « absent » n’existe pas pour un parent : un rendez-vous passé se dit « passé », qu’il ait eu lieu ou non
    expect(etatRdv('passe')).toBe('passé');
    expect(etatRdv('absent')).toBe('');
    expect(canauxEcrits(['visio', 'telephone'])).toBe('en visio ou par téléphone');
    expect(canauxEcrits(['telephone'])).toBe('par téléphone');
    expect(canauxEcrits([])).toBe('');
  });
});
