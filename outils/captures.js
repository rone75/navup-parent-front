// Captures des écrans aux trois largeurs (téléphone, tablette, ordinateur), dans .impeccable/review/ (hors dépôt).
// Usage : npm run captures [-- <dossier> <mobile|tablet|desktop>]     (ng serve sur 127.0.0.1:4201, API locales)
// Prépare un parent d'essai en semaine 3, publie pour le temps des captures les sujets 1 à 11 et donne des plages à un
// utilisateur d'essai (les créneaux des rendez-vous), puis nettoie. Les essais et le limiteur des adresses locales sont
// remis à zéro avant chaque largeur.
// Signale toute erreur de console, tout débordement horizontal et, sur les écrans des rendez-vous, toute commande de
// moins de 44 px. Un fichier « …-simule » montre un écran dont la réponse de l'API est simulée (état que l'API ne se
// laisse pas provoquer, ou espace sans le droit d'écrire un billet) : la mise en page est vraie, les données non.
const fs = require('node:fs');
const path = require('node:path');
const { BASE, VIEWPORTS, preparerParent, purger, ouvrirAgenda, reserverRdv, droitBillet, publier, nettoyer, lancer, contexte, entrer } = require('./commun');

const ORIGINE = new URL(BASE).origin;
const simuler = (status, corps) => (route) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGINE }, body: JSON.stringify(corps) });

