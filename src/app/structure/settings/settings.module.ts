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

import { ProductsComponent } from './sales/products/products.component';
import { PartnersComponent } from './partners/partners.component';
import { ProductionLineComponent } from './production/production-line/production-line.component';
import { CuttingMethodComponent } from './production/cutting-method/cutting-method.component';
import { HeatingProcessComponent } from './production/heating-process/heating-process.component';
import { HeatingPriceComponent } from './production/heating-price/heating-price.component';
import { SpecialProcessComponent } from './production/special-process/special-process.component';
import { WorkingGroupLeaderComponent } from './production/working-group-leader/working-group-leader.component';
import { WorkingPatternComponent } from './production/working-pattern/working-pattern.component';
import { MaterialsComponent } from './materials/materials/materials.component';
import { PartnerForgingProductComponent } from './materials/partner-forging-product/partner-forging-product.component';
import { AccountsComponent } from './accounting/accounts/accounts.component';
import { AcctMgmtItemsComponent } from './accounting/acct-mgmt-items/acct-mgmt-items.component';
import { AcctMgmtItemValuesComponent } from './accounting/acct-mgmt-item-values/acct-mgmt-item-values.component';
import { UsersComponent } from './accounting/users/users.component';
import { PermissionsComponent } from './accounting/permissions/permissions.component';
import { MoldStorageComponent } from './technology/molds/mold-storage.component';


export const routes: Routes = [
    { path: '', redirectTo: 'sales/product-management', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'sales', redirectTo: 'sales/product-management', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'sales/product-management', component: ProductsComponent, data: { title: '환경설정 > 영업 > 제품등록', id:89 }, canActivate: [AuthGuard] },
    { path: 'partners', redirectTo: 'partners/partners-management', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'partners/partners-management', component: PartnersComponent, data: { title: '환경설정 > 거래업체 > 거래처등록', id:90 }, canActivate: [AuthGuard] },
    { path: 'production', redirectTo: 'production/production-line', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'production/production-line', component: ProductionLineComponent, data: { title: '환경설정 > 생산 > 작업LINE등록', id:91 }, canActivate: [AuthGuard] },
    { path: 'production/cutting-method', component: CuttingMethodComponent, data: { title: '환경설정 > 생산 > 절단방식', id:92 }, canActivate: [AuthGuard] },
    { path: 'production/heating-process', component: HeatingProcessComponent, data: { title: '환경설정 > 생산 > 열처리공정', id:93 }, canActivate: [AuthGuard] },
    { path: 'production/heating-price', component: HeatingPriceComponent, data: { title: '환경설정 > 생산 > 열처리단가', id:263 }, canActivate: [AuthGuard] },
    { path: 'production/special-process', component: SpecialProcessComponent, data: { title: '환경설정 > 생산 > 특수공정', id:94 }, canActivate: [AuthGuard] },
    { path: 'production/working-group-leader', component: WorkingGroupLeaderComponent, data: { title: '환경설정 > 생산 > 조반장등록', id:95 }, canActivate: [AuthGuard] },
    { path: 'production/working-pattern', component: WorkingPatternComponent, data: { title: '환경설정 > 생산 > 근무패턴등록', id:96 }, canActivate: [AuthGuard] },
    { path: 'materials', redirectTo: 'materials/materials-management', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'materials/materials-management', component: MaterialsComponent, data: { title: '환경설정 > 외주/자재 > 원자재마스터등록', id:97 }, canActivate: [AuthGuard] },
    { path: 'materials/partner-forging-product', component: PartnerForgingProductComponent, data: { title: '환경설정 > 외주/자재 > 외주단조품등록', id:98 }, canActivate: [AuthGuard] },
    { path: 'personnel', redirectTo: 'personnel/employee', pathMatch: 'full'},
    { path: 'molds', redirectTo: 'molds/mold-management', pathMatch:'full', canActivate: [AuthGuard] },
    { path: 'molds/mold-management', component: MoldStorageComponent, data: { title: '환경설정 > 기술/품질 > 금형마스터', id:266 }, canActivate: [AuthGuard] },
    { path: 'accounting', redirectTo: 'accounting/accounts', pathMatch: 'full', canActivate: [AuthGuard] },
    { path: 'accounting/accounts', component: AccountsComponent, data: { title: '환경설정 > 관리/회계 > 계정과목등록', id:99 }, canActivate: [AuthGuard] },
    { path: 'accounting/acct-mgmt-items', component: AcctMgmtItemsComponent, data: { title: '환경설정 > 관리/회계 > 관리항목등록', id:100 }, canActivate: [AuthGuard] },
    { path: 'accounting/acct-mgmt-item-values', component: AcctMgmtItemValuesComponent, data: { title: '환경설정 > 관리/회계 > 관리내역등록', id:101 }, canActivate: [AuthGuard] },
    { path: 'accounting/users', component: UsersComponent, data: { title: '환경설정 > 관리/회계 > 사용자등록', id:102 }, canActivate: [AuthGuard] },
    { path: 'accounting/permissions', component: PermissionsComponent, data: { title: '환경설정 > 관리/회계 > 사용자권한', id:264 }, canActivate: [AuthGuard] }
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
        ProductsComponent,
        PartnersComponent,
        ProductionLineComponent,
        CuttingMethodComponent,
        HeatingProcessComponent,
        HeatingPriceComponent,
        SpecialProcessComponent,
        WorkingGroupLeaderComponent,
        WorkingPatternComponent,
        MaterialsComponent,
        PartnerForgingProductComponent,
        AccountsComponent,
        AcctMgmtItemsComponent,
        AcctMgmtItemValuesComponent,
        UsersComponent,
        PermissionsComponent,
        MoldStorageComponent
    ],
    providers: [
        { provide: BsDatepickerConfig, useFactory: getDatepickerConfig }
    ]
})

export class SettingsModule { }
