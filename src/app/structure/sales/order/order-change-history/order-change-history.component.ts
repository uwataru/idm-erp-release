import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderChangeHistoryService } from './order-change-history.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './order-change-history.item';
import {ElectronService} from "../../../../providers/electron.service";

@Component({
    selector: 'app-page',
    templateUrl: './order-change-history.component.html',
    styleUrls: ['./order-change-history.component.css'],
    providers: [OrderChangeHistoryService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class OrderChangeHistoryComponent implements OnInit {

    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_product_name: string;
    rows = [];
    messages = this.globals.datatableMessages;
    errorMessage: string;
    gridHeight = this.globals.gridHeight;

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: OrderChangeHistoryService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_partner_name: '',
            sch_sdate: '',
            sch_edate: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '수주조정내역';
        this.searchForm.controls['sch_sdate'].setValue(this.tDate);
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['order_no'],
            order: ['asc'],
            maxResultCount: 10000
        }   
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        const val = this.listSltdPaCode;
    }

    excelDown(): void {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
                    window.navigator.msSaveBlob(blob, "수주조정내역.xlsx");
                }
                else { // for chrome and firfox
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "수주조정내역.xlsx";
                    link.click();
                }
            },
            error => this.errorMessage = <any>error
        );
    }

}
