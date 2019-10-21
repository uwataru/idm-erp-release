import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, EventEmitter, Output, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OutsourcingInOutService } from './outsourcing-in-out.service';
import { AppGlobals } from '../../../../app.globals';
import { saveAs as importedSaveAs } from "file-saver";
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './outsourcing-in-out.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './outsourcing-in-out.component.html',
    styleUrls: ['./outsourcing-in-out.component.css'],
    providers: [OutsourcingInOutService],
    encapsulation: ViewEncapsulation.None
})
export class OutsourcingInOutComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;
    inputFormTitle: string;
    isEditMode: boolean = false;
    listData : Item[ ];

    searchForm: FormGroup;

    formData: Item[];

    rcvDate = this.globals.tDate;
    rows: Item['rowData'][];
    sch_partner_name: string;
    listPartners: any = [''];

    detail_partner_name: string;
    detail_sch_sdate: string;
    detail_sch_edate: string;
    detail_order_type: string;
    detail_product_code: string;
    detail_drawing_no: string;
    detail_product_name: string;
    errorMessage: string;

    detailrows: Item['detailsData'];

    detailsums_total_order_qty: number;
    detailsums_total_rcv_qty: number;
    detailsums_total_count: number;

    totalOrderQty: number;
    totalRcvQty: number;

    messages = this.globals.datatableMessages;

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private datePipe: DatePipe,
        private dataService: OutsourcingInOutService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService
        ) {
            this.searchForm = fb.group({
                sch_sdate: '',
                sch_edate: '',
                order_type: '',
                sch_partner_name: '',
                outs_partner_code: ''
            });
        }

    ngOnInit() {
        this.panelTitle = '외주수불명세서';
        this.inputFormTitle = '외주수불내역서';

        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.searchForm.controls['order_type'].setValue('C');
        this.getAll('');

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    loadSearchPartners(code):void {


        switch (code) {
            case 'C': this.listPartners = this.globals.configs['type42Partners']; break;
            case 'F': this.listPartners = this.globals.configs['type41Partners']; break;
            case 'H': this.listPartners = this.globals.configs['type43Partners']; break;
            case 'M': this.listPartners = this.globals.configs['type44Partners']; break;
        }
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.searchForm.controls['outs_partner_code'].setValue('');
        } else {
            this.searchForm.controls['outs_partner_code'].setValue(event.item.Code);
        }
    }


    getAll(orderType): void {
        let formData = this.searchForm.value;
        if (orderType == '') {
            orderType = formData.order_type;
        }
        this.loadSearchPartners(orderType);
        if((event.target as Element).id != 'search_btn') {
            this.searchForm.controls['outs_partner_code'].setValue('');
            this.searchForm.controls['sch_partner_name'].setValue('');
        }

        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            order_type: orderType,
            partner_code:  this.searchForm.controls['outs_partner_code'].value,
            sortby: ['rcv_date'],
            order: ['asc'],
            maxResultCount: 10000
        }

        let tmpEL = document.getElementById("order_type_text") as HTMLInputElement;
        switch (orderType) {
           case 'F': tmpEL.value ="단조"; break;
           case 'C': tmpEL.value ="절단"; break;
           case 'H': tmpEL.value ="열처리"; break;
           case 'M': tmpEL.value ="가공"; break;
        }

        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                this.totalOrderQty = listData['totalOrderQty'];
                this.totalRcvQty = listData['totalRcvQty'];

                this.isLoadingProgress = false;
            }
        );


    }

    excelDown() {
        let path = this.elSrv.path;
        let app = this.elSrv.remote.app;
        //let dialog = this.electronService.remote.dialog;
        //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
        //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "외주수불명세서.xlsx");

                let win = this.elSrv.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {
                    // Set the save path, making Electron not to prompt a save dialog.
                    //item.setSavePath('d:\project\원자재마스터.xlsx')
                    //item.setSavePath('d:\\project\\원자재마스터.xlsx');

                    const filename = item.getFilename();

                    item.on('updated', (event, state) => {
                        if (state === 'interrupted') {
                            console.log('Download is interrupted but can be resumed')
                        } else if (state === 'progressing') {
                            if (item.isPaused()) {
                                console.log('Download is paused')
                            } else {
                                console.log(`Received bytes: ${item.getReceivedBytes()}`)
                            }
                        }
                    })
                    item.once('done', (event, state) => {
                        if (state === 'completed') {
                            console.log(filename + ' 저장 완료');
                        } else {
                            alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
                            console.log(`Download failed: ${state}`)
                        }
                    })
                });
            },
            error => this.errorMessage = <any>error
        );
        //}
    }

    openModal(id) {
        let formData = this.searchForm.value;

        let findRow: Item['rowData'];
        for (var i = 0; i<this.rows.length; i++ ){
            if(this.rows[i].id == id){
              findRow = this.rows[i];
            }
        }


        let params = {

            id: id,
            //sch_prdline: formData.production_line,
            order_type: formData.order_type,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            product_code: findRow.product_code,
            drawing_no: findRow.drawing_no,
            partner_code: findRow.partner_code,
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;

        this.dataService.GetDetails(params).subscribe(
            data =>
            {
                this.detailrows = data['data'];

                this.detailsums_total_order_qty= data['totalOrderQty'];
                this.detailsums_total_rcv_qty = data['totalRcvQty'];
                this.detailsums_total_count = data['totalCount'];

                this.isLoadingProgress = false;
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 250);
            }
            );

            this.detail_order_type = this.searchForm.controls['order_type'].value;
            this.detail_partner_name = findRow.partner_name;
            this.detail_sch_sdate = this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd');
            this.detail_sch_edate = this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd');
            this.detail_product_code = findRow.product_code;
            this.detail_drawing_no = findRow.drawing_no;
            this.detail_product_name = findRow.product_name;

            switch (this.detail_order_type) {
                case 'C': this.detail_order_type = '절단'; break;
                case 'F': this.detail_order_type = '단조'; break;
                case 'H': this.detail_order_type = '열처리'; break;
                case 'M': this.detail_order_type = '가공'; break;
            }

    }
}
