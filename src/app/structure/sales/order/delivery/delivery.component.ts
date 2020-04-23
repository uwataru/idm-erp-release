import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DeliveryService } from './delivery.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './delivery.item';
import { ElectronService, EXPORT_EXCEL_MODE } from "../../../../providers/electron.service";
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";
import { saveAs as importedSaveAs } from "file-saver";
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
    selector: 'app-page',
    templateUrl: './delivery.component.html',
    styleUrls: ['./delivery.component.css'],
    providers: [DeliveryService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class DeliveryComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    printForm: FormGroup;

    listData: Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['partnerList'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    TotalSalesPrice: number;
    rows = [];
    prints = [];
    printMessageTop: string;
    printMessageFoot: string;
    selected = [];

    // addOkMsg = '완료되었습니다';



    messages = this.globals.datatableMessages;

    errorMessage: string;

    gridHeight = this.globals.gridHeight;

    @ViewChild('salesCompletionClose') salesCompletionClose: ElementRef;
    @ViewChild('changeStatusClose') changeStatusClose: ElementRef;
    @ViewChild('hideFormClose') hideFormClose: ElementRef;
    @ViewChild('uploadFormClose') uploadFormClose: ElementRef;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;
    @ViewChild('PrintFormModal') printFormModal: ModalDirective;

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: DeliveryService,
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
        this.panelTitle = '납품명세서';
        this.printMessageTop = "<공급 받는 자 보관용>";
        this.printMessageFoot = "<공급자 보관용>";
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
        this.getPaList();
        this.TotalSalesPrice = 0;
    }

    getAll(): void {
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

        setTimeout(() => {
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
                listData => {
                    this.listData = listData;
                    this.rows = listData['data'];

                    for (let i = 0; i < this.rows.length; i++) {
                        listData['data'][i].sales_price = listData['data'][i].qty * listData['data'][i].product_price;
                        this.TotalSalesPrice += listData['data'][i].sales_price;
                    }
                    console.log(this.TotalSalesPrice);
                    this.isLoadingProgress = false;
                }
            );
        }, 10);
    }

    getPaList() {
        this.dataService.GetPaList().subscribe(
            data => {
                this.listPartners = data['data'];
            }
        )
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        this.searchForm.controls['sch_partner_name'].setValue(event.item['name']);
        this.getAll();
    }
    print(){
        let statment_id ='';
        for(let i=0; i<this.selected.length; i++){
            if(i == 0){
                statment_id += this.selected[i].id;
            }else{
                statment_id += ','+this.selected[i].id;
            }
        }
        let data = {
            id: statment_id
        }
        this.Create(data);
        console.log('statement',this.selected, statment_id);
        
        this.printFormModal.show();
    }

    onSelect({ selected }) {
        console.log('Select Event', selected, this.selected);

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    statement(){

        this.elSrv.readyPrint('print-target-delivery-modal', '', '');
    }
    
    Create(data){
        this.dataService.statement(data).subscribe(data =>{
            if (data['result'] == "success") {
                this.prints = data['data'];
                console.log('PrintData',this.prints);
                let cnt = 0;
                for(let j = 0; j<=this.prints.length-1; j++){
                    console.log(this.prints[cnt],"CNT");
                    if(this.prints[j].item.length<10){
                        let item = 10-this.prints[j]['item'].length;
                        for(let i=this.prints[j]['item'].length; i<10; i++){
                            console.log(i);
                            this.prints[j]['item'][i] = '';
                        }
                    }
                    cnt++;
                }
                
                this.getAll();
                // this.messageService.add(this.addOkMsg);
            } else {
                this.messageService.add(data['errorMessage']);
            }
            // this.printFormModal.hide();
        })
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
            worksheet.getColumn(6).width = 10;
            worksheet.getColumn(7).width = 12;

            const header = ["납품일자", "거래처", "제품명", "수주번호", "납품수량", "단가", "금액"];
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
                jsonValueToArray.push(d.product_price);
                jsonValueToArray.push(d.sales_price);

                let row = worksheet.addRow(jsonValueToArray);
                row.font = this.globals.bodyFontStyle as Font;
                row.getCell(1).alignment = { horizontal: "center" };
                row.getCell(4).alignment = { horizontal: "center" };
                row.getCell(5).alignment = { horizontal: "right" };
                row.getCell(7).alignment = { horizontal: "right" };
                row.getCell(8).alignment = { horizontal: "right" };
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

}
