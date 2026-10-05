import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ESPACE } from './config';
import { obfuscatePassword } from './obfuscation';
import { Programme, ReponseProgression, Sujet } from './models';

/** Contenus de l'espace personnel (navup-parent-api) : programme, sujet, progression ; droits sur ses données. */
@Injectable({ providedIn: 'root' })
export class EspaceApiService {
  private readonly http = inject(HttpClient);

  programme(): Observable<Programme> {
    return this.http.get<{ programme: Programme }>(`${API_ESPACE}programme/`).pipe(map((r) => r.programme));
  }

  /** Ouvre un sujet : l'ouverture est notée, il devient celui que « Continuer » reprendra. */
  sujet(id: number): Observable<Sujet> {
    return this.http.get<{ sujet: Sujet }>(`${API_ESPACE}sujets/`, { params: { id } }).pipe(map((r) => r.sujet));
  }

  /** Position d'écoute ou « terminé ». `version` : celle que l'on a lue ; un conflit rend l'état du serveur. */
  progression(corps: { id_sujet: number; version: number; position?: number; termine?: boolean }): Observable<ReponseProgression> {
    return this.http.put<ReponseProgression>(`${API_ESPACE}progression/`, corps);
  }

  /**
   * Billet de rendez-vous : ce que le parent connecté présente aux endpoints publics de la Tour de contrôle pour ses
   * rendez-vous. Il vit dix minutes et ne se garde nulle part : voir `RdvEspace` (core/rdv-espace.ts).
   */
  billet(): Observable<string> {
    return this.http.post<{ billet: string }>(`${API_ESPACE}rendez-vous/billet/`, {}).pipe(map((r) => r.billet));
  }

  /**
   * « Télécharger mes données » : après le mot de passe retapé, un billet de quelques minutes, à présenter une seule
   * fois à la Tour de contrôle (PublicApiService.donnees). Il ne se garde nulle part.
   */
  billetDonnees(motDePasse: string): Observable<string> {
    return this.http.post<{ billet: string }>(`${API_ESPACE}profil/donnees/`, { pass: obfuscatePassword(motDePasse) }).pipe(map((r) => r.billet));
  }

  /** « Supprimer mon compte » : la demande part à NavUp, l'espace se ferme aussitôt (toutes les sessions, le mot de passe). */
  supprimerCompte(motDePasse: string): Observable<unknown> {
    return this.http.post(`${API_ESPACE}profil/suppression/`, { pass: obfuscatePassword(motDePasse) });
  }
}
