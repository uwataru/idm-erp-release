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
import {DatePipe} from "@angular/common";
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
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    currentQty: number;
    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    rows = [];
    temp = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    partnerList: any[] = this.globals.configs['partnerList'];
    productionLines: any[] = this.globals.configs['productionLine'];
    delivable_qty: number;
    delivery_qty: number;
    product_price: number;
    order_qty: number;
    current_qty: number;
    delivery_price: number;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '납품처리가 완료되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;

    constructor(
        public electronService: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: OrderNotDeliveredService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private datePipe: DatePipe,
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
            partner_name: ['', Validators.required],
            order_no: '',
            product_name: '',
            product_type: '',
            current_qty: '',
            order_qty: '',
            delivery_qty: ['', Validators.required],
            product_price: '',
            delivery_price: '',
            transport_vehicle: '',
            unload_place: ['', Validators.required],
            unload_place_id: '',
            sales_orders_detail_id: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '수주미납(등록)현황';
        this.inputFormTitle = '납품처리';

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
        this.getAll();
    }

    getAll(): void {
        this.selectedId = '';

        let formData = this.searchForm.value;
        let params = {
            partner_name: formData.sch_partner_name,
            order_no: formData.sch_order_no.trim(),
            // sortby: ['product_code'],
            // order: ['asc'],
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
                    listData['data'][i].not_delivered_qty = listData['data'][i].order_qty - listData['data'][i].delivery_qty;
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
        this.getAll();
    }
    onSelectListUnloadPlace(event: TypeaheadMatch): void {
        this.inputForm.controls['unload_place_id'].setValue(event.item['id']);
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    updateFilter(event) {
        const val = event.target.value.trim();

        // filter data
        const temp = this.temp.filter(function(d){
            return d.order_no.indexOf(val) !== -1 || !val;
        });

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
        let deliveryQty = this.utils.removeComma(formData.delivery_qty);
        if (deliveryQty < 1) {
            alert('납품수량이 0 이상이어야 합니다');
            return false;
        }

        if (deliveryQty > this.current_qty) {
            alert('납품수량이 재고수량보다 큽니다');
            return false;
        }

        let regData = {
            sales_orders_detail_id: formData.sales_orders_detail_id,
            unload_place_id: formData.unload_place_id,
            transport_vehicle: formData.transport_vehicle,
            qty: this.utils.removeComma(formData.delivery_qty) * 1,
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
                        this.inputForm.reset();
                        this.getAll();
                        this.messageService.add(this.addOkMsg);
                        // this.isInvoice = true;
                        // this.invoiceNo = data['last_id'];
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
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
                if(this.currentQty < 1) {
                    this.messageService.add('해당 제품의 재고가 없습니다.');
                    return false;
                }

                this.inputFormModal.show();
                this.inputForm.reset();

                this.dataService.GetById(this.selectedId).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            this.formData = editData['data'];
                            this.order_qty = this.formData.order_qty;
                            this.current_qty = this.formData.current_qty;
                            this.product_price = this.formData.product_price;
                            this.delivery_qty = this.formData.delivery_qty;

                            let delivable_qty = this.order_qty - this.delivery_qty;
                            if (this.current_qty < delivable_qty) {
                                delivable_qty = this.current_qty;
                            }

                            let delivery_price = this.formData.product_price * delivable_qty;
                            this.delivery_price = delivery_price;

                            this.inputForm.patchValue({
                                input_date: this.tDate,
                                partner_name: this.formData.partner_name,
                                product_name: this.formData.product_name,
                                product_type: this.formData.product_type,
                                order_qty: this.formData.order_qty,
                                current_qty: this.formData.current_qty,
                                delivery_qty: this.utils.addComma(delivable_qty),
                                product_price: this.utils.addComma(this.product_price),
                                order_no: this.formData.order_no,
                                transport_vehicle: this.formData.transport_vehicle,
                                delivery_price: this.utils.addComma(delivery_price),
                                sales_orders_detail_id: this.formData.sales_orders_detail_id
                            });
                        }
                    }
                );
                break;
        }
    }

    onSelect({ selected }) {
        this.selectedId = selected[0].id;
        this.currentQty = this.utils.removeComma(selected[0].current_qty) * 1;
    }

}
