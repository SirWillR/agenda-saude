import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from './auth';
import { Store } from './store';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  template: `
    @if (auth.user() === undefined) {
      <main class="center"><p class="muted">Carregando…</p></main>
    } @else if (auth.user() === null) {
      <main class="center">
        <h1>Agenda de Saúde</h1>
        <p class="muted">Exames e consultas de rotina da família.</p>
        <button class="btn primary" (click)="auth.signIn()">Entrar com Google</button>
        @if (auth.error()) {
          <p class="alert">{{ auth.error() }}</p>
        }
      </main>
    } @else if (store.denied()) {
      <main class="center">
        <h1>Acesso não liberado</h1>
        <p class="muted">
          A conta {{ auth.user()?.email }} não tem permissão para ver esta agenda.
        </p>
        <button class="btn" (click)="auth.signOut()">Sair e usar outra conta</button>
      </main>
    } @else {
      <header class="topbar">
        <a class="brand" routerLink="/">Agenda de Saúde</a>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
            >Painel</a
          >
          <a routerLink="/catalogo" routerLinkActive="active">Catálogo</a>
          @if (!auth.local) {
            <button class="link" (click)="auth.signOut()">Sair</button>
          }
        </nav>
      </header>
      @if (auth.local) {
        <p class="banner">
          Modo local: o Firebase ainda não foi configurado, então os dados ficam só neste navegador.
        </p>
      }
      @if (store.error()) {
        <p class="banner alert">{{ store.error() }}</p>
      }
      <main class="page">
        @if (store.loaded()) {
          <router-outlet />
        } @else {
          <p class="muted">Carregando…</p>
        }
      </main>
      <footer class="footer">
        Periodicidades e valores de referência são sugestões gerais. Ajuste conforme a orientação
        dos médicos e o laudo de cada laboratório.
      </footer>
    }
  `,
})
export class App {
  protected readonly auth = inject(Auth);
  protected readonly store = inject(Store);

  constructor() {
    effect(() => (this.auth.user() ? this.store.start() : this.store.stop()));
  }
}
