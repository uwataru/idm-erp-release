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
import { NgxBarcodeModule } from 'ngx-barcode';
import { Routes, RouterModule }  from '@angular/router';
import { AuthGuard } from '../../app.auth';
import { SharedModule } from '../shared/shared.module';

import { RawMaterialsComponent } from './order/raw-materials/raw-materials.component';
import { OutsourcingForgingWorkComponent } from './order/outsourcing-forging-work/outsourcing-forging-work.component';
import { OutsourcingCuttingWorkComponent } from './order/outsourcing-cutting-work/outsourcing-cutting-work.component';
import { HeatTreatmentOutsourcingComponent } from './order/outsourcing-heat-treatment/heat-treatment-outsourcing.component';
import { OutsideMachiningComponent } from './order/outsourcing-machining/outside-machining.component';
import { RawMaterialsReceivingComponent } from './warehousing/raw-materials/raw-materials-receiving.component';
import { RawMaterialSlipsComponent } from './slips/raw-materials/raw-material-slips.component';
import { OutsourcedStorageComponent } from './warehousing/outsourcing/outsourced-storage.component';
import { OutsourcedStorageSlipsComponent } from './slips/outsourcing/outsourced-storage-slips.component';

import { MaterialsInOutComponent } from './history/materials-in-out/materials-in-out.component';
import { OutsourcingInOutComponent } from './history/outsourcing-in-out/outsourcing-in-out.component';

export const routes: Routes = [
    { path: '', redirectTo: 'order/raw-materials', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'order/raw-materials', component: RawMaterialsComponent, data: { title: '자재/외주 > 원자재발주', id:128 }, canActivate: [AuthGuard] },
    { path: 'order/outsourcing-forging-work', component: OutsourcingForgingWorkComponent, data: { title: '자재/외주 > 외주단조발주', id:129 }, canActivate: [AuthGuard] },
    { path: 'order/outsourcing-cutting-work', component: OutsourcingCuttingWorkComponent, data: { title: '자재/외주 > 외주절단발주', id:130 }, canActivate: [AuthGuard] },
    { path: 'order/outsourcing-heat-treatment', component: HeatTreatmentOutsourcingComponent, data: { title: '자재/외주 > 외주열처리발주', id:131 }, canActivate: [AuthGuard] },
    { path: 'order/outsourcing-machining', component: OutsideMachiningComponent, data: { title: '자재/외주 > 외주가공발주', id:132 }, canActivate: [AuthGuard] },
    { path: 'warehousing/raw-materials', component: RawMaterialsReceivingComponent, data: { title: '자재/외주 > 원자재입고처리', id:133 }, canActivate: [AuthGuard] },
    { path: 'slips/raw-materials', component: RawMaterialSlipsComponent, data: { title: '자재/외주 > 원자재입고전표처리', id:134 }, canActivate: [AuthGuard] },
    { path: 'warehousing/outsourcing', component: OutsourcedStorageComponent, data: { title: '자재/외주 > 외주입고처리', id:135 }, canActivate: [AuthGuard] },
    { path: 'slips/outsourcing', component: OutsourcedStorageSlipsComponent, data: { title: '자재/외주 > 외주입고전표처리', id:136 }, canActivate: [AuthGuard] },
    { path: 'history/materials-in-out', component: MaterialsInOutComponent, data: { title: '자재/외주 > 원자재수불명세서', id:138 }, canActivate: [AuthGuard] },
    { path: 'history/outsourcing-in-out', component: OutsourcingInOutComponent, data: { title: '자재/외주 > 외주수불명세서', id:139 }, canActivate: [AuthGuard] }
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
        NgxBarcodeModule,
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        RawMaterialsComponent,
        OutsourcingForgingWorkComponent,
        OutsourcingCuttingWorkComponent,
        HeatTreatmentOutsourcingComponent,
        OutsideMachiningComponent,
        RawMaterialsReceivingComponent,
        RawMaterialSlipsComponent,
        OutsourcedStorageComponent,
        OutsourcedStorageSlipsComponent,
        MaterialsInOutComponent,
        OutsourcingInOutComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: getDatepickerConfig }
    ]
})

export class MaterialsModule { }
