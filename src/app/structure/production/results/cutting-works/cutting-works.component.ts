import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { CuttingWorksService } from './cutting-works.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, matlReceivingItem } from './cutting-works.item';
import { settings } from 'cluster';

declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './cutting-works.component.html',
    styleUrls: ['./cutting-works.component.css'],
    providers: [CuttingWorksService, DatePipe]
})
export class CuttingWorksComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    selectedId: string;
    listData : Item[];
    materialData : matlReceivingItem[];
    formData: Item['data'];
    rows = [];
    materialRows = [];
    delId = [];
    selected = [];
    selectedRcvItems = [];
    usedRcvItems: string;
    usedDetailArr = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    productionLines: any[] = this.globals.configs['productionLine'];
    totalWeight: number;
    cutting_total: number;
    product_price: number;
    origin_material: string;
    origin_size: number;

    isTmpPrice: boolean;
    order_qty: number;
    cutting_qty: number;
    input_weight: number;
    input_weight_total: number;
    inputWeightTotal: number;   // 투입중량
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    isNotNumberMsg = '숫자로만 입력하세요.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: CuttingWorksService,
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

        this.inputForm = fb.group({
            input_date: ['', Validators.required],
            is_combi: false,
            order_no: ['', Validators.required],
            poc_no: ['', Validators.required],
            release_type: ['', Validators.required],
            product_code: '',
            product_name: '',
            production_line: '',
            drawing_no: '',
            order_cutting_qty: '',
            order_material: '',
            order_size: '',
            order_steel_maker: '',
            order_ms_no: '',
            order_input_weight: '',
            order_input_weight_total: '',
            cutting_qty: ['', Validators.required],
            material: ['', Validators.required],
            size: ['', Validators.required],
            steel_maker: ['', Validators.required],
            ms_no: ['', Validators.required],
            input_weight: ['', Validators.required],
            input_weight_total: ['', Validators.required],
            remaining_qty: '',
            used_rcv_items: '',
            st: '',
            is_all_checked: false
        });
    }

    ngOnInit() {
        this.panelTitle = '조립작업 지시 현황';
        this.inputFormTitle = '조립작업입력';
        this.uploadFormTitle = '조립재고 엑셀업로드';

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
        let params = {
            sortby: ['working_stime'],
            order: ['asc'],
            maxResultCount: 10000
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

    Save () {
        let formData = this.inputForm.value;
        if ( ! formData.release_type ) {
            alert('출고구분을 선택해주세요!');
            return false;
        }

        formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');
        formData.cutting_qty = this.utils.removeComma(formData.cutting_qty) * 1;
        formData.size = this.utils.removeComma(formData.size) * 1;
        formData.input_weight = this.utils.removeComma(formData.input_weight) * 1;
        formData.remaining_qty = this.utils.removeComma(formData.remaining_qty) * 1;
        formData.used_rcv_items = this.usedRcvItems;

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


    loadMaterial(event) {

        this.selectedRcvItems = [];

        let formData = this.inputForm.value;
        this.inputForm.patchValue({ is_all_checked : false });

        let order_material = formData.order_material;
        let order_size = formData.order_size;

        if(order_material == '' || order_size == '') {
            this.messageService.add('지시재질 또는 규격을 입력하세요.');
            return false;
        } else if(isNaN(order_size)) {
            this.messageService.add('지시규격은' + this.isNotNumberMsg);
            return false;
        }

        let params = {
            material: order_material,
            size: order_size,
            st: 0,
            sortby: ['material','size','steel_maker','rcv_date'],
            order: ['asc','asc','asc','asc'],
            maxResultCount: 1000
        }
        this.isLoadingProgress = true;
        this.dataService.GetMaterialsReceiving(params).subscribe(
            listData =>
            {
                this.materialData = listData;
                this.materialRows = listData['data'];
                this.totalWeight = listData['totalWeight'];
                this.isLoadingProgress = false;

                if(order_material != this.origin_material || order_size != this.origin_size) {
                    (<HTMLInputElement>document.getElementById('order_material')).style.border = 'solid 1px #FF3300';
                    (<HTMLInputElement>document.getElementById('order_size')).style.border = 'solid 1px #FF3300';
                } else {
                    (<HTMLInputElement>document.getElementById('order_material')).style.border = '';
                    (<HTMLInputElement>document.getElementById('order_size')).style.border = '';
                }
            }
        );
    }


    openModal(method) {

        (<HTMLInputElement>document.getElementById('order_material')).style.border = '';
        (<HTMLInputElement>document.getElementById('order_size')).style.border = '';

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

            this.selectedRcvItems = [];


            // 절단작업지시 내용
            this.dataService.GetById(this.selectedId).subscribe(
                editData =>
                {
                    if (editData['result'] == "success") {
                        this.editData = editData;
                        this.formData = editData['data'];

                        this.origin_material = this.formData.material;
                        this.origin_size = this.formData.size;

                        this.cutting_total = this.formData.cutting_qty * 1;

                        let order_cutting_qty = this.formData.order_qty * 1;
                        let order_input_weight = this.formData.input_weight * 1;
                        let order_input_weight_total = Math.round(order_cutting_qty * order_input_weight * 10) * 0.1;
                        this.inputForm.patchValue({
                            input_date: this.tDate,
                            is_combi: this.formData.is_combi,
                            order_no: this.formData.order_no,
                            poc_no: this.formData.poc_no,
                            release_type: this.formData.release_type,
                            product_code: this.formData.product_code,
                            product_name: this.formData.product_name,
                            production_line: this.formData.production_line,
                            drawing_no: this.formData.drawing_no,
                            order_cutting_qty: this.utils.addComma(order_cutting_qty),
                            cutting_qty: this.utils.addComma(order_cutting_qty - this.cutting_total),
                            order_material: this.formData.material,
                            order_size: this.formData.size,
                            order_steel_maker: this.formData.steel_maker,
                            order_ms_no: this.formData.ms_no,
                            order_input_weight: this.utils.addComma(order_input_weight),
                            order_input_weight_total: this.utils.addComma(order_input_weight_total),
                            st: true
                        });


                        // 원자재 재고현황
                        this.usedDetailArr = [];
                        let params = {
                            material: this.formData.material,
                            size: this.formData.size,
                            st: 0,
                            sortby: ['material','size','steel_maker','rcv_date'],
                            order: ['asc','asc','asc','asc'],
                            maxResultCount: 1000
                        }

                        setTimeout(() => {
                            this.isLoadingProgress = true;
                            this.dataService.GetMaterialsReceiving(params).subscribe(
                                listData =>
                                {
                                    this.materialData = listData;
                                    this.materialRows = listData['data'];
                                    this.totalWeight = listData['totalWeight'];

                                    this.isLoadingProgress = false;
                                }
                            );
                        }, 100);

                    }
                }
            );
        }
    }

    onSelect(event) {
        this.selectedId = event.selected[0].poc_no;
    }

    calculInputWeightTotal() {
        let formData = this.inputForm.value;
        let order_cutting_qty = this.utils.removeComma(formData.order_cutting_qty)*1;
        let cutting_qty = this.utils.removeComma(formData.cutting_qty)*1;
        let input_weight = this.utils.removeComma(formData.input_weight)*1;
        let input_weight_total:number = Math.round(cutting_qty * input_weight * 10) * 0.1;

        if (input_weight_total > 0) {
            this.inputWeightTotal = input_weight_total;
            this.inputForm.patchValue({input_weight_total: this.utils.addComma(input_weight_total)});
        }

        // 이미 절단 입력된 수량(cutting_total)과 입력하려는 수량(cutting_qty)의 합이
        // 지시수량(order_cutting_qty)과 같거나 클때 절단작업입력이 완료된것으로 간주
        let st = false;
        if (this.cutting_total + cutting_qty >= order_cutting_qty) {
            st = true;
        }
        this.inputForm.patchValue({st: st});
    }

    checkInputWeightTotal(event): void {
        this.inputWeightTotal = event.target.value;
    }

    onSelectRcvItems({ selected }) {

        this.selectedRcvItems.splice(0, this.selectedRcvItems.length);
        this.selectedRcvItems.push(...selected);

        //if (this.selectedRcvItems.length > 0) {
            this.calculRemainingQty(this.selectedRcvItems);
        //}
    }

    calculRemainingQty(selectedRcvItems) {

        // if (selectedRcvItems.length < 1) {
        //     this.usedRcvItems = '';
        //     return false;
        // }
        let formData = this.inputForm.value;
        let inputWeightTotal: number;

        // 투입중량을 입력안한 경우 단위중량을 복사한 후 수량을 곱하여 계산한다.
        // if ( ! formData.input_weight_total || formData.input_weight_total == '') {
        //     if ( ! formData.order_input_weight ) {
        //         alert('투입중량을 입력해주세요');
        //         return false;
        //     }
        //     let inputWeight = this.utils.addComma(formData.order_input_weight);
        //     let orderInputWeight = this.utils.removeComma(formData.order_input_weight) * 1;
        //     let cuttingQty = this.utils.removeComma(formData.cutting_qty) * 1;
        //     inputWeightTotal = orderInputWeight * cuttingQty;
        //     this.inputForm.patchValue({
        //         input_weight: this.utils.addComma(inputWeight),
        //         input_weight_total: this.utils.addComma(inputWeightTotal)
        //     });
        // } else {
        //     inputWeightTotal = this.utils.removeComma(formData.input_weight_total)*1;
        // }

        this.usedDetailArr = [];    // 초기화
        let usedItemArr = [];
        let usedQty: number;

        this.inputWeightTotal = inputWeightTotal;
        usedQty = 0;
        let material = '';
        let size = '';
        let maker = '';
        let msno = '';
        this.selectedRcvItems.forEach((e:any) => {
            if (inputWeightTotal > 0) {

                // 재고 클릭시 재고사용내역에 보여줄 데이터 구성 (투입중량 - 재고 - 잔량)
                let usedData = {
                    "input_weight_total": inputWeightTotal,
                    "inven_weight": e.remaining_weight,
                    "remaining_weight": e.remaining_weight - inputWeightTotal
                }
                this.usedDetailArr.push(usedData);

                inputWeightTotal = inputWeightTotal - e.remaining_weight;

                let usedQty: number;
                if (inputWeightTotal >= 0) {
                    usedQty = e.remaining_weight;
                } else {
                    usedQty = e.remaining_weight + inputWeightTotal;
                }

                //usedQty = usedQty + usedQty;
                usedItemArr.push(e.id + ':' + e.material_code + ':' + usedQty + ':' + (e.remaining_weight - usedQty));

                material = e.material;
                size = e.size;
                maker = e.steel_maker;
                msno = e.ms_no;
                console.log(e.material)
                console.log(e.size)
            }
        });
        this.usedRcvItems = usedItemArr.join(',');

        let remainingQty = this.totalWeight - usedQty;
        remainingQty = this.utils.addComma(remainingQty);

        this.inputForm.patchValue({
            material: material,
            size: size,
            remaining_qty: remainingQty,
            steel_maker: maker,
            ms_no: msno
        });
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
                importedSaveAs(res, "조립작업지시현황.xlsx");

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

    chkAll(isChecked) {
        let formData = this.inputForm.value;
        let params = {}
        if(!isChecked) {
            params = {
                material: formData.order_material,
                size: formData.order_size,
                st: 0,
                sortby: ['material','size','steel_maker','rcv_date'],
                order: ['asc','asc','asc','asc'],
                maxResultCount: 1000
            }
        }

        this.isLoadingProgress = true;
        this.dataService.GetMaterialsReceiving(params).subscribe(
        listData =>
        {
            this.materialRows = listData['data'];
            this.isLoadingProgress = false;
        });

    }




}
