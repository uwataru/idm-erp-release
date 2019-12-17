import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { InferiorGoodsService } from './inferior-goods.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './inferior-goods.item';
import {saveAs as importedSaveAs} from "file-saver";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

@Component({
  selector: 'app-page',
  templateUrl: './inferior-goods.component.html',
  styleUrls: ['./inferior-goods.component.css'],
  providers: [InferiorGoodsService, DatePipe],
  encapsulation: ViewEncapsulation.None
})
export class InferiorGoodsComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;



    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['partnerList'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    st: number;
    rows = [];

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
        private dataService: InferiorGoodsService,
        public elSrv: ElectronService,
        private globals: AppGlobals,
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
        this.panelTitle = '납품불량명세서';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        this.rows = [];
        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['sales_date'],
            order: ['asc'],
            maxResultCount: 10000
        }

        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                for(let i=0; i<this.rows.length; i++){
                    listData['data'][i].sales_price = (listData['data'][i].qty - listData['data'][i].return_qty) * listData['data'][i].product_price;
                }

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        this.searchForm.controls['sch_partner_name'].setValue(event.item['name']);
        this.getAll();
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
            worksheet.getColumn(2).width = 25;
            worksheet.getColumn(3).width = 25;
            worksheet.getColumn(4).width = 15;
            worksheet.getColumn(5).width = 8;
            worksheet.getColumn(6).width = 8;
            worksheet.getColumn(7).width = 10;
            worksheet.getColumn(8).width = 12;

            const header = ["납품일자", "거래처", "제품명", "수주번호", "납품수량", "불량수량", "단가", "금액"];
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
                  jsonValueToArray.push(d.input_date);
                  jsonValueToArray.push(d.partner_name);
                  jsonValueToArray.push(d.product_name);
                  jsonValueToArray.push(d.order_no);
                  jsonValueToArray.push(d.qty);
                  jsonValueToArray.push(d.return_qty);
                  jsonValueToArray.push(d.product_price);
                  jsonValueToArray.push(d.sales_price);

                  let row = worksheet.addRow(jsonValueToArray);
                  row.font = this.globals.bodyFontStyle as Font;
                  row.getCell(1).alignment = {horizontal: "center"};
                  row.getCell(4).alignment = {horizontal: "center"};
                  row.getCell(5).alignment = {horizontal: "right"};
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
