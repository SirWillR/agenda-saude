import { ExamRecord, ExamType, Member } from './models';

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parts = (iso: string) => iso.split('-').map(Number) as [number, number, number];
const utc = (iso: string) => {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
};

export function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Soma meses mantendo o dia; 31/01 + 1 mês vira o último dia de fevereiro. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toIso(year, month, Math.min(d, lastDay));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = parts(birthDate);
  const [ty, tm, td] = parts(today);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

export function formatDate(iso: string): string {
  const [y, m, d] = parts(iso);
  return `${pad(d)}/${pad(m)}/${y}`;
}

export function formatInterval(months: number | null): string {
  if (!months) return 'avulso';
  if (months === 12) return 'anual';
  if (months % 12 === 0) return `a cada ${months / 12} anos`;
  return `a cada ${months} meses`;
}

export type DueStatus = 'atrasado' | 'em30' | 'em90' | 'emDia' | 'semRegistro' | 'avulso';

export interface DueItem {
  member: Member;
  examType: ExamType;
  lastDone: ExamRecord | null;
  scheduled: ExamRecord | null;
  nextDate: string | null;
  daysUntil: number | null;
  status: DueStatus;
}

export function computeDue(
  member: Member,
  examType: ExamType,
  records: ExamRecord[],
  today: string,
): DueItem {
  const mine = records.filter((r) => r.memberId === member.id && r.examTypeId === examType.id);
  const lastDone =
    mine.filter((r) => r.status === 'realizado').sort((a, b) => b.date.localeCompare(a.date))[0] ??
    null;
  const scheduled =
    mine.filter((r) => r.status === 'agendado').sort((a, b) => a.date.localeCompare(b.date))[0] ??
    null;

  let nextDate: string | null = null;
  if (scheduled) nextDate = scheduled.date;
  else if (lastDone && examType.intervalMonths)
    nextDate = addMonths(lastDone.date, examType.intervalMonths);

  let status: DueStatus;
  let daysUntil: number | null = null;
  if (nextDate === null) {
    status = examType.intervalMonths ? 'semRegistro' : 'avulso';
  } else {
    daysUntil = daysBetween(today, nextDate);
    status =
      daysUntil < 0 ? 'atrasado' : daysUntil <= 30 ? 'em30' : daysUntil <= 90 ? 'em90' : 'emDia';
  }
  return { member, examType, lastDone, scheduled, nextDate, daysUntil, status };
}

export function dueForMember(
  member: Member,
  examTypes: ExamType[],
  records: ExamRecord[],
  today: string,
): DueItem[] {
  return examTypes
    .filter((t) => t.memberIds.includes(member.id))
    .map((t) => computeDue(member, t, records, today))
    .sort(
      (a, b) =>
        (a.nextDate ?? '9999').localeCompare(b.nextDate ?? '9999') ||
        a.examType.name.localeCompare(b.examType.name),
    );
}

export function dueLabel(item: DueItem): string {
  if (item.nextDate === null || item.daysUntil === null) {
    if (item.lastDone) return `feito em ${formatDate(item.lastDone.date)}`;
    return item.status === 'avulso' ? 'avulso, sem data' : 'sem registro';
  }
  const date = formatDate(item.nextDate);
  const n = Math.abs(item.daysUntil);
  const days = n === 1 ? '1 dia' : `${n} dias`;
  const prefix = item.scheduled ? `agendado para ${date}` : `vence em ${date}`;
  if (item.daysUntil === 0) return `${prefix} · hoje`;
  return item.daysUntil < 0 ? `${prefix} · há ${days}` : `${prefix} · em ${days}`;
}

export type Flag = 'baixo' | 'alto' | 'normal' | null;

/** Compara um valor com a faixa de referência; null quando não há valor ou faixa numérica. */
export function flagResult(
  value: number | null,
  refMin: number | null,
  refMax: number | null,
): Flag {
  if (value === null || (refMin === null && refMax === null)) return null;
  if (refMin !== null && value < refMin) return 'baixo';
  if (refMax !== null && value > refMax) return 'alto';
  return 'normal';
}

export function formatRef(r: { refMin: number | null; refMax: number | null; refText: string }) {
  const n = (v: number) => String(v).replace('.', ',');
  if (r.refMin !== null && r.refMax !== null) return `${n(r.refMin)} a ${n(r.refMax)}`;
  if (r.refMin !== null) return `acima de ${n(r.refMin)}`;
  if (r.refMax !== null) return `até ${n(r.refMax)}`;
  return r.refText || '—';
}
