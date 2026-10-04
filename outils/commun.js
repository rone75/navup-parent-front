// Outils de vérification dans le navigateur (Playwright). Mode d'emploi : README, « Vérifier dans le navigateur ».
// Playwright n'est pas une dépendance du projet : on réutilise celui d'un projet voisin et le Chromium déjà présent
// dans ~/.cache/ms-playwright (même montage que navup-front/outils/commun.js).
const { execFileSync } = require('node:child_process');
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE || '/home/erwan/Documents/_DEV/medipal-front/node_modules/playwright-core',
);

const BASE = process.env.NAVUP_PARENT_FRONT || 'http://127.0.0.1:4201';
const API_ESPACE = process.env.NAVUP_PARENT_API || 'http://localhost/navup-parent-api/v1/';
const API_PUBLIC = process.env.NAVUP_API_PUBLIC || 'http://localhost/navup-api/v1/public/';
// Scripts de la Tour de contrôle qui préparent et effacent les données d'essai (poste de développement seulement)
const API_DIR = process.env.NAVUP_API_DIR || '/var/www/navup-api';

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
  return JSON.parse(php('essai-parent.php', ...args));
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

module.exports = { BASE, API_ESPACE, API_PUBLIC, API_DIR, VIEWPORTS, MOT_DE_PASSE, php, preparerParent, publier, nettoyer, api, enrober, lancer, contexte, entrer };
