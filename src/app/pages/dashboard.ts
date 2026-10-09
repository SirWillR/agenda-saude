import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DueRow } from '../due-row';
import { DueItem, DueStatus, ageOn, dueForMember, todayIso } from '../schedule';
import { Store } from '../store';

const GROUPS: { status: DueStatus; title: string }[] = [
  { status: 'atrasado', title: 'Atrasados' },
  { status: 'em30', title: 'Próximos 30 dias' },
  { status: 'em90', title: 'Próximos 90 dias' },
  { status: 'semRegistro', title: 'Sem registro ainda' },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DueRow],
  template: `
    @if (store.members().length === 0) {
      <section class="card empty">
        <h1>Vamos montar a agenda</h1>
        <p class="muted">
          Isto cria William, Stephanie e Sophia com os exames de rotina sugeridos para cada um.
          Depois você ajusta periodicidades, valores de referência e adiciona extras no Catálogo.
        </p>
        <button class="btn primary" (click)="store.seed()">Criar agenda da família</button>
      </section>
    } @else {
      <div class="summary">
        <div class="stat atrasado">
          <strong>{{ totals().atrasado }}</strong> atrasados
        </div>
        <div class="stat em30">
          <strong>{{ totals().em30 }}</strong> em 30 dias
        </div>
        <div class="stat em90">
          <strong>{{ totals().em90 }}</strong> em 90 dias
        </div>
        <div class="stat emDia">
          <strong>{{ totals().emDia }}</strong> em dia
        </div>
      </div>

      @for (p of people(); track p.member.id) {
        <section class="card">
          <header class="person" [style.--person]="p.member.color">
            <div>
              <h2>
                <a [routerLink]="['/pessoa', p.member.id]">{{ p.member.name }}</a>
              </h2>
              <p class="muted">
                {{ p.age }} anos
                @if (p.member.notes) {
                  · {{ p.member.notes }}
                }
              </p>
            </div>
            <a class="btn small" [routerLink]="['/pessoa', p.member.id]">Ver tudo</a>
          </header>

          @for (g of p.groups; track g.title) {
            <h3 class="group">{{ g.title }}</h3>
            @for (item of g.items; track item.examType.id) {
              <app-due-row [item]="item" />
            }
          }

          @if (p.emDia.length) {
            <details>
              <summary>Em dia ({{ p.emDia.length }})</summary>
              @for (item of p.emDia; track item.examType.id) {
                <app-due-row [item]="item" />
              }
            </details>
          }
        </section>
      }
    }
  `,
})
export class DashboardPage {
  protected readonly store = inject(Store);

  protected readonly people = computed(() => {
    const today = todayIso();
    return this.store.members().map((member) => {
      const items = dueForMember(member, this.store.examTypes(), this.store.records(), today);
      return {
        member,
        age: ageOn(member.birthDate, today),
        items,
        groups: GROUPS.map((g) => ({
          title: g.title,
          items: items.filter((i) => i.status === g.status),
        })).filter((g) => g.items.length),
        emDia: items.filter((i) => i.status === 'emDia'),
      };
    });
  });

  protected readonly totals = computed(() => {
    const all: DueItem[] = this.people().flatMap((p) => p.items);
    const count = (s: DueStatus) => all.filter((i) => i.status === s).length;
    return {
      atrasado: count('atrasado'),
      em30: count('em30'),
      em90: count('em90'),
      emDia: count('emDia'),
    };
  });
}
