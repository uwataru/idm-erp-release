import {NgModule} from '@angular/core';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TypeaheadModule} from 'ngx-bootstrap/typeahead';
import {BsDatepickerConfig, BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {TimepickerModule} from "ngx-bootstrap/timepicker";
import {defineLocale} from 'ngx-bootstrap/chronos';
import {koLocale} from 'ngx-bootstrap/locale';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ChartsModule} from 'ng2-charts';
import {DragulaModule} from 'ng2-dragula';
import {NgxBarcodeModule} from 'ngx-barcode';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../../app.auth';
import {SharedModule} from '../shared/shared.module';

import {ProductionLinePlanningComponent} from './planning/production-line-planning/production-line-planning.component';
import {ProductionPlanningComponent} from './planning/production-planning/production-planning.component';
import {MaterialsPlanningComponent} from './planning/materials-planning/materials-planning.component';
import {AssemblyWorksComponent} from './results/assembly-works/assembly-works.component';
import {ForgingWorksComponent} from './results/forging-works/forging-works.component';
import {ForgingResultComponent} from './record/forging-result/forging-result.component';
import {ForgingWorkTimeComponent} from './aggregation/forging-work-time/forging-work-time.component';
import {AssemblyWorkComponent} from './record/assembly-work/assembly-work.component';
import {ProductivityAnalysisComponent} from './record/productivity-analysis/productivity-analysis.component';
import {ProductionPerformanceChartComponent} from './chart/production-performance-chart/production-performance-chart.component';
import {ForgingWorkComponent} from './record/forging-work/forging-work.component';
import {TotalInventorySituationComponent} from './record/total-inventory-situation/total-inventory-situation.component';
import {LotTrackerComponent} from './record/lot-tracker/lot-tracker.component';
import { PersonnelComponent } from './personnel/personnel.component';
import { PersonnelManagementComponent } from './personnel-management/personnel-management.component';


export const routes: Routes = [
  {path: '', redirectTo: 'planning/production-line-planning', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'planning/production-line-planning', component: ProductionLinePlanningComponent, data: {title: '생산 > 라인별가동계획', id: 32}, canActivate: [AuthGuard]},
  {path: 'planning/production-planning', component: ProductionPlanningComponent, data: {title: '생산 > 생산계획관리', id: 33}, canActivate: [AuthGuard]},
  {path: 'planning/materials-planning', component: MaterialsPlanningComponent, data: {title: '생산 > 자재계획', id: 34}, canActivate: [AuthGuard]},
  {path: 'assembly-works', component: AssemblyWorksComponent, data: {title: '생산 > 조립작업입력', id: 35}, canActivate: [AuthGuard]},
  {path: 'assembly-performance', component: ForgingWorksComponent, data: {title: '생산 > 조립작업실적입력', id: 36}, canActivate: [AuthGuard]},
  {path: 'record/assembly-personnel-performance', component: ForgingResultComponent, data: {title: '생산 > 조립작업실적서', id: 37}, canActivate: [AuthGuard]},
  {path: 'record/chart-assembly-performance', component: ForgingWorkTimeComponent, data: {title: '생산 > 조립작업시간집계표', id: 38}, canActivate: [AuthGuard]},
  {path: 'record/assembly-performance-statement', component: AssemblyWorkComponent, data: {title: '생산 > 조립수불명세서', id: 39}, canActivate: [AuthGuard]},
  {path: 'record/productivity-analysis', component: ProductivityAnalysisComponent, data: {title: '생산 > 생산성분석서', id: 40}, canActivate: [AuthGuard]},
  {path: 'chart/record/chart-production-performance', component: ProductionPerformanceChartComponent, data: {title: '생산 > 생산실적차트', id: 41}, canActivate: [AuthGuard]},
  {path: 'record/forging-work', component: ForgingWorkComponent, data: {title: '생산 > 단조작업명세서', id: 125}, canActivate: [AuthGuard]},
  {path: 'record/total-inventory-situation', component: TotalInventorySituationComponent, data: {title: '생산 > 종합재고상황판', id: 42}, canActivate: [AuthGuard]},
  {path: 'record/lot-tracker', component: LotTrackerComponent, data: {title: '생산 > LOT추적표', id: 43}, canActivate: [AuthGuard]},
  {path: 'personnel', redirectTo: 'personnel', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'personnel', component: PersonnelComponent, data: { title: '생산>생산인력등록', id: 45}},
  {path: 'personnel-management', component: PersonnelManagementComponent, data: { title: '생산>생산인력관리', id: 46}}
];

// Datepicker Config
defineLocale('ko', koLocale);

export function getDatepickerConfig(): BsDatepickerConfig {
  return Object.assign(new BsDatepickerConfig(), {
    dateInputFormat: 'YYYY-MM-DD',
    showWeekNumbers: false,
    locale: 'ko'
  });
}

@NgModule({
  imports: [
    NgxDatatableModule,
    NgbModule.forRoot(),
    ModalModule.forRoot(),
    TypeaheadModule.forRoot(),
    BsDatepickerModule.forRoot(),
    TimepickerModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ChartsModule,
    DragulaModule,
    NgxBarcodeModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    ProductionLinePlanningComponent,
    ProductionPlanningComponent,
    MaterialsPlanningComponent,
    AssemblyWorksComponent,
    ForgingWorksComponent,
    ForgingResultComponent,
    ForgingWorkTimeComponent,
    PersonnelManagementComponent,
    AssemblyWorkComponent,
    ProductivityAnalysisComponent,
    ProductionPerformanceChartComponent,
    ForgingWorkComponent,
    TotalInventorySituationComponent,
    LotTrackerComponent,
    PersonnelComponent
  ],
  providers: [
    {provide: BsDatepickerConfig, useFactory: getDatepickerConfig}
  ]
})

export class ProductionModule {
}
