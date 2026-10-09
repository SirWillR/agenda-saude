import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DueItem, dueLabel, formatInterval } from './schedule';

const STATUS_TEXT: Record<DueItem['status'], string> = {
  atrasado: 'Atrasado',
  em30: 'Até 30 dias',
  em90: 'Até 90 dias',
  emDia: 'Em dia',
  semRegistro: 'Sem registro',
  avulso: 'Avulso',
};

@Component({
  selector: 'app-due-row',
  imports: [RouterLink],
  template: `
    <div class="row">
      <div class="row-main">
        <span class="row-title">{{ item().examType.name }}</span>
        <span class="row-sub">
          <span class="chip" [class]="item().status">{{ statusText() }}</span>
          @if (item().status !== 'semRegistro') {
            {{ label() }} ·
          }
          {{ interval() }}
        </span>
        @if (item().examType.notes) {
          <span class="row-note">{{ item().examType.notes }}</span>
        }
      </div>
      <div class="row-actions">
        @if (item().scheduled; as scheduled) {
          <a class="btn small" [routerLink]="['/registro', scheduled.id]">Editar</a>
          <a
            class="btn small primary"
            [routerLink]="['/registro', scheduled.id]"
            [queryParams]="{ feito: 1 }"
            >Registrar</a
          >
        } @else {
          <a class="btn small" routerLink="/registro/novo" [queryParams]="params('agendado')"
            >Agendar</a
          >
          <a
            class="btn small primary"
            routerLink="/registro/novo"
            [queryParams]="params('realizado')"
            >Registrar</a
          >
        }
      </div>
    </div>
  `,
})
export class DueRow {
  readonly item = input.required<DueItem>();

  protected readonly statusText = computed(() => STATUS_TEXT[this.item().status]);
  protected readonly label = computed(() => dueLabel(this.item()));
  protected readonly interval = computed(() => formatInterval(this.item().examType.intervalMonths));

  protected params(status: 'agendado' | 'realizado') {
    return { membro: this.item().member.id, tipo: this.item().examType.id, status };
  }
}
