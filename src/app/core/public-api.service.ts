import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_PUBLIC } from './config';
import { CanalRdv, Creneau, Invitation, Offre, Prise, SuiteCommande, VueRdvEspace, VueRdvLien } from './models';

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

/** Demande d'un rendez-vous découverte, depuis la page publique. */
export interface DemandeRdv extends Creneau {
  prenom: string;
  nom: string;
  email: string;
  /** Obligatoire pour un rendez-vous par téléphone. */
  telephone?: string;
  canal: CanalRdv;
  /** « Ce que vous aimeriez aborder », 500 caractères au plus. */
  note?: string;
  confidentialite: 1;
  /** Une clé par demande, gardée d'un essai à l'autre : un envoi répété ne réserve pas deux fois. */
  cle_saisie: string;
  /** Champ leurre. */
  site: string;
}

/** Ce qu'un parent fait d'un rendez-vous par son lien. */
export type GesteLien = ({ geste: 'deplacer' } & Creneau) | { geste: 'annuler' };

/** Rendez-vous d'accompagnement demandé depuis l'espace : le téléphone seulement si le dossier n'en a pas. */
export interface ReservationEspace extends Creneau {
  canal: CanalRdv;
  telephone?: string;
  /** « Sujet à aborder », 500 caractères au plus. */
  note?: string;
  cle_saisie: string;
}

/** Ce qu'un parent inscrit fait de ses rendez-vous depuis son espace. */
export type GesteEspace =
  | ({ geste: 'reserver' } & ReservationEspace)
  | ({ geste: 'deplacer'; id_rdv: number } & Creneau)
  | { geste: 'annuler'; id_rdv: number };

/**
 * Endpoints publics de la Tour de contrôle (navup-api) : sans jeton de session, sans donnée de dossier en retour.
 * Ce qui tient lieu d'identité voyage dans le corps des requêtes, jamais dans une adresse : le jeton d'un lien de
 * rendez-vous, ou le billet que l'API des parents vient de délivrer.
 */
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

  // ---------- Rendez-vous en ligne ----------

  /** Créneaux du rendez-vous découverte. `ouvert` faux : rien n'est proposé, la page renvoie à l'adresse de contact. */
  creneaux(): Observable<Prise> {
    return this.http.get<Prise>(`${API_PUBLIC}creneaux/`);
  }

  /**
   * Demande un rendez-vous découverte. La réponse est la même que l'adresse soit connue ou non : un e-mail part,
   * c'est lui qui confirme. Refus 400 de motif « creneau » : le créneau vient d'être pris, `prise` est jointe.
   */
  prendreRdv(demande: DemandeRdv): Observable<{ suite: 'email' }> {
    return this.http.post<{ suite: 'email' }>(`${API_PUBLIC}rendez-vous/`, demande);
  }

  /** Le rendez-vous que désigne le jeton d'un lien de gestion. 404 : lien inconnu ou révoqué. */
  rdvDuLien(jeton: string): Observable<VueRdvLien> {
    return this.http.post<VueRdvLien>(`${API_PUBLIC}rendez-vous/gestion/`, { jeton });
  }

  invitationDuLien(jeton: string): Observable<Invitation> {
    return this.http.post<Invitation>(`${API_PUBLIC}rendez-vous/gestion/`, { jeton, invitation: 1 });
  }

  /** Déplace ou annule par le lien. Refus 400 de motif « creneau » ou « delai » : la vue à jour est jointe. */
  gesteDuLien(jeton: string, geste: GesteLien): Observable<VueRdvLien> {
    return this.http.put<VueRdvLien>(`${API_PUBLIC}rendez-vous/gestion/`, { jeton, ...geste });
  }

  /** Les rendez-vous d'un parent inscrit, sur présentation de son billet. 401 : billet périmé. */
  rdvDeLEspace(billet: string): Observable<VueRdvEspace> {
    return this.http.post<VueRdvEspace>(`${API_PUBLIC}rendez-vous/espace/`, { billet });
  }

  invitationDeLEspace(billet: string, id_rdv: number): Observable<Invitation> {
    return this.http.post<Invitation>(`${API_PUBLIC}rendez-vous/espace/`, { billet, invitation: id_rdv });
  }

  /** Créneaux où déplacer un rendez-vous de l'espace ; null s'il ne se déplace plus en ligne. */
  creneauxDeLEspace(billet: string, id_rdv: number): Observable<Prise | null> {
    return this.http.post<{ prise: Prise | null }>(`${API_PUBLIC}rendez-vous/espace/`, { billet, creneaux: id_rdv }).pipe(map((r) => r.prise));
  }

  /** Réserve, déplace ou annule depuis l'espace : rend la vue à jour. Refus 400 : motif, et la vue à jour. */
  gesteDeLEspace(billet: string, geste: GesteEspace): Observable<VueRdvEspace> {
    return this.http.put<VueRdvEspace>(`${API_PUBLIC}rendez-vous/espace/`, { billet, ...geste });
  }
}
