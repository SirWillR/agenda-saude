import { Analyte, Category, ExamType, Member, Sex } from './models';

/**
 * Catálogo inicial da família. Periodicidades e faixas de referência são pontos de
 * partida gerais; tudo pode ser ajustado no app conforme os médicos e o laudo do laboratório.
 */

export const SEED_MEMBERS: Member[] = [
  {
    id: 'william',
    name: 'William',
    birthDate: '1993-01-28',
    sex: 'M',
    notes: 'Academia 3x por semana',
    color: '#2f6f8f',
    order: 0,
  },
  {
    id: 'stephanie',
    name: 'Stephanie',
    birthDate: '1995-10-31',
    sex: 'F',
    notes: 'Academia 3x por semana',
    color: '#a2527a',
    order: 1,
  },
  {
    id: 'sophia',
    name: 'Sophia',
    birthDate: '2020-09-01',
    sex: 'F',
    notes: 'Cardiopatia: anomalia de Ebstein',
    color: '#c27a2c',
    order: 2,
  },
];

const a = (
  name: string,
  unit: string,
  refMin: number | null,
  refMax: number | null,
  refText = '',
): Analyte => ({ name, unit, refMin, refMax, refText });

function adultBloodPanel(sex: Sex): Analyte[] {
  const m = sex === 'M';
  return [
    m ? a('Hemoglobina', 'g/dL', 13.5, 17.5) : a('Hemoglobina', 'g/dL', 12, 16),
    m ? a('Hematócrito', '%', 41, 53) : a('Hematócrito', '%', 36, 46),
    a('Leucócitos', '/mm³', 4000, 11000),
    a('Plaquetas', 'mil/mm³', 150, 450),
    a('Glicemia de jejum', 'mg/dL', 70, 99),
    a('Hemoglobina glicada (HbA1c)', '%', null, 5.6),
    a('Colesterol total', 'mg/dL', null, 190),
    a('HDL', 'mg/dL', 40, null),
    a('LDL', 'mg/dL', null, 130, 'A meta depende do risco cardiovascular'),
    a('Triglicerídeos', 'mg/dL', null, 150, 'Em jejum'),
    m ? a('Creatinina', 'mg/dL', 0.7, 1.3) : a('Creatinina', 'mg/dL', 0.6, 1.1),
    a('Ureia', 'mg/dL', 15, 50),
    m ? a('Ácido úrico', 'mg/dL', 3.4, 7) : a('Ácido úrico', 'mg/dL', 2.4, 6),
    a('TGO (AST)', 'U/L', null, m ? 40 : 32),
    a('TGP (ALT)', 'U/L', null, m ? 41 : 33),
    a('Gama-GT', 'U/L', null, m ? 60 : 40),
    a('TSH', 'µUI/mL', 0.4, 4.5),
    a('T4 livre', 'ng/dL', 0.9, 1.7),
    a('Vitamina D (25-OH)', 'ng/mL', 20, 60),
    a('Vitamina B12', 'pg/mL', 200, 900),
    m ? a('Ferritina', 'ng/mL', 30, 400) : a('Ferritina', 'ng/mL', 13, 150),
    a('CPK', 'U/L', null, m ? 190 : 170, 'Sobe após treino intenso; colher com 48 h de descanso'),
  ];
}

const childBloodCount: Analyte[] = [
  a('Hemoglobina', 'g/dL', 11.5, 15.5),
  a('Hematócrito', '%', 35, 45),
  a('Leucócitos', '/mm³', 4500, 13500),
  a('Plaquetas', 'mil/mm³', 150, 450),
];

const t = (
  id: string,
  name: string,
  category: Category,
  intervalMonths: number | null,
  memberIds: string[],
  notes = '',
  analytes: Analyte[] = [],
): ExamType => ({ id, name, category, intervalMonths, memberIds, notes, analytes });

const adults = ['william', 'stephanie'];

export const SEED_EXAM_TYPES: ExamType[] = [
  t('checkup', 'Check-up com clínico geral', 'consulta', 12, adults),
  t(
    'sangue-william',
    'Exames de sangue de rotina',
    'sangue',
    12,
    ['william'],
    'Jejum conforme orientação do laboratório.',
    adultBloodPanel('M'),
  ),
  t(
    'sangue-stephanie',
    'Exames de sangue de rotina',
    'sangue',
    12,
    ['stephanie'],
    'Jejum conforme orientação do laboratório.',
    adultBloodPanel('F'),
  ),
  t('urina', 'Urina tipo 1', 'sangue', 12, adults),
  t(
    'cardio-esporte',
    'Avaliação cardiológica para atividade física',
    'cardiologia',
    24,
    adults,
    'ECG e, se o médico indicar, teste ergométrico.',
  ),
  t('avaliacao-fisica', 'Avaliação física / bioimpedância', 'outro', 6, adults),
  t('dentista', 'Dentista: consulta e limpeza', 'dente', 6, adults),
  t('oftalmo', 'Oftalmologista', 'consulta', 24, adults),
  t('dermato', 'Dermatologista', 'consulta', 12, adults),
  t('gineco', 'Ginecologista e preventivo (Papanicolau)', 'consulta', 12, ['stephanie']),

  t(
    'cardio-pediatrico',
    'Cardiologista pediátrico',
    'cardiologia',
    6,
    ['sophia'],
    'Acompanhamento da anomalia de Ebstein, 1 a 2 vezes por ano conforme o cardiologista.',
  ),
  t(
    'ecocardiograma',
    'Ecocardiograma',
    'cardiologia',
    12,
    ['sophia'],
    'Frequência definida pelo cardiologista.',
  ),
  t(
    'ecg',
    'Eletrocardiograma (ECG)',
    'cardiologia',
    12,
    ['sophia'],
    'Frequência definida pelo cardiologista.',
  ),
  t(
    'holter',
    'Holter 24 h',
    'cardiologia',
    12,
    [],
    'Desativado por padrão. Marque a Sophia aqui se o cardiologista pedir.',
  ),
  t('pediatra', 'Pediatra', 'consulta', 12, ['sophia']),
  t('hemograma-sophia', 'Hemograma', 'sangue', 12, ['sophia'], '', childBloodCount),
  t(
    'odontopediatra',
    'Odontopediatra: consulta e limpeza',
    'dente',
    6,
    ['sophia'],
    'Avisar o dentista sobre a cardiopatia e confirmar com o cardiologista se precisa de profilaxia antibiótica antes do procedimento.',
  ),
  t('oftalmo-sophia', 'Oftalmologista', 'consulta', 12, ['sophia']),
];
