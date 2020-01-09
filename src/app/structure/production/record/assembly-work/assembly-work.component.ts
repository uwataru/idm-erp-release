import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { AssemblyWorkService } from './assembly-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { saveAs as importedSaveAs } from "file-saver";
import { Item } from './assembly-work.item';
import { ElectronService, EXPORT_EXCEL_MODE } from "../../../../providers/electron.service";
import { BsDatepickerConfig } from "ngx-bootstrap";
import { BsDatepickerViewMode } from "ngx-bootstrap/datepicker";
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";
import { empty } from 'rxjs';

declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './assembly-work.component.html',
    styleUrls: ['./assembly-work.component.scss'],
    providers: [AssemblyWorkService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class AssemblyWorkComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;
    gridHeight = this.globals.gridHeight;

    searchForm: FormGroup;

    formData: Item['rowData'];
    sch_product_name: string;
    listProduct: any[] = this.globals.configs['productList'];
    searchValue: string;
    filteredPartners: any[] = [];

    rows = [];

    messages = this.globals.datatableMessages;
    errorMessage: string;

    bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
        minMode: 'month' as BsDatepickerViewMode,
        dateInputFormat: 'YYYY-MM'
    });

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: AssemblyWorkService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_product_name: '',
            sch_prdline: '',
            sch_yearmonth: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '조립수불명세서';
        this.searchForm.controls['sch_yearmonth'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        this.rows = [];
        let formData = this.searchForm.value;
        let params = {
            product_name: formData.sch_product_name,
            sch_yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-M'),

        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            data => {
                this.rows = data['data'];
                for (let i in this.rows) {
                    this.rows[i].remain_qty = this.rows[i].transfer_qty + this.rows[i].production_qty
                        - this.rows[i].defect_qty - this.rows[i].loss_qty;
                }

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListProduct(event: TypeaheadMatch): void {
        if (event.item['name'] == '') {
            this.searchForm.controls['sch_product_name'].setValue('');
        } else {
            this.searchForm.controls['sch_product_name'].setValue(event.item['name']);
        }
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
            worksheet.getColumn(3).width = 10;
            worksheet.getColumn(4).width = 10;
            worksheet.getColumn(5).width = 10;
            worksheet.getColumn(6).width = 10;
            worksheet.getColumn(7).width = 10;

            const header = ["제품명", "규격", "전기이월", "생산수량", "생산불량", "LOSS", "제품재고"];
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
                jsonValueToArray.push(d.product_type);
                jsonValueToArray.push(d.transfer_qty);
                jsonValueToArray.push(d.production_qty);
                jsonValueToArray.push(d.defect_qty);
                jsonValueToArray.push(d.loss_qty);
                jsonValueToArray.push(d.remain_qty);

                let row = worksheet.addRow(jsonValueToArray);
                row.font = this.globals.bodyFontStyle as Font;
                row.getCell(3).alignment = { horizontal: "right" };
                row.getCell(4).alignment = { horizontal: "right" };
                row.getCell(5).alignment = { horizontal: "right" };
                row.getCell(6).alignment = { horizontal: "right" };
                row.getCell(7).alignment = { horizontal: "right" };
                row.eachCell((cell, number) => {
                    cell.border = this.globals.bodyBorderStyle as Borders;
                });
            }
            );

            workbook.xlsx.writeBuffer().then((data) => {
                let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                fileName = fileName == '' ? this.panelTitle : fileName;
                importedSaveAs(blob, fileName + '.xlsx');
            })
        }
    }

    onValueChange(value: Date): void {
        // console.log(this.searchForm.controls['sch_yearmonth'].value);
        this.searchForm.controls['sch_yearmonth'].setValue(value);
        this.getAll();
    }

}
