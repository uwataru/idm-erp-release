import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { OrderNotDeliveredService } from './not-delivered.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, PartnerItem } from './not-delivered.item';
import {AppConfig} from '../../../../../environments/environment';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './not-delivered.component.html',
  styleUrls: ['./not-delivered.component.scss'],
  providers: [OrderNotDeliveredService]
})
export class OrderNotDeliveredComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    statusFormTitle: string;
    statusConfirmMsg: string;
    statusConfirmBtn: string;
    statusFormValue: number;
    uploadFormTitle: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
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
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type5Partners'];
    productionLines: any[] = this.globals.configs['productionLine'];
    prev_delivery_qty: number;
    delivable_qty: number;
    normal_qty: number;
    delivery_qty: number;
    product_price: number;
    order_qty: number;
    delivery_price: number;
    editData: Item;
    isInvoice: boolean = false;
    invoiceNo: number;

    // 송장(거래명세서)
    viewModalHeight: number = window.innerHeight - 70;
    panel1Title: string;
    panel2Title: string;
    orderNo: string;
    pocNo: string;
    productType: string;
    drawingNo: string;
    productName: string;
    productPrice: number;
    deliveryPrice: number;
    deliveryQty: number;

    partnerName: string;
    partnerBizNo: string;
    partnerCeo: string;
    partnerAddr: string;
    transportVehicle: string;
    unloadPlace: string;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '납품처리가 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('InvoiceModal') invoiceModal: ModalDirective;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: OrderNotDeliveredService,
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
            delivery_date: ['', Validators.required],
            partner_code: ['', Validators.required],
            partner_name: ['', Validators.required],
            product_code: ['', Validators.required],
            product_name: '',
            order_qty: '',
            delivery_qty: ['', Validators.required],
            product_price: '',
            delivery_price: '',
            order_no: '',
            poc_no: '',
            // ms_no: '',
            transport_vehicle: '',
            unload_place: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '수주미납(등록)현황';
        this.inputFormTitle = '납품처리';
        this.uploadFormTitle = '수주 엑셀업로드';
        this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
        this.hideConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';

        this.changeSubMenu(1);

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    changeSubMenu(st): void {
        this.sch_st = st;
        this.getAll();
    }

    getAll(): void {
        this.selectedId = '';

        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            order_no: formData.sch_order_no,
            st: this.sch_st,
            sortby: ['product_code'],
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
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    updateFilter(event) {
        const val = event.target.value;

        // filter data
        const temp = this.temp.filter(function(d){
            return d.order_no.indexOf(val) !== -1 || d.poc_no.indexOf(val) !== -1 || !val;
        })

        // update the rows
        this.rows = temp;
        // 필터 변경될때마다 항상 첫 페이지로 이동.
        //this.table.offset = 0;
    }

    calculDeliveryPrice (): void {
        let formData = this.inputForm.value;
        let q = this.utils.removeComma(formData.delivery_qty) * 1;
        let p = this.utils.removeComma(formData.product_price) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls['delivery_price'].setValue(dp);
    }

    deliveryCompletion () {
        let formData = this.inputForm.value;
        if (formData.delivery_qty < 1) {
            alert('납품수량이 0 이상이어야 합니다');
            return false;
        }
        if (formData.delivery_qty > this.normal_qty) {
            alert('납품수량이 재고수량보다 큽니다');
            return false;
        }
        formData.product_price = this.utils.removeComma(formData.product_price) * 1;
        formData.delivery_qty = this.prev_delivery_qty + this.utils.removeComma(formData.delivery_qty) * 1;
        formData.delivery_price = this.utils.removeComma(formData.delivery_price) * 1;
        formData.not_delivered_qty = formData.order_qty - (formData.delivery_qty * 1);

        formData.st = 1;
        this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                        this.isInvoice = true;
                        this.invoiceNo = data['last_id'];
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    //this.invoiceModal.show();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(action, id) {

        switch (action) {
            case 'create':
                // 실행권한
                if (this.isExecutable == false) {
                    alert(this.globals.isNotExecutable);
                    return false;
                }
                this.inputFormModal.show();

                // 입력폼 리셋
                this.inputForm.reset();

                this.isInvoice = false;

                // 수주정보
                this.dataService.GetById(this.selectedId).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            this.editData = editData;
                            this.formData = editData['data'];

                            this.order_qty = this.formData.order_qty;
                            let product_price = this.formData.product_price;

                            this.prev_delivery_qty = this.formData.delivery_qty*1;
                            let delivery_qty = (this.formData.order_qty*1) - this.prev_delivery_qty;
                            this.delivery_qty = delivery_qty;

                            let delivery_price = product_price * delivery_qty;
                            this.delivery_price = delivery_price;

                            // 제품재고(생산수량)
                            let normal_qty = this.formData.normal_qty; //this.formData.production_qty;
                            this.normal_qty = normal_qty;

                            // 납품가능수량
                            let delivable_qty = delivery_qty;
                            if (normal_qty < delivery_qty) {
                                delivable_qty = normal_qty;
                            }

                            this.inputForm.patchValue({
                                delivery_date: this.tDate,
                                partner_code: this.formData.partner_code,
                                partner_name: this.formData.partner_name,
                                product_code: this.formData.product_code,
                                product_name: this.formData.product_name,
                                order_qty: this.formData.order_qty,
                                delivery_qty: this.utils.addComma(delivable_qty),
                                product_price: this.utils.addComma(product_price),
                                order_no: this.formData.order_no,
                                poc_no: this.formData.poc_no,
                                // ms_no: this.formData.ms_no,
                                transport_vehicle: this.formData.transport_vehicle,
                                unload_place: this.formData.unload_place,
                                delivery_price: this.utils.addComma(delivery_price)
                            });
                        }
                    }
                );
            break;

            case 'view':
                this.invoiceModal.show();
                this.panel1Title = '거 래 명 세 서 (공급자용)';
                this.panel2Title = '거 래 명 세 서 (공급받는자용)';
                this.dataService.GetDeliveryView(id).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            let data = editData['data'];
                            this.invoiceNo = data.id;
                            this.orderNo = data.order_no;
                            this.pocNo = data.poc_no;
                            this.productType = data.product_type;
                            this.drawingNo = data.drawing_no;
                            this.productName = data.product_name;
                            this.deliveryPrice = data.delivery_price;
                            this.deliveryQty = data.delivery_qty;
                            this.productPrice = data.product_price;

                            this.partnerName = data.ptn_name;
                            this.partnerBizNo = data.ptn_biz_no;
                            this.partnerCeo = data.ptn_ceo;
                            this.partnerAddr = data.ptn_addr;

                            this.transportVehicle = data.transport_vehicle;
                            this.unloadPlace = data.unload_place;
                        }
                    }
                );
            break;
        }

    }

    onSelect({ selected }) {
        this.selectedId = selected[0].order_no + ':' + selected[0].poc_no + ':' + selected[0].product_code;
    }

}
