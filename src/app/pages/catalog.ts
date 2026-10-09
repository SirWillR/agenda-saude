import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../models';
import { formatInterval } from '../schedule';
import { Store } from '../store';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Catálogo de exames</h1>
        <p class="muted">Periodicidade, quem faz cada exame e valores de referência.</p>
      </div>
      <a class="btn primary" routerLink="/catalogo/novo">Adicionar exame</a>
    </header>

    @for (g of groups(); track g.label) {
      <section class="card">
        <h2>{{ g.label }}</h2>
        @for (t of g.types; track t.id) {
          <a class="row link-row" [routerLink]="['/catalogo', t.id]">
            <div class="row-main">
              <span class="row-title">{{ t.name }}</span>
              <span class="row-sub">
                {{ t.interval }}
                @if (t.analytes) {
                  · {{ t.analytes }} itens com referência
                }
              </span>
            </div>
            <div class="tags">
              @for (m of t.members; track m.id) {
                <span class="tag person-tag" [style.--person]="m.color">{{ m.name }}</span>
              } @empty {
                <span class="tag">desativado</span>
              }
            </div>
          </a>
        }
      </section>
    } @empty {
      <p class="muted">Nenhum exame cadastrado.</p>
    }
  `,
})
export class CatalogPage {
  private readonly store = inject(Store);

  protected readonly groups = computed(() =>
    CATEGORIES.map((c) => ({
      label: c.label,
      types: this.store
        .examTypes()
        .filter((t) => t.category === c.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => ({
          id: t.id,
          name: t.name,
          interval: formatInterval(t.intervalMonths),
          analytes: t.analytes.length,
          members: this.store.members().filter((m) => t.memberIds.includes(m.id)),
        })),
    })).filter((g) => g.types.length),
  );
}
