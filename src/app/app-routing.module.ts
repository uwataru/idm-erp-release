import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './app.auth';

import { AdminLayoutComponent } from './layout/admin/admin-layout.component';
import { AuthLayoutComponent } from './layout/auth/auth-layout.component';
import { PrintLayoutComponent } from './layout/print/print-layout.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [AuthGuard],
        runGuardsAndResolvers: 'always',
        children: [
            {
                path: '',
                loadChildren: './structure/dashboard/dashboard.module#DashboardModule'
            },
            {
                path: 'sales',
                loadChildren: './structure/sales/sales.module#SalesModule'
            },
            {
                path: 'production',
                loadChildren: './structure/production/production.module#ProductionModule'
            },
            {
                path: 'personnel',
                loadChildren: './structure/personnel/personnel.module#PersonnelModule'
            },
            {
                path: 'materials',
                loadChildren: './structure/materials/materials.module#MaterialsModule'
            },
            {
                path: 'technology',
                loadChildren: './structure/technology/technology.module#TechnologyModule'
            },
            {
                path: 'accounting',
                loadChildren: './structure/accounting/accounting.module#AccountingModule'
            },
            {
                path: 'settings',
                loadChildren: './structure/settings/settings.module#SettingsModule'
            },
            {
                path: 'refresh',
                loadChildren: './structure/refresh/refresh.module#RefreshModule'
            }
        ]
    },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [{
            path: 'session',
            loadChildren: './structure/session/session.module#SessionModule'
        }]
    },
    {
        path: 'print',
        component: PrintLayoutComponent,
        loadChildren: './structure/print/print.module#PrintModule'
    },
    {
        path: '**',
        component: PageNotFoundComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
            useHash: true
        })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
