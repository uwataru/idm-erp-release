import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ScreeningService } from './screening.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './screening.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './screening.component.html',
    styleUrls: ['./screening.component.css'],
    providers: [ScreeningService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class ScreeningComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;
    selectedCnt: number;
    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    rows = [];
    materialRows = [];
    delId = [];
    selected = [];
    selectedRcvItems = [];
    usedRcvItems: string;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    productionQty: number;
    screeningQty: number;
    defectiveClassification: any[] = this.globals.configs['defectiveClassification'];
    totalWeight: number;
    cutting_total: number;
    product_price: number;
    isTmpPrice: boolean;
    order_qty: number;
    cutting_qty: number;
    input_weight: number;
    input_weight_total: number;
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    noScreeningOkMsg = '무선별 처리되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('NoScreeningModal') noScreeningModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: ScreeningService,
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
            sch_sdate: '',
            sch_edate: ''
        });
        this.inputForm = fb.group({
            forging_id: ['', Validators.required],
            input_date: ['', Validators.required],
            worker_name: ['', Validators.required],
            working_time: '',
            working_stime: '',
            working_etime: '',
            poc_no: ['', Validators.required],
            product_code: ['', Validators.required],
            product_name: ['', Validators.required],
            screening_qty: ['', Validators.required],
            defective_qty: '',
            defective_classification: '',
            regenerative_qty: '',
            regenerative_details: '',
            st: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '단조(선별전)재고 현황';
        this.inputFormTitle = '선별작업입력';

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
        let params = {}
        // let params = {
        //     partner_code: this.listSltdPaCode,
        //     sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
        //     sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd')
        // }
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

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        const val = this.listSltdPaCode;

        this.getAll();
    }

    Save () {
        let formData = this.inputForm.value;

        formData.screening_qty = this.utils.removeComma(formData.screening_qty) * 1;
        formData.defective_qty = this.utils.removeComma(formData.defective_qty) * 1;
        formData.regenerative_qty = this.utils.removeComma(formData.regenerative_qty) * 1;

        this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        console.log('sucessss==============');
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

    NoScreening (id): void {
        const formData: FormData = new FormData();
        this.dataService.NoScreening(id)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.noScreeningOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.selectedId = '';
                    this.selected = [];
                    this.noScreeningModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'Screening') {
                this.inputFormModal.show();
            } else if (method == 'noScreening') {
                this.noScreeningModal.show();
            } else if (method == 'upload') {
                this.uploadFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let idArr = [];
        this.selected.forEach((e:any) => {
            idArr.push(e.id);
        });

        switch (method) {

            case 'upload':
            break;

            case 'noScreening':
                this.selectedId = idArr.join(',');
                console.log(this.selectedId);

            break;

            case 'Screening':
                console.log(idArr.length);
                // 입력폼 리셋
                this.inputForm.reset();

                // 단조작업실적 내용
                this.dataService.GetById(this.selectedId).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            this.editData = editData;
                            this.formData = editData['data'];

                            this.productionQty = this.formData.production_qty * 1;
                            this.screeningQty = editData['screeningQty'] * 1;

                            // let order_cutting_qty = this.formData.order_qty * 1;
                            // let order_input_weight = this.formData.input_weight * 1;
                            // let order_input_weight_total = Math.round(order_cutting_qty * order_input_weight * 10) * 0.1;
                            this.inputForm.patchValue({
                                forging_id: this.formData.id,
                                input_date: this.tDate,
                                poc_no: this.formData.poc_no,
                                product_code: this.formData.product_code,
                                product_name: this.formData.product_name,
                                screening_qty: this.utils.addComma(this.productionQty - this.screeningQty)
                            });
                        }
                    }
                );
            break;

        }

    }

    onSelect({ selected }) {
        this.selectedCnt = selected.length;
        if (this.selectedCnt == 1) {
            this.selectedId = selected[0].id;
        }
    }

    excelDown() {
        let path = this.electronService.path;
        let app = this.electronService.remote.app;

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "단조(선별전)재고 현황.xlsx");

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
                    this.isLoadingProgress = false;
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
