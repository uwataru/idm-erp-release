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

import { SlipsComponent } from './slips/common-slips/slips.component';
import { ExpendablesSlipsComponent } from './slips/expendables-slips/expendables-slips.component';
import { MaterialsVatSlipsComponent } from './slips/materials-vat-slips/materials-vat-slips.component';
import { ExpendablesVatSlipsComponent } from './slips/expendables-vat-slips/expendables-vat-slips.component';
import { OutsourcingVatSlipsComponent } from './slips/outsourcing-vat-slips/outsourcing-vat-slips.component';
import { SalesVatSlipsComponent } from './slips/sales-vat-slips/sales-vat-slips.component';
import { SlipsApprovalComponent } from './slips/slips-approval/slips-approval.component';
import { AccountingClosingComponent } from './closing/accounting-closing/accounting-closing.component';
import { PaymentPlanComponent } from './closing/payment-plan/payment-plan.component';
import { AccountLedgerComponent } from './ledger/account-ledger/account-ledger.component';
import { MonthlySumByAccountComponent } from './aggregation/monthly-sum-by-account/monthly-sum-by-account.component';
import { GeneralLedgerComponent } from './ledger/general-ledger/general-ledger.component';
import { ManItemsLedgerComponent } from './ledger/man-items-ledger/man-items-ledger.component';
import { MonthlySumByManItemsComponent } from './aggregation/monthly-sum-by-man-items/monthly-sum-by-man-items.component';
import { BalanceByManItemsComponent } from './balance/balance-by-man-items/balance-by-man-items.component';
import { PayableNotesComponent } from './notes/payable-notes/payable-notes.component';
import { ReceivableNotesComponent } from './notes/receivable-notes/receivable-notes.component';
import { VatSumComponent } from './aggregation/vat-sum/vat-sum.component';
import { TrialBalanceComponent } from './balance/trial-balance/trial-balance.component';

export const routes: Routes = [
    { path: '', redirectTo: 'slips/common-slips', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'slips/common-slips', component: SlipsComponent, data: { title: '관리/회계 > 일반전표입력', id:64 }, canActivate: [AuthGuard] },
    { path: 'slips/expendables-slips', component: ExpendablesSlipsComponent, data: { title: '자재/외주 > 소모품입고전표처리', id:65 }, canActivate: [AuthGuard] },
    { path: 'slips/create-materials-vat-slips', component: MaterialsVatSlipsComponent, data: { title: '관리/회계 > 원자재부가세전표처리', id:66 }, canActivate: [AuthGuard] },
    { path: 'slips/create-expendables-vat-slips', component: ExpendablesVatSlipsComponent, data: { title: '관리/회계 > 소모품부가세전표처리', id:67 }, canActivate: [AuthGuard] },
    { path: 'slips/create-outsourcing-vat-slips', component: OutsourcingVatSlipsComponent, data: { title: '관리/회계 > 외주부가세전표처리', id:68 }, canActivate: [AuthGuard] },
    { path: 'slips/create-sales-vat-slips', component: SalesVatSlipsComponent, data: { title: '관리/회계 > 판매부가세전표처리', id:69 }, canActivate: [AuthGuard] },
    { path: 'slips/slips-approval', component: SlipsApprovalComponent, data: { title: '관리/회계 > 전표결재', id:70 }, canActivate: [AuthGuard] },
    { path: 'closing/accounting-closing', component: AccountingClosingComponent, data: { title: '관리/회계 > 마감작업', id:71 }, canActivate: [AuthGuard] },
    { path: 'closing/payment-plan', component: PaymentPlanComponent, data: { title: '관리/회계 > 지불계획서', id:72 }, canActivate: [AuthGuard] },
    { path: 'ledger/account-ledger', component: AccountLedgerComponent, data: { title: '관리/회계 > 계정별원장', id:73 }, canActivate: [AuthGuard] },
    { path: 'aggregation/monthly-sum-by-account', component: MonthlySumByAccountComponent, data: { title: '관리/회계 > 계정별월집계', id:74 }, canActivate: [AuthGuard] },
    { path: 'ledger/general-ledger', component: GeneralLedgerComponent, data: { title: '관리/회계 > 총계정원장', id:75 }, canActivate: [AuthGuard] },
    { path: 'ledger/man-items-ledger', component: ManItemsLedgerComponent, data: { title: '관리/회계 > 관리내역별원장', id:76 }, canActivate: [AuthGuard] },
    { path: 'aggregation/monthly-sum-by-man-items', component: MonthlySumByManItemsComponent, data: { title: '관리/회계 > 관리내역별월집계', id:77 }, canActivate: [AuthGuard] },
    { path: 'balance/balance-by-man-items', component: BalanceByManItemsComponent, data: { title: '관리/회계 > 관리내역별잔액', id:78 }, canActivate: [AuthGuard] },
    { path: 'notes/payable-notes', component: PayableNotesComponent, data: { title: '관리/회계 > 지급어음명세서', id:79 }, canActivate: [AuthGuard] },
    { path: 'notes/receivable-notes', component: ReceivableNotesComponent, data: { title: '관리/회계 > 받을어음명세서', id:80 }, canActivate: [AuthGuard] },
    { path: 'aggregation/vat-sum', component: VatSumComponent, data: { title: '관리/회계 > 부가세집계표', id:81 }, canActivate: [AuthGuard] },
    { path: 'balance/trial-balance', component: TrialBalanceComponent, data: { title: '관리/회계 > 시산표', id:82 }, canActivate: [AuthGuard] },
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
        SlipsComponent,
        ExpendablesSlipsComponent,
        MaterialsVatSlipsComponent,
        ExpendablesVatSlipsComponent,
        OutsourcingVatSlipsComponent,
        SalesVatSlipsComponent,
        SlipsApprovalComponent,
        AccountingClosingComponent,
        PaymentPlanComponent,
        AccountLedgerComponent,
        MonthlySumByAccountComponent,
        GeneralLedgerComponent,
        ManItemsLedgerComponent,
        MonthlySumByManItemsComponent,
        BalanceByManItemsComponent,
        PayableNotesComponent,
        ReceivableNotesComponent,
        VatSumComponent,
        TrialBalanceComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: getDatepickerConfig }
    ]
})

export class AccountingModule { }
