import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, ExamType } from '../models';
import { Store } from '../store';

@Component({
  selector: 'app-exam-type-form',
  imports: [FormsModule, RouterLink],
  template: `
    @if (form(); as f) {
      <a class="back" routerLink="/catalogo">← Catálogo</a>
      <h1>{{ id() ? 'Editar exame' : 'Novo exame' }}</h1>

      <form class="card form" (ngSubmit)="save()">
        <label>
          Nome
          <input name="name" [(ngModel)]="f.name" required autocomplete="off" />
        </label>

        <div class="grid2">
          <label>
            Categoria
            <select name="category" [(ngModel)]="f.category">
              @for (c of categories; track c.id) {
                <option [value]="c.id">{{ c.label }}</option>
              }
            </select>
          </label>
          <label>
            Repetir a cada (meses)
            <input
              type="number"
              name="interval"
              min="1"
              step="1"
              inputmode="numeric"
              placeholder="Vazio = avulso, sem repetição"
              [(ngModel)]="f.intervalMonths"
            />
          </label>
        </div>

        <fieldset>
          <legend>Quem faz</legend>
          <div class="checks">
            @for (m of store.members(); track m.id) {
              <label class="check">
                <input
                  type="checkbox"
                  [name]="'member-' + m.id"
                  [checked]="f.memberIds.includes(m.id)"
                  (change)="toggleMember(m.id)"
                />
                {{ m.name }}
              </label>
            }
          </div>
        </fieldset>

        <label>
          Observações
          <textarea name="notes" rows="2" [(ngModel)]="f.notes"></textarea>
        </label>

        <h2>Itens medidos e valores de referência</h2>
        <p class="muted small">
          Opcional. Use para exames com resultado numérico, como os de sangue. Deixe mínimo ou
          máximo vazio quando a referência for só "até" ou "acima de".
        </p>
        @if (f.analytes.length) {
          <div class="results analytes">
            <div class="results-head">
              <span>Item</span><span>Unidade</span><span>Ref. mín.</span><span>Ref. máx.</span
              ><span></span>
            </div>
            @for (a of f.analytes; track $index; let i = $index) {
              <div class="result">
                <input
                  [name]="'a-name' + i"
                  [(ngModel)]="a.name"
                  placeholder="Nome"
                  aria-label="Nome do item"
                />
                <input
                  [name]="'a-unit' + i"
                  [(ngModel)]="a.unit"
                  placeholder="mg/dL"
                  aria-label="Unidade"
                />
                <input
                  type="number"
                  step="any"
                  [name]="'a-min' + i"
                  [(ngModel)]="a.refMin"
                  placeholder="mín."
                  aria-label="Referência mínima"
                />
                <input
                  type="number"
                  step="any"
                  [name]="'a-max' + i"
                  [(ngModel)]="a.refMax"
                  placeholder="máx."
                  aria-label="Referência máxima"
                />
                <button
                  type="button"
                  class="btn small"
                  (click)="f.analytes.splice(i, 1)"
                  aria-label="Remover item"
                >
                  ✕
                </button>
              </div>
            }
          </div>
        }
        <button type="button" class="btn" (click)="addAnalyte()">Adicionar item</button>

        <div class="form-actions">
          @if (id()) {
            <button type="button" class="btn danger" (click)="remove()">Excluir</button>
          }
          <button type="submit" class="btn primary" [disabled]="!f.name.trim()">Salvar</button>
        </div>
      </form>
    } @else {
      <p class="muted">Exame não encontrado. <a routerLink="/catalogo">Voltar ao catálogo</a></p>
    }
  `,
})
export class ExamTypeFormPage {
  protected readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly id = input<string>();
  /** Vem do botão "Adicionar exame extra" na página da pessoa. */
  readonly membro = input<string>();

  protected readonly categories = CATEGORIES;
  protected readonly form = signal<ExamType | null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.form.set(id ? this.fromExisting(id) : this.blank()));
    });
  }

  private blank(): ExamType {
    const membro = this.membro();
    return {
      id: crypto.randomUUID(),
      name: '',
      category: 'outro',
      intervalMonths: null,
      memberIds: membro ? [membro] : [],
      notes: '',
      analytes: [],
    };
  }

  private fromExisting(id: string): ExamType | null {
    const type = this.store.examTypes().find((t) => t.id === id);
    return type
      ? { ...type, memberIds: [...type.memberIds], analytes: type.analytes.map((a) => ({ ...a })) }
      : null;
  }

  protected toggleMember(id: string): void {
    const f = this.form()!;
    f.memberIds = f.memberIds.includes(id)
      ? f.memberIds.filter((m) => m !== id)
      : [...f.memberIds, id];
  }

  protected addAnalyte(): void {
    this.form()!.analytes.push({ name: '', unit: '', refMin: null, refMax: null, refText: '' });
  }

  protected save(): void {
    const f = this.form()!;
    if (!f.name.trim()) return;
    this.store.saveExamType({
      ...f,
      name: f.name.trim(),
      intervalMonths: f.intervalMonths || null,
      analytes: f.analytes.filter((a) => a.name.trim()),
    });
    this.router.navigate(['/catalogo']);
  }

  protected remove(): void {
    const f = this.form()!;
    if (!confirm(`Excluir "${f.name}" do catálogo? Os registros já feitos continuam no histórico.`))
      return;
    this.store.removeExamType(f.id);
    this.router.navigate(['/catalogo']);
  }
}
