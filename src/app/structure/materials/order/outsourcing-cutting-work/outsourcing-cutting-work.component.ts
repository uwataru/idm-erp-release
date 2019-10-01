import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OutsourcingCuttingWorkService } from './outsourcing-cutting-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, matlReceivingItem } from './outsourcing-cutting-work.item';

@Component({
    selector: 'app-page',
    templateUrl: './outsourcing-cutting-work.component.html',
    styleUrls: ['./outsourcing-cutting-work.component.css'],
    providers: [OutsourcingCuttingWorkService, DatePipe]
})
export class OutsourcingCuttingWorkComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    formData: Item['data'];
    ppId: number;
    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type42Partners'];
    inputMakers: any[] = this.globals.configs['maker'];
    totalWeight: number;
    product_price: number;
    isTmpPrice: boolean;
    order_qty: number;
    selectedId: string;
    materialRows = [];
    materialData : matlReceivingItem[];
    selectedRcvItems = [];
    usedRcvItems: string;
    messages = this.globals.datatableMessages;

    // 절단작업지시서
    viewModalHeight: number = window.innerHeight - 70;
    cuttingWorkAllocationTitle: string;
    cuttingWorkAllocationToday: number;
    pocNo: string;

    title = 'app';
    elementType = 'svg';
    cuttingValue = 'C2016120301';
    forgingValue = 'P2016120301';
    format = 'CODE39';
    lineColor = '#000000';
    width = 1;
    height = 50;
    displayValue = true;
    fontOptions = '';
    font = 'monospace';
    textAlign = 'center';
    textPosition = 'bottom';
    textMargin = 2;
    fontSize = 14;
    background = '#ffffff';
    margin = 0;
    marginTop = 0;
    marginBottom = 0;
    marginLeft = 0;
    marginRight = 0;

    v_input_date: string;
    v_poc_no: string;
    v_order_no: string;
    v_product_code: string;
    v_product_name: string;
    v_partner_code: number;
    v_partner_name: string;
    v_product_type: string;
    v_drawing_no: string;
    v_cutting_qty: number;
    v_sub_drawing_no: string;
    v_order_qty: number;
    v_material: string;
    v_size: string;
    v_cut_length: number;
    v_steel_maker: string;
    v_ms_no: string;
    v_material_weight: number;
    v_input_weight: number;
    v_product_weight: string;
    v_product_price: number;
    v_production_line: string;
    v_working_stime: string;
    v_production_time: number;
    v_cutting_partner_code: number;
    v_cutting_partner_name: string;
    v_mold_no: string;
    v_mold_size: number;
    v_mold_storage: string;
    v_release_type: number;
    v_outs_partner_name: string;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('CuttingOrderModal') CuttingOrderModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: OutsourcingCuttingWorkService,
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
            order_date: ['', Validators.required],
            // poc_no: ['', Validators.required],
            outs_partner_code: '',
            outs_partner_name: ['', Validators.required],
            partner_code: '',
            partner_name: ['', Validators.required],
            product_code: '',
            product_name: ['', Validators.required],
            drawing_no: '',
            steel_maker: '',
            material: '',
            size: '',
            cut_length: '',
            input_weight: '',
            order_qty: ['', Validators.required],
            rcv_req_date: ['', Validators.required],
            forwarding_weight: ['', Validators.required],
            used_rcv_items: ''
        });
        
        if( this.inputPartners.filter(v => v.Code == 0).length < 1 ) {
            this.inputPartners.unshift({Code:0, Name:'자가', Alias:'자가'});
        }
        
    }

    ngOnInit() {
        this.panelTitle = '외주절단발주';

        // 입력일
        this.inputForm.controls['order_date'].setValue(this.tDate);

        // poc_no 체크 (외주절단지시에서 넘어온 경우)
        this.route.params.subscribe(params => {
            if (Object.keys(params).indexOf('id') !== -1) {
                this.inputForm.patchValue({
                    outs_partner_name: params['outs_name'],
                    outs_partner_code: params['outs_code']
                });
                this.GetPlanningInfo(params['id'], params['outs_name']);
                this.ppId = params['id'];
            }
        });
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['outs_partner_code'].setValue(0);
        } else {
            this.inputForm.controls['outs_partner_code'].setValue(event.item.Code);
        }
    }

    CalculOrderAmount (event): void {
        let formData = this.inputForm.value;
        let f = event.target.id.replace('order_weight', 'order_amount');
        let q = this.utils.removeComma(event.target.value) * 1;
        let p = this.utils.removeComma(formData.material_price) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls[f].setValue(dp);
    }

    Save () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if(!this.ppId) {
            alert('수주번호가 존재하지 않습니다.');
            return false;
        }

        let formData = this.inputForm.value;
        if ( ! formData.outs_partner_name ) {
            alert('절단업체를 선택해주세요!');
            return false;
        }
        if ( ! this.usedRcvItems ) {
            alert('재고를 선택해주세요!');
            return false;
        }

        formData.order_qty = this.utils.removeComma(formData.order_qty) * 1;

        formData.order_date = this.datePipe.transform(formData.order_date, 'yyyy-MM-dd');
        formData.rcv_req_date = this.datePipe.transform(formData.rcv_req_date, 'yyyy-MM-dd');

        formData.used_rcv_items = this.usedRcvItems;

        formData.pp_id = this.ppId * 1;
        formData.size = formData.size * 1;

        this.Create(formData);
    }

    Reset() {
        this.inputForm.reset();
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.messageService.add(this.addOkMsg);
                        this.inputForm.reset();

                        // 원자재 재고현황 reload
                        this.getMaterialsReceiving(data['data']['material'], data['data']['size'], data['data']['partner_name']);

                        // 절단작업지시서 발행
                        this.openCreateCuttingOrderModal(data['pocNo']);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    private openCreateCuttingOrderModal(pocNo): void {
        this.cuttingWorkAllocationTitle = '절 단 작 업 지 시 서';
        this.cuttingWorkAllocationToday = Date.now();

        this.dataService.GetCuttingWorkAllocation(pocNo).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    let data = editData['data'];
                    this.v_input_date = data.input_date;
                    this.v_poc_no = data.poc_no;
                    this.v_order_no = data.order_no;
                    this.v_product_code = data.product_code;
                    this.v_product_name = data.product_name;
                    this.v_partner_code = data.partner_code;
                    this.v_partner_name = data.partner_name;
                    this.v_product_type = data.product_type;
                    this.v_drawing_no = data.drawing_no;
                    this.v_sub_drawing_no = data.sub_drawing_no;
                    this.v_order_qty = data.order_qty;
                    this.v_material = data.material;
                    this.v_size = data.size;
                    this.v_cut_length = data.cut_length;
                    this.v_steel_maker = data.steel_maker;
                    this.v_ms_no = data.ms_no;
                    this.v_material_weight = data.material_weight;
                    this.v_input_weight = data.input_weight;
                    this.v_product_weight = data.product_weight + 'Kg';
                    this.v_product_price = data.product_price;
                    this.v_production_line = data.production_line;
                    this.v_working_stime = data.working_stime;
                    this.v_production_time = data.production_time;
                    this.v_cutting_partner_code = data.cutting_partner_code;
                    this.v_cutting_partner_name = data.cutting_partner_name;
                    this.v_mold_no = data.mold_no;
                    this.v_mold_size = data.mold_size;
                    this.v_mold_storage = data.mold_storage;
                    this.v_release_type = data.release_type;
                    this.v_outs_partner_name = (data.release_type == 2) ? data.outs_partner_name : '자가';

                    // 콤비 제품인 경우
                    if (editData['combiData'] != '') {
                        let combiData = editData['combiData'];
                        this.v_product_code = this.v_product_code + ', ' + combiData.product_code;
                        this.v_product_name = this.v_product_name + ', ' + combiData.product_name;
                        this.v_product_weight = this.v_product_weight + ', ' + combiData.product_weight + 'Kg';
                    }

                    this.CuttingOrderModal.show();
                }
            }
        );
    }

    // loadInfo(event) {
    //     let PocNo = event.target.value;
    //     if ( ! PocNo ) {
    //         return false;
    //     }
    //     this.GetForgingDataByPocNo(PocNo);
    // }

    // GetForgingDataByPocNo (pocNo): void {
    GetPlanningInfo (id, outs_name): void {
        // 단조품정보
        // this.dataService.GetById(pocNo).subscribe(
        this.dataService.GetPlanningInfo(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.formData = editData['data'];

                    this.inputForm.patchValue({
                        product_code: this.formData.product_code,
                        product_name: this.formData.product_name,
                        drawing_no: this.formData.drawing_no,
                        //outs_partner_code: this.formData.outs_partner_code, // cutting_partner_code
                        //outs_partner_name: this.formData.outs_partner_name, // cutting_partner_name
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        material: this.formData.material,
                        steel_maker: this.formData.steel_maker,
                        size: this.formData.size,
                        cut_length: this.formData.cut_length,
                        order_qty: this.utils.addComma(this.formData.order_qty),
                        input_weight: this.formData.input_weight,
                        forwarding_weight: this.utils.addComma(this.formData.order_qty * this.formData.input_weight)
                    });
                    this.calculForwardingWeight();

                    // 원자재 재고현황
                    this.getMaterialsReceiving(this.formData.material, this.formData.size, outs_name);
                }
            }
        );
    }

    getMaterialsReceiving(material, size, partner_name): void {
        let params = {
            partner_name: partner_name,
            material: material,
            size: size,
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


    

    loadMaterial(event) {                   
        let formData = this.inputForm.value;
        let partner_name = formData.outs_partner_name;
        let material = formData.material;
        let size = formData.size;
        
        if(!partner_name || !material || !size) {
            this.messageService.add('지시재질 또는 규격을 입력하세요.');
            return false;
        } else if(isNaN(size)) {
            this.messageService.add('지시규격은 숫자로만 입력하세요.');
            return false;
        }

        this.getMaterialsReceiving(material, size, partner_name);        
    }



    onSelect({ selected }) {
        this.selectedId = selected[0].product_code;
    }

    calculForwardingWeight() {
        let formData = this.inputForm.value;
        let order_qty = this.utils.removeComma(formData.order_qty * 1) * 1;
        let input_weight = this.utils.removeComma(formData.input_weight) * 1;
        let forwardingWeight:number = Math.round(order_qty * input_weight * 10) * 0.1;
        if (forwardingWeight > 0) {
            this.inputForm.patchValue({forwarding_weight: this.utils.addComma(forwardingWeight)});
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
        if ( ! formData.forwarding_weight || formData.forwarding_weight == '') {
            alert('수량을 입력하여 출고중량을 계산해주세요');
            return false;
        }

        let usedItemArr = [];
        let usedQuantity: number;
        let forwardingWeight: number;

        forwardingWeight = this.utils.removeComma(formData.forwarding_weight);
        usedQuantity = 0;
        this.selectedRcvItems.forEach((e:any) => {

            this.inputForm.patchValue({
                steel_maker: e.steel_maker,
                storage: e.storage,
                ms_no: e.ms_no
            });

            if (forwardingWeight > 0) {
                forwardingWeight = forwardingWeight - e.remaining_weight;

                let usedQty: number;
                if (forwardingWeight >= 0) {
                    usedQty = e.remaining_weight;
                } else {
                    usedQty = e.remaining_weight + forwardingWeight;
                }

                usedQuantity = usedQuantity + usedQty;
                usedItemArr.push(e.id + ':' + e.material_code + ':' + usedQty + ':' + (e.remaining_weight - usedQty));
            }
        });
        this.usedRcvItems = usedItemArr.join(',');
        console.log(this.usedRcvItems);
    }
}
