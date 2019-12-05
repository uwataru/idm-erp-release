import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { AssemblyWorkTimeService } from './assembly-work-time.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './assembly-work-time.item';

@Component({
  selector: 'app-page',
  templateUrl: './assembly-work-time.component.html',
  styleUrls: ['./assembly-work-time.component.scss'],
  providers: [AssemblyWorkTimeService, DatePipe]
})
export class AssemblyWorkTimeComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    productionLines: any[] = this.globals.configs['productionLine'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    rows = [];
    gridHeight = this.globals.gridHeight;

    messages = this.globals.datatableMessages;

    errorMessage: string;

    @ViewChild('salesCompletionClose') salesCompletionClose: ElementRef;
    @ViewChild('changeStatusClose') changeStatusClose: ElementRef;
    @ViewChild('hideFormClose') hideFormClose: ElementRef;
    @ViewChild('uploadFormClose') uploadFormClose: ElementRef;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        public electronService: ElectronService,
        private dataService: AssemblyWorkTimeService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            sch_prdline: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '조립작업시간집계표';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_production_line: formData.sch_prdline,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            // sortby: ['sales_date'],
            // order: ['asc'],
            // maxResultCount: 10000
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                // this.rows.sort(function(a,b) {
                //     return a.dateKey > b.dateKey ? 1 : -1;
                // });
                // for (let i=0; i < this.rows.length; i++) {
                //     this.rows[i].dateData.sort(function(a,b) {
                //         return a.lineKey.localeCompare(b.lineKey)
                //     })
                // }

                this.isLoadingProgress = false;
            }
        );
    }
}
