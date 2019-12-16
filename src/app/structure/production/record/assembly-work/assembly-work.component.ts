import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { AssemblyWorkService } from './assembly-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { saveAs as importedSaveAs } from "file-saver";
import { Item } from './assembly-work.item';
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../../providers/electron.service";
import { ModalDirective } from 'ngx-bootstrap/modal';
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

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
    gridHeight = this.globals.gridHeight - 45;

    searchForm: FormGroup;

    formData: Item['rowData'];
    sch_partner_name: string;
    listPartners: any[] = this.globals.configs['type5Partners'];
    productionLines: any[] = this.globals.configs['productionLine'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];

    rows: Item['rowData'];

    sums_prev_assembly_qty: number;
    sums_assembly_qty: number;
    sums_forwarding_weight: number;
    sums_defective_qty: number;
    sums_loss_qty: number;
    sums_lucre_qty: number;
    sums_inventory_qty: number;

    detailsTitle: string;

    detail_product_code: string;
    detail_product_name: string;
    detail_partner_name: string;
    detail_sch_sdate: string;
    detail_sch_edate: string;

    detailrows: Item['rowData'];

    detailsums_assembly_qty: number;
    detailsums_forwarding_weight: number;
    detailsums_defective_qty: number;
    detailsums_loss_qty: number;
    detailsums_lucre_qty: number;
    detailsums_inventory_qty: number;

    messages = this.globals.datatableMessages;

    errorMessage: string;

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
            sch_partner_name: '',
            production_line: '',
            sch_sdate: '',
            sch_edate: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '조립수불명세서';
        this.detailsTitle = '조립수불내역서';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
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
            partner_code: formData.sch_partner_name,
            sch_prdline: formData.production_line,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['input_date'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            data =>
            {
                this.rows = data['rowData'];

                this.sums_prev_assembly_qty = data['sumData']['prev_assembly_qty'];
                this.sums_assembly_qty = data['sumData']['assembly_qty'];
                this.sums_forwarding_weight = data['sumData']['forwarding_weight'];
                this.sums_defective_qty = data['sumData']['defective_qty'];
                this.sums_loss_qty = data['sumData']['loss_qty'];
                this.sums_lucre_qty = data['sumData']['lucre_qty'];
                this.sums_inventory_qty = data['sumData']['inventory_qty'];

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

    openModal(poc_no) {

        // 검색폼 리셋
        // this.inputForm.reset();

        // POC No로 내역 조회
        let formData = this.searchForm.value;
        let params = {
            poc_no: poc_no,
            //sch_prdline: formData.production_line,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['input_date'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        this.dataService.GetDetails(params).subscribe(
            data =>
            {
                this.detail_product_code = data['viewData']['product_code'];
                this.detail_product_name = data['viewData']['product_name'];
                this.detail_partner_name = data['viewData']['partner_name'];
                this.detail_sch_sdate = data['viewData']['sch_sdate'];
                this.detail_sch_edate = data['viewData']['sch_edate'];

                this.detailrows = data['rowData'];

                this.detailsums_assembly_qty = data['sumData']['assembly_qty'];
                this.detailsums_forwarding_weight = data['sumData']['forwarding_weight'];
                this.detailsums_defective_qty = data['sumData']['defective_qty'];
                this.detailsums_loss_qty = data['sumData']['loss_qty'];
                this.detailsums_lucre_qty = data['sumData']['lucre_qty'];
                this.detailsums_inventory_qty = data['sumData']['inventory_qty'];

                this.isLoadingProgress = false;
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 250);
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
