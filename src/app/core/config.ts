import { environment } from '../../environments/environment';

// Adresses des deux API : celles de l'environnement du build (src/environments/).

/** API de l'espace personnel (dépôt navup-parent-api) : accès, programme, médias, progression. */
export const API_ESPACE = environment.apiEspace;

/** Endpoints publics de la Tour de contrôle (dépôt navup-api) : offre, commande, demande d'un lien d'accès. */
export const API_PUBLIC = environment.apiPublic;

/** Adresse de contact écrite dans l'appli. */
export const CONTACT = 'contact@navup.fr';

/** Adresse publique du site, avec la barre finale : elle entre dans les balises de partage (aperçu d'un lien). */
export const SITE = 'https://navup.fr/';
