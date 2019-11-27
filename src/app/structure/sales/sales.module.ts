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
import { Routes, RouterModule }  from '@angular/router';
import { AuthGuard } from '../../app.auth';
import { SharedModule } from '../shared/shared.module';

import { OrderRegistrationComponent } from './order/order-registration/order-registration.component';
import { OrderAdjustmentComponent } from './order/order-adjustment/order-adjustment.component';
import { OrderNotDeliveredComponent } from './order/not-delivered/not-delivered.component';
import { CompletionWaitingComponent } from './order/completion-waiting/completion-waiting.component';
import { SalesSlipsComponent } from './order/sales-slips/sales-slips.component';
import { LossHandlingComponent } from './loss/loss-handling.component';
import { OrderChangeHistoryComponent } from './order/order-change-history/order-change-history.component';
import { DeliveryComponent } from './order/delivery/delivery.component';
import { ReturnComponent } from './order/return/return.component';
import { InferiorGoodsComponent } from './order/inferior-goods/inferior-goods.component';
import { UnsoldComponent } from './order/unsold/unsold.component';
import { SelfComponent } from './order/self/self.component';
import { DeliveryPerformanceChartComponent } from './chart/delivery-performance-chart/delivery-performance-chart.component';

export const routes: Routes = [
    { path: '', redirectTo: 'orders', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'orders', component: OrderRegistrationComponent, data: { title: '영업 > 수주등록', id:20 }, canActivate: [AuthGuard] },
    { path: 'orders-adjustment', component: OrderAdjustmentComponent, data: { title: '영업 > 수주조정', id:21 }, canActivate: [AuthGuard] },
    { path: 'orders-not-delivered', component: OrderNotDeliveredComponent, data: { title: '영업 > 납품처리', id:23 }, canActivate: [AuthGuard] },
    { path: 'orders-completion-waiting', component: CompletionWaitingComponent, data: { title: '영업 > 판매처리', id:24 }, canActivate: [AuthGuard] },
    { path: 'orders-sales-slips', component: SalesSlipsComponent, data: { title: '영업 > 판매전표처리', id:25 }, canActivate: [AuthGuard] },
    { path: 'loss-handling', component: LossHandlingComponent, data: { title: '영업 > 정기LOSS처리', id:26 }, canActivate: [AuthGuard] },
    { path: 'orders-adjustment-history', component: OrderChangeHistoryComponent, data: { title: '영업 > 수주조정내역', id:22 }, canActivate: [AuthGuard] },
    { path: 'orders-delivery', component: DeliveryComponent, data: { title: '영업 > 납품명세서', id:27 }, canActivate: [AuthGuard] },
    { path: 'orders-return', component: ReturnComponent, data: { title: '영업 > 반품명세서', id:28 }, canActivate: [AuthGuard] },
    { path: 'orders-inferior-goods', component: InferiorGoodsComponent, data: { title: '영업 > 납품불량명세서', id:29 }, canActivate: [AuthGuard] },
    { path: 'order/unsold', component: UnsoldComponent, data: { title: '영업 > 미판매명세서', id:262 }, canActivate: [AuthGuard] },
    { path: 'order/self', component: SelfComponent, data: { title: '영업 > 자가제품수불명세서', id:113 }, canActivate: [AuthGuard] },
    { path: 'chart-delivery-performance', component: DeliveryPerformanceChartComponent, data: { title: '영업 > 납품실적차트', id:30 }, canActivate: [AuthGuard] }
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
        SharedModule,
        RouterModule.forChild(routes),
    ],
    declarations: [
        OrderRegistrationComponent,
        OrderAdjustmentComponent,
        OrderNotDeliveredComponent,
        CompletionWaitingComponent,
        SalesSlipsComponent,
        LossHandlingComponent,
        OrderChangeHistoryComponent,
        DeliveryComponent,
        ReturnComponent,
        InferiorGoodsComponent,
        UnsoldComponent,
        SelfComponent,
        DeliveryPerformanceChartComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: getDatepickerConfig }
    ]
})

export class SalesModule { }
