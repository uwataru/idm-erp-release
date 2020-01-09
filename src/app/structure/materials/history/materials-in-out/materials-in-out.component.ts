import { Component, EventEmitter, Output, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { saveAs as importedSaveAs } from "file-saver";
import { DatePipe } from '@angular/common';
import { MaterialsInOutService } from './materials-in-out.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { BsDatepickerConfig } from "ngx-bootstrap";
import { BsDatepickerViewMode } from "ngx-bootstrap/datepicker";
import { ElectronService, EXPORT_EXCEL_MODE } from '../../../../providers/electron.service';
import { MessageService } from '../../../../message.service';
import { Item } from './materials-in-out.item';
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './materials-in-out.component.html',
    styleUrls: ['./materials-in-out.component.css'],
    providers: [MaterialsInOutService, DatePipe],
    encapsulation: ViewEncapsulation.None

})
export class MaterialsInOutComponent implements OnInit {
    gridHeight = this.globals.gridHeight;
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    searchForm: FormGroup;
    historyForm: FormGroup;

    isEditMode: boolean = false;
    isLoadingProgress: boolean = false;

    formData: Item[];
    searchValue: string;
    rows: Item['rowData'][];
    temp = [];
    listSltdPaCode: number = 0;
    listPartners: any[] = this.globals.configs['partnerList'];
    listMaterials: any[] = this.globals.configs['schMaterials'];
    listSize: any[] = this.globals.configs['sizeList'];


    totalBalance: number;
    totalBalanceAmount: number;

    totalOrderAmount: number;
    totalRcvWeight: number;
    totalUsedWeight: number;
    totalUsedAmount: number;
    totalWeight: number;
    totalRemaingAmount: number;

    detail_sch_sdate: string;
    detail_sch_edate: string;

    messages = this.globals.datatableMessages;

    errorMessage: string;

    bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
        minMode: 'month' as BsDatepickerViewMode,
        dateInputFormat: 'YYYY-MM'
    });

    constructor(
        private fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: MaterialsInOutService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        this.historyForm = fb.group({
            sch_maker_name: '',
            sch_partner_name: ''
        });

        this.searchForm = fb.group({
            sch_yearmonth: '',
            sch_material: '',
            sch_size: '',
            sch_partner_name: '',
        });

        // if( this.listPartners.filter(v => v.Code == 0).length < 1 ) {
        //     this.listPartners.unshift({Code:0, Name:'전체', name:'전체'});
        // }
    }

    ngOnInit() {
        this.panelTitle = '원자재수불명세서';
        // this.inputFormTitle = '원자재수불내역서';


        this.getAll();
        this.searchForm.controls['sch_yearmonth'].setValue(this.tDate);

        $(document).ready(function () {
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll(): void {
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

        setTimeout(() => {
            let formData = this.searchForm.value;
            this.rows = [];

            let params = {
                sch_yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-M'),
                material_name: formData.sch_material,
                material_size: formData.sch_size,
                partner_name: formData.sch_partner_name,
                // sortby: ['rcv_date'],
                // order: ['asc'],
                // maxResultCount: 10000
            }
            this.isLoadingProgress = true;

            this.dataService.GetAll(params).subscribe(
                data => {
                    this.rows = data['data'];
                    this.temp = data['data'];

                    let len = this.rows.length;
                    for (let i = 0; i < len; i++) {
                        this.rows[i].remain_qty = this.rows[i].transfer_qty + this.rows[i].receiving_qty - this.rows[i].insert_qty - this.rows[i].output_qty;
                    }

                    // this.totalBalance = data['totalBalance'];
                    // this.totalBalanceAmount = data['totalBalanceAmount'];
                    //
                    // this.totalOrderAmount = data['totalOrderAmount'];
                    // this.totalRcvWeight = data['totalRcvWeight'];
                    // this.totalUsedWeight = data['totalUsedWeight'];
                    // this.totalUsedAmount = data['totalUsedAmount'];
                    // this.totalWeight = data['totalWeight'];
                    // this.totalRemaingAmount = data['totalRemaingAmount'];

                    this.isLoadingProgress = false;
                }
            );
        }, 10);
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['name'] == '') {
            this.searchForm.controls['sch_partner_name'].setValue('');
        } else {
            this.searchForm.controls['sch_partner_name'].setValue(event.item['name']);
        }

        const val = this.listSltdPaCode;
    }

    onSelectListMaterial(event: TypeaheadMatch): void {
        if (event.item['v_name'] == '') {
            this.searchForm.controls['sch_material'].setValue('');
        } else {
            this.searchForm.controls['sch_material'].setValue(event.item['name']);
        }

        const val = this.listSltdPaCode;
    }

    onSelectListSize(event: TypeaheadMatch): void {
        if (event.item['set_value'] == '') {
            this.searchForm.controls['sch_size'].setValue('');
        } else {
            this.searchForm.controls['sch_size'].setValue(event.item['set_value']);
        }

    }

    // updateFilterSize(event) {
    //     const val = event.target.value;
    //     // filter data
    //     let tempArr = this.temp.map(x => Object.assign({}, x));
    //     let temp = tempArr.filter(function (d) {
    //         return d.size.indexOf(val) !== -1 || !val;
    //     });

    //     this.rows = temp;
    // }

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
            worksheet.getColumn(3).width = 15;
            worksheet.getColumn(4).width = 25;
            worksheet.getColumn(5).width = 12;
            worksheet.getColumn(6).width = 12;
            worksheet.getColumn(7).width = 12;
            worksheet.getColumn(8).width = 12;
            worksheet.getColumn(9).width = 12;

            const header = ["일자", "자재명", "규격", "거래처", "전기이월수량", "입고수량", "투입수량", "기타반출수량", "재고수량"];
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
                jsonValueToArray.push(d.name);
                jsonValueToArray.push(d.size);
                jsonValueToArray.push(d.partner_name);
                jsonValueToArray.push(d.transfer_qty);
                jsonValueToArray.push(d.receiving_qty);
                jsonValueToArray.push(d.insert_qty);
                jsonValueToArray.push(d.output_qty);
                jsonValueToArray.push(d.remain_qty);

                let row = worksheet.addRow(jsonValueToArray);
                row.font = this.globals.bodyFontStyle as Font;
                row.getCell(1).alignment = { horizontal: "center" };
                row.getCell(4).alignment = { horizontal: "right" };
                row.getCell(5).alignment = { horizontal: "right" };
                row.getCell(6).alignment = { horizontal: "right" };
                row.getCell(7).alignment = { horizontal: "right" };
                row.getCell(8).alignment = { horizontal: "right" };
                row.getCell(9).alignment = { horizontal: "right" };
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
