import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { EspaceApiService } from './espace-api.service';
import { Creneau, Invitation, Prise, VueRdvEspace } from './models';
import { GesteEspace, PublicApiService, ReservationEspace } from './public-api.service';

/**
 * Les rendez-vous d'un parent inscrit. Ils vivent dans la Tour de contrôle, qui ne connaît pas la session du parent :
 * l'API des parents délivre un billet (dix minutes), présenté ensuite aux endpoints publics dans le corps des
 * requêtes. Le jeton de session, lui, ne quitte jamais l'API des parents.
 *
 * Le billet ne se garde que dans cet objet, qui n'est pas un service de l'appli : chaque page qui s'en sert le
 * déclare dans ses `providers`, il naît et disparaît avec elle. Rien n'en est écrit dans le stockage ni dans l'adresse.
 * Billet refusé (401 : périmé) : un autre est demandé et l'appel est rejoué, une seule fois.
 */
@Injectable()
export class RdvEspace {
  private readonly espace = inject(EspaceApiService);
  private readonly publique = inject(PublicApiService);

  private billet = '';

  vue(): Promise<VueRdvEspace> {
    return this.avecBillet((b) => this.publique.rdvDeLEspace(b));
  }

  invitation(id_rdv: number): Promise<Invitation> {
    return this.avecBillet((b) => this.publique.invitationDeLEspace(b, id_rdv));
  }

  /** Créneaux où déplacer ce rendez-vous. */
  creneaux(id_rdv: number): Promise<Prise | null> {
    return this.avecBillet((b) => this.publique.creneauxDeLEspace(b, id_rdv));
  }

  reserver(demande: ReservationEspace): Promise<VueRdvEspace> {
    return this.geste({ geste: 'reserver', ...demande });
  }

  deplacer(id_rdv: number, creneau: Creneau): Promise<VueRdvEspace> {
    return this.geste({ geste: 'deplacer', id_rdv, date: creneau.date, heure: creneau.heure });
  }

  annuler(id_rdv: number): Promise<VueRdvEspace> {
    return this.geste({ geste: 'annuler', id_rdv });
  }

  private geste(geste: GesteEspace): Promise<VueRdvEspace> {
    return this.avecBillet((b) => this.publique.gesteDeLEspace(b, geste));
  }

  private async avecBillet<T>(appel: (billet: string) => Observable<T>): Promise<T> {
    if (this.billet === '') {
      this.billet = await firstValueFrom(this.espace.billet());
    }
    try {
      return await firstValueFrom(appel(this.billet));
    } catch (err) {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        throw err;
      }
      // Billet périmé : rien n'a été fait. Un autre billet, et le même appel, une fois.
      this.billet = '';
      this.billet = await firstValueFrom(this.espace.billet());
      return firstValueFrom(appel(this.billet));
    }
  }
}
