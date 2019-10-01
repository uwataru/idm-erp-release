import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { request } from 'request';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { MoldMakingService } from './mold-making.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './mold-making.item';
declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './mold-making.component.html',
  styleUrls: ['./mold-making.component.css'],
  providers: [MoldMakingService],
  encapsulation: ViewEncapsulation.None
})
export class MoldMakingComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    orderFormTitle: string;
    storeFormTitle: string;
    statusFormTitle: string;
    statusConfirmMsg: string;
    statusConfirmBtn: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    listData : Item[];
    formData: Item['data'];

    searchValue: string;
    filteredPartners: any[] = [];
    sch_product_name: string;
    sch_st: number;
    st: number;
    rows = [];
    temp = [];
    delId = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    orderForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type44Partners'];
    editData: Item;

    productCode: string;
    mgmtNo: string;
    prodPartnerName: string;
    repairRcvReqDate: string;

    productionLine: string;
    equipmentName: string;
    prodResultRows = [];
    productType: string;
    subDrawingNo: string;
    drawingNo: string;
    productName: string;
    material: string;
    size: number;
    cutLength: number;
    production_costs: number;
    production_limits: number;
    isOrderState: boolean = false;
    isStoreState: boolean = false;

    storeForm: FormGroup;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('OrderFormModal') orderFormModal: ModalDirective;
    @ViewChild('StoreFormModal') storeFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private sanitizer: DomSanitizer,
        private datePipe: DatePipe,
        private dataService: MoldMakingService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
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

        this.searchForm = fb.group({
            sch_product_code: ''
        });
        this.orderForm = fb.group({
            mold_id: '',
            repair_cnt: '',
            product_code: '',
            mgmt_no: '',
            mgmt_third_no: '',
            repair_partner_code: '',
            repair_partner_name: '',
            repair_order_date: '',
            production_costs: ['', Validators.required],
            repair_rcv_req_date: '',
            mold_stand_no: ''
        });
        this.storeForm = fb.group({
            mold_id: '',
            mold_code: '',
            repair_rcv_date: ['', Validators.required],
            production_costs: ['', Validators.required],
            mold_stand_no: ['', Validators.required],
            production_limits: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.panelTitle = '금형보유현황';
        this.orderFormTitle = '인하금형 발주';
        this.storeFormTitle = '인하금형 입고';
        this.uploadFormTitle = '금형 엑셀업로드';
        this.statusFormTitle = '금형 삭제';
        this.statusConfirmMsg = '선택하신 금형을 삭제하시겠습니까?';

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
        if (formData.sch_product_code == '') {
            this.messageService.add('제품코드를 입력해주세요!');
        } else {
            let params = {
                product_code: formData.sch_product_code,
                order: 'repair_order_date desc',
                maxResultCount: 10000
            }
            this.isLoadingProgress = true;
            this.dataService.GetAll(params).subscribe(
                listData =>
                {
                    this.listData = listData;
                    this.temp = listData['data'];
                    this.rows = listData['data'];

                    this.isLoadingProgress = false;
                }
            );
        }
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
                importedSaveAs(res, "금형이력관리.xlsx");

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

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.orderForm.controls['prod_partner_code'].setValue(0);
        } else {
            this.orderForm.controls['prod_partner_code'].setValue(event.item.Code);
        }
    }

    loadProductInfo (event) {
        this.getProductInfo(event.target.value);
    }

    getProductInfo(productCode) {
        // 제품정보 조회
        this.dataService.GetProductInfo(productCode).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];

                    this.productionLine = this.formData.production_line;
                    this.equipmentName = this.formData.equipment_name;
                    this.orderForm.patchValue({
                        product_name: this.formData.product_name,
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        production_line: this.formData.production_line,
                        equipment_name: this.formData.equipment_name
                    });
                    this.productType = this.formData.product_type;
                    this.subDrawingNo = this.formData.sub_drawing_no;
                    this.drawingNo = this.formData.drawing_no;
                    this.productName = this.formData.product_name;
                    this.material = this.formData.material;
                    this.size = this.formData.size;
                    this.cutLength = this.formData.cut_length;
                }
            }
        );

        // 해당 제품번호로 단조 생산된 기록 조회(생산일별로 개수 조회)
        this.isLoadingProgress = true;
        this.dataService.GetProdResults(productCode).subscribe(
            result =>
            {
                this.prodResultRows = result['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];

                    this.productCode = this.formData.product_code;

                    // 발주
                    if (this.isOrderState ==  true) {

                        let mgmtThirdNo = 1;
                        if (this.formData.management_no) {
                            let mgmtNoArr = this.formData.management_no.split('-');
                            this.mgmtNo = mgmtNoArr[0] + '-' + mgmtNoArr[1];
                            mgmtThirdNo = Number(mgmtNoArr[2]) + 1;
                        }

                        this.orderForm.patchValue({
                            mold_id: this.formData.id,
                            product_code: this.formData.product_code,
                            repair_cnt: this.formData.repair_cnt,
                            mgmt_no: this.mgmtNo,
                            mgmt_third_no: mgmtThirdNo,
                            repair_partner_code: this.formData.prod_partner_code,
                            repair_partner_name: this.formData.prod_partner_name
                        });

                    }

                    // 입고
                    if (this.isStoreState ==  true) {

                        this.mgmtNo = this.formData.management_no;
                        this.prodPartnerName = this.formData.prod_partner_name;
                        this.repairRcvReqDate = this.formData.repair_rcv_req_date;

                        this.storeForm.patchValue({
                            mold_id: this.formData.id,
                            mold_code: this.formData.mold_code,
                            partner_name: this.formData.partner_name,
                            partner_code: this.formData.partner_code,
                            product_code: this.formData.product_code,
                            prod_partner_code: this.formData.prod_partner_code,
                            prod_partner_name: this.formData.prod_partner_name,
                            production_line: this.formData.production_line,
                            production_date: this.formData.production_date,
                            production_costs: this.utils.addComma(this.formData.repair_costs),
                            mold_size: this.formData.mold_size,
                            mold_material: this.formData.mold_material,
                            production_limits: this.utils.addComma(this.formData.production_limits),
                            mold_stand_no: this.formData.mold_stand_no
                        });

                    }

                    this.getProductInfo(this.formData.product_code);
                }
            }
        );
    }

    Save () {

        // 등록결과를 리스트에서 확인할 수 있도록 제품코드를 검색란 미리 입력
        this.searchForm.controls['sch_product_code'].setValue(this.productCode);

        // if (this.isEditMode == true) {
        //     this.Update(this.selectedId, formData);
        // }
        if (this.isOrderState ==  true) {
            let formData = this.orderForm.value;

            formData.production_costs = this.utils.removeComma(formData.production_costs) * 1;
            formData.repair_order_date = this.datePipe.transform(formData.repair_order_date, 'yyyy-MM-dd');
            formData.repair_rcv_req_date = this.datePipe.transform(formData.repair_rcv_req_date, 'yyyy-MM-dd');

            this.Create(formData);
        }
        if (this.isStoreState ==  true) {
            let formData = this.storeForm.value;

            formData.production_costs = this.utils.removeComma(formData.production_costs) * 1;
            formData.repair_rcv_date = this.datePipe.transform(formData.repair_rcv_date, 'yyyy-MM-dd');
            formData.production_limits = this.utils.removeComma(formData.production_limits) * 1;

            this.Store(this.selectedId, formData);
        }
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.resetOrderFormModal();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.orderFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Store (id, data): void {
        this.dataService.Store(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.resetStoreFormModal();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.storeFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    // Update (id, data): void {
    //     this.dataService.Update(id, data)
    //         .subscribe(
    //             data => {
    //                 if (data['result'] == "success") {
    //                     //this.resetModal();
    //                     this.getAll();
    //                     this.messageService.add(this.editOkMsg);
    //                 } else {
    //                     this.messageService.add(data['errorMessage']);
    //                 }
    //                 //this.closeWriteModal();
    //             },
    //             error => this.errorMessage = <any>error
    //         );
    // }

    // Delete (id): void {
    //     const formData: FormData = new FormData();
    //     formData.append('st', '-1');
    //     this.dataService.changeStatus(id, formData)
    //         .subscribe(
    //             data => {
    //                 if (data['result'] == "success") {
    //                     this.getAll();
    //                     this.messageService.add(this.delOkMsg);
    //                 } else {
    //                     this.messageService.add(data['errorMessage']);
    //                 }
    //                 this.selectedId = '';
    //                 this.selected = [];
    //                 this.closeDeleteModal();
    //             },
    //             error => this.errorMessage = <any>error
    //         );
    // }

    openModal(id, type) {
        // 실행권한
        if (this.isExecutable == true) {
            if (type == 'order') {
                this.orderFormModal.show();
            } else if (type == 'store') {
                this.storeFormModal.show();
            } else if (type == 'upload') {
                this.uploadFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.selectedId = id;
        if (type == 'order') {
            // 발주
            this.resetOrderFormModal();
            this.isOrderState = true;
            this.isStoreState = false;
        } else if (type == 'store') {
            // 입고
            this.resetStoreFormModal();
            this.isOrderState = false;
            this.isStoreState = true;
        }
        this.Edit(id);
    }

    resetOrderFormModal() {
        this.orderForm.reset();
        this.prodResultRows = [];
        this.productionLine = '';
        this.equipmentName = '';
        this.productType = '';
        this.subDrawingNo = '';
        this.drawingNo = '';
        this.productName = '';
        this.material = '';
        this.size = 0;
        this.cutLength = 0;
    }

    resetStoreFormModal() {
        this.storeForm.reset();
        this.prodResultRows = [];
    }

}
