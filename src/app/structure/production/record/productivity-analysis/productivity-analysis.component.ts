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
    gridHeight = this.globals.gridHeight;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];
    selected = [];

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
            sch_prdline: ''
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
            sch_prdline: formData.sch_prdline,
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                // this.rows.sort(function(a,b) {
                //     return a.subKey > b.subKey ? 1 : -1;
                // });

                this.isLoadingProgress = false;
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
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 12;
            worksheet.getColumn(4).width = 12;
            worksheet.getColumn(5).width = 12;
            worksheet.getColumn(6).width = 15;
            worksheet.getColumn(7).width = 20;
            worksheet.getColumn(8).width = 20;
            worksheet.getColumn(9).width = 20;
            worksheet.getColumn(10).width = 20;
            worksheet.getColumn(11).width = 20;
            worksheet.getColumn(12).width = 20;
            worksheet.getColumn(13).width = 20;

            const header = ["작업일", "작업라인", "총가동시간", "투입인원", "생산수량", "생산금액", "원자재 투입금액", "총가동 시간당 생산수량",
                "총가동 생산금액", "총가동 자재 투입금액", "투입 인원당 생산수량", "투입 인원당 생산금액", "인원당 원자재 투입금액"];
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
                    jsonValueToArray.push(d.line_no);
                    jsonValueToArray.push(d.total_work_time);
                    jsonValueToArray.push(d.total_work_personnel);
                    jsonValueToArray.push(d.total_production_qty);
                    jsonValueToArray.push(d.total_production_price);
                    jsonValueToArray.push(d.total_material_price);
                    jsonValueToArray.push(d.hour_production_qty);
                    jsonValueToArray.push(d.hour_production_price);
                    jsonValueToArray.push(d.hour_material_price);
                    jsonValueToArray.push(d.hour_personner_qty);
                    jsonValueToArray.push(d.hour_personner_price);
                    jsonValueToArray.push(d.personner_material_price);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(1).alignment = {horizontal: "center"};
                    row.getCell(2).alignment = {horizontal: "center"};
                    row.getCell(3).alignment = {horizontal: "right"};
                    row.getCell(4).alignment = {horizontal: "right"};
                    row.getCell(5).alignment = {horizontal: "right"};
                    row.getCell(6).alignment = {horizontal: "right"};
                    row.getCell(7).alignment = {horizontal: "right"};
                    row.getCell(8).alignment = {horizontal: "right"};
                    row.getCell(9).alignment = {horizontal: "right"};
                    row.getCell(10).alignment = {horizontal: "right"};
                    row.getCell(11).alignment = {horizontal: "right"};
                    row.getCell(12).alignment = {horizontal: "right"};
                    row.getCell(13).alignment = {horizontal: "right"};
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
