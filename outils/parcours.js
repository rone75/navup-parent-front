// Contrôles fonctionnels de l'appli des parents, dans un Chromium sans tête et par appels directs aux deux API.
// Usage : npm run parcours     (ng serve sur 127.0.0.1:4201, navup-api et navup-parent-api servies par Apache)
// Une ligne OK / ÉCHEC / IGNORÉ par contrôle ; sortie 1 au premier échec constaté.
// Prépare des parents d'essai (essai.…@navup.local) et publie pour le temps du contrôle des sujets de la formation ;
// à la fin, les sujets retrouvent leur état et les dossiers d'essai sont effacés.
const { BASE, API_ESPACE, API_PUBLIC, MOT_DE_PASSE, php, preparerParent, publier, nettoyer, api, enrober, lancer, contexte, entrer, VIEWPORTS } = require('./commun');

let echecs = 0;
const ok = (libelle) => console.log(`OK      ${libelle}`);
const echec = (libelle, detail) => {
  echecs++;
  console.log(`ÉCHEC   ${libelle}${detail ? ' : ' + detail : ''}`);
};
const ignore = (libelle, raison) => console.log(`IGNORÉ  ${libelle} : ${raison}`);
const verifier = (condition, libelle, detail) => (condition ? ok(libelle) : echec(libelle, detail));

const jetonDuLien = (lien) => lien.split('#')[1];

