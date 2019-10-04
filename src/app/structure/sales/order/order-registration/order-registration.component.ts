import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderRegistrationService } from './order-registration.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item, PartnerItem } from './order-registration.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './order-registration.component.html',
    styleUrls: ['./order-registration.component.css'],
    providers: [OrderRegistrationService, DatePipe]
})
export class OrderRegistrationComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    isLoadingProgress: boolean = false;
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
    sch_product_name: string;
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
    isCombi: boolean = false;
    prodTypeStr: string;
    combiTypeStr: string;
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
        private dataService: OrderRegistrationService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        console.log("in")
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
            partner_code: ['', Validators.required],
            partner_name: ['', Validators.required],
            input_date: ['', Validators.required],
            order_type1: ['', Validators.required],
            order_type2: ['', Validators.required],
            product_code: ['', Validators.required],
            combi_product_code: '',
            is_combi: '',
            order_qty: ['', Validators.required],
            delivery_date: ['', Validators.required],
            // product_type: '',
            // drawing_no: '',
            // sub_drawing_no: '',
            promised_date: ['', Validators.required],
            production_line: ['', Validators.required],
            product_name: '',
            size: '',
            combi_product_name: '',
            product_price: '',
            combi_product_price: '',
            order_no: '',
            modi_reason: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '제품마스터';
        this.inputFormTitle = '수주 등록';

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
        this.selectedId = '';

        let formData = this.searchForm.value;

        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            let params = {
                partner_code: this.listSltdPaCode,
                partner_name: formData.sch_partner_name,
                product_name: formData.sch_product_name,
                st: 1,
                sortby: ['sort_no'],
                order: ['asc'],
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
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['Code'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['Code'];
        }

        const val = this.listSltdPaCode;

        this.getAll();
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
            return d.product_code.indexOf(val) !== -1 || !val;
        })

        // update the rows
        this.rows = temp;
        // 필터 변경될때마다 항상 첫 페이지로 이동.
        //this.table.offset = 0;
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

    Save () {
         let formData = this.inputForm.value;
         if ( ! formData.production_line ) {
             alert('작업라인을 선택해주세요!');
             return false;
         }
         if (this.isEditMode == true && ! formData.modi_reason) {
             alert('정정사유를 선택해주세요!');
             return false;
         }
         formData.product_price = this.utils.removeComma(formData.product_price) * 1;
         formData.order_qty = this.utils.removeComma(formData.order_qty) * 1;

         formData.delivery_date = this.datePipe.transform(formData.delivery_date, 'yyyy-MM-dd');
         formData.promised_date = this.datePipe.transform(formData.promised_date, 'yyyy-MM-dd');
         formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');

         formData.is_tmp_price = 'N';
         formData.st = 1;

         if (this.isCombi == true) {
             formData.combi_product_price = this.utils.removeComma(formData.combi_product_price) * 1;
         }

         this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        // this.router.navigate(['/sales/order/order-adjustment']);
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
        if (this.isExecutable == true) {
            this.inputFormModal.show();
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        // 입력폼 리셋
        this.inputForm.reset();

        // 수주구분1 기본값
        this.inputForm.controls['order_type1'].setValue("D");

        // 입력일
        this.inputForm.controls['input_date'].setValue(this.tDate);

        // 수주번호
        this.dataService.createOrderNo()
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.controls['order_no'].setValue(data['order_no']);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );

        // 제품정보
        this.dataService.GetProductInfo(this.selectedId).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let product_price = this.utils.addComma(this.formData.product_price);

                    this.isCombi = false;
                    if (this.formData.is_combi == 'Y') {
                        this.isCombi = true;
                    }
                    if (this.formData.is_tmp_price == 'Y') {
                        this.isTmpPrice = true;
                    }

                    // 콤비제품인 경우
                    let combi_product_code = '';
                    let combi_product_name = '';
                    let combi_product_price = 0;
                    let combi_product_weight = 0.0;
                    let combi_heating_spec = '';
                    if (this.isCombi == true) {
                        combi_product_code = editData['combiData'].product_code;
                        combi_product_name = editData['combiData'].product_name;
                        combi_product_price = this.utils.addComma(editData['combiData'].product_price);

                        this.getCombiTypeString(this.formData.product_code);
                    }

                    this.inputForm.patchValue({
                        product_code: this.selectedId,
                        partner_code: this.formData.partner_code,
                        partner_name: this.formData.partner_name,
                        product_name: this.formData.product_name,
                        // product_type: this.formData.product_type,
                        // drawing_no: this.formData.drawing_no,
                        // sub_drawing_no: this.formData.sub_drawing_no,
                        size: this.formData.size,
                        production_line: this.formData.production_line,
                        product_price: product_price,
                        is_combi: this.formData.is_combi,
                        combi_product_code: combi_product_code,
                        combi_product_name: combi_product_name,
                        combi_product_price: combi_product_price
                    });
                }
            }
        );
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

    onSelect({ selected }) {
        this.selectedId = selected[0].product_code;
    }

}
