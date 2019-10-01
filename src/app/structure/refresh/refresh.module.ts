import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { BsDatepickerModule, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { koLocale } from 'ngx-bootstrap/locale';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChartsModule } from 'ng2-charts';
import { DragulaModule } from 'ng2-dragula';
import { NgxBarcodeModule } from 'ngx-barcode';
import { Routes, RouterModule }  from '@angular/router';
import { AuthGuard } from '../../app.auth';
import { SharedModule } from '../shared/shared.module';

import { RefreshComponent } from './refresh.component';

export const routes: Routes = [
    { path: '', redirectTo: 'load', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'load', component: RefreshComponent, data: { title: '', id:999 }, canActivate: [AuthGuard] },
  
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
        CommonModule,
        RouterModule.forChild(routes),
        NgxBarcodeModule,
        SharedModule
    ],
    declarations: [
        RefreshComponent
    ]
})

export class RefreshModule { }
