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
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../../providers/electron.service";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";
import {saveAs as importedSaveAs} from "file-saver";
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
        public elSrv: ElectronService
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

    exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
        if (this.elSrv.checkExportExcel()) {
            let data;
            if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
                // data = this.dataService.GetMasterExcelData()['data'];
            } else { //리스트는 기존 가져온 데이터로 생성
                data = this.rows;
            }

            let workbook = new Workbook();
            let worksheet = workbook.addWorksheet(this.panelTitle);

            worksheet.getColumn(1).width = 15;
            worksheet.getColumn(2).width = 25;
            worksheet.getColumn(3).width = 12;
            worksheet.getColumn(4).width = 12;
            worksheet.getColumn(5).width = 25;
            worksheet.getColumn(6).width = 15;
            worksheet.getColumn(7).width = 8;
            worksheet.getColumn(8).width = 10;

            const header = ["수주번호", "거래처", "등록일자", "약속일자", "제품명", "규격", "수량", "단가"];
            let headerRow = worksheet.addRow(header);
            headerRow.font = this.globals.headerFontStyle as Font;
            headerRow.eachCell((cell, number) => {
                cell.fill = this.globals.headerFillColor as Fill;
                cell.border = this.globals.headerBorderStyle as Borders;
                cell.alignment = this.globals.headerAlignment as Alignment;
            });

            let jsonValueToArray;
            data.forEach(d => {
                    jsonValueToArray = [];
                    jsonValueToArray.push(d.order_no);
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.demand_date);
                    jsonValueToArray.push(d.promised_date);
                    jsonValueToArray.push(d.product_name);
                    jsonValueToArray.push(d.product_type);
                    jsonValueToArray.push(d.product_qty);
                    jsonValueToArray.push(d.product_price);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(1).alignment = {horizontal: "center"};
                    row.getCell(3).alignment = {horizontal: "center"};
                    row.getCell(4).alignment = {horizontal: "center"};
                    row.getCell(7).alignment = {horizontal: "right"};
                    row.getCell(8).alignment = {horizontal: "right"};
                    row.eachCell((cell, number) => {
                        cell.border = this.globals.bodyBorderStyle as Borders;
                    });
                }
            );

            workbook.xlsx.writeBuffer().then((data) => {
                let blob = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
                fileName = fileName == '' ? this.panelTitle : fileName;
                importedSaveAs(blob, fileName + '.xlsx');
            })
        }
    }

}
