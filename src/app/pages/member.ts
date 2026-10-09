import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DueRow } from '../due-row';
import { ageOn, dueForMember, flagResult, formatDate, todayIso } from '../schedule';
import { Store } from '../store';

@Component({
  selector: 'app-member',
  imports: [RouterLink, DueRow],
  template: `
    @if (member(); as m) {
      <header class="page-head" [style.--person]="m.color">
        <div>
          <a class="back" routerLink="/">← Painel</a>
          <h1 class="person-name">{{ m.name }}</h1>
          <p class="muted">
            {{ age() }} anos · nascimento {{ date(m.birthDate) }}
            @if (m.notes) {
              · {{ m.notes }}
            }
          </p>
        </div>
        <div class="row-actions">
          <a class="btn" routerLink="/catalogo/novo" [queryParams]="{ membro: m.id }"
            >Adicionar exame extra</a
          >
          <a class="btn primary" routerLink="/registro/novo" [queryParams]="{ membro: m.id }"
            >Registrar exame</a
          >
        </div>
      </header>

      <section class="card">
        <h2>Exames e consultas</h2>
        @for (item of items(); track item.examType.id) {
          <app-due-row [item]="item" />
        } @empty {
          <p class="muted">Nenhum exame ativo para {{ m.name }}. Ative no Catálogo.</p>
        }
      </section>

      @if (analytes().length) {
        <section class="card">
          <h2>Evolução dos resultados</h2>
          <div class="tags">
            @for (a of analytes(); track a.name) {
              <a
                class="tag"
                [class.out]="a.out"
                [routerLink]="['/pessoa', m.id, 'evolucao']"
                [queryParams]="{ nome: a.name }"
                >{{ a.name }}: {{ a.value }} {{ a.unit }}</a
              >
            }
          </div>
          <p class="muted small">Último valor de cada item. Em destaque, os fora da referência.</p>
        </section>
      }

      <section class="card">
        <h2>Histórico</h2>
        @for (r of history(); track r.record.id) {
          <a class="row link-row" [routerLink]="['/registro', r.record.id]">
            <div class="row-main">
              <span class="row-title">{{ r.name }}</span>
              <span class="row-sub">
                {{ date(r.record.date) }} ·
                {{ r.record.status === 'agendado' ? 'agendado' : 'realizado' }}
                @if (r.record.professional) {
                  · {{ r.record.professional }}
                }
                @if (r.outOfRange) {
                  · <span class="out-text">{{ r.outOfRange }} fora da referência</span>
                }
              </span>
            </div>
          </a>
        } @empty {
          <p class="muted">Nada registrado ainda.</p>
        }
      </section>
    } @else {
      <p class="muted">Pessoa não encontrada. <a routerLink="/">Voltar ao painel</a></p>
    }
  `,
})
export class MemberPage {
  private readonly store = inject(Store);
  readonly id = input.required<string>();

  protected readonly date = formatDate;
  protected readonly member = computed(() => this.store.members().find((m) => m.id === this.id()));
  protected readonly age = computed(() => ageOn(this.member()?.birthDate ?? '', todayIso()));

  protected readonly items = computed(() => {
    const m = this.member();
    return m ? dueForMember(m, this.store.examTypes(), this.store.records(), todayIso()) : [];
  });

  private readonly records = computed(() =>
    this.store
      .records()
      .filter((r) => r.memberId === this.id())
      .sort((a, b) => b.date.localeCompare(a.date)),
  );

  protected readonly history = computed(() =>
    this.records().map((record) => ({
      record,
      name:
        this.store.examTypes().find((t) => t.id === record.examTypeId)?.name ?? 'Exame removido',
      outOfRange: record.results.filter((r) =>
        ['baixo', 'alto'].includes(flagResult(r.value, r.refMin, r.refMax) ?? ''),
      ).length,
    })),
  );

  /** Último valor de cada analito, do mais recente para o mais antigo. */
  protected readonly analytes = computed(() => {
    const latest = new Map<string, { name: string; value: string; unit: string; out: boolean }>();
    for (const record of this.records()) {
      for (const r of record.results) {
        if (r.value === null || latest.has(r.name)) continue;
        const flag = flagResult(r.value, r.refMin, r.refMax);
        latest.set(r.name, {
          name: r.name,
          value: String(r.value).replace('.', ','),
          unit: r.unit,
          out: flag === 'baixo' || flag === 'alto',
        });
      }
    }
    return [...latest.values()];
  });
}
