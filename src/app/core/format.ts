// Mise en forme de ce que l'API sert : numéros, durées, dates, montants. Aucun calcul métier ici.

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

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
