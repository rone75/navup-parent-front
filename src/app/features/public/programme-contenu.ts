// Le programme tel que la page publique le présente : la répartition officielle des quarante sujets sur douze
// semaines (cahier de l'écosystème §10) et les cinq piliers des fiches. C'est du texte de vente, écrit dans la page
// pour être lu par un moteur de recherche ; les titres sont ceux de la formation dans la Tour de contrôle au
// 4 octobre 2026. `npm run parcours` compare ce fichier aux titres servis par l'API : un sujet renommé s'y voit.

export interface PilierProgramme {
  numero: number;
  nom: string;
  /** Couleur de sa pastille (jeton de styles.scss). */
  couleur: string;
}

export const PILIERS: PilierProgramme[] = [
  { numero: 1, nom: 'Psychologie et développement', couleur: 'var(--orange)' },
  { numero: 2, nom: 'Relation et cadre familial', couleur: 'var(--bleu)' },
  { numero: 3, nom: 'Environnement scolaire et pression sociale', couleur: 'var(--jaune)' },
  { numero: 4, nom: 'Risques et dérives modernes', couleur: 'var(--encre)' },
  { numero: 5, nom: 'Santé et équilibre global', couleur: 'var(--feuille)' },
];

export interface SujetProgramme {
  numero: number;
  titre: string;
  pilier: number;
}

export interface SemaineContenu {
  numero: number;
  sujets: SujetProgramme[];
}

export const SEMAINES: SemaineContenu[] = [
  {
    numero: 1,
    sujets: [
      { numero: 1, titre: 'Le corps qui change', pilier: 1 },
      { numero: 2, titre: 'Besoin de plaire et insécurité', pilier: 1 },
      { numero: 3, titre: 'Sexualité et construction identitaire', pilier: 1 },
      { numero: 4, titre: 'Stress et anxiété', pilier: 1 },
    ],
  },
  {
    numero: 2,
    sujets: [
      { numero: 5, titre: 'La peur de décevoir et le regard du parent', pilier: 1 },
      { numero: 6, titre: 'Accepter de ne pas être parfait', pilier: 1 },
      { numero: 7, titre: 'La manipulation', pilier: 1 },
    ],
  },
  {
    numero: 3,
    sujets: [
      { numero: 8, titre: "L'insolence", pilier: 1 },
      { numero: 9, titre: 'Manque de considération', pilier: 1 },
      { numero: 10, titre: "Être à l'écoute sans perdre son autorité", pilier: 2 },
    ],
  },
  {
    numero: 4,
    sujets: [
      { numero: 11, titre: 'Laisser respirer sans abandonner le cadre', pilier: 2 },
      { numero: 12, titre: 'Poser un cadre et comprendre son rôle de responsable légal', pilier: 2 },
      { numero: 13, titre: 'Parents divorcés', pilier: 2 },
      { numero: 14, titre: 'Familles nombreuses', pilier: 2 },
    ],
  },
  {
    numero: 5,
    sujets: [
      { numero: 15, titre: 'Enfant unique', pilier: 2 },
      { numero: 16, titre: 'Enfant malade', pilier: 2 },
      { numero: 17, titre: 'Violence dans le couple et violence sur son enfant', pilier: 2 },
      { numero: 18, titre: 'Impact socio-économique et pression financière', pilier: 2 },
    ],
  },
  {
    numero: 6,
    sujets: [
      { numero: 19, titre: 'Harcèlement scolaire et harcèlement social', pilier: 3 },
      { numero: 20, titre: 'Harcèlement en ligne', pilier: 3 },
      { numero: 21, titre: 'Comparaison sociale et pression matérielle', pilier: 3 },
    ],
  },
  {
    numero: 7,
    sujets: [
      { numero: 22, titre: 'Décrochage scolaire', pilier: 3 },
      { numero: 23, titre: 'Lycée professionnel et SEGPA', pilier: 3 },
      { numero: 24, titre: 'Vie scolaire et cadre scolaire', pilier: 3 },
    ],
  },
  {
    numero: 8,
    sujets: [
      { numero: 25, titre: 'Le regard des autres adultes', pilier: 3 },
      { numero: 26, titre: 'Inégalité sociale et impact sur la scolarité', pilier: 3 },
      { numero: 27, titre: "Sentiment d'exclusion", pilier: 3 },
    ],
  },
  {
    numero: 9,
    sujets: [
      { numero: 28, titre: 'Mauvaises fréquentations', pilier: 4 },
      { numero: 29, titre: 'La délinquance', pilier: 4 },
      { numero: 30, titre: 'Vie en dehors de la maison', pilier: 4 },
    ],
  },
  {
    numero: 10,
    sujets: [
      { numero: 31, titre: 'Drogues et substances toxiques', pilier: 4 },
      { numero: 32, titre: 'Violence agie ou subie', pilier: 4 },
      { numero: 33, titre: 'Réseaux sociaux', pilier: 4 },
      { numero: 34, titre: "Temps d'écran", pilier: 4 },
    ],
  },
  {
    numero: 11,
    sujets: [
      { numero: 35, titre: 'Le sommeil', pilier: 5 },
      { numero: 36, titre: 'Activité physique', pilier: 5 },
      { numero: 37, titre: 'Santé générale', pilier: 5 },
    ],
  },
  {
    numero: 12,
    sujets: [
      { numero: 38, titre: 'Stress chronique', pilier: 5 },
      { numero: 39, titre: 'Insécurité ressentie', pilier: 5 },
      { numero: 40, titre: 'Épreuves de la vie', pilier: 5 },
    ],
  },
];
