import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { HeatTreatmentOutsourcingService } from './heat-treatment-outsourcing.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './heat-treatment-outsourcing.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './heat-treatment-outsourcing.component.html',
    styleUrls: ['./heat-treatment-outsourcing.component.css'],
    providers: [HeatTreatmentOutsourcingService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class HeatTreatmentOutsourcingComponent implements OnInit {
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
    usedRcvItems: string;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type43Partners'];
    inputSltdPaCode: number = 0;
    heatingProcess: any[] = this.globals.configs['heatingProcess'];
    screeningQty: number;
    totalWeight: number;
    cutting_total: number;
  assembly_total: number;
    product_price: number;
    isTmpPrice: boolean;
    order_qty: number;
    cutting_qty: number;
  assembly_qty: number;
    input_weight: number;
    input_weight_total: number;
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    noScreeningOkMsg = '무선별 처리되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: HeatTreatmentOutsourcingService,
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
            order_date: ['', Validators.required],
            rcv_req_date: ['', Validators.required],
            poc_no: ['', Validators.required],
            order_qty: ['', Validators.required],
            partner_name: ['', Validators.required],
            partner_code: ['', Validators.required],
            heat_treatment_process: '',
            heat_treatment_criteria: '',
            product_code: '',
            product_name: '',
            drawing_no: '',
            material: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '열처리대기품현황';
        this.inputFormTitle = '외주열처리 발주';

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
        this.selectedCnt = 0;
        this.selectedId = '';
        this.selected = [];

        let formData = this.searchForm.value;
        let params = {
            heat_treatment: true,
            partner_code: this.listSltdPaCode,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd')
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

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        const val = this.listSltdPaCode;

        this.getAll();
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    Save () {
        let formData = this.inputForm.value;

        formData.order_date = this.datePipe.transform(formData.order_date, 'yyyy-MM-dd');
        formData.rcv_req_date = this.datePipe.transform(formData.rcv_req_date, 'yyyy-MM-dd');
        formData.order_qty = this.utils.removeComma(formData.order_qty) * 1;

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

    openModal(method) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'write') {
                this.inputFormModal.show();
            } else if (method == 'upload') {
                this.uploadFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if (method == 'upload') {

        } else {
            // 입력폼 리셋
            this.inputForm.reset();

            // 단조작업실적 내용
            this.dataService.GetById(this.selectedId).subscribe(
                editData =>
                {
                    if (editData['result'] == "success") {
                        this.editData = editData;
                        this.formData = editData['data'];

                        this.inputForm.patchValue({
                            forging_id: editData['id'],
                            order_date: this.tDate,
                            poc_no: this.formData.poc_no,
                            order_qty: (this.formData.production_qty - this.formData.outs_qty) * 1,
                            heat_treatment_process: editData['heatTreatmentProcess'],
                            product_code: this.formData.product_code,
                            product_name: this.formData.product_name,
                            drawing_no: this.formData.drawing_no,
                            material: this.formData.material
                        });
                    }
                }
            );
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
        //let dialog = this.electronService.remote.dialog;
        //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
        //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "열처리대기품현황.xlsx");

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
                    this.messageService.add(this.addOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.uploadFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }

}
