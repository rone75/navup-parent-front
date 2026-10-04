// Contrôles fonctionnels de l'appli des parents, dans un Chromium sans tête et par appels directs aux deux API.
// Usage : npm run parcours     (ng serve sur 127.0.0.1:4201, navup-api et navup-parent-api servies par Apache)
// Une ligne OK / ÉCHEC / IGNORÉ / NON VÉRIFIÉ par contrôle, puis le décompte ; sortie 1 au premier échec constaté.
// Prépare des parents d'essai (essai.…@navup.local), publie pour le temps du contrôle des sujets de la formation et
// donne des plages à un utilisateur d'essai (essai.agenda) ; à la fin, les sujets retrouvent leur état et les essais
// sont effacés. Les essais et le limiteur des adresses locales sont aussi remis à zéro au départ.
const fs = require('node:fs');
const {
  BASE,
  API_ESPACE,
  API_PUBLIC,
  MOT_DE_PASSE,
  php,
  preparerParent,
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
  VIEWPORTS,
} = require('./commun');

const compte = { ok: 0, echec: 0, ignore: 0, nonVerifie: 0 };
const ok = (libelle) => {
  compte.ok++;
  console.log(`OK      ${libelle}`);
};
const echec = (libelle, detail) => {
  compte.echec++;
  console.log(`ÉCHEC   ${libelle}${detail ? ' : ' + detail : ''}`);
};
const ignore = (libelle, raison) => {
  compte.ignore++;
  console.log(`IGNORÉ  ${libelle} : ${raison}`);
};
// Un contrôle écrit mais impossible à exercer sur ce poste : il n'est ni réussi ni raté, et il se voit
const nonVerifie = (libelle, raison) => {
  compte.nonVerifie++;
  console.log(`NON VÉRIFIÉ : ${raison} — ${libelle}`);
};
const verifier = (condition, libelle, detail) => (condition ? ok(libelle) : echec(libelle, detail));

const jetonDuLien = (lien) => lien.split('#')[1];
const capitale = (texte) => texte.charAt(0).toUpperCase() + texte.slice(1);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ORIGINE = new URL(BASE).origin;

const erreursConsole = [];
/** Suit une page : erreurs de console inattendues, boîtes de dialogue (il ne doit y en avoir aucune). */
function suivre(page) {
  page.on('console', (msg) => {
    // Les refus attendus (403 d'un média bloqué exprès, 400 d'un formulaire, 404 d'un lien inconnu) laissent une ligne de console
    if (msg.type() === 'error' && !/403|400|401|Failed to load resource/.test(msg.text())) {
      erreursConsole.push(msg.text().slice(0, 200));
    }
  });
  page.on('pageerror', (e) => erreursConsole.push('erreur de page : ' + e.message.slice(0, 200)));
  page.on('dialog', (d) => {
    erreursConsole.push('boîte de dialogue : ' + d.message());
    void d.dismiss();
  });
}

