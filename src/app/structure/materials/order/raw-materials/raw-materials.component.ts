import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { RawMaterialsService } from './raw-materials.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './raw-materials.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './raw-materials.component.html',
    styleUrls: ['./raw-materials.component.css'],
    providers: [RawMaterialsService, DatePipe]
})
export class RawMaterialsComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    lossFormTitle: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['type2Partners'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_material: string;
    sch_st: number;
    st: number;
    rows = [];
    materialRows = [];
    selectedRcvItems = [];

    temp = [];
    delId = [];
    selected = [];
    selectedId: string;
    selectedCnt: number;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    lossForm: FormGroup;
    inputPartners: any[] = this.globals.configs['type2Partners'];
    locationPartners: any[] = this.globals.configs['type4Partners'];

    inputMakers: any[] = this.globals.configs['maker'];
    product_price: number;
    isTmpPrice: boolean;
    editData: Item;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('LossFormModal') lossFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private router: Router,
        private datePipe: DatePipe,
        private dataService: RawMaterialsService,
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
            sch_material: ''
        });
        this.inputForm = fb.group({
            material_code: '',
            material_name: ['', Validators.required],
            material_size: ['', Validators.required],
            material_maker_name: '',
            material_maker: '',
            partner_name: ['', Validators.required],
            partner_code: '',
            price_per_unit: ['', Validators.required],
            order_date1: ['', Validators.required],
            order_date2: '',
            order_date3: '',
            order_weight1: ['', Validators.required],
            order_weight2: '',
            order_weight3: '',
            order_amount1: ['', Validators.required],
            order_amount2: '',
            order_amount3: '',
            rcv_request_date1: ['', Validators.required],
            rcv_request_date2: '',
            rcv_request_date3: '',
            rcv_location1: ['', Validators.required],
            rcv_location2: '',
            rcv_location3: '',
            remaining_weight:''
        });

        this.lossForm = fb.group({
            material_code: '',
            material_name: '',
            material_size: '',
            material_maker_name: '',
            material_maker: '',
            partner_name: '',
            partner_code: '',
            price_per_unit: '',
            weight_used: ['', Validators.required],
            input_date: ['', Validators.required]
        });

        if( this.locationPartners.filter(v => v.Code == 0).length < 1 ) {
            this.locationPartners.unshift({Code:0, Name:'자가', Alias:'자가'});
        }

    }

    ngOnInit() {
        this.panelTitle = '원자재발주';
        this.inputFormTitle = '원자재발주';
        this.lossFormTitle = 'LOSS처리';

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
            //partner_name: formData.sch_partner_name,
            material: formData.sch_material,
            st: 1,
            //sortby: ['material_name','size'],
            sortby: ['partner_name','material_name','size'],
            order: ['asc','asc'],
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
            return d.material.indexOf(val) !== -1 || !val;
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
        let p = this.utils.removeComma(formData.price_per_unit) * 1;
        let dp = this.utils.addComma(q * p)
        this.inputForm.controls[f].setValue(dp);
    }

    onValueChange(value: Date): void {
        this.inputForm.patchValue({promised_date: value});
    }


    loadMaterial() {
        let formData = this.lossForm.value;
        let params = {
            material: formData.material_name,
            size: formData.material_size,
            steel_maker: formData.material_maker
        }
        this.isLoadingProgress = true;
        setTimeout(() => {
            this.dataService.GetMaterialsReceiving(params).subscribe(
                listData =>
                {
                    //합계뺀다
                    this.materialRows = listData['data'].filter(v => v.id != 0);
                    this.isLoadingProgress = false;
                }
            );
        }, 100);
    }



    lossSave () {
        let formData = this.lossForm.value;
        let params = {
            material_code: formData.material_code,
            weight_used: formData.weight_used * 1,
            input_date: this.datePipe.transform(formData.input_date, 'yyyy-MM-dd'),
            inventory_id: this.selectedRcvItems[0].id
        }
        this.dataService.LossSave(params)
        .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.inputForm.reset();
                    this.getAll();
                    this.messageService.add(this.addOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.lossFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );

    }

    Save () {
        let formModel = this.inputForm.value;

        let rowData = [];
        for (let i=1; i<=3; i++) {
            let colData = [];

            let order_date = this.datePipe.transform(formModel['order_date' + i], 'yyyy-MM-dd');
            colData.push(order_date);

            let order_weight = this.utils.removeComma(formModel['order_weight' + i]) * 1;
            colData.push(order_weight);

            let order_amount = this.utils.removeComma(formModel['order_amount' + i]) * 1;
            colData.push(order_amount);

            let rcv_request_date = this.datePipe.transform(formModel['rcv_request_date' + i], 'yyyy-MM-dd');
            colData.push(rcv_request_date);

            colData.push(formModel['rcv_location' + i]);

            rowData.push(colData.join(':#:'));
        }

        let formData = {
            material_code: formModel.material_code,
            material_name: formModel.material_name,
            material_size: formModel.material_size*1,
            material_maker: formModel.material_maker,
            partner_name: formModel.partner_name,
            partner_code: formModel.partner_code*1,
            price_per_unit: this.utils.removeComma(formModel.price_per_unit)*1,
            material_order: rowData.join('=||='),
            // 재고수량 추가
            remaining_weight: formModel.remaining_weight
        }

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

    openModal(type) {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let myForm: FormGroup;
        if(type == 'order') {
            this.inputFormModal.show();
            this.inputForm.reset();
            this.inputForm.controls['order_date1'].setValue(this.tDate);
            myForm = this.inputForm;
        } else if(type == 'loss') {
            this.lossFormModal.show();
            this.lossForm.reset();
            myForm = this.lossForm;
        }

        this.dataService.GetMaterialInfo(this.selectedId).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let price_per_unit = this.utils.addComma(this.formData.price);


                    myForm.patchValue({
                        material_code: this.formData.code,
                        material_name: this.formData.material,
                        material_size: this.formData.size,
                        material_maker_name: this.formData.maker_name,
                        material_maker: this.formData.maker,
                        partner_name: this.formData.partner_name,
                        partner_code: this.formData.partner_code,
                        price_per_unit: price_per_unit,
                        remaining_weight: this.formData.remaining_weight
                    });

                    if(type == 'loss') {
                        this.loadMaterial();
                    }
                }
            }
        );
    }

    onSelect({ selected }) {
        //this.selectedId = selected[0].material_code;
        this.selectedCnt = selected.length;
        if (this.selectedCnt == 1) {
            this.selectedId = selected[0].material_code;
        }
    }


    onSelectLocationPartner(event: TypeaheadMatch, type: string): void {
        if (event.item == '') {
            this.inputForm.controls['rcv_location'+type].setValue("");
        } else {
            this.inputForm.controls['rcv_location'+type].setValue(event.item.Name);
        }
    }

}
