import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ChangeToReadyStateService } from './change-to-ready-state.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { saveAs as importedSaveAs } from "file-saver";
import { UtilsService } from '../../../../utils.service';
import { WindowRefService } from '../../../../structure/shared/popup/window-ref.service';
import { MessageService } from '../../../../message.service';
import { Item, moldItem } from './change-to-ready-state.item';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './change-to-ready-state.component.html',
  styleUrls: ['./change-to-ready-state.component.css'],
  providers: [ChangeToReadyStateService, DatePipe, WindowRefService],
  encapsulation: ViewEncapsulation.None
})
export class ChangeToReadyStateComponent implements OnInit {
    tDate = this.globals.tDate;
    nativeWindow: any;
    panelTitle: string = '금형준비작업';
    moldSelectTitle: string = '금형준비완료입력';
    orderConfirmMsg: string;
    orderType: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];
    totalQuantity: number;
    totalSalesPrice: number;
    isInitPlanDate: boolean = false;
    selectedId: number;

    pocNo: string;
    subDrawingNo: string;
    productCode: string;
    productName: string;
    moldData: moldItem[];
    moldRows = [];
    selected = [];
    selectedMoldCode: string;

    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('OrderConfirmClose') OrderConfirmClose: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private datePipe: DatePipe,
        private dataService: ChangeToReadyStateService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private winRef: WindowRefService,
        private utils: UtilsService,
        private messageService: MessageService
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

        this.nativeWindow = winRef.getNativeWindow();

        this.searchForm = fb.group({
            start_date: '',
            end_date: '',
            sch_prdline: ''
        });
    }

    ngOnInit() {
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
            sch_edate: this.datePipe.transform(formData.end_date, 'yyyy-MM-dd'),
            sch_prdline: formData.sch_prdline,
            //sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sortby: ['seq_no'],
            order: ['asc']
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                //this.totalQty = listData['sumData']['total_qty'];

                this.isLoadingProgress = false;
                if (this.isInitPlanDate == false) {
                    this.isInitPlanDate = true;
                }
            }
        );
    }

    excelDown() {
        let path = this.electronService.path;
        let app = this.electronService.remote.app;
        //let dialog = this.electronService.remote.dialog;
        //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
        //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "금형준비작업.xlsx");

                let win = this.electronService.remote.getCurrentWindow();

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

    onSelect({ selected }) {
        this.selectedMoldCode = selected[0].mold_code;
    }

    openModal(val) {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }
        let _arr = val.split('::');
        this.selectedId = _arr[0] * 1;
        let pocNo = _arr[1];
        let productCode = _arr[2];

        

        // 제품정보 조회
        this.dataService.GetProductInfo(productCode).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.formData = editData['data'];

                    this.pocNo = pocNo;
                    this.subDrawingNo = this.formData.drawing_no;
                    this.productCode = productCode;
                    this.productName = this.formData.product_name;
                    this.inputFormModal.show();
                }
            }
        );

        // 해당제품의 금형리스트 조회
        let params = {
            product_code: productCode,
            order: 'rcv_date desc, production_date desc',
            maxResultCount: 1000
        }
        this.isLoadingProgress = true;
        this.dataService.GetMoldInfo(params).subscribe(
            moldData =>
            {
                console.log(moldData);
                this.moldData = moldData;
                this.moldRows = moldData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    Save (): void {
        const selectMoldData: FormData = new FormData();
        selectMoldData.append('mold_code', this.selectedMoldCode);

        this.dataService.SelectMold(this.selectedId, selectMoldData)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

}
