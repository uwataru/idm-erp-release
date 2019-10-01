import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { DefectInspectionService } from './defect-inspection.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './defect-inspection.item';

@Component({
    selector: 'app-page',
    templateUrl: './defect-inspection.component.html',
    styleUrls: ['./defect-inspection.component.scss'],
    providers: [DefectInspectionService, DatePipe]
})
export class DefectInspectionComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    selectedCnt: number;
    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    rows = [];
    materialRows = [];
    delId = [];
    selected = [];
    selectedRcvItems = [];
    usedRcvItems: string;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    screeningQty: number;
    inputPartners: any[];
    defectiveClassification: any[] = this.globals.configs['defectiveClassification'];
    sltdInvenClass: number;
    cuttingInvenQty: number;
    forgingInvenQty: number;
    sltdOutsInvenClass: string;
    outsInvenQty: number;
    outsCuttingInvenQty: number;
    outsForgingInvenQty: number;
    outsHeatingInvenQty: number;
    outsMachiningInvenQty: number;
    prodInvenQty: number;
    unsoldInvenQty: number;
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

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: DefectInspectionService,
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
            product_code: ['', Validators.required],
            product_name: ['', Validators.required],
            drawing_no: ['', Validators.required],
            poc_no: ['', Validators.required],
            production_date: ['', Validators.required],
            production_qty: ['', Validators.required],
            inventory_classification: ['', Validators.required],
            outs_inven_type: '',
            outs_partner_name: '',
            outs_partner_code: '',
            defective_qty: '',
            defective_classification: ['', Validators.required],
            refer_etc: '',
            inspector: '',
            inspection_date: '',
            input_date: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '검사불량입력';
        this.inputForm.controls['input_date'].setValue(this.tDate);
        //this.getAll();
    }

    // getAll(): void {
    //     let params = {}
    //     this.isLoadingProgress = true;
    //     this.dataService.GetAll(params).subscribe(
    //         listData =>
    //         {
    //             this.listData = listData;
    //             this.rows = listData['data'];
    //
    //             this.isLoadingProgress = false;
    //         }
    //     );
    // }
    loadInputPartners(code):void {
        switch (code) {
            case 'C': this.inputPartners = this.globals.configs['type42Partners']; break;
            case 'F': this.inputPartners = this.globals.configs['type41Partners']; break;
            case 'H': this.inputPartners = this.globals.configs['type43Partners']; break;
            case 'M': this.inputPartners = this.globals.configs['type44Partners']; break;
        }
        //this.sltdOutsInvenClass = 'C';
    }
    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['outs_partner_code'].setValue(0);
        } else {
            this.inputForm.controls['outs_partner_code'].setValue(event.item.Code);
        }
    }

    Save () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }
        
        let formData = this.inputForm.value;
        if ( formData.inventory_classification == 3 && !formData.outs_partner_code ) {
            alert('거래처를 선택해주세요!');
            return false;
        }

        formData.inventory_classification = formData.inventory_classification * 1;
        formData.defective_classification = formData.defective_classification * 1;
        formData.screening_qty = this.utils.removeComma(formData.screening_qty) * 1;
        formData.defective_qty = this.utils.removeComma(formData.defective_qty) * 1;
        formData.inspection_date = this.datePipe.transform(formData.inspection_date, 'yyyy-MM-dd');
        formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');

        this.Create(formData);
    }

    Reset() {
        this.inputForm.reset();
        this.sltdInvenClass = 0;
        this.cuttingInvenQty = 0;
        this.forgingInvenQty = 0;
        this.outsInvenQty = 0;
        this.outsCuttingInvenQty = 0;
        this.outsForgingInvenQty = 0;
        this.outsHeatingInvenQty = 0;
        this.outsMachiningInvenQty = 0;
        this.inputForm.controls['input_date'].setValue(this.tDate);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.Reset();
                        //this.getAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    loadInfo() {
        let formData = this.inputForm.value;
        let ProductCode = formData.product_code;
        let PocNo = formData.poc_no;

        if ( ! ProductCode ) {
            this.messageService.add('제품코드를 입력해주세요');
            return false;
        }
        if ( ! PocNo ) {
            this.messageService.add('POC NO를 입력해주세요');
            return false;
        }

        // 입력폼 리셋
        this.inputForm.reset();
        this.sltdInvenClass = 0;
        this.inputForm.controls['input_date'].setValue(this.tDate);

        // 내용
        this.dataService.GetById(PocNo, ProductCode).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];

                    this.screeningQty = editData['screeningQty'] * 1;

                    this.sltdInvenClass = editData['inventory_classification'];
                    this.cuttingInvenQty = editData['cutting_inven_qty'];
                    this.forgingInvenQty = editData['forging_inven_qty'];
                    this.outsInvenQty = editData['outs_inven_qty'];
                    this.outsCuttingInvenQty = editData['outs_cutting_inven_qty'];
                    this.outsForgingInvenQty = editData['outs_forging_inven_qty'];
                    this.outsHeatingInvenQty = editData['outs_heating_inven_qty'];
                    this.outsMachiningInvenQty = editData['outs_machining_inven_qty'];
                    this.prodInvenQty = editData['product_inven_qty'];
                    this.unsoldInvenQty = editData['unsold_inven_qty'];

                    if (this.outsCuttingInvenQty > 0) {
                        this.sltdOutsInvenClass = 'C';
                    }
                    if (this.outsForgingInvenQty > 0) {
                        this.sltdOutsInvenClass = 'F';
                    }
                    if (this.outsMachiningInvenQty > 0) {
                        this.sltdOutsInvenClass = 'M';
                    }
                    if (this.outsHeatingInvenQty > 0) {
                        this.sltdOutsInvenClass = 'H';
                    }
                    this.loadInputPartners(this.sltdOutsInvenClass);

                    // let order_cutting_qty = this.formData.order_qty * 1;
                    // let order_input_weight = this.formData.input_weight * 1;
                    // let order_input_weight_total = Math.round(order_cutting_qty * order_input_weight * 10) * 0.1;
                    this.inputForm.patchValue({
                        product_code: ProductCode,
                        poc_no: PocNo,
                        inventory_classification: editData['inventory_classification'],
                        outs_inven_type: this.sltdOutsInvenClass,
                        product_name: this.formData.product_name,
                        drawing_no: this.formData.drawing_no,
                        production_date: this.formData.production_date,
                        production_qty: this.formData.production_qty
                    });
                }
            }
        );
    }

}
