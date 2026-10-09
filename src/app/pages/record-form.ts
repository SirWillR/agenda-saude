import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExamRecord, ExamType, RecordStatus, ResultValue } from '../models';
import { flagResult, todayIso } from '../schedule';
import { Store } from '../store';

@Component({
  selector: 'app-record-form',
  imports: [FormsModule, RouterLink],
  template: `
    @if (form(); as f) {
      <a class="back" [routerLink]="backLink()">← Voltar</a>
      <h1>{{ id() ? 'Editar registro' : 'Novo registro' }}</h1>

      <form class="card form" (ngSubmit)="save()">
        <div class="grid2">
          <label>
            Pessoa
            <select
              name="member"
              [(ngModel)]="f.memberId"
              (ngModelChange)="memberChanged()"
              required
            >
              @for (m of store.members(); track m.id) {
                <option [value]="m.id">{{ m.name }}</option>
              }
            </select>
          </label>
          <label>
            Exame ou consulta
            <select name="type" [(ngModel)]="f.examTypeId" (ngModelChange)="typeChanged()" required>
              <option value="" disabled>Escolha…</option>
              @for (t of typeOptions(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </label>
        </div>

        <div class="segmented" role="radiogroup" aria-label="Situação">
          <label [class.on]="f.status === 'realizado'">
            <input type="radio" name="status" value="realizado" [(ngModel)]="f.status" />
            Realizado
          </label>
          <label [class.on]="f.status === 'agendado'">
            <input type="radio" name="status" value="agendado" [(ngModel)]="f.status" />
            Agendado
          </label>
        </div>

        <div class="grid2">
          <label>
            Data
            <input type="date" name="date" [(ngModel)]="f.date" required />
          </label>
          <label>
            Profissional
            <input name="professional" [(ngModel)]="f.professional" autocomplete="off" />
          </label>
          <label>
            Local
            <input name="place" [(ngModel)]="f.place" autocomplete="off" />
          </label>
        </div>

        <label>
          Observações
          <textarea name="notes" rows="3" [(ngModel)]="f.notes"></textarea>
        </label>

        @if (f.status === 'realizado' && f.results.length) {
          <h2>Resultados</h2>
          <p class="muted small">
            Preencha só o que foi medido. A referência vem do catálogo; troque pela do laudo se o
            laboratório usar outra faixa.
          </p>
          <div class="results">
            <div class="results-head">
              <span>Item</span><span>Valor</span><span>Ref. mín.</span><span>Ref. máx.</span>
            </div>
            @for (r of f.results; track r.name; let i = $index) {
              <div class="result" [class]="flag(r) ?? ''">
                <span class="result-name">
                  {{ r.name }} <small>{{ r.unit }}</small>
                  @if (flag(r) === 'baixo' || flag(r) === 'alto') {
                    <span class="chip atrasado">{{ flag(r) }}</span>
                  }
                  @if (r.refText) {
                    <small class="ref-text">{{ r.refText }}</small>
                  }
                </span>
                <input
                  type="number"
                  step="any"
                  inputmode="decimal"
                  [name]="'value' + i"
                  placeholder="valor"
                  [(ngModel)]="r.value"
                  [attr.aria-label]="'Valor de ' + r.name"
                />
                <input
                  type="number"
                  step="any"
                  inputmode="decimal"
                  [name]="'min' + i"
                  placeholder="mín."
                  [(ngModel)]="r.refMin"
                  [attr.aria-label]="'Referência mínima de ' + r.name"
                />
                <input
                  type="number"
                  step="any"
                  inputmode="decimal"
                  [name]="'max' + i"
                  placeholder="máx."
                  [(ngModel)]="r.refMax"
                  [attr.aria-label]="'Referência máxima de ' + r.name"
                />
              </div>
            }
          </div>
        }

        <div class="form-actions">
          @if (id()) {
            <button type="button" class="btn danger" (click)="remove()">Excluir</button>
          }
          <button type="submit" class="btn primary" [disabled]="!f.examTypeId || !f.date">
            Salvar
          </button>
        </div>
      </form>
    } @else {
      <p class="muted">Registro não encontrado. <a routerLink="/">Voltar ao painel</a></p>
    }
  `,
})
export class RecordFormPage {
  protected readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly id = input<string>();
  readonly membro = input<string>();
  readonly tipo = input<string>();
  readonly status = input<RecordStatus>();
  /** Vem do botão "Registrar" de um agendamento: abre já como realizado. */
  readonly feito = input<string>();

  protected readonly form = signal<ExamRecord | null>(null);
  private readonly memberId = signal('');

  protected readonly typeOptions = computed(() =>
    this.store
      .examTypes()
      .filter((t) => t.memberIds.includes(this.memberId()))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly backLink = computed(() =>
    this.memberId() ? ['/pessoa', this.memberId()] : ['/'],
  );

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.form.set(id ? this.fromExisting(id) : this.blank()));
      this.memberId.set(untracked(this.form)?.memberId ?? '');
    });
  }

  private blank(): ExamRecord {
    const memberId = this.membro() ?? this.store.members()[0]?.id ?? '';
    const type = this.store.examTypes().find((t) => t.id === this.tipo());
    return {
      id: crypto.randomUUID(),
      memberId,
      examTypeId: type?.id ?? '',
      date: todayIso(),
      status: this.status() === 'agendado' ? 'agendado' : 'realizado',
      professional: '',
      place: '',
      notes: '',
      results: this.buildResults(type),
    };
  }

  private fromExisting(id: string): ExamRecord | null {
    const record = this.store.records().find((r) => r.id === id);
    if (!record) return null;
    const type = this.store.examTypes().find((t) => t.id === record.examTypeId);
    return {
      ...record,
      status: this.feito() ? 'realizado' : record.status,
      results: this.buildResults(type, record.results),
    };
  }

  /** Linhas do catálogo, preservando valores e referências já gravados no registro. */
  private buildResults(type: ExamType | undefined, existing: ResultValue[] = []): ResultValue[] {
    const analytes = type?.analytes ?? [];
    const saved = new Map(existing.map((r) => [r.name, r]));
    return [
      ...analytes.map((a) => ({ ...(saved.get(a.name) ?? { ...a, value: null }) })),
      ...existing.filter((r) => !analytes.some((a) => a.name === r.name)).map((r) => ({ ...r })),
    ];
  }

  protected flag(r: ResultValue) {
    return flagResult(r.value, r.refMin, r.refMax);
  }

  protected memberChanged(): void {
    const f = this.form()!;
    this.memberId.set(f.memberId);
    if (!this.typeOptions().some((t) => t.id === f.examTypeId)) {
      f.examTypeId = '';
      f.results = [];
    }
  }

  protected typeChanged(): void {
    const f = this.form()!;
    f.results = this.buildResults(this.store.examTypes().find((t) => t.id === f.examTypeId));
  }

  protected save(): void {
    const f = this.form()!;
    if (!f.examTypeId || !f.date) return;
    this.store.saveRecord({
      ...f,
      results: f.status === 'realizado' ? f.results.filter((r) => r.value !== null) : [],
    });
    this.router.navigate(['/pessoa', f.memberId]);
  }

  protected remove(): void {
    const f = this.form()!;
    if (!confirm('Excluir este registro?')) return;
    this.store.removeRecord(f.id);
    this.router.navigate(['/pessoa', f.memberId]);
  }
}
