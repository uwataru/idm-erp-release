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

import {PersonnelComponent} from "./personnel/personnel.component";
import {PersonnelManagementComponent} from "./personnel-management/personnel-management.component";


export const routes: Routes = [
  {path: '', redirectTo: 'personnel-register', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'personnel-register', component: PersonnelComponent, data: { title: '인력관리>생산인력등록', id: 45}},
  {path: 'personnel-management', component: PersonnelManagementComponent, data: { title: '인력관리>생산인력관리', id: 46}}
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
    PersonnelManagementComponent,
    PersonnelComponent
  ],
  providers: [
    {provide: BsDatepickerConfig, useFactory: getDatepickerConfig}
  ]
})

export class PersonnelModule {
}
