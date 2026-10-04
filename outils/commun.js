// Outils de vérification dans le navigateur (Playwright). Mode d'emploi : README, « Vérifier dans le navigateur ».
// Playwright n'est pas une dépendance du projet : on réutilise celui d'un projet voisin et le Chromium déjà présent
// dans ~/.cache/ms-playwright (même montage que navup-front/outils/commun.js).
const { execFileSync } = require('node:child_process');
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE || '/home/erwan/Documents/_DEV/medipal-front/node_modules/playwright-core',
);

// L'adresse du front : `ng serve --host 127.0.0.1` par défaut ; un `ng serve` lancé sans --host écoute sur [::1],
// et se désigne par NAVUP_PARENT_FRONT=http://localhost:4201
const BASE = (process.env.NAVUP_PARENT_FRONT || 'http://127.0.0.1:4201').replace(/\/$/, '');
const API_ESPACE = process.env.NAVUP_PARENT_API || 'http://localhost/navup-parent-api/v1/';
const API_PUBLIC = process.env.NAVUP_API_PUBLIC || 'http://localhost/navup-api/v1/public/';
// Scripts de la Tour de contrôle qui préparent et effacent les données d'essai (poste de développement seulement)
const API_DIR = process.env.NAVUP_API_DIR || '/var/www/navup-api';
const API_PARENTS_DIR = process.env.NAVUP_PARENT_API_DIR || '/var/www/navup-parent-api';

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

const MOT_DE_PASSE = 'Soirées apaisées 26';

function php(script, ...args) {
  return execFileSync('php', [`${API_DIR}/script-cgi/${script}`, ...args], { encoding: 'utf8' }).trim();
}

/**
 * Prépare un parent d'essai (essai.…@navup.local) et rend son lien d'accès. `debut` : début du programme, en jours
 * par rapport à aujourd'hui (-16 : semaine 3) ; `suspendu` : compte désactivé.
 */
function preparerParent({ email = 'essai.parent@navup.local', prenom = 'Camille', debut = -16, suspendu = false } = {}) {
  const args = [`--email=${email}`, `--prenom=${prenom}`, `--debut=${debut}`, `--appli=${BASE}/`];
  if (suspendu) {
    args.push('--suspendu');
  }
  const parent = JSON.parse(php('essai-parent.php', ...args));
  return { ...parent, lien: surBase(parent.lien) };
}

/**
 * Un lien écrit par la Tour de contrôle, ramené à l'adresse du front que pilotent ces outils : quand la Tour de
 * contrôle a sa propre adresse de l'appli ($_APP_PARENTS_URL), elle ignore celle qu'on lui passe.
 */
function surBase(lien) {
  const u = new URL(lien);
  return BASE + u.pathname + u.search + u.hash;
}

// ---------- Rendez-vous en ligne (étape 6b) ----------

/**
 * Remet à zéro les essais et le limiteur des adresses locales (8 réservations ou gestes par heure et par adresse).
 * Efface aussi l'utilisateur d'essai qui reçoit : sans lui, aucun créneau n'est proposé.
 */
function purger() {
  return php('purge-essais.php').split('\n').pop();
}

/** Crée l'utilisateur d'essai qui reçoit (essai.agenda) : des plages tous les jours, un lien de visio. Des créneaux sont alors proposés. */
function ouvrirAgenda() {
  return JSON.parse(php('essai-rdv.php', '--disponibilites=essai.agenda'));
}

/** Réserve le premier créneau libre pour un parent d'essai. Rend { id_rdv, id_contact, date_debut, lien } : le lien de gestion. */
function reserverRdv(email, type = 'decouverte') {
  const rdv = JSON.parse(php('essai-rdv.php', `--reserver=${email}`, `--type=${type}`, `--appli=${BASE}/`));
  return { ...rdv, lien: surBase(rdv.lien) };
}

/**
 * Le droit INSERT de l'API des parents sur la table des billets est-il posé ? Sans lui, v1/rendez-vous/billet/
 * répond 500 et les rendez-vous de l'espace ne peuvent pas être exercés. Rend { present, detail }.
 */
