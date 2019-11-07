import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService} from '../../../../providers/electron.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { UnsoldService } from './unsold.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, detailsItem } from './unsold.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './unsold.component.html',
    styleUrls: ['./unsold.component.css'],
    providers: [UnsoldService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class UnsoldComponent implements OnInit {
    gridHeight = this.globals.gridHeight - 43;
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    st: number;
    rows = [];
    totalQty: number;
    totalSalesPrice: number;
    totalUnSoldPrice: number;

    inputFormTitle: string;
    isEditMode: boolean = false;
    detailRows: detailsItem[];
    selected = [];

    detail_product_code: string;
    detail_product_name: string;
    detail_partner_name: string;
    detail_sch_sdate: string;
    detail_sch_edate: string;
    detailsums_sales_price: number;
    detailsums_forwarding_weight: number;

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
        private dataService: UnsoldService,
        private globals: AppGlobals,
        public electronService: ElectronService,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            sch_partner_name: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '미판매명세서';
        this.inputFormTitle = '미판매내역서';
        this.searchForm.controls['sch_sdate'].setValue(this.tDate);
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['sales_date'],
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
                this.totalQty = listData['totalCount'];
                this.totalSalesPrice = listData['sumData']['total_sales_price'];
                this.totalUnSoldPrice = listData['sumData']['total_un_sold_price'];

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
                    window.navigator.msSaveBlob(blob, "미판매명세서.xlsx");
                }
                else { // for chrome and firfox
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "미판매명세서.xlsx";
                    link.click();
                }
            },
            error => this.errorMessage = <any>error
        );
    }
    excelDownDetail(): void {
        this.dataService.GetDetailExcelFile().subscribe(
            blob => {
                if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
                    window.navigator.msSaveBlob(blob, "미판매내역서.xlsx");
                }
                else { // for chrome and firfox
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "미판매내역서.xlsx";
                    link.click();
                }
            },
            error => this.errorMessage = <any>error
        );
    }

    openModal(product_code) {
        let formData = this.searchForm.value;

        let params = {
            product_code: product_code,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['delivery_date'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;

        this.dataService.GetDetails(params).subscribe(
            listData =>
            {
                this.detail_product_code = listData['data'][0]['product_code'];
                this.detail_product_name = listData['data'][0]['product_name'];
                this.detail_partner_name = listData['data'][0]['partner_name'];
                this.detail_sch_sdate = this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd');
                this.detail_sch_edate = this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd');

                this.detailRows = listData['data'];

                this.detailsums_sales_price = listData['sumData']['total_sales_price'];
                this.detailsums_forwarding_weight = listData['sumData']['total_un_sold_price'];

                this.isLoadingProgress = false;
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 250);
            }
        );
    }
}
