import { ExamRecord, ExamType, Member } from './models';
import { addMonths, ageOn, computeDue, daysBetween, dueLabel, flagResult } from './schedule';

const member: Member = {
  id: 'm',
  name: 'Sophia',
  birthDate: '2020-09-01',
  sex: 'F',
  notes: '',
  color: '#000',
  order: 0,
};

const type = (intervalMonths: number | null): ExamType => ({
  id: 't',
  name: 'Cardiologista',
  category: 'cardiologia',
  intervalMonths,
  memberIds: ['m'],
  notes: '',
  analytes: [],
});

const record = (date: string, status: ExamRecord['status'], id = date): ExamRecord => ({
  id,
  memberId: 'm',
  examTypeId: 't',
  date,
  status,
  professional: '',
  place: '',
  notes: '',
  results: [],
});

describe('datas', () => {
  it('soma meses virando o ano', () => {
    expect(addMonths('2026-10-09', 6)).toBe('2027-04-09');
  });

  it('ajusta para o último dia quando o mês é mais curto', () => {
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28');
    expect(addMonths('2027-08-31', 6)).toBe('2028-02-29');
  });

  it('conta dias entre datas', () => {
    expect(daysBetween('2026-10-09', '2026-11-08')).toBe(30);
    expect(daysBetween('2026-10-09', '2026-10-01')).toBe(-8);
  });

  it('calcula idade antes e depois do aniversário', () => {
    expect(ageOn('2020-09-01', '2026-10-09')).toBe(6);
    expect(ageOn('1995-10-31', '2026-10-09')).toBe(30);
    expect(ageOn('1995-10-31', '2026-10-31')).toBe(31);
  });
});

describe('computeDue', () => {
  const today = '2026-10-09';

  it('sem registro quando o exame periódico nunca foi feito', () => {
    const due = computeDue(member, type(6), [], today);
    expect(due.status).toBe('semRegistro');
    expect(due.nextDate).toBeNull();
  });

  it('avulso quando não há periodicidade nem agendamento', () => {
    expect(computeDue(member, type(null), [], today).status).toBe('avulso');
  });

  it('usa o último realizado mais a periodicidade', () => {
    const due = computeDue(
      member,
      type(6),
      [record('2025-06-01', 'realizado'), record('2026-05-01', 'realizado')],
      today,
    );
    expect(due.lastDone?.date).toBe('2026-05-01');
    expect(due.nextDate).toBe('2026-11-01');
    expect(due.status).toBe('em30');
  });

  it('classifica atrasado, 90 dias e em dia', () => {
    const status = (lastDone: string) =>
      computeDue(member, type(6), [record(lastDone, 'realizado')], today).status;
    expect(status('2026-03-01')).toBe('atrasado');
    expect(status('2026-06-15')).toBe('em90');
    expect(status('2026-09-30')).toBe('emDia');
  });

  it('vence hoje ainda não é atrasado', () => {
    const due = computeDue(member, type(6), [record('2026-04-09', 'realizado')], today);
    expect(due.daysUntil).toBe(0);
    expect(due.status).toBe('em30');
  });

  it('agendamento tem prioridade sobre a data calculada', () => {
    const due = computeDue(
      member,
      type(6),
      [record('2026-01-01', 'realizado'), record('2026-12-20', 'agendado')],
      today,
    );
    expect(due.nextDate).toBe('2026-12-20');
    expect(due.status).toBe('em90');
    expect(dueLabel(due)).toContain('agendado para 20/12/2026');
  });

  it('agendamento que já passou fica atrasado', () => {
    const due = computeDue(member, type(null), [record('2026-10-01', 'agendado')], today);
    expect(due.status).toBe('atrasado');
  });

  it('ignora registros de outra pessoa', () => {
    const other = { ...record('2026-09-01', 'realizado'), memberId: 'x' };
    expect(computeDue(member, type(6), [other], today).status).toBe('semRegistro');
  });
});

describe('flagResult', () => {
  it('marca abaixo, acima e dentro da faixa', () => {
    expect(flagResult(11, 12, 16)).toBe('baixo');
    expect(flagResult(17, 12, 16)).toBe('alto');
    expect(flagResult(12, 12, 16)).toBe('normal');
    expect(flagResult(16, 12, 16)).toBe('normal');
  });

  it('aceita faixa só com mínimo ou só com máximo', () => {
    expect(flagResult(35, 40, null)).toBe('baixo');
    expect(flagResult(140, null, 130)).toBe('alto');
    expect(flagResult(100, null, 130)).toBe('normal');
  });

  it('não marca sem valor ou sem faixa', () => {
    expect(flagResult(null, 1, 2)).toBeNull();
    expect(flagResult(5, null, null)).toBeNull();
  });
});
