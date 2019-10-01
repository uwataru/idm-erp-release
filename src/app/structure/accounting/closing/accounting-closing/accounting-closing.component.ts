import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountingClosingService } from './accounting-closing.service';
import { Item } from './accounting-closing.item';
import { MessageService } from '../../../../message.service';
import { AppGlobals } from '../../../../app.globals';
import {ElectronService} from '../../../../providers/electron.service';
import { UtilsService } from '../../../../utils.service';

@Component({
    selector: 'app-page',
    templateUrl: './accounting-closing.component.html',
    styleUrls: ['./accounting-closing.component.css'],
    providers: [AccountingClosingService]
})
export class AccountingClosingComponent implements OnInit {

    panelTitle: string;
    isLoadingProgress: boolean = false;
    inputFormTitle: string;
    deleteFormTitle: string;
    isEditMode: boolean = false;
    rows: Item[];
    selected = [];
    rcvDate = this.globals.tDate;

    closeForm: FormGroup;


    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;


    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: AccountingClosingService,
        private globals: AppGlobals,
        private messageService: MessageService,
        public electronService: ElectronService,
        private utils: UtilsService
        ) {

            this.closeForm = fb.group({
                year: ['', [Validators.required]],
                month: ['', [Validators.required]],
                mgmt_items_close: '',
                trial_balance: '',
                acct_close: '',
                pay_plan_cal: ''
            });
        }

    ngOnInit() {
        this.panelTitle = '마감작업';
        this.inputFormTitle = '등록';
        this.deleteFormTitle = '삭제';

        let ym = this.rcvDate.split('-');
        this.closeForm.controls['year'].setValue(ym[0]);
        this.closeForm.controls['month'].setValue(ym[1]);
    }

    
    closeSave() {

        let formData = this.closeForm.value;        
        let params = {
            sch_year: formData.year,
            sch_month: formData.month,
            mgmt_items_close: formData.mgmt_items_close ? 'Y' : 'N',
            trial_balance: formData.trial_balance ? 'Y' : 'N',
            acct_close: formData.acct_close ? 'Y' : 'N',
            pay_plan_cal: formData.pay_plan_cal ? 'Y' : 'N'
        }

        this.isLoadingProgress = true;
        this.dataService.closeSave(params).subscribe(
            listData =>
            {
                if(listData['checkCnt'] > 0) {
                    this.messageService.add('이미 등록되어 있습니다.');
                } else {
                    this.messageService.add('등록되었습니다.');
                }
                this.isLoadingProgress = false;
            }
        );
    }

}
