// Captures des écrans aux trois largeurs (téléphone, tablette, ordinateur), dans .impeccable/review/ (hors dépôt).
// Usage : npm run captures [-- <dossier> <mobile|tablet|desktop>]     (ng serve sur 127.0.0.1:4201, API locales)
// Prépare un parent d'essai en semaine 3 et publie pour le temps des captures les sujets 1 à 11, puis nettoie.
// Signale toute erreur de console et tout débordement horizontal.
const fs = require('node:fs');
const path = require('node:path');
const { BASE, VIEWPORTS, preparerParent, publier, nettoyer, lancer, contexte, entrer } = require('./commun');

const dossier = process.argv[2] || '.impeccable/review';
const seule = process.argv[3];

(async () => {
  fs.mkdirSync(dossier, { recursive: true });
  const soucis = [];
  const browser = await lancer();
  try {
    publier();
    for (const [nom, viewport] of Object.entries(VIEWPORTS)) {
      if (seule && seule !== nom) {
        continue;
      }
      const tactile = nom !== 'desktop';
      const ctx = await contexte(browser, viewport, { reducedMotion: 'reduce', hasTouch: tactile, isMobile: nom === 'mobile' });
      const page = await ctx.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') {
          soucis.push(`${nom} : console : ${m.text().slice(0, 160)}`);
        }
      });
      page.on('pageerror', (e) => soucis.push(`${nom} : erreur : ${e.message.slice(0, 160)}`));

      // La fenêtre prend la hauteur du document : une capture « pleine page » couperait l'émulation tactile
      const capturer = async (fichier, { haut = false } = {}) => {
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await page.evaluate(() => document.fonts.ready);
        // Le pointeur quitte la page : aucune ligne ne reste survolée sur la capture
        await page.mouse.move(0, 0);
        await page.setViewportSize(viewport);
        const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (debordement > 1) {
          soucis.push(`${nom} : ${fichier} déborde de ${debordement} px`);
        }
        if (!haut) {
          const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.setViewportSize({ width: viewport.width, height: Math.min(Math.max(hauteur, viewport.height), 12000) });
          await page.waitForTimeout(250);
        }
        await page.screenshot({ path: path.join(dossier, `${fichier}-${nom}.png`) });
        await page.setViewportSize(viewport);
      };

      // Page publique : le premier écran, puis la page entière
      await page.goto(BASE + '/');
      await page.waitForSelector('.prix-etiquette');
      await capturer('landing-haut', { haut: true });
      await capturer('landing');
      await page.goto(BASE + '/paiement?paiement=ok');
      await page.waitForSelector('[data-etat=ok]');
      await capturer('paiement');
      await page.goto(BASE + '/connexion');
      await page.waitForSelector('input[name=email]');
      await capturer('connexion');
      await page.goto(BASE + '/cgv');
      await page.waitForSelector('.texte-long');
      await capturer('cgv');

      // Espace personnel : un parent en semaine 3
      const parent = preparerParent({ email: `essai.captures.${nom}@navup.local`, debut: -16 });
      await page.goto(parent.lien);
      await page.waitForSelector('input[name=pass]');
      await capturer('mot-de-passe');
      await entrer(page, parent.lien, { bienvenue: false }).catch(() => undefined);
      await page.waitForSelector('.bienvenue');
      await capturer('bienvenue');
      await page.click('.bienvenue .btn');
      await page.waitForSelector('.accueil');
      await capturer('accueil');
      await page.click('.espace-page header .btn-grand');
      await page.waitForSelector('.fiche-pages img');
      // La première page de la fiche doit être décodée : sinon la capture montre un cadre vide
      await page.evaluate(async () => {
        const image = document.querySelector('.fiche-pages img');
        await image.decode();
        // Deux images d'écran : l'image décodée est alors peinte
        await new Promise((suite) => requestAnimationFrame(() => requestAnimationFrame(suite)));
      });
      await capturer('sujet-haut', { haut: true });
      await capturer('sujet');
      await page.goto(BASE + '/espace/programme');
      await page.waitForSelector('.programme');
      await capturer('programme');
      await page.goto(BASE + '/espace/profil');
      await page.waitForSelector('.profil');
      await capturer('profil');
      await ctx.close();
    }
  } finally {
    await browser.close();
    console.log(nettoyer());
  }
  console.log(soucis.length === 0 ? `Captures dans ${dossier} : aucune erreur de console, aucun débordement.` : soucis.join('\n'));
  process.exit(soucis.length === 0 ? 0 : 1);
})();
