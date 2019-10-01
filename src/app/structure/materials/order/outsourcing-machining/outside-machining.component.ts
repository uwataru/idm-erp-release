import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OutsideMachiningService } from './outside-machining.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './outside-machining.item';

@Component({
    selector: 'app-page',
    templateUrl: './outside-machining.component.html',
    styleUrls: ['./outside-machining.component.css'],
    providers: [OutsideMachiningService, DatePipe]
})
export class OutsideMachiningComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;


    formData: Item['data'];
    inputForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type44Partners'];
    price_per_unit: number;
    order_qty: number;
    editData: Item;
    data: Date;
    selectedId: string;
    usedRcvItems: string;
    messages = this.globals.datatableMessages;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private router: Router,
        private datePipe: DatePipe,
        private dataService: OutsideMachiningService,
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
            forging_id: ['', Validators.required],
            order_date: ['', Validators.required],
            rcv_req_date: ['', Validators.required],
            poc_no: ['', Validators.required],
            order_qty: ['', Validators.required],
            partner_name: ['', Validators.required],
            partner_code: ['', Validators.required],
            machining_process: '',
            price_per_unit: '',
            outs_cost: '',
            product_code: '',
            product_name: '',
            drawing_no: '',
            material: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '외주가공발주';

        // 입력일
        this.inputForm.controls['order_date'].setValue(this.tDate);
    }

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_code'].setValue(0);
        } else {
            this.inputForm.controls['partner_code'].setValue(event.item.Code);
        }
    }

    Save () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let formData = this.inputForm.value;
        if ( ! formData.partner_name ) {
            alert('가공업체를 선택해주세요!');
            return false;
        }

        formData.order_qty = this.utils.removeComma(formData.order_qty) * 1;

        formData.order_date = this.datePipe.transform(formData.order_date, 'yyyy-MM-dd');
        formData.rcv_req_date = this.datePipe.transform(formData.rcv_req_date, 'yyyy-MM-dd');

        formData.price_per_unit = this.utils.removeComma(formData.price_per_unit) * 1;
        formData.outs_cost = this.utils.removeComma(formData.outs_cost) * 1;

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
                        this.inputForm.reset();
                        this.inputForm.controls['order_date'].setValue(this.tDate);
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    loadInfo(event) {
        let PocNo = event.target.value;
        if ( ! PocNo ) {
            return false;
        }

        // 단조품정보
        this.dataService.GetById(PocNo).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];

                    this.inputForm.patchValue({
                        forging_id: this.formData.id,
                        product_code: this.formData.product_code,
                        product_name: this.formData.product_name,
                        drawing_no: this.formData.drawing_no,
                        material: this.formData.material,
                        order_qty: this.utils.addComma(this.formData.production_qty * 1)
                    });
                }
            }
        );
    }

    calculOutsCost() {
        let formData = this.inputForm.value;
        let order_qty = this.utils.removeComma(formData.order_qty)*1;
        let price_per_unit = this.utils.removeComma(formData.price_per_unit)*1;

        this.inputForm.patchValue({outs_cost: this.utils.addComma(order_qty * price_per_unit)})
    }
}
