import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ESPACE } from './config';
import { Programme, ReponseProgression, Sujet } from './models';

/** Contenus de l'espace personnel (navup-parent-api) : programme, sujet, progression. */
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
}
