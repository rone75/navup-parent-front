/**
 * Production : remplace environment.ts au build (`ng build`, fileReplacements d'angular.json).
 * Adresses proposées en attendant le choix de l'hébergement : à confirmer avant le premier déploiement
 * (deploiement/README.md de navup-api), avec les mêmes origines dans la politique de contenu du .htaccess.
 */
export const environment = {
  apiEspace: 'https://api-espace.navup.fr/v1/',
  apiPublic: 'https://api.navup.fr/v1/public/',
};
