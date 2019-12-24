import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { AssemblyResultService } from './assembly-result.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './assembly-result.item';
import { saveAs as importedSaveAs } from "file-saver";
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../../providers/electron.service";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

@Component({
  selector: 'app-page',
  templateUrl: './assembly-result.component.html',
  styleUrls: ['./assembly-result.component.scss'],
  providers: [AssemblyResultService, DatePipe]
})
export class AssemblyResultComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    productionLines: any[] = this.globals.configs['productionLine'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    st: number;
    rows = [];
    totalQuantity: number;
    totalSalesPrice: number;
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
        private dataService: AssemblyResultService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            sch_prdline: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '조립작업실적서';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            production_work_lines_id: formData.sch_prdline,
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

                let price: number;
                for (let i=0; i < this.rows.length; i++) {
                   price = this.rows[i].qty * this.rows[i].product_price;
                   this.rows[i].price = price;
                }

                this.isLoadingProgress = false;
            }
        );
    }
    selectPrdline(event){
        console.log(event);
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

            worksheet.getColumn(1).width = 12;
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 15;
            worksheet.getColumn(4).width = 25;
            worksheet.getColumn(5).width = 25;
            worksheet.getColumn(6).width = 8;
            worksheet.getColumn(7).width = 10;
            worksheet.getColumn(8).width = 12;

            const header = ["일자", "작업라인", "수주번호", "거래처", "제품명", "수량", "단가", "금액"];
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
                    jsonValueToArray.push(d.production_date);
                    jsonValueToArray.push(d.work_line);
                    jsonValueToArray.push(d.order_no);
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.product_name);
                    jsonValueToArray.push(d.qty);
                    jsonValueToArray.push(d.product_price);
                    jsonValueToArray.push(d.price);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(1).alignment = {horizontal: "center"};
                    row.getCell(2).alignment = {horizontal: "center"};
                    row.getCell(3).alignment = {horizontal: "center"};
                    row.getCell(6).alignment = {horizontal: "right"};
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
