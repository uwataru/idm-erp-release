import { Component, Inject, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ForgingWorkService } from './forging-work.service';
import { AppGlobals } from '../../../../app.globals';
import { saveAs as importedSaveAs } from "file-saver";
import { UtilsService } from '../../../../utils.service';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { MessageService } from '../../../../message.service';
import { Item } from './forging-work.item';
import {ElectronService} from "../../../../providers/electron.service";
declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './forging-work.component.html',
  styleUrls: ['./forging-work.component.scss'],
  providers: [ForgingWorkService, DatePipe]
})
export class ForgingWorkComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['rowData'];
    sch_partner_name: string;
    listPartners: any[] = this.globals.configs['type5Partners'];
    productionLines: any[] = this.globals.configs['productionLine'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];

    rows: Item['rowData'];

    sums_prev_production_qty: number;
    sums_production_qty: number;
    sums_forwarding_weight: number;
    sums_forging_qty: number;
    sums_defective_qty: number;
    sums_loss_qty: number;
    sums_lucre_qty: number;
    sums_inventory_qty: number;

    detailsTitle: string;

    detail_product_code: string;
    detail_product_name: string;
    detail_drawing_no: string;
    detail_partner_name: string;
    detail_sch_sdate: string;
    detail_sch_edate: string;

    detailrows: Item['rowData'];

    detailsums_production_qty: number;
    detailsums_forwarding_weight: number;
    detailsums_outsourcing_rcv_qty: number;
    detailsums_outsourcing_order_qty: number;
    detailsums_defective_qty: number;
    detailsums_screening_qty: number;
    detailsums_screening_defect_qty: number;
    detailsums_loss_qty: number;
    detailsums_lucre_qty: number;
    detailsums_inventory_qty: number;

    messages = this.globals.datatableMessages;

    errorMessage: string;
    
    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: ForgingWorkService,
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
        this.panelTitle = '단조수불명세서';
        this.detailsTitle = '단조수불내역서'
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

                this.sums_prev_production_qty = data['sumData']['prev_production_qty'];
                this.sums_production_qty = data['sumData']['production_qty'];
                this.sums_forwarding_weight = data['sumData']['forwarding_weight'];
                this.sums_forging_qty = data['sumData']['forging_qty'];
                this.sums_defective_qty = data['sumData']['defective_qty'];
                this.sums_loss_qty = data['sumData']['loss_qty'];
                this.sums_lucre_qty = data['sumData']['lucre_qty'];
                this.sums_inventory_qty = data['sumData']['inventory_qty'];

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
                importedSaveAs(res, "단조수불명세서.xlsx");

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
                this.detail_drawing_no = data['viewData']['drawing_no'];
                this.detail_partner_name = data['viewData']['partner_name'];
                this.detail_sch_sdate = data['viewData']['sch_sdate'];
                this.detail_sch_edate = data['viewData']['sch_edate'];

                this.detailrows = data['rowData'];

                this.detailsums_production_qty = data['sumData']['production_qty'];
                this.detailsums_forwarding_weight = data['sumData']['forwarding_weight'];
                this.detailsums_outsourcing_rcv_qty = data['sumData']['outsourcing_rcv_qty'];
                this.detailsums_outsourcing_order_qty = data['sumData']['outsourcing_order_qty'];
                this.detailsums_screening_qty = data['sumData']['screening_qty'];
                this.detailsums_screening_defect_qty = data['sumData']['screening_defect_qty'];
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
}
