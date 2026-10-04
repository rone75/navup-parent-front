import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_PUBLIC } from './config';
import { Offre, SuiteCommande } from './models';

export interface Commande {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  fois: number;
  cgv: 0 | 1;
  confidentialite: 0 | 1;
  communications: 0 | 1;
  /** Champ leurre : un parent ne le voit pas, un robot le remplit et rien n'est enregistré. */
  site: string;
  /** Une clé par commande : un envoi répété rouvre la même page de paiement. */
  cle_saisie: string;
  /** Le prix lu à l'écran, en centimes : refusé s'il a changé depuis. */
  prix_affiche: number;
}

/** Endpoints publics de la Tour de contrôle (navup-api) : sans jeton, sans donnée de dossier en retour. */
@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);

  offre(): Observable<Offre> {
    return this.http.get<{ offre: Offre }>(`${API_PUBLIC}offre/`).pipe(map((r) => r.offre));
  }

  commander(commande: Commande): Observable<SuiteCommande> {
    return this.http.post<SuiteCommande>(`${API_PUBLIC}commande/`, commande);
  }

  /** Demande un lien d'accès par e-mail. La réponse est la même que l'adresse ait un compte ou non. */
  demanderLien(email: string): Observable<unknown> {
    return this.http.post(`${API_PUBLIC}acces/`, { email });
  }
}
