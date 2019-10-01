import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { request } from 'request';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { MoldStorageService } from './mold-storage.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './mold-storage.item';
declare var $: any;


@Component({
  selector: 'app-page',
  templateUrl: './mold-storage.component.html',
  styleUrls: ['./mold-storage.component.css'],
  providers: [MoldStorageService]
})
export class MoldStorageComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
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

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type44Partners'];
    editData: Item;
    productionLine: string;
    equipmentName: string;
    moldrows = [];
    productType: string;
    subDrawingNo: string;
    drawingNo: string;
    productName: string;
    material: string;
    size: number;
    cutLength: number;
    production_costs: number;
    production_limits: number;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        private electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private sanitizer: DomSanitizer,
        private datePipe: DatePipe,
        private dataService: MoldStorageService,
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
        this.inputForm = fb.group({
            product_code: ['', Validators.required],
            product_name: '',
            partner_name: ['', Validators.required],
            partner_code: '',
            production_line: '',
            equipment_name: '',
            prod_partner_name: ['', Validators.required],
            prod_partner_code: '',
            production_date: ['', Validators.required],
            production_costs: ['', Validators.required],
            mold_size: ['', Validators.required],
            mold_material: ['', Validators.required],
            production_limits: ['', Validators.required],
            mold_stand_no: ['', Validators.required],
            management_no: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.panelTitle = '금형보유현황';
        this.uploadFormTitle = '금형 엑셀업로드';
        this.statusFormTitle = '금형 폐기';
        this.statusConfirmMsg = '선택하신 금형을 폐기하시겠습니까?';

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
                product_code: formData.sch_product_code,
                //order: 'repair_order_date desc',
                order: 'product_code asc',
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
                    setTimeout(()=>{ document.getElementsByTagName('datatable-body')[0].scrollTop = 1; },0);

                }
            );
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['prod_partner_code'].setValue(0);
        } else {
            this.inputForm.controls['prod_partner_code'].setValue(event.item.Code);
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
                    this.inputForm.patchValue({
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

        // 같은 제품번호로 제작된 금형 조회. 최근 제작일 순으로 정렬
        let params = {
            product_code: productCode,
            order: 'rcv_date desc, production_date desc',
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            result =>
            {
                this.moldrows = result['data'];

                let productionDate = this.inputForm.controls['production_date'].value;
                if (productionDate != null) {
                    this.CreateManagementNo(productionDate);
                }

                if(this.isEditMode == false) {
                    this.inputForm.patchValue({
                        prod_partner_code : this.moldrows[0].prod_partner_code,
                        prod_partner_name : this.moldrows[0].prod_partner_name,
                        production_date : this.moldrows[0].production_date,
                        production_costs : this.moldrows[0].production_costs,
                        mold_size : this.moldrows[0].mold_size,
                        mold_material : this.moldrows[0].mold_material,
                        production_limits : this.moldrows[0].production_limits,
                        mold_stand_no : this.moldrows[0].mold_stand_no
                    })
                }
                this.isLoadingProgress = false;
            }
        );
    }

    onProductionDateChange(value: string): void {
        if (value != null) {
            this.CreateManagementNo(value);
        }
    }

    CreateManagementNo(d) {
        let productionDate = this.datePipe.transform(d, 'yyyy-MM-dd').substr(2).replace(/-/g,'');

        let productCode = this.inputForm.controls['product_code'].value;
        if (productCode == '' || productCode == null) {
            return false;
        }

        let mgmtNo = []
        this.moldrows.forEach((e) => {
            let n = e.management_no.split('-');
            mgmtNo.push(n[1]);
        });

        let makeOrderNo = '01';
        if (mgmtNo.length > 0) {
            let maxMgmtNo = Math.max.apply(null, mgmtNo) + 1;
            if (maxMgmtNo < 10) {
                makeOrderNo = '0' + maxMgmtNo;
            }
        }

        let managementNo = productionDate + '-' + makeOrderNo + '-0';
        this.inputForm.patchValue({management_no: managementNo});
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        partner_name: this.formData.partner_name,
                        partner_code: this.formData.partner_code,
                        product_code: this.formData.product_code,
                        prod_partner_code: this.formData.prod_partner_code,
                        prod_partner_name: this.formData.prod_partner_name,
                        production_line: this.formData.production_line,
                        production_date: this.formData.production_date,
                        production_costs: this.utils.addComma(this.formData.production_costs),
                        mold_size: this.formData.mold_size,
                        mold_material: this.formData.mold_material,
                        production_limits: this.utils.addComma(this.formData.production_limits),
                        mold_stand_no: this.formData.mold_stand_no,
                        management_no: this.formData.management_no
                    });

                    this.getProductInfo(this.formData.product_code);
                }
            }
        );
    }

    Save () {
         let formData = this.inputForm.value;

         formData.production_date = this.datePipe.transform(formData.production_date, 'yyyy-MM-dd');
         formData.production_costs = this.utils.removeComma(formData.production_costs) * 1;
         formData.production_limits = this.utils.removeComma(formData.production_limits) * 1;

         // 등록결과를 리스트에서 확인할 수 있도록 제품코드를 검색란 미리 입력
         this.searchForm.controls['sch_product_code'].setValue(formData.product_code);

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             this.Create(formData);
         }
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.resetModal();
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

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.resetModal();
                        this.getAll();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Delete (id): void {
        const formData: FormData = new FormData();
        formData.append('st', '-1');
        this.dataService.changeStatus(id, formData)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.selectedId = '';
                    this.selected = [];
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, id) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'write') {
                this.inputFormModal.show();
            } else if (method == 'delete') {
                this.deleteFormModal.show();
            } else if (method == 'upload') {
                this.uploadFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if (id) {
            if (id == 'selected') {
                let idArr = [];
                this.selected.forEach((e:any) => {
                    idArr.push(e.id);
                });
                this.selectedId = idArr.join(',');
                console.log(this.selectedId);
            } else {
                this.selectedId = id;
            }
        }
        if (method == 'write') {
            if (id) {
                this.inputFormTitle = '금형 수정';
                this.isEditMode = true;
                this.Edit(id);
            } else {
                this.inputFormTitle = '금형 등록';
                this.resetModal();
                //this.inputForm.controls['input_date'].setValue(this.tDate);
                this.isEditMode = false;
            }
        }
    }

    resetModal() {
        this.inputForm.reset();
        this.moldrows = [];
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

    excelDown() {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(blob, "금형마스터.xlsx");

                let win = this.electronService.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {

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
                    this.resetModal();
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

    onMoldSelect({selected}) {
        
        let formData = this.inputForm.value;
        this.inputForm.patchValue({
            prod_partner_code: selected[0].prod_partner_code,
            prod_partner_name: selected[0].prod_partner_name,
            production_line: selected[0].production_line,
            production_date: selected[0].production_date,
            production_costs: this.utils.addComma(selected[0].production_costs),
            mold_size: selected[0].mold_size,
            mold_material: selected[0].mold_material,
            production_limits: this.utils.addComma(selected[0].production_limits),
            mold_stand_no: selected[0].mold_stand_no,
            management_no: formData.management_no
        });
        if(this.isEditMode == true) {
            this.inputForm.patchValue({management_no: selected[0].management_no});
        }
    }

}
