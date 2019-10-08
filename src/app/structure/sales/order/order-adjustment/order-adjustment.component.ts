import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderAdjustmentService } from './order-adjustment.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, PartnerItem } from './order-adjustment.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './order-adjustment.component.html',
    styleUrls: ['./order-adjustment.component.css'],
    providers: [OrderAdjustmentService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class OrderAdjustmentComponent implements OnInit {
    tDate = this.globals.tDate;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    panelTitle = '수주 등록 현황';
    searchForm: FormGroup;
    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    st: number;
    rows = [];
    temp = [];
    delId = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputFormTitle: string = '수주 조정';
    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type5Partners'];
    productionLines: any[] = this.globals.configs['productionLine'];
    isCombi: boolean = false;
    prodTypeStr: string;
    combiTypeStr: string;
    product_price: number;
    isTmpPrice: boolean;
    order_qty: number;
    editData: Item;
    data: Date;
    editOkMsg: string = '수정이 완료되었습니다.';

    deleteConfirmTitle: string = '수주 삭제';
    deleteConfirmMsg: string = '선택하신 데이터를 삭제하시겠습니까?';

    sendToPlanningTitle: string = '생산계획으로 자료전송';
    sendToPlanningMsg: string = '수주등록현황 자료를 생산계획으로 보내시겠습니까?'
    sendOkMsg: string = '전송이 완료되었습니다';

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    uploadFormTitle = '수주 엑셀업로드';
    addOkMsg = '등록이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
    @ViewChild('SendToPlanningModal') sendToPlanningModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: OrderAdjustmentService,
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
            sch_product_code: ''
        });
        this.inputForm = fb.group({
            partner_code: ['', Validators.required],
            partner_name: ['', Validators.required],
            input_date: ['', Validators.required],
            order_type1: ['', Validators.required],
            order_type2: ['', Validators.required],
            product_code: ['', Validators.required],
            combi_product_code: '',
            is_combi: '',
            combi_id: '',
            order_qty: ['', Validators.required],
            delivery_date: ['', Validators.required],
            promised_date: ['', Validators.required],
            // product_type: '',
            // drawing_no: '',
            // sub_drawing_no: '',
            production_line: ['', Validators.required],
            product_name: '',
            size: '',
            combi_product_name: '',
            product_price: '',
            combi_product_price: '',
            order_no: '',
            modi_reason: ['', Validators.required]
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
            product_code: formData.sch_product_code,
            sortby: ['input_date', 'order_no', 'product_code'],
            order: ['desc', 'desc', 'desc'],
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
                this.temp = listData['data'];
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

        // filter data
        // const temp = this.temp.filter(function(d){
        //     return d.partner_code.indexOf(val) !== -1 || !val;
        // })
        //
        // // update the rows
        // this.rows = temp;
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    loadProductInfo (event) {
        let productCode = event.target.value;
        this.isTmpPrice = false;
        this.dataService.GetProductInfo(productCode).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let product_price = this.utils.addComma(this.formData.product_price);
                    this.inputForm.patchValue({
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        product_type: this.formData.product_type,
                        drawing_no: this.formData.drawing_no,
                        sub_drawing_no: this.formData.sub_drawing_no,
                        product_name: this.formData.product_name,
                        size: this.formData.size,
                        production_line: this.formData.production_line,
                        product_price: product_price,
                    });

                    if (this.formData.is_tmp_price == 'Y') {
                        this.isTmpPrice = true;
                    }
                }
            }
        );
    }

    updateFilter(event) {
        const val = event.target.value;

        // filter data
        const temp = this.temp.filter(function(d){
            return d.product_code.indexOf(val) !== -1 || !val;
        })

        // update the rows
        this.rows = temp;
        // 필터 변경될때마다 항상 첫 페이지로 이동.
        //this.table.offset = 0;
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let product_price = this.utils.addComma(this.formData.product_price);
                    let order_qty = this.utils.addComma(this.formData.order_qty);

                    // 콤비제품인 경우
                    let isCombi = 'N';
                    let combiId: number;
                    let combi_product_code = '';
                    let combi_product_name = '';
                    let combi_product_price = 0;
                    if (editData['combiData'].product_code != '') {
                        this.isCombi = true;
                        isCombi = 'Y';
                        combiId = editData['combiData'].id;
                        combi_product_code = editData['combiData'].product_code;
                        combi_product_name = editData['combiData'].product_name;
                        combi_product_price = this.utils.addComma(editData['combiData'].product_price);

                        this.getCombiTypeString(this.formData.product_code);
                    }

                    this.inputForm.patchValue({
                        is_combi: isCombi,
                        combi_id: combiId,
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        input_date: this.formData.input_date,
                        order_type1: this.formData.order_type1,
                        order_type2: this.formData.order_type2,
                        order_no: this.formData.order_no,
                        product_code: this.formData.product_code,
                        // product_type: this.formData.product_type,
                        // drawing_no: this.formData.drawing_no,
                        // sub_drawing_no: this.formData.sub_drawing_no,
                        product_name: this.formData.product_name,
                        size: this.formData.size,
                        order_qty: order_qty,
                        product_price: product_price,
                        production_line: this.formData.production_line,
                        delivery_date: this.formData.delivery_date,
                        promised_date: this.formData.promised_date,
                        combi_product_code: combi_product_code,
                        combi_product_name: combi_product_name,
                        combi_product_price: combi_product_price
                    });
                }
            }
        );
    }

    copy_date(event): void {
        let formData = this.inputForm.value;
        if (formData.promised_date == null || formData.promised_date == '') {
            this.inputForm.patchValue({promised_date: event.target.value});
        }
    }

    onValueChange(value: Date): void {
        this.inputForm.patchValue({promised_date: value});
    }

    AddComma(event) {
        var valArray = event.target.value.split('.');
        for(var i = 0; i < valArray.length; ++i) {
            valArray[i] = valArray[i].replace(/\D/g, '');
        }

        var newVal: string;

        if (valArray.length === 0) {
            newVal = '0';
        } else {
            let matches = valArray[0].match(/[0-9]{3}/mig);

            if(matches !== null && valArray[0].length > 3) {
                let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
                let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

                newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
            } else {
                newVal = valArray[0];
            }

            if(valArray.length > 1) {
                newVal += "." + valArray[1].substring(0,2);
            }
        }
        this.inputForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
        //this.inputForm.patchValue({'combi_product_price' : this.utils.addComma(newVal)});
    }

    getCombiTypeString(code) {
        if (!code) return false;

        if (code.indexOf( "BB" ) > 0) {
            this.prodTypeStr = "내륜";
            this.combiTypeStr = "외륜";
        }
        if (code.indexOf( "AA" ) > 0) {
            this.prodTypeStr = "외륜";
            this.combiTypeStr = "내륜";
        }
    }

    Save () {
         let formData = this.inputForm.value;
         if ( ! formData.production_line ) {
             alert('작업라인을 선택해주세요!');
             return false;
         }
         if ( ! formData.modi_reason) {
             alert('정정사유를 선택해주세요!');
             return false;
         }
         formData.product_price = this.utils.removeComma(formData.product_price) * 1;
         formData.order_qty = this.utils.removeComma(formData.order_qty) * 1;

         formData.delivery_date = this.datePipe.transform(formData.delivery_date, 'yyyy-MM-dd');
         formData.promised_date = this.datePipe.transform(formData.promised_date, 'yyyy-MM-dd');
         formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');

         if (this.isCombi == true) {
             formData.combi_product_price = this.utils.removeComma(formData.combi_product_price) * 1;
         }

         this.Update(this.selectedId, formData);
    }

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
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

    delete (id): void {
        const formData: FormData = new FormData();
        formData.append('st', '-1');
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
                    this.selected = [];
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, id) {
        // 실행권한
        if (this.isExecutable == true) {
            switch (method) {
                case 'delete':
                    this.deleteFormModal.show();
                break;
                case 'edit':
                    this.inputFormModal.show();
                break;
                case 'send':
                    this.sendToPlanningModal.show();
                break;
                case 'upload':
                    this.uploadFormModal.show();
                break;
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
        if (method == 'edit') {
            this.Edit(id);
        }
    }

    SendToPlanning(): void {
        const formData: FormData = new FormData();
        formData.append('user', this.globals.userId);
        this.dataService.SendToPlanning(formData)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.messageService.add(this.sendOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);

                        // 오류난 수주 출력
                        let params = {
                            order_no: data['order_no'],
                            sortby: ['input_date', 'order_no', 'product_code'],
                            order: ['desc', 'desc', 'desc'],
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
                    this.sendToPlanningModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    excelDown(type): void {
        this.dataService.GetExcelFile(type).subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                if (type) importedSaveAs(res, "수주마스터.xlsx");
                else importedSaveAs(res, "수주등록현황.xlsx");

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
                    });
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
