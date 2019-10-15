import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { CuttingWorkService } from './cutting-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { saveAs as importedSaveAs } from "file-saver";
import { Item } from './cutting-work.item';
import {ElectronService} from "../../../../providers/electron.service";
import { ModalDirective } from 'ngx-bootstrap/modal';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './cutting-work.component.html',
    styleUrls: ['./cutting-work.component.scss'],
    providers: [CuttingWorkService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class CuttingWorkComponent implements OnInit {
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

    sums_prev_cutting_qty: number;
    sums_cutting_qty: number;
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

    detailsums_cutting_qty: number;
    detailsums_forwarding_weight: number;
    detailsums_forging_qty: number;
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
        private dataService: CuttingWorkService,
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

                this.sums_prev_cutting_qty = data['sumData']['prev_cutting_qty'];
                this.sums_cutting_qty = data['sumData']['cutting_qty'];
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
                importedSaveAs(res, "절단수불명세서.xlsx");

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

                this.detailsums_cutting_qty = data['sumData']['cutting_qty'];
                this.detailsums_forwarding_weight = data['sumData']['forwarding_weight'];
                this.detailsums_forging_qty = data['sumData']['forging_qty'];
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
}