(async () => {
  const browser = await lancer();
  const erreursConsole = [];
  try {
    publier();

    // ---------- Fichiers internes de l'API des parents ----------
    const racine = API_ESPACE.replace(/v1\/$/, '');
    const fermes = await Promise.all(['require/secret.php', 'include/package.session.php', 'sql/100_espace.sql', '.git/config', 'README.md'].map((f) => fetch(racine + f).then((r) => r.status)));
    verifier(fermes.every((s) => s === 403), "API des parents : secrets, classes, SQL et dépôt refusés en HTTP", fermes.join(','));

    // ---------- Accès : lien, mot de passe, connexion ----------
    const parent = preparerParent({ email: 'essai.parcours@navup.local', debut: -16 });
    const jeton = jetonDuLien(parent.lien);

    let r = await api(API_ESPACE, 'POST', 'acces/verification/', { corps: { jeton } });
    verifier(r.status === 200 && r.json.prenom === 'Camille' && r.json.motif === 'creation', "lien d'accès : reconnu, il dit le prénom et la raison");
    r = await api(API_ESPACE, 'POST', 'acces/verification/', { corps: { jeton: 'A'.repeat(40) } });
    verifier(r.status === 400, 'lien inconnu : refusé sans dire pourquoi');
    r = await api(API_ESPACE, 'POST', 'acces/', { corps: { jeton, pass: enrober('court') } });
    verifier(r.status === 400 && /10 caractères/.test(r.json.message), 'mot de passe trop court : refusé, le lien reste utilisable');

    const deux = await Promise.all([1, 2].map(() => api(API_ESPACE, 'POST', 'acces/', { corps: { jeton, pass: enrober(MOT_DE_PASSE) } })));
    const reussies = deux.filter((x) => x.status === 201);
    verifier(reussies.length === 1 && deux.some((x) => x.status === 400), 'lien présenté deux fois en même temps : une seule fois accepté', deux.map((x) => x.status).join(','));
    const session = reussies[0]?.json.token;

    r = await api(API_ESPACE, 'GET', 'session/', { jeton: session });
    verifier(r.status === 200 && r.json.moi.acces.etat === 'ouvert' && r.json.moi.email === 'essai.parcours@navup.local', 'session : le parent, son accès ouvert');
    r = await api(API_ESPACE, 'GET', 'programme/');
    verifier(r.status === 401 && r.json.code === 301, 'sans session : 401, code de session terminée');

    r = await api(API_ESPACE, 'POST', 'session/', { corps: { email: 'personne@exemple.fr', pass: enrober('nimporte quoi') } });
    const inconnu = r.json.message;
    r = await api(API_ESPACE, 'POST', 'session/', { corps: { email: 'essai.parcours@navup.local', pass: enrober('mauvais mot de passe') } });
    verifier(r.status === 401 && r.json.code === 2 && r.json.message === inconnu, 'connexion : même refus pour un e-mail inconnu et un mauvais mot de passe');
    r = await api(API_ESPACE, 'POST', 'session/', { corps: { email: 'Essai.Parcours@navup.local', pass: enrober(MOT_DE_PASSE) } });
    verifier(r.status === 201 && typeof r.json.token === 'string', 'connexion : e-mail sans égard à la casse, session ouverte');

    // Limiteur : une autre adresse d'essai, pour ne pas fermer celle du parcours. Les deux adresses de bouclage
    // du poste (127.0.0.1 et ::1) font deux adresses IP distinctes pour l'API.
    const cible = { email: 'essai.limite@navup.local', pass: enrober('mauvais mot de passe') };
    let dernier = 0;
    for (let i = 0; i < 6; i++) {
      dernier = (await api(API_ESPACE.replace('localhost', '127.0.0.1'), 'POST', 'session/', { corps: cible })).status;
    }
    verifier(dernier === 429, 'six essais ratés sur un e-mail : la connexion par mot de passe se ferme (429)', String(dernier));
    r = await api(API_ESPACE.replace('localhost', '[::1]'), 'POST', 'session/', { corps: cible }).catch(() => ({ status: 0 }));
    if (r.status === 0) {
      ignore('limiteur par adresse IP', 'ce poste ne répond pas en IPv6');
    } else {
      verifier(r.status === 401, 'depuis une autre adresse IP, le même e-mail reste essayable', String(r.status));
    }

    // ---------- Programme, sujet, médias ----------
    r = await api(API_ESPACE, 'GET', 'programme/', { jeton: session });
    const programme = r.json.programme;
    verifier(programme.semaine === 3 && programme.sur === 12 && programme.semaines[3].etat === 'verrouillee' && programme.prochaine.numero === 4, 'programme : semaine 3 sur 12, la quatrième verrouillée avec sa date');
    const premier = programme.semaines[0].sujets[0];
    const verrouille = programme.semaines[3].sujets[0];
    verifier(verrouille && verrouille.etat === 'verrouille', "semaine à venir : son sujet est annoncé, verrouillé");

    r = await api(API_ESPACE, 'GET', `sujets/?id=${verrouille.id_sujet}`, { jeton: session });
    verifier(r.status === 400 && r.json.date_deblocage === programme.semaines[3].date_deblocage, "sujet d'une semaine à venir : refusé, avec sa date");
    r = await api(API_ESPACE, 'GET', 'sujets/?id=99999999', { jeton: session });
    verifier(r.status === 404, 'sujet inconnu ou en brouillon : 404');

    r = await api(API_ESPACE, 'GET', `sujets/?id=${premier.id_sujet}`, { jeton: session });
    const sujet = r.json.sujet;
    verifier(r.status === 200 && sujet.audio && sujet.fiche.pages.length >= 2 && sujet.fiche.pdf, 'sujet : un audio, les pages de la fiche, son PDF');
    verifier(!JSON.stringify(sujet).match(/[a-f0-9]{64}\.(mp3|pdf|jpg)/), "sujet : aucun nom de fichier du disque ne sort de l'API");

    let m = await fetch(sujet.audio.url, { headers: { Range: 'bytes=0-1' } });
    verifier(m.status === 206 && m.headers.get('content-range')?.startsWith('bytes 0-1/') && m.headers.get('content-length') === '2', 'audio : une plage de deux octets répond 206, avec sa taille');
    m = await fetch(sujet.audio.url, { headers: { Range: 'bytes=999999999-' } });
    verifier(m.status === 416, 'audio : une plage hors du fichier répond 416');
    m = await fetch(sujet.fiche.pages[0]);
    verifier(m.status === 200 && m.headers.get('content-type') === 'image/jpeg', "fiche : la page est une image");
    m = await fetch(sujet.audio.url.slice(0, -1) + (sujet.audio.url.endsWith('0') ? '1' : '0'));
    verifier(m.status === 403, 'média : une signature altérée est refusée');
    m = await fetch(sujet.audio.url.replace(/e=\d+/, 'e=1700000000'));
    verifier(m.status === 403, 'média : une adresse expirée est refusée');
    m = await fetch(sujet.fiche.pages[0].replace('p=1', 'p=9'));
    verifier(m.status === 403, "média : une page que la fiche n'a pas est refusée");

    // ---------- Progression ----------
    r = await api(API_ESPACE, 'PUT', 'progression/', { jeton: session, corps: { id_sujet: premier.id_sujet, version: sujet.progression.version, position: 125 } });
    const v = r.json.progression.version;
    verifier(r.status === 200 && r.json.progression.position === 125 && !r.json.conflit, "progression : la position d'écoute est gardée");
    r = await api(API_ESPACE, 'PUT', 'progression/', { jeton: session, corps: { id_sujet: premier.id_sujet, version: v - 1, position: 10 } });
    verifier(r.json.conflit === true && r.json.progression.position === 125, "progression : une écriture partie d'une version dépassée ne s'écrit pas");
    r = await api(API_ESPACE, 'PUT', 'progression/', { jeton: session, corps: { id_sujet: verrouille.id_sujet, version: 0, position: 5 } });
    verifier(r.status === 400, "progression : rien ne s'écrit sur un sujet verrouillé");

    // ---------- États de l'accès ----------
    const etats = [
      [{ debut: 5 }, 'pas_commence'],
      [{ debut: -150 }, 'ferme'],
      [{ debut: -16, suspendu: true }, 'suspendu'],
    ];
    for (const [reglage, attendu] of etats) {
      preparerParent({ email: 'essai.parcours@navup.local', ...reglage });
      const moi = await api(API_ESPACE, 'GET', 'session/', { jeton: session });
      const contenu = await api(API_ESPACE, 'GET', 'programme/', { jeton: session });
      const media = await fetch(sujet.audio.url, { headers: { Range: 'bytes=0-1' } });
      verifier(
        moi.status === 200 && moi.json.moi.acces.etat === attendu && contenu.status === 403 && contenu.json.acces.etat === attendu && media.status === 403,
        `accès « ${attendu} » : la session vit, les contenus et les médias sont refusés avec l'état`,
      );
    }
    preparerParent({ email: 'essai.parcours@navup.local', debut: -90 });
    r = await api(API_ESPACE, 'GET', 'session/', { jeton: session });
    const fini = await api(API_ESPACE, 'GET', 'programme/', { jeton: session });
    verifier(r.json.moi.acces.etat === 'ouvert' && r.json.moi.acces.programme_termine === true && fini.status === 200 && fini.json.programme.prochaine === null, 'programme terminé : les contenus restent ouverts jusqu’à la fin de l’accès');

    // ---------- Endpoints publics de la Tour de contrôle ----------
    r = await api(API_PUBLIC, 'GET', 'offre/');
    const offre = r.json.offre;
    verifier(r.status === 200 && offre.prix > 0 && offre.modalites.length >= 1 && offre.modalites.every((x) => x.echeances.length === x.fois), "offre : un prix et le détail de chaque modalité");
    r = await api(API_PUBLIC, 'POST', 'commande/', {
      corps: { prenom: 'A', nom: 'B', email: 'essai.prix@navup.local', fois: 1, cgv: 1, confidentialite: 1, cle_saisie: '11111111-1111-4111-8111-111111111111', prix_affiche: offre.prix + 100 },
    });
    verifier(r.status === 400 && /prix a changé/.test(r.json.message), 'commande : refusée si le prix affiché n’est plus le bon');
    const connu = await api(API_PUBLIC, 'POST', 'acces/', { corps: { email: 'essai.parcours@navup.local' } });
    const absent = await api(API_PUBLIC, 'POST', 'acces/', { corps: { email: 'personne@exemple.fr' } });
    verifier(connu.status === 200 && absent.status === 200 && JSON.stringify(connu.json) === JSON.stringify(absent.json), "demande d'un lien : même réponse, que l'adresse ait un compte ou non");
    // Le parent du navigateur est préparé après cette demande : le lien qu'elle a fait partir par e-mail aurait annulé le sien.
    // L'ancienne session, elle, tombera quand ce nouveau lien sera consommé.
    const pourNavigateur = preparerParent({ email: 'essai.parcours@navup.local', debut: -16 });

    // ---------- Dans le navigateur ----------
    const ctx = await contexte(browser, VIEWPORTS.mobile, { hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('console', (msg) => {
      // Les refus attendus (403 d'un média bloqué exprès, 400 d'un formulaire) laissent une ligne de console
      if (msg.type() === 'error' && !/403|400|401|Failed to load resource/.test(msg.text())) {
        erreursConsole.push(msg.text().slice(0, 200));
      }
    });
    page.on('dialog', (d) => {
      erreursConsole.push('boîte de dialogue : ' + d.message());
      void d.dismiss();
    });

    // Page publique
    await page.goto(BASE + '/');
    await page.waitForSelector('.prix-etiquette');
    const affiche = (await page.textContent('.ticket-total .chiffre')).replace(/\s/g, '');
    verifier(affiche === String(offre.prix / 100).replace('.', ',') + '€', 'page publique : le prix affiché est celui de l’API', affiche);
    verifier((await page.locator('.semaines ol li').count()) === 40, 'page publique : les quarante sujets des douze semaines');
    await page.fill('input[name=prenom]', 'Camille');
    await page.fill('input[name=nom]', 'Essai-Achat');
    await page.fill('input[name=email]', 'essai.achat@navup.local');
    await page.click('#rejoindre button[type=submit]');
    await page.waitForSelector('#rejoindre .refus');
    verifier(/conditions générales/.test(await page.textContent('#rejoindre .refus')), 'achat : refusé en ligne sans les conditions générales, sans boîte de dialogue');
    await page.check('input[name=cgv]');
    await page.check('input[name=confidentialite]');
    await page.click('#rejoindre button[type=submit]');
    const suite = await Promise.race([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }).then(() => 'stripe'),
      page
        .waitForFunction(() => /indisponible/.test(document.querySelector('#rejoindre .refus')?.textContent ?? ''), null, { timeout: 30000 })
        .then(() => 'indisponible'),
    ]).catch(() => 'rien');
    if (suite === 'stripe') {
      ok('achat : le formulaire mène à la page de paiement de Stripe');
    } else if (suite === 'indisponible') {
      ignore('achat : page de paiement de Stripe', 'Stripe est injoignable depuis le serveur web');
    } else {
      echec('achat : le formulaire mène à la page de paiement de Stripe', suite);
    }
    await page.goto(BASE + '/paiement?paiement=ok');
    verifier(/bien reçu/.test(await page.textContent('h1')), 'retour de paiement : la page remercie et annonce le lien par e-mail');
    await page.goto(BASE + '/paiement?paiement=nimporte');
    verifier((await page.getAttribute('[data-etat]', 'data-etat')) === 'invalide', 'retour de paiement : un état inconnu vaut « invalide »');

    // Accès par le lien : le jeton quitte la barre d'adresse
    await page.goto(pourNavigateur.lien);
    await page.waitForSelector('input[name=pass]');
    verifier(!page.url().includes('#') && page.url().endsWith('/mot-de-passe'), "lien d'accès : le jeton est retiré de la barre d'adresse");
    await entrer(page, pourNavigateur.lien);
    verifier(/semaine 3 sur 12/.test(await page.textContent('.espace-page header')), 'accueil : « semaine 3 sur 12 », après les mots de bienvenue');
    const cles = await page.evaluate(() => Object.keys(localStorage));
    verifier(cles.length === 1 && cles[0] === 'navup_parent_token', 'stockage local : une seule clé, le jeton de session', cles.join(','));
    r = await api(API_ESPACE, 'GET', 'session/', { jeton: session });
    verifier(r.status === 401, 'un nouveau mot de passe choisi par lien ferme les sessions précédentes');

    // Programme : la semaine à venir ne s'ouvre pas
    await page.goto(BASE + '/espace/programme');
    await page.waitForSelector('.programme');
    verifier((await page.locator('[data-etat=verrouillee] a.etiquette').count()) === 0 && (await page.locator('[data-etat=verrouillee]').count()) === 9, 'programme : neuf semaines à venir, aucun de leurs sujets ne s’ouvre');

    // Sujet : la fiche, l'écoute, la reprise, « terminé »
    await page.locator('a.etiquette').nth(1).click();
    await page.waitForSelector('.fiche-pages img');
    await page.waitForFunction(() => [...document.querySelectorAll('.fiche-pages img')].slice(0, 1).every((i) => i.complete && i.naturalWidth > 0));
    ok('sujet : la première page de la fiche est affichée');
    // Le premier chargement de l'audio est refusé une fois, comme une adresse expirée : le poste doit s'en remettre
    let bloque = true;
    await page.route('**/v1/media/**', (route) => {
      if (bloque && route.request().url().includes('p=0')) {
        bloque = false;
        return route.fulfill({ status: 403, body: '' });
      }
      return route.continue();
    });
    await page.click('.poste-barre .btn-rond');
    const joue = await page
      .waitForFunction(() => /^[0-9]+:0[2-9]/.test(document.querySelector('.poste-barre-titre .petit')?.textContent ?? ''), null, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    verifier(joue && !bloque, "écoute : l'audio joue, et le poste s'est remis d'une adresse refusée");
    await page.click('.poste-barre .btn-rond');
    await page.waitForTimeout(800);
    const position = await page.textContent('.poste-barre-titre .petit');
    await page.reload();
    await page.waitForSelector('.poste-barre');
    const reprise = await page.textContent('.poste-barre-titre .petit');
    const secondes = (t) => Number(t.trim().split(' ')[0].split(':')[1]);
    verifier(secondes(reprise) >= 2 && Math.abs(secondes(reprise) - secondes(position)) <= 2, "reprise : après un rechargement, l'écoute repart d'où elle s'était arrêtée", `${position} → ${reprise}`);

    await page.click('.sujet-cote .btn-orange');
    await page.waitForSelector('.termine-dit');
    await page.goto(BASE + '/espace/programme');
    await page.waitForSelector('.programme');
    verifier((await page.locator('a.etiquette.terminee').count()) === 1, 'terminé : le geste du parent marque le sujet, que le programme montre terminé');

    // L'accès se suspend pendant la visite : l'espace le dit, le profil reste lisible
    preparerParent({ email: 'essai.parcours@navup.local', debut: -16, suspendu: true });
    await page.goto(BASE + '/espace');
    await page.waitForSelector('[data-acces=suspendu]');
    await page.goto(BASE + '/espace/profil');
    await page.waitForSelector('.profil');
    verifier((await page.locator('.profil').count()) === 1 && /suspendu/.test(await page.textContent('.profil')), 'accès suspendu : un écran le dit, le profil reste lisible');
    await page.click('.espace-page .btn-feuille:has-text("déconnecter")');
    await page.waitForURL(/\/connexion$/);
    verifier((await page.evaluate(() => Object.keys(localStorage).length)) === 0, 'déconnexion : le jeton quitte le stockage local');
    await ctx.close();

    // ---------- Le programme de la page publique est celui de la formation ----------
    php('essai-publication.php', '--publier=1-40');
    const tout = preparerParent({ email: 'essai.titres@navup.local', debut: -80 });
    r = await api(API_ESPACE, 'POST', 'acces/', { corps: { jeton: jetonDuLien(tout.lien), pass: enrober(MOT_DE_PASSE) } });
    r = await api(API_ESPACE, 'GET', 'programme/', { jeton: r.json.token });
    const deLApi = r.json.programme.semaines.flatMap((w) => w.sujets.map((s) => `${w.numero}/${s.numero}/${s.titre}`));
    const { SEMAINES } = await lirePage(browser);
    verifier(deLApi.length === 40 && JSON.stringify(deLApi) === JSON.stringify(SEMAINES), 'page publique : ses quarante titres et leur semaine sont ceux de la formation', `${deLApi.length} sujets servis`);

    // ---------- Cohérence, côté serveur ----------
    for (const [script, dossier] of [
      ['verifier-espace.php', API_ESPACE.includes('navup-parent-api') ? '/var/www/navup-parent-api' : null],
    ]) {
      if (dossier === null) {
        continue;
      }
      try {
        const sortie = require('node:child_process').execFileSync('php', [`${dossier}/script-cgi/${script}`], { encoding: 'utf8' }).trim();
        ok(sortie.split('\n').pop());
      } catch (e) {
        echec(script, (e.stdout || e.message).toString().trim().split('\n').slice(-3).join(' / '));
      }
    }
    try {
      ok(php('verifier-connexions.php', '--rapide').split('\n').pop());
    } catch (e) {
      echec('verifier-connexions.php', (e.stdout || e.message).toString().trim().split('\n').slice(-3).join(' / '));
    }
  } catch (e) {
    echec('parcours interrompu', e.message.split('\n')[0]);
  } finally {
    await browser.close();
    console.log(nettoyer());
  }

  if (erreursConsole.length > 0) {
    echecs++;
    console.log('ÉCHEC   console du navigateur :\n  ' + erreursConsole.join('\n  '));
  } else {
    console.log('Aucune erreur de console inattendue, aucune boîte de dialogue.');
  }
  process.exit(echecs === 0 ? 0 : 1);
})();

/** Les quarante sujets tels que la page publique les écrit : « semaine/numéro/titre », dans l'ordre. */
async function lirePage(browser) {
  const ctx = await contexte(browser, VIEWPORTS.desktop);
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.waitForSelector('.semaines');
  const SEMAINES = await page.evaluate(() =>
    [...document.querySelectorAll('.semaines > section')].flatMap((section, i) =>
      [...section.querySelectorAll('ol li')].map((li) => `${i + 1}/${Number(li.children[0].textContent)}/${li.children[1].textContent.trim()}`),
    ),
  );
  await ctx.close();
  return { SEMAINES };
}
