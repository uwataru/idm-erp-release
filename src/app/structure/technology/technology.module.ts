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
import { Routes, RouterModule }  from '@angular/router';
import { AuthGuard } from '../../app.auth';
import { SharedModule } from '../shared/shared.module';

import { ScreeningComponent } from './quality/screening/screening.component';
import { DefectInspectionComponent } from './quality/defect-inspection/defect-inspection.component';
import { ReturnComponent } from './products/return/return.component';
import { ShippingPackagingComponent } from './products/shipping-packaging/shipping-packaging.component';
import { InspectionItemComponent } from './quality/inspection-item/inspection-item.component';
import { QualityStatusComponent } from './quality/quality-status/quality-status.component';

export const routes: Routes = [
    { path: '', redirectTo: 'inspection-item', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'quality/inspection-item', component: InspectionItemComponent, data: { title: '기술/품질 > 검사항목' } },
    { path: 'quality/screening', component: ScreeningComponent, data: { title: '품질 > 선별작업실적', id:143 }, canActivate: [AuthGuard] },
    { path: 'quality/quality-status', component: QualityStatusComponent, data: { title: '품질 > 품질현황', id:142 }, canActivate: [AuthGuard] },
    { path: 'products/shipping-packaging', component: ShippingPackagingComponent, data: { title: '품질 > 출하/포장관리' } },
    { path: 'quality/defect-inspection', component: DefectInspectionComponent, data: { title: '품질 > 불량관리', id:144 }, canActivate: [AuthGuard] },
    { path: 'products/return', component: ReturnComponent, data: { title: '품질 > 반품관리' } },
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
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        InspectionItemComponent,
        ReturnComponent,
        ShippingPackagingComponent,
        QualityStatusComponent,
        ScreeningComponent,
        DefectInspectionComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: getDatepickerConfig }
    ]
})

export class TechnologyModule { }
