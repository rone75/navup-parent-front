import { Invitation } from './models';

/**
 * Remet au parent l'invitation de calendrier d'un rendez-vous : un fichier .ics fabriqué dans la page (Blob) à partir
 * de ce que l'API vient de rendre. Aucune adresse ne porte le jeton ni le billet. À n'appeler que sur un geste, dans
 * le navigateur.
 */
export function telechargerInvitation(invitation: Invitation): void {
  const adresse = URL.createObjectURL(new Blob([invitation.ics], { type: 'text/calendar;charset=utf-8' }));
  const lien = document.createElement('a');
  lien.href = adresse;
  lien.download = invitation.nom;
  lien.hidden = true;
  document.body.append(lien);
  lien.click();
  lien.remove();
  // Le navigateur a pris le fichier : l'adresse temporaire est rendue
  setTimeout(() => URL.revokeObjectURL(adresse), 1000);
}
