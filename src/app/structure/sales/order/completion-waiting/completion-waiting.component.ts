import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { CompletionWaitingService } from './completion-waiting.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './completion-waiting.item';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './completion-waiting.component.html',
  styleUrls: ['./completion-waiting.component.scss'],
  providers: [CompletionWaitingService]
})
export class CompletionWaitingComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    salesCompletionTitle: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    hideConfirmMsg: string;
    isEditMode: boolean = false;
    gridHeight = this.globals.gridHeight - 15;

    searchForm: FormGroup;

    selectedData: string;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type5Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    st: number;
    rows = [];
    temp = [];
    delId = [];
    selected = [];
    selectedTotalPrice: number;
    selectedTotalQty: number;
    messages = this.globals.datatableMessages;

    checked_sales_date: string;
    checkedInputForm: FormGroup;

    inputForm: FormGroup;
    partnerName: string;
    productCode: string;
    orderNo: string;
    POCNO: string;
    deliveryDate: string;

    resultRows = Item['data'];
    salesDate: string;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '판매처리가 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('PrintResultsModal') PrintResultsModal: ModalDirective;
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: CompletionWaitingService,
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
            sch_order_no: ''
        });

        this.inputForm = fb.group({
            delivery_no: ['', Validators.required],
            sales_date: ['', Validators.required],
            sales_type: ['', Validators.required],
            sales_qty: ['', Validators.required],
            product_price: ['', Validators.required],
            sales_price: ['', Validators.required]
        });

        this.checkedInputForm = fb.group({
            checked_sales_date: ['', Validators.required],
            //checked_sales_type: '',
            checked_sales_price: '',
            checked_sales_qty: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '미판매(납품)현황';
        this.salesCompletionTitle = '판매처리';
        this.uploadFormTitle = '미판매재고 엑셀업로드';

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
        this.selectedTotalPrice = 0;
        this.selectedTotalQty = 0;
        this.selected = [];

        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            order_no: formData.sch_order_no,
            st: this.sch_st,
            sortby: ['product_code'],
            order: ['asc'],
            maxResultCount: 10000
        };
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

                this.rows.forEach((e: any) => {
                    e.sales_qty = e.delivery_qty;
                });

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
    }

    onSelect({ selected }) {
        // console.log('Select Event', selected, this.selected);

        if(selected === undefined){
            return;
        }

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
        this.reCalcTotalPriceAndQty();
    }

    private reCalcTotalPriceAndQty() {
        this.selectedTotalPrice = 0;
        this.selectedTotalQty = 0;
        this.selected.forEach((e: any) => {
            this.selectedTotalPrice += Number(e.sales_price);
            this.selectedTotalQty += Number(e.sales_qty);
        });
    }

    changeQuantityPrice (rowIndex): void {
        let dq = this.rows[rowIndex]['delivery_qty'];
        let sq = this.utils.removeComma((<HTMLInputElement>document.getElementById('sales_qty_' + this.rows[rowIndex]['id'])).value) * 1;
        let pp = this.utils.removeComma((<HTMLInputElement>document.getElementById('product_price_' + this.rows[rowIndex]['id'])).value) * 1;
        (<HTMLInputElement>document.getElementById('sales_price_' + this.rows[rowIndex]['id'])).value = this.utils.addComma(sq * pp);
        // 미판매수량 = 납품수량 - 판매수량
        (<HTMLInputElement>document.getElementById('unsold_qty_' + this.rows[rowIndex]['id'])).value = this.utils.addComma(dq - sq);

        this.rows[rowIndex]['sales_price'] = sq * pp;
        this.rows[rowIndex]['sales_qty'] = sq;
        this.rows[rowIndex]['product_price'] = pp;
    }

    onEnterSelectDeliveryQty (row, rowIndex): void{
        // console.log('onEnterSelectDeliveryQty', row, rowIndex);
        this.selected.forEach((e: any, index, object) => {
            if(e.id == row.id){
                object.splice(index, 1);
            }
        });
        this.selected.push(row);

        this.changeQuantityPrice(rowIndex);
        this.reCalcTotalPriceAndQty();
    }

    Save () {
         let formData = this.inputForm.value;
         formData.sales_date = this.datePipe.transform(formData.sales_date, 'yyyy-MM-dd');
         formData.product_price = this.utils.removeComma(formData.product_price) * 1;
         formData.sales_qty = this.utils.removeComma(formData.sales_qty) * 1;
         formData.sales_price = this.utils.removeComma(formData.sales_price) * 1;

         formData.st = 1;
         this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        //this.inputForm.reset();
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

    SaveChecked () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let formData = this.checkedInputForm.value;
        formData.checked_sales_date = this.datePipe.transform(formData.checked_sales_date, 'yyyy-MM-dd');
        formData.checked_sales_price = this.selectedTotalPrice;
        formData.checked_sales_qty = this.selectedTotalQty;

        let salesCompletionsData = [];
        this.selected.forEach((e:any) => {

            if (<HTMLSelectElement>document.getElementById('sales_price_' + e.id) != null) {
                if ((<HTMLSelectElement>document.getElementById('sales_price_' + e.id)).value != '') {
                    let checkedData = [];
                    let salesType = (<HTMLSelectElement>document.getElementById('sales_type_' + e.id)).value;
                    let productPrice = (<HTMLSelectElement>document.getElementById('product_price_' + e.id)).value;
                    let salesQty = (<HTMLSelectElement>document.getElementById('sales_qty_' + e.id)).value;
                    let salesPrice = (<HTMLSelectElement>document.getElementById('sales_price_' + e.id)).value;

                    checkedData.push(e.id);
                    checkedData.push(this.utils.removeComma(salesType));
                    checkedData.push(this.utils.removeComma(productPrice));
                    checkedData.push(this.utils.removeComma(salesQty));
                    checkedData.push(this.utils.removeComma(salesPrice));

                    salesCompletionsData.push(checkedData.join(':#:'));
                }
            }
        });

        formData.sales_completions_data = salesCompletionsData.join('=||=');
        this.createCheckedData(formData);
    }

    createCheckedData (data): void {
        this.dataService.CreateCheckedData(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.checkedInputForm.reset();
                        this.initRowVal();
                        this.selected = [];
                        this.resultRows = data['data'];
                        this.salesDate = data['sales_date'];
                        this.PrintResultsModal.show();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                        console.log(this.resultRows);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, rowIndex) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'upload') {
                this.uploadFormModal.show();
            } else {
                this.inputFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if (method == 'upload') {

        } else {

            let rowData = [];
            if (rowIndex == 'checkedAll') {
                this.selected.forEach((data) => {
                    let colData = [];
                    colData.push(this.rows[rowIndex]['id']);
                    colData.push(this.rows[rowIndex]['sales_type']);
                    colData.push(this.rows[rowIndex]['sales_price']);
                    rowData.push(colData.join(':#:'))
                });

                this.selectedData = rowData.join('=||=');
            } else {
                this.partnerName = this.rows[rowIndex]['partner_name'];
                this.productCode = this.rows[rowIndex]['product_code'];
                this.orderNo = this.rows[rowIndex]['order_no'];
                this.POCNO = this.rows[rowIndex]['poc_no'];
                this.deliveryDate = this.rows[rowIndex]['delivery_date'];

                this.inputForm.patchValue({
                    sales_date: this.tDate, //this.formData.delivery_date,
                    delivery_no: this.rows[rowIndex]['id'],
                    sales_type: (<HTMLInputElement>document.getElementById('sales_type_' + this.rows[rowIndex]['id'])).value,
                    sales_qty: (<HTMLInputElement>document.getElementById('sales_qty_' + this.rows[rowIndex]['id'])).value,
                    product_price: (<HTMLInputElement>document.getElementById('product_price_' + this.rows[rowIndex]['id'])).value,
                    sales_price: (<HTMLInputElement>document.getElementById('sales_price_' + this.rows[rowIndex]['id'])).value
                });
            }

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
                importedSaveAs(res, "미판매재고현황.xlsx");

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

    private initRowVal() {
        this.rows.forEach((e: any) => {
            let tEl = (<HTMLInputElement>document.getElementById('unsold_qty_' + e.id));
            if(tEl)
                (<HTMLInputElement>document.getElementById('unsold_qty_' + e.id)).value = '';
        });
    }
}
