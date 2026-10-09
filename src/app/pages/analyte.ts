import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { flagResult, formatDate, formatRef } from '../schedule';
import { Store } from '../store';

const W = 600;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

@Component({
  selector: 'app-analyte',
  imports: [RouterLink],
  template: `
    <a class="back" [routerLink]="['/pessoa', id()]">← {{ member()?.name ?? 'Voltar' }}</a>
    <h1>{{ nome() }}</h1>

    @if (points().length) {
      <section class="card">
        @if (chart(); as c) {
          <svg
            class="chart"
            [attr.viewBox]="viewBox"
            role="img"
            [attr.aria-label]="'Evolução de ' + nome()"
          >
            @if (c.band; as b) {
              <rect
                class="band"
                [attr.x]="left"
                [attr.y]="b.y"
                [attr.width]="plotW"
                [attr.height]="b.h"
              />
            }
            <line
              class="axis"
              [attr.x1]="left"
              [attr.x2]="left + plotW"
              [attr.y1]="bottom"
              [attr.y2]="bottom"
            />
            <text class="tick" [attr.x]="left - 8" [attr.y]="c.yMaxPos + 4" text-anchor="end">
              {{ c.yMax }}
            </text>
            <text class="tick" [attr.x]="left - 8" [attr.y]="bottom + 4" text-anchor="end">
              {{ c.yMin }}
            </text>
            <text class="tick" [attr.x]="left" [attr.y]="bottom + 20">{{ c.first }}</text>
            <text class="tick" [attr.x]="left + plotW" [attr.y]="bottom + 20" text-anchor="end">
              {{ c.last }}
            </text>
            <polyline class="line" [attr.points]="c.line" />
            @for (p of c.dots; track p.id) {
              <circle class="dot" [class.out]="p.out" [attr.cx]="p.x" [attr.cy]="p.y" r="5">
                <title>{{ p.title }}</title>
              </circle>
            }
          </svg>
          <p class="muted small">Faixa sombreada: referência do exame mais recente.</p>
        }

        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Referência</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.recordId) {
              <tr>
                <td>
                  <a [routerLink]="['/registro', p.recordId]">{{ p.dateText }}</a>
                </td>
                <td>{{ p.valueText }} {{ p.unit }}</td>
                <td>{{ p.ref }}</td>
                <td>
                  @if (p.flag === 'baixo' || p.flag === 'alto') {
                    <span class="chip atrasado">{{ p.flag }}</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    } @else {
      <p class="muted">Nenhum resultado registrado para este item.</p>
    }
  `,
})
export class AnalytePage {
  private readonly store = inject(Store);
  readonly id = input.required<string>();
  readonly nome = input<string>('');

  protected readonly viewBox = `0 0 ${W} ${H}`;
  protected readonly left = PAD.left;
  protected readonly bottom = H - PAD.bottom;
  protected readonly plotW = W - PAD.left - PAD.right;

  protected readonly member = computed(() => this.store.members().find((m) => m.id === this.id()));

  /** Em ordem cronológica. */
  protected readonly points = computed(() =>
    this.store
      .records()
      .filter((r) => r.memberId === this.id() && r.status === 'realizado')
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap((record) =>
        record.results
          .filter((r) => r.name === this.nome() && r.value !== null)
          .map((r) => ({
            recordId: record.id,
            date: record.date,
            dateText: formatDate(record.date),
            value: r.value as number,
            valueText: String(r.value).replace('.', ','),
            unit: r.unit,
            refMin: r.refMin,
            refMax: r.refMax,
            ref: formatRef(r),
            flag: flagResult(r.value, r.refMin, r.refMax),
          })),
      ),
  );

  protected readonly rows = computed(() => [...this.points()].reverse());

  protected readonly chart = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return null;
    const latest = pts[pts.length - 1];
    const bounds = [latest.refMin, latest.refMax].filter((v): v is number => v !== null);
    const all = [...pts.map((p) => p.value), ...bounds];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const margin = (hi - lo || Math.abs(hi) || 1) * 0.1;
    const yMin = lo - margin;
    const yMax = hi + margin;

    const top = PAD.top;
    const plotH = this.bottom - top;
    const y = (v: number) => this.bottom - ((v - yMin) / (yMax - yMin)) * plotH;
    const t0 = Date.parse(pts[0].date);
    const span = Date.parse(latest.date) - t0 || 1;
    const x = (date: string) => this.left + ((Date.parse(date) - t0) / span) * this.plotW;

    const dots = pts.map((p) => ({
      id: p.recordId,
      x: x(p.date),
      y: y(p.value),
      out: p.flag === 'baixo' || p.flag === 'alto',
      title: `${p.dateText}: ${p.valueText} ${p.unit}`,
    }));
    const bandTop = y(latest.refMax ?? yMax);
    const bandBottom = y(latest.refMin ?? yMin);
    const round = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');
    return {
      dots,
      line: dots.map((d) => `${d.x},${d.y}`).join(' '),
      band: bounds.length ? { y: bandTop, h: bandBottom - bandTop } : null,
      yMin: round(yMin),
      yMax: round(yMax),
      yMaxPos: top,
      first: pts[0].dateText,
      last: latest.dateText,
    };
  });
}
