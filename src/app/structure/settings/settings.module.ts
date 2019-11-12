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
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../../app.auth';
import {SharedModule} from '../shared/shared.module';

import {ProductsComponent} from './sales/products/products.component';
import {PartnersComponent} from './partners/partners.component';
import {ProductionLineComponent} from './production/production-line/production-line.component';
import {CuttingMethodComponent} from './production/cutting-method/cutting-method.component';
import {HeatingProcessComponent} from './production/heating-process/heating-process.component';
import {HeatingPriceComponent} from './production/heating-price/heating-price.component';
import {SpecialProcessComponent} from './production/special-process/special-process.component';
import {WorkingGroupLeaderComponent} from './production/working-group-leader/working-group-leader.component';
import {WorkingPatternComponent} from './production/working-pattern/working-pattern.component';
import {MaterialsComponent} from './materials/materials/materials.component';
import {PartnerAssemblyProductComponent} from './materials/partner-assembly-product/partner-assembly-product.component';
import {AccountsComponent} from './accounting/accounts/accounts.component';
import {AcctMgmtItemsComponent} from './accounting/acct-mgmt-items/acct-mgmt-items.component';
import {AcctMgmtItemValuesComponent} from './accounting/acct-mgmt-item-values/acct-mgmt-item-values.component';
import {UsersComponent} from './accounting/users/users.component';
import {PermissionsComponent} from './accounting/permissions/permissions.component';
import {MoldStorageComponent} from './technology/molds/mold-storage.component';
import {NgDaumAddressModule} from 'ng2-daum-address';


export const routes: Routes = [
  {path: '', redirectTo: 'partners/partners-management', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'partners', redirectTo: 'partners/partners-management', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'partners/partners-management', component: PartnersComponent, data: {title: '환경설정 > 영업 > 거래처등록', id: 90}, canActivate: [AuthGuard]},
  {path: 'materials', redirectTo: 'materials/product-management', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'materials/product-management', component: ProductsComponent, data: {title: '환경설정 > 자재 > 제품등록', id: 89}, canActivate: [AuthGuard]},
  {path: 'materials/materials-management', component: MaterialsComponent, data: {title: '환경설정 > 자재 > 원자재물품등록', id: 97}, canActivate: [AuthGuard]},
  {path: 'materials/partner-assembly-product', component: PartnerAssemblyProductComponent, data: {title: '환경설정 > 자재 > 외주물품등록', id: 98}, canActivate: [AuthGuard]},
  {path: 'production', redirectTo: 'production/production-line', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'production/production-line', component: ProductionLineComponent, data: {title: '환경설정 > 생산 > 작업LINE등록', id: 91}, canActivate: [AuthGuard]},
  {path: 'production/cutting-method', component: CuttingMethodComponent, data: {title: '환경설정 > 생산 > 조립공정등록', id: 92}, canActivate: [AuthGuard]},
  {path: 'accounting', redirectTo: 'accounting/accounts', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'accounting/accounts', component: AccountsComponent, data: {title: '환경설정 > 계정관리 > 계정과목등록', id: 99}, canActivate: [AuthGuard]},
  {path: 'accounting/acct-mgmt-items', component: AcctMgmtItemsComponent, data: {title: '환경설정 > 계정관리 > 관리항목등록', id: 100}, canActivate: [AuthGuard]},
  {path: 'accounting/acct-mgmt-item-values', component: AcctMgmtItemValuesComponent, data: {title: '환경설정 > 계정관리 > 관리내역등록', id: 101}, canActivate: [AuthGuard]},
  {path: 'users', redirectTo: 'users/management', pathMatch: 'full', canActivate: [AuthGuard]},
  {path: 'users/management', component: UsersComponent, data: {title: '환경설정 > 계정관리 > 사용자등록', id: 102}, canActivate: [AuthGuard]},
  {path: 'users/permissions', component: PermissionsComponent, data: {title: '환경설정 > 관리/회계 > 사용자권한', id: 264}, canActivate: [AuthGuard]}
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
    NgDaumAddressModule,
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
    PartnerAssemblyProductComponent,
    AccountsComponent,
    AcctMgmtItemsComponent,
    AcctMgmtItemValuesComponent,
    UsersComponent,
    PermissionsComponent,
    MoldStorageComponent
  ],
  providers: [
    {provide: BsDatepickerConfig, useFactory: getDatepickerConfig}
  ]
})

export class SettingsModule {
}