(async () => {
  const browser = await lancer();
  try {
    purger();
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
    suivre(page);

    // Page publique
    await page.goto(BASE + '/');
    await page.waitForSelector('.prix-etiquette');
    const affiche = (await page.textContent('.ticket-total .chiffre')).replace(/\s/g, '');
    verifier(affiche === String(offre.prix / 100).replace('.', ',') + '€', 'page publique : le prix affiché est celui de l’API', affiche);
    verifier((await page.locator('.semaines ol li').count()) === 40, 'page publique : les quarante sujets des douze semaines');
    await page.fill('#rejoindre input[name=prenom]', 'Camille');
    await page.fill('#rejoindre input[name=nom]', 'Essai-Achat');
    await page.fill('#rejoindre input[name=email]', 'essai.achat@navup.local');
    await page.click('#rejoindre button[type=submit]');
    await page.waitForSelector('#rejoindre .refus');
    verifier(/conditions générales/.test(await page.textContent('#rejoindre .refus')), 'achat : refusé en ligne sans les conditions générales, sans boîte de dialogue');
    await page.check('#rejoindre input[name=cgv]');
    await page.check('#rejoindre input[name=confidentialite]');
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

    // ---------- Rendez-vous en ligne (étape 6b) ----------
    await rendezVousPublics(browser);
    await rendezVousEspace(browser);

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
    echec('console du navigateur', '\n  ' + erreursConsole.join('\n  '));
  } else {
    ok('aucune erreur de console inattendue, aucune boîte de dialogue');
  }
  console.log(
    `${compte.ok + compte.echec} contrôles : ${compte.ok} OK, ${compte.echec} échec(s) ; ${compte.ignore} ignoré(s), ${compte.nonVerifie} non vérifié(s).`,
  );
  process.exit(compte.echec === 0 ? 0 : 1);
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

// ---------- Rendez-vous en ligne (étape 6b) ----------

/** Texte d'un élément, espaces ramenés à un seul (les espaces insécables restent : « 9 h 30 » s'écrit avec). */
const texteDe = async (page, selecteur) => (await page.locator(selecteur).first().innerText()).replace(/[ \t\n]+/g, ' ').trim();

/** Attend que le texte d'un élément dise ce qu'on attend (l'affichage suit le geste d'un instant) ; rend ce texte, ou '' passé le délai. */
async function attendreTexte(page, selecteur, attendu) {
  const dit = (t) => (attendu instanceof RegExp ? attendu.test(t) : t.includes(attendu));
  const fin = Date.now() + 10000;
  let texte = '';
  while (Date.now() < fin) {
    texte = (await page.locator(selecteur).count()) > 0 ? await texteDe(page, selecteur) : '';
    if (dit(texte)) {
      return texte;
    }
    await page.waitForTimeout(100);
  }
  return dit(texte) ? texte : '';
}

/** Choisit un jour puis une heure dans une prise de rendez-vous, en attendant que chacun soit pris en compte. */
async function choisirCreneau(page, zone, jour, heure) {
  await page.locator(`${zone} .prise-jour`).nth(jour).click();
  await page.waitForSelector(`${zone} .prise-jour:nth-child(${jour + 1})[aria-pressed=true]`);
  await page.locator(`${zone} .prise-heure`).nth(heure).click();
  await page.waitForSelector(`${zone} .prise-heure[aria-pressed=true]`);
}

/** Réponse simulée d'un endpoint public : le front s'y fie comme à l'API. Sert aux seuls états que l'API ne se laisse pas provoquer. */
const simuler = (status, corps) => (route) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': ORIGINE }, body: JSON.stringify(corps) });

/** La page publique (créneaux, réservation, repli) et la gestion d'un rendez-vous par son lien. */
async function rendezVousPublics(browser) {
  // Les essais d'avant sont finis : limiteur remis à zéro, et plus personne ne reçoit
  purger();
  const ctx = await contexte(browser, VIEWPORTS.mobile, { hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  suivre(page);
  const aLaPrise = async () => {
    const lus = page.waitForResponse((x) => x.url().endsWith('/public/creneaux/'));
    await page.goto(BASE + '/');
    await lus.catch(() => undefined);
    await page.waitForSelector('.prix-etiquette');
  };
  const replie = async () =>
    (await page.locator('#rendez-vous [data-etape=contact] a.btn[href^="mailto:"]').count()) === 1 && (await page.locator('#rendez-vous .prise-jour').count()) === 0;

  // Repli : rien n'est proposé (personne ne reçoit), puis l'appel échoue
  let r = await api(API_PUBLIC, 'GET', 'creneaux/');
  if (r.status === 200 && r.json.ouvert === false) {
    verifier(r.json.jours.length === 0, 'créneaux : sans personne qui reçoit, rien n’est proposé (ouvert : faux)');
    await aLaPrise();
    verifier(await replie(), 'page publique sans créneau proposé : le lien vers l’adresse de contact reste');
  } else {
    ignore('page publique sans créneau proposé', 'des créneaux sont proposés sur ce poste sans l’utilisateur d’essai');
  }
  await page.route('**/v1/public/creneaux/', simuler(503, { success: false, message: 'Indisponible.' }));
  await aLaPrise();
  verifier(await replie(), 'page publique quand la lecture des créneaux échoue (503 simulé) : le lien vers l’adresse de contact reste');
  await page.unroute('**/v1/public/creneaux/');

  // Quelqu'un reçoit : des créneaux sont proposés
  ouvrirAgenda();
  r = await api(API_PUBLIC, 'GET', 'creneaux/');
  const prise = r.json;
  verifier(
    r.status === 200 && prise.ouvert === true && prise.jours.length > 2 && prise.fuseau === 'Europe/Paris' && prise.canaux.includes('visio') && prise.canaux.includes('telephone'),
    'créneaux : des jours et des heures de Paris, en visio ou par téléphone',
  );
  const premier = { date: prise.jours[0].date, heure: prise.jours[0].creneaux[0] };

  await aLaPrise();
  await page.waitForSelector('#rendez-vous .prise-jour');
  const jours = page.locator('#rendez-vous .prise-jour');
  const heures = page.locator('#rendez-vous .prise-heure');
  verifier(
    (await jours.count()) === Math.min(8, prise.jours.length) &&
      (await heures.count()) === prise.jours[0].creneaux.length &&
      (await texteDe(page, '#rendez-vous .prise-quand')).includes(momentEcrit(premier.date, premier.heure).split(' à ')[0]) &&
      /heure de Paris/.test(await texteDe(page, '#rendez-vous .prise-quand')),
    'page publique : les jours proposés, les heures du premier jour, « heure de Paris »',
    `${await jours.count()} jours, ${await heures.count()} heures`,
  );
  const mesure = await page.evaluate(() => ({
    deborde: document.documentElement.scrollWidth - window.innerWidth,
    petites: [...document.querySelectorAll('#rendez-vous .prise-jour, #rendez-vous .prise-heure, #rendez-vous .prise .lien')].filter((e) => {
      const b = e.getBoundingClientRect();
      return b.width < 44 || b.height < 44;
    }).length,
  }));
  verifier(mesure.deborde <= 1 && mesure.petites === 0, 'créneaux à 390 px : la page ne déborde pas, chaque jour et chaque heure fait 44 px au moins', JSON.stringify(mesure));

  // Au clavier : un jour se choisit par Entrée, « Voir plus de jours » donne le focus au premier jour ajouté
  await jours.nth(1).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#rendez-vous .prise-jour:nth-child(2)[aria-pressed=true]', { timeout: 5000 }).catch(() => undefined);
  verifier(
    (await jours.nth(1).getAttribute('aria-pressed')) === 'true' &&
      (await heures.count()) === prise.jours[1].creneaux.length &&
      (await texteDe(page, '#rendez-vous .prise-quand')).includes(momentEcrit(prise.jours[1].date, '09:00').split(' à ')[0]),
    'créneaux au clavier : Entrée choisit un jour, ses heures s’affichent',
  );
  if (prise.jours.length > 8) {
    await page.locator('#rendez-vous .prise > .lien').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('#rendez-vous .prise-jour').length > 8);
    const focus = await page.evaluate(() => [...document.querySelectorAll('#rendez-vous .prise-jour')].indexOf(document.activeElement));
    verifier((await jours.count()) === Math.min(16, prise.jours.length) && focus === 8, '« Voir plus de jours » : huit jours de plus, le focus sur le premier d’entre eux', `focus sur le jour ${focus}`);
  } else {
    ignore('« Voir plus de jours »', 'huit jours au plus sont proposés');
  }

  // Un autre parent prend le premier créneau pendant que la page est ouverte
  const autre = reserverRdv('essai.rdv-autre@navup.local');
  const envois = [];
  page.on('request', (q) => {
    if (q.method() === 'POST' && q.url().endsWith('/public/rendez-vous/')) {
      envois.push({ corps: q.postDataJSON(), entetes: q.headers() });
    }
  });
  await choisirCreneau(page, '#rendez-vous', 0, 0);
  await page.waitForSelector('#rendez-vous form');
  await page.click('#rendez-vous form button[type=submit]');
  const sansIdentite = await attendreTexte(page, '#rendez-vous form .refus', /prénom/);
  await page.fill('#rendez-vous input[name=prenom]', 'Camille');
  await page.fill('#rendez-vous input[name=nom]', 'Essai-Rdv');
  await page.fill('#rendez-vous input[name=email]', 'essai.rdv-public@navup.local');
  await page.check('#rendez-vous label.case:has-text("Par téléphone") input');
  const champNumero = await page
    .waitForSelector('#rendez-vous input[name=telephone]', { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  await page.click('#rendez-vous form button[type=submit]');
  const sansNumero = await attendreTexte(page, '#rendez-vous form .refus', /numéro/);
  await page.check('#rendez-vous label.case:has-text("En visio") input');
  await page.waitForSelector('#rendez-vous input[name=telephone]', { state: 'detached', timeout: 5000 }).catch(() => undefined);
  const sansChampNumero = (await page.locator('#rendez-vous input[name=telephone]').count()) === 0;
  await page.fill('#rendez-vous textarea[name=note]', 'Les écrans, le soir.');
  await page.click('#rendez-vous form button[type=submit]');
  const sansCase = await attendreTexte(page, '#rendez-vous form .refus', /confidentialité/);
  verifier(
    sansIdentite !== '' && sansNumero !== '' && champNumero && sansChampNumero && sansCase !== '' && envois.length === 0,
    'rendez-vous : refus écrits dans la page (identité, numéro si téléphone, confidentialité), rien n’est envoyé',
    [sansIdentite, sansNumero, sansCase].join(' / '),
  );
  verifier(
    (await page.locator('#rendez-vous .leurre input[name=site]').count()) === 1 && (await page.getAttribute('#rendez-vous form a[href$="/confidentialite"]', 'href')) !== null,
    'rendez-vous : le champ leurre est là, hors de vue, et la case mène à la politique de confidentialité',
  );
  await page.check('#rendez-vous input[name=confidentialite]');

  if (autre.date_debut === `${premier.date} ${premier.heure}:00`) {
    await page.click('#rendez-vous form button[type=submit]');
    await page.waitForSelector('#rendez-vous app-rdv-decouverte > .refus');
    const dit = await texteDe(page, '#rendez-vous app-rdv-decouverte > .refus');
    await page.waitForSelector('#rendez-vous form', { state: 'detached' });
    const premiereHeure = await heures.first().innerText();
    verifier(
      /vient d'être pris/.test(dit) && (await page.locator('#rendez-vous form').count()) === 0 && premiereHeure.trim() !== momentEcrit(premier.date, premier.heure).split(' à ')[1],
      'créneau pris entre-temps : la page le dit et montre les créneaux à jour, sans ce créneau',
      `${dit} / première heure : ${premiereHeure}`,
    );
  } else {
    ignore('créneau pris entre-temps', `le script a réservé ${autre.date_debut}, pas le premier créneau lu (${premier.date} ${premier.heure})`);
  }

  // Un autre créneau : la saisie est restée, la demande part
  const choisi = { date: prise.jours[1].date, heure: prise.jours[1].creneaux[2] };
  await choisirCreneau(page, '#rendez-vous', 1, 2);
  await page.waitForSelector('#rendez-vous form');
  const gardee = (await page.inputValue('#rendez-vous input[name=prenom]')) === 'Camille' && (await page.isChecked('#rendez-vous input[name=confidentialite]'));
  await page.click('#rendez-vous form button[type=submit]');
  await page.waitForSelector('#rendez-vous [data-etape=envoye]');
  const annonce = await texteDe(page, '#rendez-vous [data-etape=envoye]');
  verifier(
    gardee && /Un e-mail vient de partir/.test(annonce) && annonce.includes('essai.rdv-public@navup.local') && annonce.includes(momentEcrit(choisi.date, choisi.heure)) && /heure de paris/i.test(annonce) && /le déplacer ou l'annuler/.test(annonce),
    'réservation publique : la saisie est gardée, puis l’écran annonce l’e-mail et rappelle le créneau choisi',
    annonce,
  );
  const dernier = envois[envois.length - 1];
  verifier(
    envois.length >= 1 &&
      UUID_V4.test(dernier.corps.cle_saisie) &&
      envois.every((e) => e.corps.cle_saisie === dernier.corps.cle_saisie && e.corps.site === '' && !('authorization' in e.entetes)) &&
      dernier.corps.canal === 'visio' &&
      !('telephone' in dernier.corps) &&
      dernier.corps.note === 'Les écrans, le soir.' &&
      dernier.corps.date === choisi.date &&
      dernier.corps.heure === choisi.heure &&
      dernier.corps.confidentialite === 1,
    `demande envoyée (${envois.length} envoi(s)) : clé de saisie UUID v4 gardée d’un essai à l’autre, leurre vide, pas de numéro en visio`,
    JSON.stringify(dernier?.corps),
  );
  r = await api(API_PUBLIC, 'GET', 'creneaux/');
  verifier(!r.json.jours.find((j) => j.date === choisi.date)?.creneaux.includes(choisi.heure), 'réservation publique : le créneau réservé n’est plus proposé par l’API');
  verifier((await page.evaluate(() => localStorage.length + sessionStorage.length)) === 0, 'page publique : rien dans le stockage du navigateur, ni saisie ni créneau');

  // La réponse ne dit rien d'un dossier : la même pour une adresse qui a déjà un rendez-vous et pour une inconnue
  const libre = r.json.jours[3];
  const demande = (email, heure, cle) => ({
    corps: { prenom: 'Camille', nom: 'Essai-Rdv', email, canal: 'visio', date: libre.date, heure, confidentialite: 1, cle_saisie: cle, site: '' },
  });
  const connue = await api(API_PUBLIC, 'POST', 'rendez-vous/', demande('essai.rdv-autre@navup.local', libre.creneaux[0], 'e55a1e55-0000-4000-8000-000000000001'));
  const inconnue = await api(API_PUBLIC, 'POST', 'rendez-vous/', demande('essai.rdv-inconnue@navup.local', libre.creneaux[1], 'e55a1e55-0000-4000-8000-000000000002'));
  verifier(
    connue.status === 201 && inconnue.status === 201 && JSON.stringify(connue.json) === JSON.stringify(inconnue.json) && connue.json.suite === 'email',
    'demande de rendez-vous : même réponse, que l’adresse ait déjà un rendez-vous ou non',
    `${connue.status} / ${inconnue.status}`,
  );

  // ---------- Gestion par le lien reçu par e-mail ----------
  const rdv = reserverRdv('essai.rdv-lien@navup.local');
  const jeton = jetonDuLien(rdv.lien);
  r = await api(API_PUBLIC, 'POST', 'rendez-vous/gestion/', { corps: { jeton } });
  const vue = r.json;
  verifier(
    r.status === 200 && /^[a-f0-9]{48}$/.test(jeton) && vue.rdv.etat === 'confirme' && vue.rdv.date_debut === rdv.date_debut && vue.rdv.annulable && vue.rdv.deplacable && vue.prise.ouvert && vue.delai_heures > 0,
    'lien de gestion (API) : le rendez-vous confirmé, déplaçable et annulable, avec ses créneaux',
  );
  r = await api(API_PUBLIC, 'POST', 'rendez-vous/gestion/', { corps: { jeton: 'a'.repeat(48) } });
  verifier(r.status === 404, 'lien de gestion (API) : un jeton inconnu répond 404');

  const lien = await ctx.newPage();
  suivre(lien);
  const demandes = [];
  lien.on('request', (q) => q.url().includes('/public/rendez-vous/gestion/') && demandes.push({ url: q.url(), corps: q.postDataJSON(), entetes: q.headers() }));
  await lien.goto(rdv.lien);
  await lien.waitForSelector('[data-page=vue] .rdv');
  let fiche = await texteDe(lien, '[data-page=vue]');
  verifier(!lien.url().includes('#') && lien.url() === BASE + '/rendez-vous', 'lien de gestion : le jeton est retiré de la barre d’adresse', lien.url());
  verifier(
    fiche.includes(capitale(momentEcrit(rdv.date_debut, undefined, true))) && /Rendez-vous découverte par téléphone, 30 minutes\. Heure de Paris\./.test(fiche) && /confirmé/.test(fiche),
    'lien de gestion : le rendez-vous, son jour et son heure de Paris, sa durée, son canal, son état',
    fiche,
  );
  verifier(
    demandes.length > 0 && demandes.every((d) => !d.url.includes(jeton) && d.corps.jeton === jeton && !('authorization' in d.entetes)),
    'lien de gestion : le jeton voyage dans le corps des demandes, jamais dans une adresse',
  );

  const [fichier] = await Promise.all([lien.waitForEvent('download'), lien.click('.rdv button:has-text("Ajouter à mon agenda")')]);
  const ics = fs.readFileSync(await fichier.path(), 'utf8');
  verifier(
    fichier.suggestedFilename() === 'rendez-vous-navup.ics' && ics.startsWith('BEGIN:VCALENDAR') && /DTSTART:\d{8}T\d{6}Z/.test(ics) && /SUMMARY:Rendez-vous d/.test(ics),
    '« Ajouter à mon agenda » : un fichier .ics est remis, fabriqué dans la page',
    fichier.suggestedFilename(),
  );

  // Déplacer : mêmes créneaux que partout, puis le lien suit le rendez-vous déplacé
  await lien.click('.rdv .lien:has-text("Déplacer")');
  await lien.waitForSelector('.rdv-geste .prise-jour');
  const cible = { date: vue.prise.jours[2].date, heure: vue.prise.jours[2].creneaux[1] };
  await choisirCreneau(lien, '.rdv-geste', 2, 1);
  await lien.click('.rdv-geste .btn');
  await lien.waitForSelector('.rdv .refus.info');
  r = await api(API_PUBLIC, 'POST', 'rendez-vous/gestion/', { corps: { jeton } });
  fiche = await texteDe(lien, '[data-page=vue]');
  verifier(
    r.status === 200 && r.json.rdv.date_debut === `${cible.date} ${cible.heure}:00` && r.json.rdv.etat === 'confirme' && fiche.includes(capitale(momentEcrit(cible.date, cible.heure, true))) && /déplacé/.test(fiche),
    'déplacer par le lien : le rendez-vous passe au créneau choisi, le même lien le suit',
    `${r.json.rdv?.date_debut} / ${fiche}`,
  );

  // Annuler : la confirmation est écrite dans la page
  await lien.click('.rdv .lien:has-text("Annuler")');
  await lien.waitForSelector('.rdv-geste');
  const question = await texteDe(lien, '.rdv-geste');
  await lien.click('.rdv-geste .btn');
  await lien.waitForSelector('.rdv[data-etat=annule]');
  r = await api(API_PUBLIC, 'POST', 'rendez-vous/gestion/', { corps: { jeton } });
  fiche = await texteDe(lien, '[data-page=vue]');
  verifier(
    /Annuler ce rendez-vous \?/.test(question) &&
      r.json.rdv.etat === 'annule' &&
      !r.json.rdv.annulable &&
      /annulé/.test(fiche) &&
      (await lien.locator('.rdv .lien, .rdv button').count()) === 0 &&
      (await lien.locator('.rdv a:has-text("Prendre un autre rendez-vous")').count()) === 1,
    'annuler par le lien : confirmation en ligne, le rendez-vous est annulé, plus aucun geste, un autre peut être pris',
    fiche,
  );

  // Lien invalide : un autre lien ouvert dans le même onglet (seul le fragment change), puis une arrivée sans jeton
  await lien.goto(BASE + '/rendez-vous#' + 'a'.repeat(48));
  await lien.waitForSelector('[data-page=invalide]');
  verifier(/plus valable/.test(await texteDe(lien, '[data-page=invalide]')) && !lien.url().includes('#'), 'lien inconnu (404) : « Ce lien n’est plus valable », le jeton quitte l’adresse');
  const avant = demandes.length;
  const sansJeton = await ctx.newPage();
  suivre(sansJeton);
  sansJeton.on('request', (q) => q.url().includes('/public/rendez-vous/gestion/') && demandes.push({ url: q.url() }));
  await sansJeton.goto(BASE + '/rendez-vous#pas-un-jeton');
  await sansJeton.waitForSelector('[data-page=invalide]');
  verifier(demandes.length === avant && !sansJeton.url().includes('#'), 'lien mal formé : dit invalide sans rien demander à l’API');

  // États que l'API ne se laisse pas provoquer (le délai est de plusieurs heures) : sa réponse est simulée, le front affiché est le vrai
  // Chaque réponse simulée porte une heure à elle : la fiche est lue quand elle l'affiche
  const simule = (corps) => ({ rdv: { id_rdv: 1, type: 'decouverte', duree: 30, canal: 'visio', visio: null, annulable: false, deplacable: false, ...corps }, prise: null, delai_heures: 12 });
  const montrer = async (corps) => {
    await sansJeton.unroute('**/v1/public/rendez-vous/gestion/').catch(() => undefined);
    await sansJeton.route('**/v1/public/rendez-vous/gestion/', simuler(200, { success: true, ...simule(corps) }));
    await sansJeton.goto(BASE + '/rendez-vous#' + 'b'.repeat(48));
    await attendreTexte(sansJeton, '[data-page=vue] h2', momentEcrit(corps.date_debut));
    return texteDe(sansJeton, '[data-page=vue]');
  };
  fiche = await montrer({ etat: 'confirme', date_debut: '2026-12-01 09:00:00' });
  verifier(
    /ne se modifie plus en ligne/.test(fiche) && /12 heures/.test(fiche) && /contact@navup\.fr/.test(fiche) && (await sansJeton.locator('.rdv .lien').count()) === 0,
    'plus modifiable en ligne (réponse simulée) : ni « Déplacer » ni « Annuler », « écrivez-nous »',
    fiche,
  );
  fiche = await montrer({ etat: 'confirme', date_debut: '2026-12-01 10:00:00', visio: 'https://visio.exemple.test/navup-essai', annulable: true });
  verifier(
    (await sansJeton.getAttribute('.rdv a.btn:has-text("Rejoindre la visio")', 'href')) === 'https://visio.exemple.test/navup-essai' && /en visio/.test(fiche) && /Pour le déplacer, écrivez-nous/.test(fiche),
    'rendez-vous en visio (réponse simulée) : le lien de la visio est proposé',
    fiche,
  );
  fiche = await montrer({ etat: 'passe', date_debut: '2026-09-01 11:00:00' });
  verifier(/passé/.test(fiche) && !/absent/i.test(fiche) && (await sansJeton.locator('.rdv button, .rdv .lien').count()) === 0, 'rendez-vous passé (réponse simulée) : dit « passé », sans geste', fiche);
  await sansJeton.unroute('**/v1/public/rendez-vous/gestion/');

  verifier((await lien.evaluate(() => localStorage.length + sessionStorage.length)) === 0, 'gestion par lien : rien dans le stockage du navigateur, le jeton reste en mémoire de la page');
  await ctx.close();
}

/** Les rendez-vous dans l'espace personnel. Ils demandent un billet de l'API des parents : sans son droit d'écriture, rien ne peut être exercé. */
async function rendezVousEspace(browser) {
  const droit = droitBillet();
  // Limiteur remis à zéro (les gestes publics en ont consommé), puis de nouveau quelqu'un qui reçoit
  purger();
  ouvrirAgenda();
  const parent = preparerParent({ email: 'essai.rdv-espace@navup.local', debut: -10 });
  const ctx = await contexte(browser, VIEWPORTS.mobile, { hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  suivre(page);
  const publiques = [];
  page.on('request', (q) => q.url().startsWith(API_PUBLIC) && publiques.push({ url: q.url(), entetes: q.headers(), corps: q.postData() }));
  await entrer(page, parent.lien);
  verifier((await page.locator('.rail nav a[href="/espace/rendez-vous"]').count()) === 1, 'espace : « Rendez-vous » est dans la navigation');
  const mesure = await page.evaluate(() => ({
    deborde: document.documentElement.scrollWidth - window.innerWidth,
    coupes: [...document.querySelectorAll('.rail nav a')].filter((a) => a.scrollWidth > a.clientWidth + 1).length,
    entrees: document.querySelectorAll('.rail nav a').length,
  }));
  verifier(mesure.entrees === 4 && mesure.coupes === 0 && mesure.deborde <= 1, 'navigation à 390 px : quatre entrées, aucune coupée, la page ne déborde pas', JSON.stringify(mesure));

  // La page publique visitée en étant connecté : le jeton de session ne part pas vers la Tour de contrôle
  const lus = page.waitForResponse((x) => x.url().endsWith('/public/creneaux/'));
  await page.goto(BASE + '/');
  await lus;
  await page.waitForSelector('.prix-etiquette');

  const session = (await api(API_ESPACE, 'POST', 'session/', { corps: { email: 'essai.rdv-espace@navup.local', pass: enrober(MOT_DE_PASSE) } })).json.token;
  let r = await api(API_ESPACE, 'POST', 'rendez-vous/billet/', { jeton: session });

  if (!droit.present) {
    // Le billet ne peut pas être écrit : la page ne peut que le dire. Ses contrôles sont écrits ci-dessous, pas exercés.
    const raison = `droit e_billet manquant (${droit.detail} ; v1/rendez-vous/billet/ répond ${r.status})`;
    await page.goto(BASE + '/espace/rendez-vous');
    await page.waitForSelector('.espace-page .refus');
    verifier(
      (await page.locator('.espace-page .refus').count()) === 1 && (await page.locator('.espace-page button:has-text("Réessayer")').count()) === 1 && (await page.locator('.rail nav a.ici[href="/espace/rendez-vous"]').count()) === 1,
      'espace sans billet : la page des rendez-vous le dit et propose de réessayer, la navigation reste',
    );
    await page.goto(BASE + '/espace');
    await page.waitForSelector('.accueil');
    verifier((await page.locator('[data-rdv=rappel]').count()) === 0 && /semaine 2 sur 12/.test(await page.textContent('.espace-page header')), 'accueil sans billet : le programme s’affiche, sans rappel de rendez-vous');
    for (const libelle of [
      'billet : délivré à la session, refusé s’il est inconnu',
      'espace : créneaux d’accompagnement affichés, « Prendre un rendez-vous d’accompagnement »',
      'espace : réservation (façon de se parler, téléphone si le dossier n’en a pas, sujet à aborder)',
      'espace : le rendez-vous réservé apparaît à venir, un seul à la fois',
      'accueil : rappel du prochain rendez-vous',
      'espace : déplacer, ajouter à l’agenda, annuler',
      'espace : rendez-vous précédents, « passé » ou « annulé »',
      'espace : billet périmé (401), redemandé puis appel rejoué dans le navigateur',
    ]) {
      nonVerifie(libelle, raison);
    }
  } else {
    verifier(r.status === 201 && /^[0-9a-f]{48}$/.test(r.json.billet), 'billet : délivré à la session', String(r.status));
    const billet = r.json.billet;
    r = await api(API_PUBLIC, 'POST', 'rendez-vous/espace/', { corps: { billet } });
    const vue = r.json;
    const refuse = await api(API_PUBLIC, 'POST', 'rendez-vous/espace/', { corps: { billet: 'b'.repeat(48) } });
    verifier(
      r.status === 200 && vue.peut_prendre === true && vue.avenir.length === 0 && vue.prise.type === 'suivi' && vue.prise.ouvert && refuse.status === 401,
      'rendez-vous de l’espace (API) : rien à venir, un rendez-vous d’accompagnement peut être pris ; billet inconnu refusé (401)',
      `${r.status} / ${refuse.status}`,
    );

    // Le premier billet présenté par la page est refusé une fois, comme un billet périmé : elle en redemande un et rejoue
    let perime = true;
    let billets = 0;
    page.on('request', (q) => q.url().endsWith('/rendez-vous/billet/') && q.method() === 'POST' && billets++);
    await page.route('**/v1/public/rendez-vous/espace/', (route) => {
      if (perime) {
        perime = false;
        return simuler(401, { success: false, message: 'Votre billet n’est plus valable.', code: 2 })(route);
      }
      return route.continue();
    });
    await page.goto(BASE + '/espace/rendez-vous');
    await page.waitForSelector('[data-rdv=prendre] .prise-jour');
    await page.unroute('**/v1/public/rendez-vous/espace/');
    verifier(!perime && billets === 2, 'billet périmé (401 simulé une fois) : un autre est demandé, l’appel est rejoué, la page s’affiche', `${billets} billet(s)`);
    verifier(
      (await page.locator('[data-rdv=prendre] .prise-jour').count()) === Math.min(8, vue.prise.jours.length) && (await page.locator('[data-rdv=avenir]').count()) === 0,
      'espace : les créneaux d’accompagnement, « Prendre un rendez-vous d’accompagnement »',
    );

    // Prendre : par téléphone, le numéro n'est demandé que si le dossier n'en a pas
    const choisi = { date: vue.prise.jours[1].date, heure: vue.prise.jours[1].creneaux[0] };
    await choisirCreneau(page, '[data-rdv=prendre]', 1, 0);
    await page.waitForSelector('[data-rdv=prendre] form');
    await page.check('[data-rdv=prendre] label.case:has-text("Par téléphone") input');
    // Le dossier a déjà un numéro : une phrase le dit ; sinon le champ apparaît, et il est obligatoire
    await page.waitForSelector('[data-rdv=prendre] input[name=telephone], [data-rdv=prendre] form p.secondaire');
    const champ = await page.locator('[data-rdv=prendre] input[name=telephone]').count();
    if (champ === 1) {
      await page.click('[data-rdv=prendre] form button[type=submit]');
      await attendreTexte(page, '[data-rdv=prendre] form .refus', /numéro/);
      await page.fill('[data-rdv=prendre] input[name=telephone]', '06 00 00 00 00');
    }
    await page.fill('[data-rdv=prendre] textarea[name=note]', 'Le retour du collège.');
    await page.click('[data-rdv=prendre] form button[type=submit]');
    await page.waitForSelector('[data-rdv=avenir] .rdv');
    let fiche = await texteDe(page, '[data-rdv=avenir]');
    r = await api(API_PUBLIC, 'POST', 'rendez-vous/espace/', { corps: { billet } });
    verifier(
      champ === (vue.telephone_connu ? 0 : 1) &&
        fiche.includes(capitale(momentEcrit(choisi.date, choisi.heure))) &&
        /Rendez-vous d'accompagnement par téléphone/.test(fiche) &&
        r.json.avenir.length === 1 &&
        r.json.avenir[0].date_debut === `${choisi.date} ${choisi.heure}:00` &&
        r.json.peut_prendre === false &&
        (await page.locator('[data-rdv=prendre]').count()) === 0,
      'espace : le rendez-vous d’accompagnement est réservé et apparaît à venir ; un seul à la fois',
      fiche,
    );

    await page.goto(BASE + '/espace');
    await page.waitForSelector('[data-rdv=rappel]');
    verifier((await texteDe(page, '[data-rdv=rappel]')).includes(capitale(momentEcrit(choisi.date, choisi.heure))), 'accueil : le prochain rendez-vous est rappelé, avec son jour et son heure');

    // Déplacer, agenda, annuler
    await page.goto(BASE + '/espace/rendez-vous');
    await page.waitForSelector('[data-rdv=avenir] .rdv');
    const [fichier] = await Promise.all([page.waitForEvent('download'), page.click('[data-rdv=avenir] button:has-text("Ajouter à mon agenda")')]);
    verifier(fichier.suggestedFilename() === 'rendez-vous-navup.ics' && fs.readFileSync(await fichier.path(), 'utf8').startsWith('BEGIN:VCALENDAR'), 'espace : « Ajouter à mon agenda » remet un fichier .ics');
    await page.click('[data-rdv=avenir] .lien:has-text("Déplacer")');
    await page.waitForSelector('[data-rdv=avenir] .rdv-geste .prise-jour');
    await choisirCreneau(page, '[data-rdv=avenir] .rdv-geste', 3, 0);
    await page.click('[data-rdv=avenir] .rdv-geste .btn');
    await page.waitForSelector('[data-rdv=avenir] .rdv-geste', { state: 'detached' });
    r = await api(API_PUBLIC, 'POST', 'rendez-vous/espace/', { corps: { billet } });
    fiche = await texteDe(page, '[data-rdv=avenir]');
    verifier(
      r.json.avenir.length === 1 && r.json.avenir[0].date_debut !== `${choisi.date} ${choisi.heure}:00` && fiche.includes(capitale(momentEcrit(r.json.avenir[0].date_debut))),
      'espace : déplacer un rendez-vous, le nouveau créneau s’affiche',
      fiche,
    );
    await page.click('[data-rdv=avenir] .lien:has-text("Annuler")');
    await page.waitForSelector('[data-rdv=avenir] .rdv-geste');
    await page.click('[data-rdv=avenir] .rdv-geste .btn');
    await page.waitForSelector('[data-rdv=avant]');
    r = await api(API_PUBLIC, 'POST', 'rendez-vous/espace/', { corps: { billet } });
    const precedents = await texteDe(page, '[data-rdv=avant]');
    verifier(
      r.json.avenir.length === 0 && r.json.peut_prendre === true && /annulé/.test(precedents) && !/absent/i.test(await page.innerText('.espace-page')) && (await page.locator('[data-rdv=avenir]').count()) === 0 && (await page.locator('[data-rdv=prendre]').count()) === 1,
      'espace : annuler (confirmation en ligne) ; le rendez-vous passe aux précédents, « annulé », et un autre peut être pris',
      precedents,
    );
  }

  verifier(
    publiques.length > 0 && publiques.every((q) => !('authorization' in q.entetes) && !q.url.includes('?')),
    `parent connecté : aucune des ${publiques.length} demandes aux endpoints publics ne porte le jeton de session`,
  );
  const cles = await page.evaluate(() => [Object.keys(localStorage).join(','), sessionStorage.length]);
  verifier(cles[0] === 'navup_parent_token' && cles[1] === 0, 'stockage après les rendez-vous : toujours une seule clé, le jeton de session ; ni billet ni créneau', cles.join(' / '));
  await ctx.close();
}
