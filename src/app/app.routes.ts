import { Routes } from '@angular/router';
import { AnalytePage } from './pages/analyte';
import { CatalogPage } from './pages/catalog';
import { DashboardPage } from './pages/dashboard';
import { ExamTypeFormPage } from './pages/exam-type-form';
import { MemberPage } from './pages/member';
import { RecordFormPage } from './pages/record-form';

export const routes: Routes = [
  { path: '', component: DashboardPage },
  { path: 'pessoa/:id', component: MemberPage },
  { path: 'pessoa/:id/evolucao', component: AnalytePage },
  { path: 'registro/novo', component: RecordFormPage },
  { path: 'registro/:id', component: RecordFormPage },
  { path: 'catalogo', component: CatalogPage },
  { path: 'catalogo/novo', component: ExamTypeFormPage },
  { path: 'catalogo/:id', component: ExamTypeFormPage },
  { path: '**', redirectTo: '' },
];
