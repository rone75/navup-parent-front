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

/**
 * Remet au parent ses données (« Télécharger mes données ») : un fichier JSON lisible, fabriqué dans la page à partir
 * de ce que l'API vient de rendre. Rien n'est gardé : ni dans un service, ni dans le stockage du navigateur.
 */
export function telechargerDonnees(donnees: Record<string, unknown>, jour: string): void {
  const adresse = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json;charset=utf-8' }));
  const lien = document.createElement('a');
  lien.href = adresse;
  lien.download = `mes-donnees-navup-${jour}.json`;
  lien.hidden = true;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(adresse), 1000);
}
