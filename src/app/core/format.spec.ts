import { duree, euros, horloge, jourEcrit, numero } from './format';

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
});
