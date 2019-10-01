import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentPlanService } from './payment-plan.service';
import { Item } from './payment-plan.item';
import { MessageService } from '../../../../message.service';
import { AppGlobals } from '../../../../app.globals';
import {ElectronService} from '../../../../providers/electron.service';
import { UtilsService } from '../../../../utils.service';

@Component({
    selector: 'app-page',
    templateUrl: './payment-plan.component.html',
    styleUrls: ['./payment-plan.component.css'],
    providers: [PaymentPlanService]
})
export class PaymentPlanComponent implements OnInit {

    panelTitle: string;
    isLoadingProgress: boolean = false;
    rows: Item[];
    rcvDate = this.globals.tDate;

    gridHeight = this.globals.gridHeight - 140;


    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: PaymentPlanService,
        private globals: AppGlobals,
        private messageService: MessageService,
        public electronService: ElectronService,
        private utils: UtilsService
        ) {

        }

    ngOnInit() {
        this.panelTitle = '지불계획서';
        this.GetAll();
    }

    
    GetAll(): void {
        

        let params = {
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {

                this.rows = listData['data'];
                console.log(this.rows)
                this.isLoadingProgress = false;
            }
        );

    }

}
