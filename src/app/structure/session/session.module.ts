import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule }  from '@angular/router';
import { SignInComponent } from './signin/signin.component';

export const routes: Routes = [
    { path: '', redirectTo: 'signin', pathMatch: 'full' },
    { path: 'signin', component: SignInComponent, data: { title: '로그인' } }
];

@NgModule({
    imports: [
        NgxDatatableModule,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        SignInComponent
    ]
})

export class SessionModule { }
