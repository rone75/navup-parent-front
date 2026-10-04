import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

// Point d'entrée du prérendu : au build, les pages publiques sont écrites en HTML statique (voir app.routes.server.ts).
// Aucun serveur Node en production : Apache sert les fichiers.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
