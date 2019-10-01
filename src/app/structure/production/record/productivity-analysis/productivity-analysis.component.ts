import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DragulaService } from 'ng2-dragula';
import { DatePipe } from '@angular/common';
import { ProductivityAnalysisService } from './productivity-analysis.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './productivity-analysis.item';
import {ElectronService} from "../../../../providers/electron.service";

@Component({
  selector: 'app-page',
  templateUrl: './productivity-analysis.component.html',
  styleUrls: ['./productivity-analysis.component.scss'],
  providers: [ProductivityAnalysisService, DragulaService, DatePipe]
})
export class ProductivityAnalysisComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];

    sum_working_time: number;
    sum_failure_time: number;
    sum_product_cnt: number;
    sum_production_qty: number;
    sum_production_weight: number;
    sum_production_price: number;

    totalQuantity: number;
    totalSalesPrice: number;
    isInitPlanDate: boolean = false;

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
        private dragulaService: DragulaService,
        private dataService: ProductivityAnalysisService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSer: ElectronService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            production_line: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '생산성분석서';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.GetAll();
    }

    GetAll() {
        let formData = this.searchForm.value;
        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sch_prdline: formData.production_line,
            sortby: ['seq_no'],
            order: ['asc']
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                this.sum_working_time = listData['sumData']['working_time'];
                this.sum_failure_time = listData['sumData']['failure_time'];
                this.sum_product_cnt = listData['sumData']['product_cnt'];
                this.sum_production_qty = listData['sumData']['production_qty'];
                this.sum_production_weight = listData['sumData']['production_weight'];
                this.sum_production_price = listData['sumData']['production_price'];
                //this.totalQuantity = listData['sumData']['total_qty'];
                //this.totalSalesPrice = listData['sumData']['total_sales_price'];

                this.rows.sort(function(a,b) {
                    return a.subKey > b.subKey ? 1 : -1;
                });

                this.isLoadingProgress = false;
                if (this.isInitPlanDate == false) {
                    this.isInitPlanDate = true;
                }
            }
        );
    }

    convertYearMonth(ym) {
        let yy = ym.substring(0,4);
        let mm = ym.substring(4,6);
        return yy + '-' + mm;
    }

    excelDown(): void {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
                    window.navigator.msSaveBlob(blob, "Report.xlsx");
                }
                else { // for chrome and firfox
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "Report.xlsx";
                    link.click();
                }
            },
            error => this.errorMessage = <any>error
        );
    }
}
