import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash nas rotas: o GitHub Pages não reescreve URLs para o index.html.
    provideRouter(routes, withHashLocation(), withComponentInputBinding()),
  ],
};
