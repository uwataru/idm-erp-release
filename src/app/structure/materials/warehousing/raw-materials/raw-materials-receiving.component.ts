import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation  } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { RawMaterialsReceivingService } from './raw-materials-receiving.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './raw-materials-receiving.item';
import { AngularElectronPage } from '../../../../../../e2e/app.po';
import { element } from 'protractor';
import { elementClassNamed } from '@angular/core/src/render3/instructions';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './raw-materials-receiving.component.html',
    styleUrls: ['./raw-materials-receiving.component.css'],
    providers: [RawMaterialsReceivingService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialsReceivingComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    statusFormTitle: string;
    statusConfirmMsg: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type41Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_product_name: string;
    sch_st: number;
    st: number;
    rows = [];
    delId = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type41Partners'];
    storagePartners: any[] = this.globals.configs['type42Partners'];
    inputMakers: any[] = this.globals.configs['maker'];
    rcv_weight: number;
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        private electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: RawMaterialsReceivingService,
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
            sch_partner_name: '',
            sch_product_name: ''
        });
        this.inputForm = fb.group({
            order_id: ['', Validators.required],
            material_code: ['', Validators.required],
            rcv_date: ['', Validators.required],
            partner_name: ['', Validators.required],
            partner_code: ['', Validators.required],
            result_type: ['', Validators.required],
            steel_maker_name: ['', Validators.required],
            steel_maker: ['', Validators.required],
            is_report: '',
            is_mealsheet: '',
            materials: ['', Validators.required],
            ms_no: ['', Validators.required],
            size: ['', Validators.required],
            rcv_weight: ['', Validators.required],
            price_per_unit: ['', Validators.required],
            storage: ['', Validators.required],
            order_amount: ['', Validators.required]
        });


        if( this.storagePartners.filter(v => v.Code == 0).length < 1 ) {
            this.storagePartners.unshift({Code:0, Name:'자가', Alias:'자가'});
        }
    }

    ngOnInit() {
        this.panelTitle = '원자재발주현황';
        this.inputFormTitle = '원자재입고처리';
        this.uploadFormTitle = '원자재 재고 엑셀업로드';

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
            partner_name: formData.sch_partner_name,
            product_name: formData.sch_product_name,
            st: 0,
            sortby: ['material_code'],
            order: ['asc'],
            maxResultCount: 10000
        }
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    onSelectStoragePartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['storage'].setValue("");
        } else {
            this.inputForm.controls['storage'].setValue(event.item.Name);
        }
    }

    onSelectInputMaker(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['maker_code'].setValue(0);
        } else {
            this.inputForm.controls['maker_code'].setValue(event.item.CfgCode);
        }
    }

    CalculOrderAmount (event): void {
        let formData = this.inputForm.value;
        let f = event.target.id.replace('order_weight', 'order_amount');
        let q = this.utils.removeComma(event.target.value) * 1;
        let p = this.utils.removeComma(formData.price_per_unit) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls['order_amount'].setValue(dp);
    }

    Save () {
        let formData = this.inputForm.value;

        formData.price_per_unit = this.utils.removeComma(formData.price_per_unit) * 1;
        formData.rcv_weight = this.utils.removeComma(formData.rcv_weight) * 1;
        formData.order_amount = this.utils.removeComma(formData.order_amount) * 1;

        formData.rcv_date = this.datePipe.transform(formData.rcv_date, 'yyyy-MM-dd');

        this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }


    getRowClass(row) {

        let rt = '';
        if(row.is_sum_row == 'Y') {
            rt = 'row-color';
        } else if(row.is_all_sum_row == 'Y') {
            rt = 'all-row-color';
        }
        return rt; 
     }


    deleteOrder(id) {
        const formData: FormData = new FormData();
        this.dataService.Delete(id, formData) 
        .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.getAll();
                    this.messageService.add(this.delOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.selectedId = '';
                this.statusFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }

    openModal(method) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'receiving') {
                this.inputFormModal.show();
            } else if (method == 'upload') {
                this.uploadFormModal.show();
            } else if (method == 'delete') {

                //입고가 있으면 리턴
                this.dataService.GetInventory(this.selectedId).subscribe(
                    inventoryData =>
                    {
                        if(inventoryData['data'] && Object.keys(inventoryData['data']).length > 0) {
                            this.messageService.add('입고처리된 데이터가 존재하여 삭제할수 없습니다.');
                            return false;   
                        } else {
                            this.isLoadingProgress = false;
                            this.statusFormModal.show();
                        }
                    }
                );
                
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if (method == 'upload') {

        } else if(method == 'delete') {
            this.statusFormTitle = '발주 삭제';
            this.statusConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
        } else {

            // 입력폼 리셋
            this.inputForm.reset();

            // 주문 ID
            this.inputForm.controls['order_id'].setValue(this.selectedId);

            // 입력일
            this.inputForm.controls['rcv_date'].setValue(this.tDate);

            // 입고구분
            this.inputForm.controls['result_type'].setValue('RCV');

            // 단조품정보
            this.dataService.GetById(this.selectedId).subscribe(
                editData =>
                {
                    if (editData['result'] == "success") {
                        this.editData = editData;
                        this.formData = editData['data'];

                        let price_per_unit = this.utils.addComma(this.formData.price_per_unit);
                        let order_amount = this.utils.addComma(this.formData.order_amount);
                        this.inputForm.patchValue({
                            material_code: this.formData.material_code,
                            partner_code: this.formData.partner_code,
                            partner_name: this.formData.partner_name,
                            steel_maker_name: editData['makerName'],
                            steel_maker: this.formData.material_maker,
                            materials: this.formData.material_name,
                            size: this.formData.material_size,
                            rcv_weight: this.formData.order_weight,
                            price_per_unit: price_per_unit,
                            storage: this.formData.rcv_location,
                            order_amount: order_amount,
                        });
                    }
                }
            );

        }

    }

    onSelect({ selected }) {
        if(selected.length > 0) {
            this.selectedId = selected[0].id;       
        } else {
            this.selectedId = "";
        }        
    }

    checkSelect(event) {
        return event.id > 0 ? true : false;
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
                importedSaveAs(res, "원자재재고현황.xlsx");

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
                            this.uploadFormModal.hide();
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

    fileSelected (event) {
        let fileList: FileList = event.target.files;
        if(fileList.length > 0) {
            let file: File = fileList[0];
            let formData:FormData = new FormData();
            formData.append('uploadFile', file, file.name);

            this.excelUpload(formData);
        }
    }

    excelUpload (data): void {
        this.isLoadingProgress = true;
        this.dataService.UploadExcelFile(data).subscribe(
            data => {
                if (data['result'] == "success") {
                    this.inputForm.reset();
                    this.getAll();
                    this.messageService.add(this.editOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.uploadFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }
}