function droitBillet() {
  let sortie = '';
  try {
    sortie = execFileSync('php', [`${API_PARENTS_DIR}/script-cgi/verifier-droits.php`], { encoding: 'utf8' });
  } catch (e) {
    sortie = `${e.stdout || ''}${e.stderr || ''}` || e.message;
  }
  const ligne = sortie.split('\n').find((l) => l.includes('e_billet'));
  return { present: ligne === undefined, detail: ligne ? ligne.trim() : '' };
}

/** Jour et heure tels que le front les écrit : « mardi 6 octobre à 9 h 30 » (espaces insécables), sans conversion de fuseau. */
function momentEcrit(date, heure = date.slice(11, 16), avecAnnee = false) {
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const [a, m, j] = date.slice(0, 10).split('-').map(Number);
  const [h, min] = heure.split(':').map(Number);
  const jour = `${JOURS[new Date(Date.UTC(a, m - 1, j)).getUTCDay()]} ${j === 1 ? '1er' : j} ${MOIS[m - 1]}${avecAnnee ? ' ' + a : ''}`;
  return `${jour} à ${h}\u00a0h${min === 0 ? '' : '\u00a0' + String(min).padStart(2, '0')}`;
}

/** Publie pour le temps du contrôle les sujets 1 à 11 (trois semaines, et un sujet de la quatrième). */
function publier() {
  return php('essai-publication.php', '--publier=1-11');
}

/** Rend aux sujets leur état, et efface les dossiers d'essai avec tout ce qui en dépend. */
function nettoyer() {
  const sorties = [];
  for (const [script, args] of [
    ['essai-publication.php', ['--retablir']],
    ['purge-essais.php', []],
  ]) {
    try {
      sorties.push(php(script, ...args).split('\n').pop());
    } catch (e) {
      sorties.push(`${script} : ${e.message.split('\n')[0]}`);
    }
  }
  return sorties.join(' | ');
}

/** Appel direct d'une API (sans en-tête Origin, donc sans CORS). Rend { status, json }. */
async function api(base, methode, chemin, { jeton, corps } = {}) {
  const res = await fetch(base + chemin, {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: 'Bearer ' + Buffer.from('1234567' + jeton + 'abcd').toString('base64') } : {}),
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const texte = (await res.text()).replace(/^\)\]\}',?\n/, '');
  return { status: res.status, json: texte ? JSON.parse(texte) : {} };
}

/** Mot de passe enrobé comme le front l'envoie (18 caractères + base64 + 9 caractères). */
const enrober = (motDePasse) => 'A'.repeat(18) + Buffer.from(motDePasse, 'utf8').toString('base64') + 'B'.repeat(9);

/** Le Chromium complet, en français (le navigateur sans tête allégé ne rend pas tout comme celui d'un parent). */
function lancer() {
  return chromium.launch({ channel: 'chromium', args: ['--lang=fr-FR', '--autoplay-policy=no-user-gesture-required'] });
}

function contexte(browser, viewport, options = {}) {
  return browser.newContext({ viewport, locale: 'fr-FR', timezoneId: 'Europe/Paris', ...options });
}

/** Entre dans l'espace par le lien d'accès : choisit le mot de passe, et passe les mots de bienvenue si demandé. */
async function entrer(page, lien, { bienvenue = true } = {}) {
  await page.goto(lien);
  await page.waitForSelector('input[name=pass]');
  await page.fill('input[name=pass]', MOT_DE_PASSE);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/espace$/);
  if (bienvenue) {
    await page.waitForSelector('.bienvenue');
    await page.click('.bienvenue .btn');
    await page.waitForSelector('.accueil');
  }
}

module.exports = {
  BASE,
  API_ESPACE,
  API_PUBLIC,
  API_DIR,
  VIEWPORTS,
  MOT_DE_PASSE,
  php,
  preparerParent,
  surBase,
  purger,
  ouvrirAgenda,
  reserverRdv,
  droitBillet,
  momentEcrit,
  publier,
  nettoyer,
  api,
  enrober,
  lancer,
  contexte,
  entrer,
};
