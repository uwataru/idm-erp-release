import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { SalesSlipsService } from './sales-slips.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './sales-slips.item';
import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import { AppConfig } from '../../../../../environments/environment';
import {saveAs as importedSaveAs} from "file-saver";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './sales-slips.component.html',
    styleUrls: ['./sales-slips.component.css'],
    providers: [SalesSlipsService],
    encapsulation: ViewEncapsulation.None
})
export class SalesSlipsComponent implements OnInit {
    gridHeight = this.globals.gridHeight;
    panelTitle: string;
    inputFormTitle: string;
    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];

    rcvDate = this.globals.tDate;
    sch_partner_name: string;
    isLoadingProgress: boolean = false;
    listPartners: any[] = this.globals.configs['partnerList'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    rows: Item[];
    totalQty: number;
    totalSalesPrice: number;
    temp = [];
    selected = [];
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    drAcctCode: string;
    crAcctCode: string;
    resultRows = Item['data'];
    slipNo: string;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '저장되었습니다.';

    @ViewChild('PrintResultsModal') printResultsModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: SalesSlipsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
            if (route.routeConfig.data.id in this.globals.userPermission) {
                console.log(route.routeConfig.data.id);
                if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
                    this.isExecutable = true;
                }
                if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
                    this.isPrintable = true;
                }
            }
        }

        this.searchForm = fb.group({
            rcv_date: '',
            sch_partner_name: '',
            slip_no: ''
        });

        this.inputForm = fb.group({
            dr_acct_name: ['', [Validators.required]],
            cr_acct_name: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '판매전표처리';
        this.searchForm.controls['rcv_date'].setValue(this.rcvDate);
        this.GetAll();

        // 차변계정
        this.inputForm.controls['dr_acct_name'].setValue('외상매출금');
        this.drAcctCode = '111032';

        // 대변계정
        this.inputForm.controls['cr_acct_name'].setValue('매출액(제)');
        this.crAcctCode = '410011';

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    onValueChange(value: Date): void {
        this.rcvDate = this.datePipe.transform(value, 'yyyy-MM-dd');
        this.GetAll();
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            sch_sdate: this.rcvDate,
            // sch_edate: this.rcvDate,
            // sortby: ['product_code'],
            // order: ['asc'],
            maxResultCount: 1000
        };
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        this.dataService.GetSalesCompletionAll(params).subscribe(
            listData =>
            {
                this.listData = listData;

                this.temp = [];
                this.rows = [];
                for(let i in listData['data']){
                    listData['data'][i].sales_price = listData['data'][i].qty * listData['data'][i].product_price;
                }
                this.temp = listData['data'];
                this.rows = listData['data'];
                // this.totalQty = listData['sumData']['total_qty'];
                // this.totalSalesPrice = listData['sumData']['total_sales_price'];

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['name'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['name'];
        }

        this.GetAll();
    }

    onSelect({ selected }) {
        console.log('Select Event', selected, this.selected);

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    onSelectAccounts(event: TypeaheadMatch, drcr): void {
        if (event.item['AcctCode'] == '') {
            this.drAcctCode = '';
            this.crAcctCode = '';
        } else {
            if (drcr == 'dr') {
                this.drAcctCode = event.item['AcctCode'];
            } else {
                this.crAcctCode = event.item['AcctCode'];
            }
        }
    }

    Save() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let checkedIdArr = [];
        this.selected.forEach((e:any) => {
            checkedIdArr.push(e.id);
        });
        let params = {
            'checked_id': checkedIdArr.join(','),
            // 'grp_no': '800',
            // 'rcv_date': this.rcvDate,
            // 'dr_acct_code': this.drAcctCode,
            // 'cr_acct_code': this.crAcctCode
        };
        this.dataService.Save(params)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.searchForm.controls['slip_no'].setValue(data['slipNo']);
                        //this.inputForm.reset();
                        this.selected = [];

                        // 전표 출력
                        this.openResultModal(data['slipNo']);

                        this.GetAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    // this.closeWriteModal();
                },
                error => this.errorMessage = <any>error
            );
    }

    private openResultModal(slipNo): void {
        this.dataService.GetSlip(slipNo).subscribe(
            data =>
            {
                if (data['data'].length > 0) {
                    this.resultRows = data['data'];
                    this.slipNo = data['slip_no'];
                    this.printResultsModal.show();
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

            worksheet.getColumn(1).width = 25;
            worksheet.getColumn(2).width = 25;
            worksheet.getColumn(3).width = 8;
            worksheet.getColumn(4).width = 10;
            worksheet.getColumn(5).width = 12;
            worksheet.getColumn(6).width = 15;
            worksheet.getColumn(7).width = 12;
            worksheet.getColumn(8).width = 12;

            const header = ["거래처", "제품명", "수량", "단가", "금액", "수주번호", "납품일", "판매일"];
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
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.product_name);
                    jsonValueToArray.push(d.qty);
                    jsonValueToArray.push(d.product_price);
                    jsonValueToArray.push(d.sales_price);
                    jsonValueToArray.push(d.order_no);
                    jsonValueToArray.push(d.delivery_date);
                    jsonValueToArray.push(d.sales_date);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(6).alignment = {horizontal: "center"};
                    row.getCell(7).alignment = {horizontal: "center"};
                    row.getCell(8).alignment = {horizontal: "center"};
                    row.getCell(3).alignment = {horizontal: "right"};
                    row.getCell(4).alignment = {horizontal: "right"};
                    row.getCell(5).alignment = {horizontal: "right"};
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
