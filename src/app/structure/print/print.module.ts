import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule }  from '@angular/router';
import { NgxBarcodeModule } from 'ngx-barcode';
import { SharedModule } from '../shared/shared.module';

import { SalesOrderDInvoicePrintComponent } from '../sales/order/not-delivered/print/invoice.component';
import { ProductionPlanningPrintComponent } from '../production/planning/print/production-planning.component';
import { ForgingWorkAllocationPrintComponent } from '../production/planning/print/forging-work-allocation/forging-work-allocation.component';
import { CuttingWorkAllocationPrintComponent } from '../production/planning/print/cutting-work-allocation/cutting-work-allocation.component';

export const routes: Routes = [
    { path: '', redirectTo: 'session/404' },
    { path: 'sales/order/not-delivered', component: SalesOrderDInvoicePrintComponent, data: { title: '생산 > 생산계획서' } },
    { path: 'production/planning/production-planning', component: ProductionPlanningPrintComponent, data: { title: '생산 > 생산계획서' } },
    { path: 'production/planning/forging-work-allocation', component: ForgingWorkAllocationPrintComponent, data: { title: '생산 > 단조작업지시서' } },
    { path: 'production/planning/cutting-work-allocation', component: CuttingWorkAllocationPrintComponent, data: { title: '생산 > 절단작업지시서' } }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        NgxBarcodeModule,
        SharedModule
    ],
    declarations: [
        SalesOrderDInvoicePrintComponent,
        ProductionPlanningPrintComponent,
        ForgingWorkAllocationPrintComponent,
        CuttingWorkAllocationPrintComponent
    ]
})

export class PrintModule { }
