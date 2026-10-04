import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, PLATFORM_ID, inject, signal, viewChild } from '@angular/core';
import { horloge } from '../../core/format';
import { Icon } from '../../shared/icon';

/**
 * L'extrait audio de la page publique : quatre-vingts secondes du sujet 01, à écouter sans compte.
 * C'est le poste de l'espace personnel, en petit. L'aiguille de son cadran suit le vrai signal (AnalyserNode) :
 * elle ne bouge que si le son joue, et retombe à la pause. Avec « réduire les animations », elle reste au repos.
 * Le fichier est servi par le site lui-même (public/medias) : l'extrait n'ouvre aucun accès au programme.
 */
@Component({
  selector: 'app-extrait',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'poste' },
  template: `
    <div class="poste-tete">
      <img class="pochette" src="images/pochette-jaune.webp" alt="" width="512" height="512" loading="lazy" />
      <p class="poste-titre"><span class="chiffre">01</span> · Le corps qui change</p>
    </div>
    <div class="poste-cadran" aria-hidden="true">
      <svg viewBox="0 0 200 92" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M24 62 A92 92 0 0 1 176 62" />
        <path d="M150 34.5 A92 92 0 0 1 176 62" stroke="var(--bleu)" stroke-width="6" />
        <path d="M24 62l7-5M49 36l5 7M82 22l2 8M118 22l-2 8M151 36l-5 7M176 62l-7-5" />
        <g #aiguille class="aiguille">
          <path d="M100 114V32" stroke-width="2.5" />
        </g>
        <circle cx="100" cy="114" r="30" fill="var(--encre)" stroke="none" />
      </svg>
    </div>
    <div class="poste-commandes">
      <button class="btn btn-rond grand" type="button" (click)="basculer()" [attr.aria-label]="enLecture() ? 'Mettre l’extrait en pause' : 'Écouter l’extrait'">
        <app-icon [nom]="enLecture() ? 'pause' : 'play'" />
      </button>
      <span class="extrait-temps" aria-live="off">
        {{ enLecture() || position() > 0 ? heure(position()) + ' sur ' + heure(duree()) : 'Écouter un extrait, ' + heure(duree()) }}
      </span>
    </div>
  `,
})
export class Extrait implements OnDestroy {
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly aiguille = viewChild<ElementRef<SVGGElement>>('aiguille');

  private audio: HTMLAudioElement | null = null;
  private contexte: AudioContext | null = null;
  private analyseur: AnalyserNode | null = null;
  private echantillons: Uint8Array<ArrayBuffer> | null = null;
  private image = 0;
  private niveau = 0;

  readonly enLecture = signal(false);
  readonly position = signal(0);
  readonly duree = signal(80);
  readonly heure = horloge;

  basculer(): void {
    if (!this.navigateur) {
      return;
    }
    const audio = this.element();
    if (audio.paused) {
      this.brancher(audio);
      void this.contexte?.resume();
      void audio.play().catch(() => this.enLecture.set(false));
    } else {
      audio.pause();
    }
  }

  ngOnDestroy(): void {
    // Pendant le prérendu, il n'y a ni image à annuler ni son à couper
    if (!this.navigateur) {
      return;
    }
    cancelAnimationFrame(this.image);
    this.audio?.pause();
    void this.contexte?.close();
  }

  private element(): HTMLAudioElement {
    if (this.audio) {
      return this.audio;
    }
    const audio = new Audio('medias/extrait-01.mp3');
    audio.preload = 'none';
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) {
        this.duree.set(Math.round(audio.duration));
      }
    });
    audio.addEventListener('timeupdate', () => this.position.set(audio.currentTime));
    audio.addEventListener('play', () => {
      this.enLecture.set(true);
      this.animer();
    });
    audio.addEventListener('pause', () => this.enLecture.set(false));
    audio.addEventListener('ended', () => {
      this.enLecture.set(false);
      this.position.set(0);
    });
    this.audio = audio;
    return audio;
  }

  // Le signal passe par un analyseur avant d'aller au haut-parleur. Créé au premier appui : un navigateur refuse
  // un contexte audio sans geste. S'il n'existe pas, l'extrait joue quand même, l'aiguille reste au repos.
  private brancher(audio: HTMLAudioElement): void {
    if (this.contexte || typeof AudioContext === 'undefined') {
      return;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    try {
      this.contexte = new AudioContext();
      this.analyseur = this.contexte.createAnalyser();
      this.analyseur.fftSize = 1024;
      this.echantillons = new Uint8Array(new ArrayBuffer(this.analyseur.fftSize));
      const source = this.contexte.createMediaElementSource(audio);
      source.connect(this.analyseur);
      this.analyseur.connect(this.contexte.destination);
    } catch {
      this.contexte = null;
      this.analyseur = null;
    }
  }

  // L'aiguille a de la masse : elle monte vite, retombe lentement, comme celle d'un vrai cadran
  private animer(): void {
    cancelAnimationFrame(this.image);
    const trait = this.aiguille()?.nativeElement;
    if (!trait || !this.analyseur || !this.echantillons) {
      return;
    }
    const pas = (): void => {
      let cible = 0;
      if (this.enLecture() && this.analyseur && this.echantillons) {
        this.analyseur.getByteTimeDomainData(this.echantillons);
        let somme = 0;
        for (const v of this.echantillons) {
          const e = (v - 128) / 128;
          somme += e * e;
        }
        cible = Math.min(1, Math.sqrt(somme / this.echantillons.length) * 3.2);
      }
      this.niveau += (cible - this.niveau) * (cible > this.niveau ? 0.3 : 0.07);
      trait.style.rotate = `${-52 + this.niveau * 104}deg`;
      if (this.enLecture() || this.niveau > 0.005) {
        this.image = requestAnimationFrame(pas);
      }
    };
    this.image = requestAnimationFrame(pas);
  }
}
