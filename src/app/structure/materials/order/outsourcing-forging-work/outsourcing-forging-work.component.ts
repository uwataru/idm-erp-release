import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OutsourcingForgingWorkService } from './outsourcing-forging-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, matlReceivingItem } from './outsourcing-forging-work.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './outsourcing-forging-work.component.html',
    styleUrls: ['./outsourcing-forging-work.component.css'],
    providers: [OutsourcingForgingWorkService, DatePipe]
})
export class OutsourcingForgingWorkComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    selectedCnt: number;
    listData : Item[];
    materialData : matlReceivingItem[];
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
    materialRows = [];
    temp = [];
    delId = [];
    selected = [];
    selectedRcvItems = [];
    usedRcvItems: string;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type41Partners'];
    inputMakers: any[] = this.globals.configs['maker'];
    totalWeight: number;
    product_price: number;
    isTmpPrice: boolean;
    order_qty: number;
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private router: Router,
        private datePipe: DatePipe,
        private dataService: OutsourcingForgingWorkService,
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
            product_code: '',
            product_name: '',
            drawing_no: '',
            product_reg_no: '',
            outs_partner_code: '',
            outs_partner_name: '',
            ref_matl_supl_type: '',
            matl_cost: '',
            forging_cost: '',
            outs_cost: '',
            material: '',
            size: '',
            input_weight: '',
            order_date: ['', Validators.required],
            partner_code: '',
            partner_name: ['', Validators.required],
            matl_supl_type: ['', Validators.required],
            order_qty: ['', Validators.required],
            rcv_req_date: ['', Validators.required],
            poc_no: ['', Validators.required],
            steel_maker: '',
            storage: '',
            ms_no: '',
            estimated_weight: '',
            used_rcv_items: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '외주단조품';
        this.inputFormTitle = '외주단조발주';

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
            partner_name: formData.sch_partner_name,
            product_name: formData.sch_product_name,
            st: 1,
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

    onSelectInputMaker(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['maker_code'].setValue(0);
        } else {
            this.inputForm.controls['maker_code'].setValue(event.item.CfgCode);
        }
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

    CalculOrderAmount (event): void {
        let formData = this.inputForm.value;
        let f = event.target.id.replace('order_weight', 'order_amount');
        let q = this.utils.removeComma(event.target.value) * 1;
        let p = this.utils.removeComma(formData.material_price) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls[f].setValue(dp);
    }

    onValueChange(value: Date): void {
        this.inputForm.patchValue({promised_date: value});
    }

    Save () {
        let formData = this.inputForm.value;
        if ( ! formData.partner_name ) {
            alert('단조업체를 선택해주세요!');
            return false;
        }

        switch (formData.ref_matl_supl_type) {
            case "유상": formData.ref_matl_supl_type = 1; break;
            case "무상": formData.ref_matl_supl_type = 2; break;
            case "도급": formData.ref_matl_supl_type = 3; break;
        }

        formData.matl_cost = this.utils.removeComma(formData.matl_cost) * 1;
        formData.forging_cost = this.utils.removeComma(formData.forging_cost) * 1;
        formData.outs_cost = this.utils.removeComma(formData.outs_cost) * 1;

        formData.matl_supl_type = formData.matl_supl_type * 1;
        formData.order_qty = formData.order_qty * 1;

        formData.order_date = this.datePipe.transform(formData.order_date, 'yyyy-MM-dd');
        formData.rcv_req_date = this.datePipe.transform(formData.rcv_req_date, 'yyyy-MM-dd');

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

    openModal() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.inputFormModal.show();
        // 입력폼 리셋
        this.inputForm.reset();

        // 입력일
        this.inputForm.controls['order_date'].setValue(this.tDate);

        // 단조품정보
        this.dataService.GetMaterialInfo(this.selectedId).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let matl_supl_type_text: string;
                    switch (this.formData.material_supply_type) {
                        case 1: matl_supl_type_text = "유상"; break;
                        case 2: matl_supl_type_text = "무상"; break;
                        case 3: matl_supl_type_text = "도급"; break;
                    }
                    let matl_cost = this.utils.addComma(this.formData.material_cost);
                    let forging_cost = this.utils.addComma(this.formData.forging_cost);
                    let outs_cost = this.utils.addComma(this.formData.outsourcing_cost);
                    this.inputForm.patchValue({
                        product_code: this.formData.product_code,
                        product_name: this.formData.product_name,
                        drawing_no: this.formData.drawing_no,
                        product_reg_no: this.formData.product_reg_no,
                        outs_partner_code: this.formData.forging_partner_code,
                        outs_partner_name: this.formData.forging_partner_name,
                        ref_matl_supl_type: matl_supl_type_text,
                        matl_cost: matl_cost,
                        forging_cost: forging_cost,
                        outs_cost: outs_cost,
                        partner_code: this.formData.forging_partner_code,
                        partner_name: this.formData.forging_partner_name,
                        matl_supl_type: this.formData.material_supply_type.toString(),
                        material: this.formData.material,
                        size: this.formData.size,
                        input_weight: this.formData.input_weight,
                    });

                    // 원자재 재고현황
                    let params = {
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
                        }
                    );
                }
            }
        );
    }

    onSelect({ selected }) {
        //this.selectedId = selected[0].product_code;
        this.selectedCnt = selected.length;
        if (this.selectedCnt == 1) {
            this.selectedId = selected[0].product_code;
        }
    }

    calculInputWeightTotal() {
        let formData = this.inputForm.value;
        let order_qty = this.utils.removeComma(formData.order_qty) * 1;
        let input_weight = this.utils.removeComma(formData.input_weight) * 1;
        let estimatedWeight:number = Math.round(order_qty * input_weight * 10) * 0.1;

        if (estimatedWeight > 0) {
            this.inputForm.patchValue({estimated_weight: this.utils.addComma(estimatedWeight)})
        }
    }

    onSelectRcvItems({ selected }) {
        this.selectedRcvItems.splice(0, this.selectedRcvItems.length);
        this.selectedRcvItems.push(...selected);

        if (this.selectedRcvItems.length > 0) {
            this.calculRemainingQuantity(this.selectedRcvItems);
        }
    }

    calculRemainingQuantity(selectedRcvItems) {
        if (selectedRcvItems.length < 1) {
            this.usedRcvItems = '';
            return false;
        }
        let formData = this.inputForm.value;
        if ( ! formData.estimated_weight || formData.estimated_weight == '') {
            alert('수량을 입력하여 예상사용중량을 계산해주세요');
            return false;
        }

        let usedItemArr = [];
        let usedQuantity: number;
        let estimatedWeight: number;

        estimatedWeight = this.utils.removeComma(formData.estimated_weight);
        usedQuantity = 0;
        this.selectedRcvItems.forEach((e:any) => {

            this.inputForm.patchValue({
                steel_maker: e.steel_maker,
                storage: e.storage,
                ms_no: e.ms_no
            });

            if (estimatedWeight > 0) {
                estimatedWeight = estimatedWeight - e.remaining_weight;

                let usedQty: number;
                if (estimatedWeight >= 0) {
                    usedQty = e.remaining_weight;
                } else {
                    usedQty = e.remaining_weight + estimatedWeight;
                }

                usedQuantity = usedQuantity + usedQty;
                usedItemArr.push(e.id + ':' + e.material_code + ':' + usedQty + ':' + (e.remaining_weight - usedQty));
            }
        });
        this.usedRcvItems = usedItemArr.join(',');
    }
}
