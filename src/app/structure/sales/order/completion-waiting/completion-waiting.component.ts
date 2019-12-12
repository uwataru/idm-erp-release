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
import {not} from "rxjs/internal-compatibility";
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
    inputFormTitle: string;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    hideConfirmMsg: string;
    isEditMode: boolean = false;
    gridHeight = this.globals.gridHeight;
    selectedId: string;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    partnerList: any[] = this.globals.configs['partnerList'];
    saleTypeList: any[] = this.globals.configs['saleTypeList'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    rows = [];
    temp = [];
    selected = [];
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    partnerName: string;
    productCode: string;
    orderNo: string;

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
            input_date: ['', Validators.required],
            partner_name: '',
            order_no: '',
            product_name: '',
            product_type: '',
            delivery_qty: '',
            sales_qty: ['', Validators.required],
            sales_type: ['', Validators.required],
            product_price: '',
            sale_price: '',
            sales_orders_detail_id: '',
            not_sales_qty: ''

        });
    }

    ngOnInit() {
        this.panelTitle = '미판매(납품)현황';
        this.inputFormTitle = '판매처리';

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
        this.selected = [];

        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            // sortby: ['product_code'],
            // order: ['asc'],
            // maxResultCount: 10000
        };
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_code'] = this.listSltdPaCode;
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;

                for(let i in listData['data']){
                    listData['data'][i].price = listData['data'][i].sales_qty * listData['data'][i].product_price;
                    listData['data'][i].not_sales_qty = listData['data'][i].delivery_qty - listData['data'][i].sales_qty;
                }

                this.temp = listData['data'];
                this.rows = listData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['id'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['id'];
        }
    }

    onSelect({ selected }) {
        this.selectedId = selected[0].id;
    }

    Save () {
        let formData = this.inputForm.value;

        let saleQty = this.utils.removeComma(formData.sales_qty) * 1;
        let deliveryQty = this.utils.removeComma(formData.delivery_qty) * 1;
        let notSalesQty = this.utils.removeComma(formData.not_sales_qty) * 1;
        if (saleQty < 1) {
            alert('판매수량이 0 이상이어야 합니다');
            return false;
        }

        if(saleQty > notSalesQty){
            alert('판매수량이 미판매 수량보다 큽니다.');
            return false;
        }

        let regData = {
            sales_orders_detail_id: formData.sales_orders_detail_id,
            settings_id: formData.sales_type * 1,
            qty: this.utils.removeComma(formData.sales_qty) * 1,
            input_date: this.datePipe.transform(formData.input_date, 'yyyy-MM-dd')
        };
        console.log(regData);
        this.Create(regData);
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

    openModal(method, rowIndex) {
        // 실행권한
        if (this.isExecutable == true) {
           this.inputFormModal.show();
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.inputFormModal.show();

        // 입력폼 리셋
        this.inputForm.reset();

        // 수주정보
        this.dataService.GetById(this.selectedId).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.formData = editData['data'];

                    let not_sales_qty = this.formData.delivery_qty - this.formData.sales_qty;
                    let price = not_sales_qty * this.formData.product_price;

                    this.inputForm.patchValue({
                        input_date: this.tDate,
                        order_no: this.formData.order_no,
                        partner_name: this.formData.partner_name,
                        product_name: this.formData.product_name,
                        product_type: this.formData.product_type,
                        delivery_qty: this.utils.addComma(this.formData.delivery_qty),
                        sales_qty: this.utils.addComma(not_sales_qty),
                        not_sales_qty: this.utils.addComma(not_sales_qty),
                        product_price: this.utils.addComma(this.formData.product_price),
                        sale_price: this.utils.addComma(price),
                        sales_orders_detail_id: this.formData.id
                    });
                }
            }
        );
    }

    calculateSalePrice(){
        let formData = this.inputForm.value;
        let q = this.utils.removeComma(formData.sales_qty) * 1;
        let p = this.utils.removeComma(formData.product_price) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls['sale_price'].setValue(dp);
    }

}
