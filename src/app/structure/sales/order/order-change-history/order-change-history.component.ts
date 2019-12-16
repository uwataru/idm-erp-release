import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderChangeHistoryService } from './order-change-history.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './order-change-history.item';
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../../providers/electron.service";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

import {saveAs as importedSaveAs} from "file-saver";

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
    listPartners: any[] = this.globals.configs['partnerList'];
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
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
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
            // maxResultCount: 10000
        };
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        console.log(params);
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

            worksheet.getColumn(1).width = 25;
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 25;
            worksheet.getColumn(4).width = 12;
            worksheet.getColumn(5).width = 12;
            worksheet.getColumn(6).width = 12;
            worksheet.getColumn(7).width = 8;
            worksheet.getColumn(8).width = 12;

            const header = ["제품명", "수주번호", "거래처", "최초등록일", "최초등록수량", "조정약속일자", "조정수량", "조정사유"];
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
                    jsonValueToArray.push(d.product_name);
                    jsonValueToArray.push(d.order_no);
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.input_date);
                    jsonValueToArray.push(d.before_value);
                    jsonValueToArray.push(d.after_promised_date);
                    jsonValueToArray.push(d.after_value);
                    jsonValueToArray.push(d.set_value);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(2).alignment = {horizontal: "center"};
                    row.getCell(4).alignment = {horizontal: "center"};
                    row.getCell(6).alignment = {horizontal: "center"};
                    row.getCell(8).alignment = {horizontal: "center"};
                    row.getCell(5).alignment = {horizontal: "right"};
                    row.getCell(7).alignment = {horizontal: "right"};
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
