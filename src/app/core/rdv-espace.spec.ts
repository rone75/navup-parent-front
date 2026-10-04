import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_ESPACE, API_PUBLIC } from './config';
import { VueRdvEspace } from './models';
import { RdvEspace } from './rdv-espace';
import { sessionInterceptor } from './session.interceptor';

const BILLET = `${API_ESPACE}rendez-vous/billet/`;
const RDV = `${API_PUBLIC}rendez-vous/espace/`;
const VUE: VueRdvEspace = {
  avenir: [],
  avant: [],
  prise: { ouvert: false, type: 'suivi', duree: 45, canaux: [], fuseau: 'Europe/Paris', jours: [] },
  peut_prendre: false,
  telephone_connu: true,
  delai_heures: 12,
};

/** Laisse passer les promesses en attente : l'appel suivant est alors parti. */
const souffler = () => new Promise<void>((suite) => setTimeout(suite));

describe('rendez-vous de l’espace : billet et jeton de session', () => {
  let http: HttpTestingController;
  let rdv: RdvEspace;

  beforeEach(() => {
    localStorage.setItem('navup_parent_token', 'jeton-de-session');
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), RdvEspace],
    });
    http = TestBed.inject(HttpTestingController);
    rdv = TestBed.inject(RdvEspace);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('demande le billet avec la session, puis le présente sans elle aux endpoints publics', async () => {
    const vue = rdv.vue();

    const billet = http.expectOne(BILLET);
    expect(billet.request.method).toBe('POST');
    expect(billet.request.headers.get('Authorization')).toBe('Bearer jeton-de-session');
    billet.flush({ success: true, billet: 'b1' }, { status: 201, statusText: 'Created' });
    await souffler();

    const lecture = http.expectOne(RDV);
    // Le jeton de session du parent ne part jamais vers la Tour de contrôle : seul le billet, dans le corps
    expect(lecture.request.headers.has('Authorization')).toBe(false);
    expect(lecture.request.body).toEqual({ billet: 'b1' });
    expect(lecture.request.urlWithParams).toBe(RDV);
    lecture.flush({ success: true, ...VUE });

    expect((await vue).delai_heures).toBe(12);
  });

  it('garde le billet d’un appel à l’autre, sans rien écrire dans le stockage', async () => {
    const premiere = rdv.vue();
    http.expectOne(BILLET).flush({ billet: 'b1' });
    await souffler();
    http.expectOne(RDV).flush(VUE);
    await premiere;

    const invitation = rdv.invitation(7);
    await souffler();
    http.expectNone(BILLET);
    const appel = http.expectOne(RDV);
    expect(appel.request.body).toEqual({ billet: 'b1', invitation: 7 });
    appel.flush({ nom: 'rendez-vous-navup.ics', ics: 'BEGIN:VCALENDAR' });
    await invitation;

    expect(Object.keys(localStorage)).toEqual(['navup_parent_token']);
    expect(sessionStorage.length).toBe(0);
  });

  it('billet périmé (401) : en redemande un et rejoue l’appel, une fois', async () => {
    const geste = rdv.annuler(12);
    http.expectOne(BILLET).flush({ billet: 'b1' });
    await souffler();
    http.expectOne(RDV).flush({ success: false, message: 'Votre billet n’est plus valable.' }, { status: 401, statusText: 'Unauthorized' });
    await souffler();

    http.expectOne(BILLET).flush({ billet: 'b2' });
    await souffler();
    const rejoue = http.expectOne(RDV);
    expect(rejoue.request.method).toBe('PUT');
    expect(rejoue.request.body).toEqual({ billet: 'b2', geste: 'annuler', id_rdv: 12 });
    rejoue.flush(VUE);

    expect((await geste).avenir).toEqual([]);
  });

  it('second refus du billet : l’erreur remonte, sans troisième essai', async () => {
    const vue = rdv.vue();
    const issue = vue.then(
      () => 'reçu',
      (err: { status: number }) => err.status,
    );
    http.expectOne(BILLET).flush({ billet: 'b1' });
    await souffler();
    http.expectOne(RDV).flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
    await souffler();
    http.expectOne(BILLET).flush({ billet: 'b2' });
    await souffler();
    http.expectOne(RDV).flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

    expect(await issue).toBe(401);
    http.expectNone(BILLET);
  });

  it('un refus qui n’est pas un billet périmé (400, créneau pris) n’est pas rejoué', async () => {
    const geste = rdv.deplacer(12, { date: '2026-10-06', heure: '09:00' });
    const issue = geste.then(
      () => 'reçu',
      (err: { status: number }) => err.status,
    );
    http.expectOne(BILLET).flush({ billet: 'b1' });
    await souffler();
    http.expectOne(RDV).flush({ success: false, motif: 'creneau' }, { status: 400, statusText: 'Bad Request' });

    expect(await issue).toBe(400);
    http.expectNone(BILLET);
  });
});
