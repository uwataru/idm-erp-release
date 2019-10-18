import {NgModule} from '@angular/core';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TypeaheadModule} from 'ngx-bootstrap/typeahead';
import {BsDatepickerConfig, BsDatepickerModule} from 'ngx-bootstrap/datepicker';
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
import {CuttingWorksComponent} from './results/cutting-works/cutting-works.component';
import {AssemblyWorksComponent} from './results/assembly-works/assembly-works.component';
import {ForgingWorksComponent} from './results/forging-works/forging-works.component';
import {ForgingResultComponent} from './record/forging-result/forging-result.component';
import {ForgingWorkTimeComponent} from './aggregation/forging-work-time/forging-work-time.component';
import {CuttingWorkComponent} from './record/cutting-work/cutting-work.component';
import {ProductivityAnalysisComponent} from './record/productivity-analysis/productivity-analysis.component';
import {ProductionPerformanceChartComponent} from './chart/production-performance-chart/production-performance-chart.component';
import {ForgingWorkComponent} from './record/forging-work/forging-work.component';
import {TotalInventorySituationComponent} from './record/total-inventory-situation/total-inventory-situation.component';
import {LotTrackerComponent} from './record/lot-tracker/lot-tracker.component';

export const routes: Routes = [
  {path: '', redirectTo: 'planning/production-planning', pathMatch: 'full', canActivate: [AuthGuard]},
  {
    path: 'planning/production-line-planning',
    component: ProductionLinePlanningComponent,
    data: {title: '생산 > 라인별가동계획', id: 115},
    canActivate: [AuthGuard]
  },
  {
    path: 'planning/production-planning',
    component: ProductionPlanningComponent,
    data: {title: '생산 > 생산계획조정', id: 116},
    canActivate: [AuthGuard]
  },
  {
    path: 'planning/materials-planning',
    component: MaterialsPlanningComponent,
    data: {title: '생산 > 자재계획', id: 117},
    canActivate: [AuthGuard]
  },
  {path: 'results/cutting-works', component: CuttingWorksComponent, data: {title: '생산 > 조립작업입력', id: 118}, canActivate: [AuthGuard]},
  {path: 'results/forging-works', component: ForgingWorksComponent, data: {title: '생산 > 조립작업실적입력', id: 119}, canActivate: [AuthGuard]},
  {path: 'record/forging-result', component: ForgingResultComponent, data: {title: '생산 > 조립작업실적서', id: 120}, canActivate: [AuthGuard]},
  {
    path: 'aggregation/forging-work-time',
    component: ForgingWorkTimeComponent,
    data: {title: '생산 > 조립작업시간집계표', id: 121},
    canActivate: [AuthGuard]
  },
  {path: 'record/cutting-work', component: CuttingWorkComponent, data: {title: '생산 > 조립수불명세서', id: 122}, canActivate: [AuthGuard]},
  {
    path: 'record/productivity-analysis',
    component: ProductivityAnalysisComponent,
    data: {title: '생산 > 생산성분석서', id: 123},
    canActivate: [AuthGuard]
  },
  {
    path: 'chart/production-performance',
    component: ProductionPerformanceChartComponent,
    data: {title: '생산 > 생산실적차트', id: 124},
    canActivate: [AuthGuard]
  },
  {path: 'record/forging-work', component: ForgingWorkComponent, data: {title: '생산 > 단조작업명세서', id: 125}, canActivate: [AuthGuard]},
  {
    path: 'record/total-inventory-situation',
    component: TotalInventorySituationComponent,
    data: {title: '생산 > 종합재고상황판', id: 126},
    canActivate: [AuthGuard]
  },
  {path: 'record/lot-tracker', component: LotTrackerComponent, data: {title: '생산 > LOT추적표', id: 127}, canActivate: [AuthGuard]}
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
    CuttingWorksComponent,
    AssemblyWorksComponent,
    ForgingWorksComponent,
    ForgingResultComponent,
    ForgingWorkTimeComponent,
    CuttingWorkComponent,
    ProductivityAnalysisComponent,
    ProductionPerformanceChartComponent,
    ForgingWorkComponent,
    TotalInventorySituationComponent,
    LotTrackerComponent
  ],
  providers: [
    {provide: BsDatepickerConfig, useFactory: getDatepickerConfig}
  ]
})

export class ProductionModule {
}