/** Créneaux simulés : dix jours, deux demi-journées. */
function priseSimulee(type, duree) {
  const jours = [];
  for (let j = 6; j <= 15; j++) {
    jours.push({ date: `2026-10-${String(j).padStart(2, '0')}`, creneaux: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:30', '17:00'] });
  }
  return { ouvert: true, type, duree, canaux: ['visio', 'telephone'], fuseau: 'Europe/Paris', jours };
}
const rdvSimule = (corps) => ({ id_rdv: 1, type: 'suivi', etat: 'confirme', date_debut: '2026-10-08 14:30:00', duree: 45, canal: 'visio', visio: null, annulable: true, deplacable: true, ...corps });

const dossier = process.argv[2] || '.impeccable/review';
const seule = process.argv[3];

(async () => {
  fs.mkdirSync(dossier, { recursive: true });
  const soucis = [];
  const browser = await lancer();
  const droit = droitBillet();
  const notes = [];
  try {
    publier();
    for (const [nom, viewport] of Object.entries(VIEWPORTS)) {
      if (seule && seule !== nom) {
        continue;
      }
      // Limiteur des adresses locales et essais remis à zéro : plus personne ne reçoit, aucun créneau n'est proposé
      purger();
      const tactile = nom !== 'desktop';
      const ctx = await contexte(browser, viewport, { reducedMotion: 'reduce', hasTouch: tactile, isMobile: nom === 'mobile' });
      const page = await ctx.newPage();
      page.on('console', (m) => {
        // Sans le droit d'écrire un billet, l'API des parents répond 500 à chaque demande de billet : attendu, et dit à la fin
        if (m.type() === 'error' && !(!droit.present && m.location().url.endsWith('/rendez-vous/billet/'))) {
          soucis.push(`${nom} : console : ${m.text().slice(0, 160)}`);
        }
      });
      page.on('pageerror', (e) => soucis.push(`${nom} : erreur : ${e.message.slice(0, 160)}`));

      // La fenêtre prend la hauteur du document : une capture « pleine page » couperait l'émulation tactile.
      // `selecteur` : la capture se borne à cet élément (une rubrique de la page publique), `cibles` : ses commandes sont mesurées.
      const capturer = async (fichier, { haut = false, selecteur = null, cibles = null } = {}) => {
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await page.evaluate(() => document.fonts.ready);
        // Le pointeur quitte la page : aucune ligne ne reste survolée sur la capture
        await page.mouse.move(0, 0);
        await page.setViewportSize(viewport);
        const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (debordement > 1) {
          soucis.push(`${nom} : ${fichier} déborde de ${debordement} px`);
        }
        if (cibles) {
          // Boutons, liens-gestes et liens-boutons : 44 px au moins dans les deux sens (les liens d'une phrase ne sont pas des cibles)
          const petites = await page.evaluate(
            (s) =>
              [...document.querySelectorAll(s)]
                .flatMap((zone) => [...zone.querySelectorAll('button, a.btn, .lien, label.case, nav a')])
                .map((e) => ({ e, b: e.getBoundingClientRect() }))
                .filter(({ b }) => b.width > 0 && (b.width < 44 || b.height < 44))
                .map(({ e, b }) => `« ${e.textContent.trim().slice(0, 30)} » ${Math.round(b.width)}×${Math.round(b.height)}`),
            cibles,
          );
          if (petites.length > 0) {
            soucis.push(`${nom} : ${fichier} : cibles de moins de 44 px : ${petites.join(', ')}`);
          }
        }
        let clip;
        if (!haut) {
          const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.setViewportSize({ width: viewport.width, height: Math.min(Math.max(hauteur, viewport.height), 12000) });
          await page.waitForTimeout(250);
          if (selecteur) {
            const b = await page.locator(selecteur).first().boundingBox();
            const marge = 24;
            clip = { x: 0, y: Math.max(0, b.y - marge), width: viewport.width, height: b.height + marge * 2 };
          }
        }
        await page.screenshot({ path: path.join(dossier, `${fichier}-${nom}.png`), ...(clip ? { clip } : {}) });
        await page.setViewportSize(viewport);
      };
      const choisir = async (zone, jour, heure) => {
        await page.locator(`${zone} .prise-jour`).nth(jour).click();
        await page.waitForSelector(`${zone} .prise-jour:nth-child(${jour + 1})[aria-pressed=true]`);
        await page.locator(`${zone} .prise-heure`).nth(heure).click();
        await page.waitForSelector(`${zone} .prise-heure[aria-pressed=true]`);
      };
      const publique = async () => {
        const lus = page.waitForResponse((x) => x.url().endsWith('/public/creneaux/'));
        await page.goto(BASE + '/');
        await lus.catch(() => undefined);
        await page.waitForSelector('.prix-etiquette');
      };

      // Page publique sans créneau proposé : la feuille « Prenons le temps d'échanger… » garde son lien vers l'adresse de contact
      await publique();
      if ((await page.locator('#rendez-vous .prise-jour').count()) === 0) {
        await capturer('rdv-public-repli', { selecteur: '#rendez-vous', cibles: '#rendez-vous' });
      } else {
        notes.push(`${nom} : rdv-public-repli non capturé, des créneaux sont proposés sur ce poste sans l'utilisateur d'essai`);
      }

      // Page publique : le premier écran, puis la page entière, avec les créneaux du rendez-vous découverte
      ouvrirAgenda();
      await publique();
      await page.waitForSelector('#rendez-vous .prise-jour');
      await capturer('landing-haut', { haut: true });
      await capturer('landing');

      // Rendez-vous découverte : les créneaux, la saisie (avec un refus), l'annonce de l'e-mail
      await capturer('rdv-public-creneaux', { selecteur: '#rendez-vous', cibles: '#rendez-vous' });
      await choisir('#rendez-vous', 2, 7);
      await page.waitForSelector('#rendez-vous form');
      await page.fill('#rendez-vous input[name=prenom]', 'Camille');
      await page.fill('#rendez-vous input[name=nom]', 'Essai-Captures');
      await page.fill('#rendez-vous input[name=email]', `essai.captures-rdv.${nom}@navup.local`);
      await page.check('#rendez-vous label.case:has-text("Par téléphone") input');
      await page.fill('#rendez-vous textarea[name=note]', 'Les devoirs du soir, et le téléphone à table.');
      await page.waitForSelector('#rendez-vous input[name=telephone]');
      await page.click('#rendez-vous form button[type=submit]');
      await page.waitForSelector('#rendez-vous form .refus');
      await capturer('rdv-public-saisie', { selecteur: '#rendez-vous', cibles: '#rendez-vous' });
      await page.check('#rendez-vous label.case:has-text("En visio") input');
      await page.waitForSelector('#rendez-vous input[name=telephone]', { state: 'detached' });
      await page.check('#rendez-vous input[name=confidentialite]');
      await page.click('#rendez-vous form button[type=submit]');
      await page.waitForSelector('#rendez-vous [data-etape=envoye]');
      await capturer('rdv-public-envoye', { selecteur: '#rendez-vous', cibles: '#rendez-vous' });

      // Gestion d'un rendez-vous par son lien : le voir, le déplacer, l'annuler ; puis les états qui ne se provoquent pas
      const rdv = reserverRdv(`essai.captures-lien.${nom}@navup.local`);
      await page.goto(rdv.lien);
      await page.waitForSelector('[data-page=vue] .rdv');
      await capturer('rdv-lien', { cibles: 'main' });
      await page.click('.rdv .lien:has-text("Déplacer")');
      await page.waitForSelector('.rdv-geste .prise-jour');
      await choisir('.rdv-geste', 3, 4);
      await capturer('rdv-lien-deplacer', { cibles: 'main' });
      await page.click('.rdv-geste .lien:has-text("Garder le créneau actuel")');
      await page.click('.rdv .lien:has-text("Annuler")');
      await page.waitForSelector('.rdv-geste[aria-label^="Annuler"]');
      await capturer('rdv-lien-annuler', { cibles: 'main' });
      await page.click('.rdv-geste .btn');
      await page.waitForSelector('.rdv[data-etat=annule]');
      await capturer('rdv-lien-annule', { cibles: 'main' });
      await page.goto(BASE + '/rendez-vous#pas-un-jeton');
      await page.waitForSelector('[data-page=invalide]');
      await capturer('rdv-lien-invalide', { cibles: 'main' });
      const lienSimule = async (fichier, corps) => {
        await page.unroute('**/v1/public/rendez-vous/gestion/').catch(() => undefined);
        await page.route('**/v1/public/rendez-vous/gestion/', simuler(200, { success: true, rdv: rdvSimule(corps), prise: null, delai_heures: 12 }));
        await page.goto(BASE + '/rendez-vous#' + 'b'.repeat(48));
        // Chaque réponse simulée porte une heure à elle : la capture attend que la fiche l'affiche
        await page.waitForFunction((heure) => document.querySelector('[data-page=vue] h2')?.textContent.includes(heure), `${Number(corps.date_debut.slice(11, 13))}\u00a0h`);
        await capturer(fichier, { cibles: 'main' });
      };
      await lienSimule('rdv-lien-visio-simule', { date_debut: '2026-10-08 14:30:00', visio: 'https://visio.exemple.test/navup-essai', deplacable: false });
      await lienSimule('rdv-lien-delai-simule', { date_debut: '2026-10-05 09:00:00', type: 'decouverte', canal: 'telephone', duree: 30, annulable: false, deplacable: false });
      await lienSimule('rdv-lien-passe-simule', { date_debut: '2026-09-10 16:00:00', type: 'decouverte', etat: 'passe', annulable: false, deplacable: false });
      await page.unroute('**/v1/public/rendez-vous/gestion/');
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

      // Rendez-vous de l'espace : ils demandent un billet de l'API des parents
      const prendre = async (suffixe) => {
        await page.waitForSelector('[data-rdv=prendre] .prise-jour');
        await capturer('rdv-espace' + suffixe, { cibles: '.espace-page, .rail' });
        await choisir('[data-rdv=prendre]', 1, 2);
        await page.waitForSelector('[data-rdv=prendre] form');
        await page.check('[data-rdv=prendre] label.case:has-text("Par téléphone") input');
        await page.waitForSelector('[data-rdv=prendre] input[name=telephone], [data-rdv=prendre] form p.secondaire');
        await page.fill('[data-rdv=prendre] textarea[name=note]', 'Le retour du collège, et les devoirs.');
      };
      await page.goto(BASE + '/espace/rendez-vous');
      if (droit.present) {
        await prendre('');
        await capturer('rdv-espace-saisie', { cibles: '.espace-page' });
        if ((await page.locator('[data-rdv=prendre] input[name=telephone]').count()) === 1) {
          await page.fill('[data-rdv=prendre] input[name=telephone]', '06 00 00 00 00');
        }
        await page.click('[data-rdv=prendre] form button[type=submit]');
        await page.waitForSelector('[data-rdv=avenir] .rdv');
        await capturer('rdv-espace-avenir', { cibles: '.espace-page' });
        await page.click('[data-rdv=avenir] .lien:has-text("Déplacer")');
        await page.waitForSelector('[data-rdv=avenir] .rdv-geste .prise-jour');
        await capturer('rdv-espace-deplacer', { cibles: '.espace-page' });
        await page.goto(BASE + '/espace');
        await page.waitForSelector('[data-rdv=rappel]');
        await capturer('accueil-rdv');
      } else {
        // Sans le droit : la page ne peut que dire que cela n'a pas fonctionné. C'est son état réel sur ce poste.
        await page.waitForSelector('.espace-page .refus');
        await capturer('rdv-espace-erreur', { cibles: '.espace-page, .rail' });
        notes.push(`${nom} : NON VÉRIFIÉ : droit e_billet manquant (${droit.detail}) — rdv-espace-erreur est l'état réel ; les fichiers rdv-espace-*-simule et accueil-rdv-simule montrent la mise en page avec des réponses simulées`);

        // La mise en page, avec des réponses simulées (billet, puis rendez-vous) : rien de ce qui s'y lit ne vient de l'API
        const espaceSimule = async (vue) => {
          await page.unroute('**/v1/public/rendez-vous/espace/').catch(() => undefined);
          await page.route('**/v1/public/rendez-vous/espace/', (route) => {
            const corps = route.request().postDataJSON() ?? {};
            return simuler(200, 'creneaux' in corps ? { success: true, prise: priseSimulee('suivi', 45) } : { success: true, ...vue })(route);
          });
        };
        await page.route('**/v1/rendez-vous/billet/', simuler(201, { success: true, billet: 'c'.repeat(48) }));
        const base = { avant: [], prise: priseSimulee('suivi', 45), telephone_connu: false, delai_heures: 12 };
        await espaceSimule({ ...base, avenir: [], peut_prendre: true });
        await page.goto(BASE + '/espace/rendez-vous');
        await prendre('-simule');
        await capturer('rdv-espace-saisie-simule', { cibles: '.espace-page' });
        const avenir = [rdvSimule({ id_rdv: 2, visio: 'https://visio.exemple.test/navup-essai' }), rdvSimule({ id_rdv: 3, type: 'bilan', etat: 'a_confirmer', date_debut: '2026-10-20 10:00:00', duree: 60, canal: 'presentiel', deplacable: false })];
        const avant = [
          rdvSimule({ id_rdv: 4, type: 'decouverte', etat: 'passe', date_debut: '2026-09-10 09:30:00', duree: 30, canal: 'telephone', annulable: false, deplacable: false }),
          rdvSimule({ id_rdv: 5, etat: 'annule', date_debut: '2026-09-24 17:00:00', annulable: false, deplacable: false }),
        ];
        await espaceSimule({ ...base, avenir, avant, peut_prendre: false, telephone_connu: true });
        await page.goto(BASE + '/espace/profil');
        await page.goto(BASE + '/espace/rendez-vous');
        await page.waitForSelector('[data-rdv=avenir] .rdv');
        await capturer('rdv-espace-avenir-simule', { cibles: '.espace-page' });
        await page.locator('[data-rdv=avenir] .lien:has-text("Déplacer")').first().click();
        await page.waitForSelector('[data-rdv=avenir] .rdv-geste .prise-jour');
        await choisir('[data-rdv=avenir] .rdv-geste', 2, 1);
        await capturer('rdv-espace-deplacer-simule', { cibles: '.espace-page' });
        await page.goto(BASE + '/espace');
        await page.waitForSelector('[data-rdv=rappel]');
        await capturer('accueil-rdv-simule');
        await page.unroute('**/v1/public/rendez-vous/espace/');
        await page.unroute('**/v1/rendez-vous/billet/');
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    console.log(nettoyer());
  }
  if (notes.length > 0) {
    console.log(notes.join('\n'));
  }
  console.log(soucis.length === 0 ? `Captures dans ${dossier} : aucune erreur de console, aucun débordement, aucune cible de moins de 44 px.` : soucis.join('\n'));
  process.exit(soucis.length === 0 ? 0 : 1);
})();
