import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { PayableNotesService } from './payable-notes.service';
import { MessageService } from '../../../../message.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppGlobals } from '../../../../app.globals';
import { Item } from './payable-notes.item';

@Component({
    selector: 'app-page',
    templateUrl: './payable-notes.component.html',
    styleUrls: ['./payable-notes.component.css'],
    providers: [PayableNotesService],
    encapsulation: ViewEncapsulation.None
})
export class PayableNotesComponent implements OnInit {

    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    messages = this.globals.datatableMessages;
    rcvDate = this.globals.tDate;
    rows: Item[];

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: PayableNotesService,
        private globals: AppGlobals,
        private messageService: MessageService) {

        this.searchForm = fb.group({
            sch_year: ['', [Validators.required]],
            sch_month: ['', [Validators.required]],
            sch_bank_name: ''
        });

    }

    ngOnInit() {
        this.panelTitle = '지급어음명세서';

        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.searchForm.controls['sch_month'].setValue(ym[1]);

        this.GetAll();
    }

    GetAll(): void {
        
        let formData = this.searchForm.value;
        let sch_year = formData.sch_year.trim();
        let sch_month = formData.sch_month.trim();
        let sch_bank_name = formData.sch_bank_name.trim();

        if(!sch_year || !sch_month) {
            this.messageService.add('검색년월을 빠짐없이 입력하세요.');
            return;
        }

        let params = {
            sch_year: sch_year,
            sch_month: sch_month
        };

        if(sch_bank_name) {
            params['sch_bank_name'] = sch_bank_name;
        }

        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.rows = listData['data'];
                this.isLoadingProgress = false;
            }
        );

    }
    
    getRowClass(row) {
        let rt = '';
        if(row.is_all_sum_row == 'Y') {
            rt = 'all-row-color';
        } else if(row.is_sum_row == 'Y') {
            rt = 'row-color';
        }        
        return rt;
    }

    
}
