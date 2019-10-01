import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule }  from '@angular/router';

import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
    { path: '', component: DashboardComponent, data: { title:'메인', id:141 } }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        DashboardComponent
    ],
    providers: [
    ]
})

export class DashboardModule { }
