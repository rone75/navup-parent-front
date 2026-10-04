import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from './api-error';
import { EspaceApiService } from './espace-api.service';
import { numero } from './format';
import { Progression, Sujet } from './models';
import { ToastService } from './toast.service';

export const VITESSES = [0.75, 1, 1.25, 1.5, 2] as const;

/** Le sujet que le poste joue : de quoi l'afficher partout dans l'espace, et sa progression. */
export interface EnEcoute {
  id_sujet: number;
  numero: number;
  titre: string;
  pochette: 'jaune' | 'bleu';
  duree: number | null;
  progression: Progression;
}

// La position part au serveur toutes les quinze secondes de lecture, à la pause et quand l'appli passe en arrière-plan
const INTERVALLE_SAUVEGARDE = 15;

/**
 * Le poste : un seul élément <audio> pour toute la vie de l'appli (un téléphone n'en laisse jouer qu'un, et ne le
 * laisse démarrer que sur un geste). Il garde le sujet en écoute d'une page à l'autre de l'espace.
 * - La lecture reprend où elle s'était arrêtée : la position vient du serveur, et lui est rendue en cours de route.
 * - L'adresse d'un audio est signée et ne vaut que quelques heures : quand elle ne répond plus, le sujet est
 *   redemandé et la lecture reprend au même endroit.
 * - « Terminé » est un geste du parent : rien ici ne le déduit de l'écoute.
 */
