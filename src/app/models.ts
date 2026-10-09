export type Sex = 'M' | 'F';

export interface Member {
  id: string;
  name: string;
  /** ISO yyyy-mm-dd */
  birthDate: string;
  sex: Sex;
  notes: string;
  color: string;
  order: number;
}

export type Category = 'consulta' | 'sangue' | 'cardiologia' | 'dente' | 'imagem' | 'outro';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'consulta', label: 'Consultas' },
  { id: 'sangue', label: 'Sangue e laboratório' },
  { id: 'cardiologia', label: 'Cardiologia' },
  { id: 'dente', label: 'Dentes' },
  { id: 'imagem', label: 'Imagem' },
  { id: 'outro', label: 'Outros' },
];

export interface Analyte {
  name: string;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  refText: string;
}

export interface ExamType {
  id: string;
  name: string;
  category: Category;
  /** null = exame avulso, sem repetição */
  intervalMonths: number | null;
  memberIds: string[];
  notes: string;
  analytes: Analyte[];
}

export interface ResultValue extends Analyte {
  value: number | null;
}

export type RecordStatus = 'agendado' | 'realizado';

export interface ExamRecord {
  id: string;
  memberId: string;
  examTypeId: string;
  /** ISO yyyy-mm-dd */
  date: string;
  status: RecordStatus;
  professional: string;
  place: string;
  notes: string;
  results: ResultValue[];
}
