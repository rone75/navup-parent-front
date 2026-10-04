import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_ESPACE } from './config';
import { Moi, ReponseMoi, ReponseSession } from './models';
import { obfuscatePassword, obfuscateToken } from './obfuscation';

/**
 * Clé du jeton de session dans le stockage local (valeur déjà enrobée, prête pour l'en-tête Authorization).
 * C'est la seule clé que l'appli y écrit : aucune donnée du programme ni du parent n'y entre.
 */
const CLE_JETON = 'navup_parent_token';

/** Session du parent : son jeton, son identité et l'état de son accès. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly moiSig = signal<Moi | null>(null);
  private lecture: Promise<void> | null = null;

  /** Le parent connecté (null tant que l'API n'a pas reconnu le jeton). */
  readonly moi = this.moiSig.asReadonly();
  readonly connecte = computed(() => this.moiSig() !== null);

  jeton(): string | null {
    if (!this.navigateur) {
      return null;
    }
    try {
      return localStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  }

  async connexion(email: string, motDePasse: string): Promise<Moi> {
    const res = await firstValueFrom(
      this.http.post<ReponseSession>(`${API_ESPACE}session/`, { email, pass: obfuscatePassword(motDePasse) }),
    );
    return this.ouvrir(res);
  }

  /** Le lien reçu par e-mail est-il encore utilisable ? Rend le prénom et la raison du lien. */
  verifierLien(jeton: string): Promise<{ prenom: string | null; motif: 'creation' | 'reinitialisation' }> {
    return firstValueFrom(
      this.http.post<{ prenom: string | null; motif: 'creation' | 'reinitialisation' }>(`${API_ESPACE}acces/verification/`, { jeton }),
    );
  }

  /** Crée ou remplace le mot de passe avec le lien reçu par e-mail : la session s'ouvre dans la foulée. */
  async choisirMotDePasse(jeton: string, motDePasse: string): Promise<Moi> {
    const res = await firstValueFrom(
      this.http.post<ReponseSession>(`${API_ESPACE}acces/`, { jeton, pass: obfuscatePassword(motDePasse) }),
    );
    return this.ouvrir(res);
  }

  /**
   * Relit le parent d'après le jeton gardé, une fois par chargement de l'appli (les gardes de l'espace l'attendent).
   * Ne rejette jamais. Seul un refus de l'API (401) efface le jeton : un réseau coupé ne déconnecte pas.
   */
  charger(): Promise<void> {
    if (this.moiSig() !== null || !this.jeton()) {
      return Promise.resolve();
    }
    this.lecture ??= firstValueFrom(this.http.get<ReponseMoi>(`${API_ESPACE}session/`))
      .then((res) => this.moiSig.set(res.moi))
      .catch((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.vider();
        }
      })
      .finally(() => (this.lecture = null));
    return this.lecture;
  }

  /** Relit l'état de l'accès (un sujet vient d'être refusé : l'accès a peut-être changé). */
  async relire(): Promise<void> {
    const res = await firstValueFrom(this.http.get<ReponseMoi>(`${API_ESPACE}session/`));
    this.moiSig.set(res.moi);
  }

  async changerMotDePasse(actuel: string, nouveau: string): Promise<void> {
    await firstValueFrom(
      this.http.put(`${API_ESPACE}session/mot-de-passe/`, {
        actuel: obfuscatePassword(actuel),
        nouveau: obfuscatePassword(nouveau),
      }),
    );
  }

  /** Préférences : l'e-mail de chaque nouvelle semaine, les écrans de bienvenue lus. */
  async preferences(choix: { annonce_semaine?: boolean; accueil_lu?: true }): Promise<void> {
    const res = await firstValueFrom(this.http.put<ReponseMoi>(`${API_ESPACE}profil/`, choix));
    this.moiSig.set(res.moi);
  }

  /** Ferme la session côté API (au mieux), l'oublie ici et revient à la connexion. */
  deconnexion(): void {
    if (this.jeton()) {
      this.http.delete(`${API_ESPACE}session/`).subscribe({ error: () => undefined });
    }
    this.vider();
    void this.router.navigateByUrl('/connexion');
  }

  /** Oublie la session sans naviguer (l'intercepteur l'appelle quand l'API ne reconnaît plus le jeton). */
  vider(): void {
    if (this.navigateur) {
      try {
        localStorage.removeItem(CLE_JETON);
      } catch {
        /* stockage indisponible */
      }
    }
    this.moiSig.set(null);
  }

  private ouvrir(res: ReponseSession): Moi {
    if (this.navigateur) {
      try {
        localStorage.setItem(CLE_JETON, obfuscateToken(res.token));
      } catch {
        /* stockage indisponible : la session ne survivra pas au rechargement */
      }
    }
    this.moiSig.set(res.moi);
    return res.moi;
  }
}