@Injectable({ providedIn: 'root' })
export class LecteurService {
  private readonly api = inject(EspaceApiService);
  private readonly toast = inject(ToastService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private audio: HTMLAudioElement | null = null;
  private dernierEnvoi = 0;
  private reprise: number | null = null; // position à reposer quand le fichier est prêt
  private relances = 0;

  private readonly sujetSig = signal<EnEcoute | null>(null);
  private readonly lectureSig = signal(false);
  private readonly positionSig = signal(0);
  private readonly dureeSig = signal(0);
  private readonly vitesseSig = signal<number>(1);
  private readonly attenteSig = signal(false);

  /** Le sujet chargé dans le poste, ou null. */
  readonly sujet = this.sujetSig.asReadonly();
  readonly enLecture = this.lectureSig.asReadonly();
  readonly position = this.positionSig.asReadonly();
  readonly duree = this.dureeSig.asReadonly();
  readonly vitesse = this.vitesseSig.asReadonly();
  /** Le fichier se charge (réseau lent) : le bouton de lecture le dit. */
  readonly attente = this.attenteSig.asReadonly();
  /** Part écoulée, de 0 à 100, pour dessiner la piste. */
  readonly part = computed(() => (this.dureeSig() > 0 ? Math.min(100, (this.positionSig() / this.dureeSig()) * 100) : 0));

  /**
   * Place un sujet dans le poste, sans lancer la lecture (elle attend un geste). Le même sujet déjà chargé garde
   * sa lecture en cours : seule sa progression est rafraîchie.
   */
  charger(sujet: Sujet): void {
    if (!this.navigateur || sujet.audio === null) {
      return;
    }
    const courant = this.sujetSig();
    if (courant?.id_sujet === sujet.id_sujet) {
      this.sujetSig.set({ ...courant, progression: this.lectureSig() ? courant.progression : sujet.progression });
      return;
    }
    this.envoyer();
    const audio = this.element();
    audio.pause();
    this.lectureSig.set(false);
    this.relances = 0;
    this.sujetSig.set({
      id_sujet: sujet.id_sujet,
      numero: sujet.numero,
      titre: sujet.titre,
      pochette: sujet.pochette,
      duree: sujet.audio.duree,
      progression: sujet.progression,
    });
    this.dureeSig.set(sujet.audio.duree ?? 0);
    // Un sujet écouté jusqu'au bout reprend au début
    const depart = sujet.audio.duree !== null && sujet.progression.position >= sujet.audio.duree - 5 ? 0 : sujet.progression.position;
    this.positionSig.set(depart);
    this.reprise = depart;
    audio.src = sujet.audio.url;
    audio.load();
    this.annoncer();
  }

  /** Lecture ou pause. Toujours appelée depuis un geste du parent. */
  basculer(): void {
    const audio = this.audio;
    if (!audio || this.sujetSig() === null) {
      return;
    }
    if (audio.paused) {
      audio.playbackRate = this.vitesseSig();
      void audio.play().catch(() => this.lectureSig.set(false));
    } else {
      audio.pause();
    }
  }

  /** Recule ou avance de quelques secondes. */
  sauter(secondes: number): void {
    this.aller(this.positionSig() + secondes);
  }

  /** Va à une position, en secondes. */
  aller(secondes: number): void {
    const audio = this.audio;
    if (!audio) {
      return;
    }
    const max = this.dureeSig() > 0 ? this.dureeSig() : Number.MAX_SAFE_INTEGER;
    const cible = Math.max(0, Math.min(max, secondes));
    this.positionSig.set(cible);
    if (audio.readyState >= 1) {
      audio.currentTime = cible;
    } else {
      this.reprise = cible;
    }
  }

  choisirVitesse(v: number): void {
    this.vitesseSig.set(v);
    if (this.audio) {
      this.audio.defaultPlaybackRate = v;
      this.audio.playbackRate = v;
    }
  }

  /** Marque le sujet terminé, ou revient dessus. Rend la progression du serveur, qui fait foi. */
  async marquer(idSujet: number, progression: Progression, termine: boolean): Promise<Progression> {
    const res = await firstValueFrom(this.api.progression({ id_sujet: idSujet, version: progression.version, termine }));
    // Un autre appareil a écrit entre-temps : rien n'a été écrit, on repart de l'état du serveur
    const suite = res.conflit
      ? (await firstValueFrom(this.api.progression({ id_sujet: idSujet, version: res.progression.version, termine }))).progression
      : res.progression;
    const courant = this.sujetSig();
    if (courant?.id_sujet === idSujet) {
      this.sujetSig.set({ ...courant, progression: suite });
    }
    return suite;
  }

  /** Vide le poste (déconnexion, accès fermé). */
  arreter(): void {
    this.envoyer();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.sujetSig.set(null);
    this.lectureSig.set(false);
    this.positionSig.set(0);
  }

  // L'élément audio, créé au premier besoin (jamais pendant le prérendu)
  private element(): HTMLAudioElement {
    if (this.audio) {
      return this.audio;
    }
    const audio = new Audio();
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.dureeSig.set(Math.round(audio.duration));
      }
      if (this.reprise !== null) {
        audio.currentTime = this.reprise;
        this.reprise = null;
      }
      audio.playbackRate = this.vitesseSig();
    });
    audio.addEventListener('timeupdate', () => {
      if (this.reprise !== null) {
        return;
      }
      this.positionSig.set(audio.currentTime);
      if (!audio.paused && Math.abs(audio.currentTime - this.dernierEnvoi) >= INTERVALLE_SAUVEGARDE) {
        this.envoyer();
      }
    });
    audio.addEventListener('play', () => {
      this.lectureSig.set(true);
      this.relances = 0;
      this.etatMedia('playing');
    });
    audio.addEventListener('pause', () => {
      this.lectureSig.set(false);
      this.etatMedia('paused');
      this.envoyer();
    });
    audio.addEventListener('waiting', () => this.attenteSig.set(true));
    audio.addEventListener('playing', () => this.attenteSig.set(false));
    audio.addEventListener('canplay', () => this.attenteSig.set(false));
    audio.addEventListener('ended', () => {
      this.lectureSig.set(false);
      this.envoyer();
    });
    audio.addEventListener('error', () => void this.relancer());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.envoyer();
      }
    });
    window.addEventListener('pagehide', () => this.envoyer());

    this.audio = audio;
    return audio;
  }

  /**
   * L'audio ne répond plus : son adresse signée a expiré (une pause reprise le lendemain) ou le fichier a été
   * remplacé. Le sujet est redemandé, la lecture reprend au même endroit. Deux essais, puis on le dit.
   */
  private async relancer(): Promise<void> {
    const courant = this.sujetSig();
    const audio = this.audio;
    if (!courant || !audio || !audio.getAttribute('src')) {
      return;
    }
    const jouait = this.lectureSig() || !audio.paused;
    this.lectureSig.set(false);
    if (this.relances >= 2) {
      this.attenteSig.set(false);
      this.toast.error("L'audio ne se charge pas. Vérifiez votre connexion, puis relancez la lecture.");
      return;
    }
    this.relances++;
    try {
      const frais = await firstValueFrom(this.api.sujet(courant.id_sujet));
      if (frais.audio === null || this.sujetSig()?.id_sujet !== courant.id_sujet) {
        return;
      }
      this.reprise = this.positionSig();
      audio.src = frais.audio.url;
      audio.load();
      if (jouait) {
        void audio.play().catch(() => this.lectureSig.set(false));
      }
    } catch (err) {
      this.attenteSig.set(false);
      this.toast.error(apiErrorMessage(err));
    }
  }

  /** Rend la position d'écoute au serveur. Sans attendre : la lecture ne dépend pas de la réponse. */
  private envoyer(): void {
    const courant = this.sujetSig();
    if (!courant || this.reprise !== null) {
      return;
    }
    const position = Math.floor(this.positionSig());
    if (position === courant.progression.position) {
      return;
    }
    this.dernierEnvoi = position;
    this.api.progression({ id_sujet: courant.id_sujet, version: courant.progression.version, position }).subscribe({
      next: (res) => {
        const actuel = this.sujetSig();
        if (actuel?.id_sujet !== courant.id_sujet) {
          return;
        }
        // En cas de conflit, on adopte la version du serveur ; la position partira au prochain envoi
        this.sujetSig.set({ ...actuel, progression: res.conflit ? { ...res.progression, position: actuel.progression.position } : res.progression });
      },
      error: () => undefined,
    });
  }

  // Écran verrouillé, casque, montre : le système affiche le sujet et pilote le poste
  private annoncer(): void {
    const courant = this.sujetSig();
    if (!courant || typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${numero(courant.numero)} · ${courant.titre}`,
      artist: 'NavUp',
      album: 'Programme NavUp',
      artwork: [{ src: `images/pochette-${courant.pochette}.webp`, sizes: '512x512', type: 'image/webp' }],
    });
    const gestes: [MediaSessionAction, () => void][] = [
      ['play', () => this.basculer()],
      ['pause', () => this.basculer()],
      ['seekbackward', () => this.sauter(-15)],
      ['seekforward', () => this.sauter(15)],
    ];
    for (const [action, geste] of gestes) {
      try {
        navigator.mediaSession.setActionHandler(action, geste);
      } catch {
        /* geste inconnu de ce navigateur */
      }
    }
  }

  private etatMedia(etat: MediaSessionPlaybackState): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = etat;
    }
  }
}
