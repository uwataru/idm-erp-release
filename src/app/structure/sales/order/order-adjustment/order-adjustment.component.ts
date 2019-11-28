import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderAdjustmentService } from './order-adjustment.service';
import { AppGlobals } from '../../../../app.globals';
import {ActivatedRoute, Router} from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './order-adjustment.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './order-adjustment.component.html',
    styleUrls: ['./order-adjustment.component.css'],
    providers: [OrderAdjustmentService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class OrderAdjustmentComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    selectedId: number;
    listData: Item[];
    formData: Item['data'];
    sch_partner_name: string;
    listSltdPaCode: number = 0;
    filteredPartners: any[] = [];
    sch_product_name: string;
    rows = [];
    temp = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    partnerList: any[] = this.globals.configs['partnerList'];
    productionLines: any[] = this.globals.configs['productionLine'];
    productList: any[] = this.globals.configs['productList'];
    correctionReasonList: any[] = this.globals.configs['correctionReasonList'];
    beforeProductQty: number;
    product_price: number;
    isTmpPrice: boolean;
    data: Date;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) public fb: FormBuilder,
        private router: Router,
        private datePipe: DatePipe,
        private dataService: OrderAdjustmentService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ('id' in route.routeConfig.data)) {
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

        this.buildInputFormGroup();
    }

    buildInputFormGroup(){
        this.inputForm = this.fb.group({
            product_name: [''],
            product_type: [''],
            order_type: [''],
            demand_date: [''],
            product_qty: ['', Validators.required],
            price: [''],
            product_price: [''],
            // input_date: [''],
            first_input_date: [''],
            partner_name: [''],
            order_no: [''],
            promised_date: ['', Validators.required],
            line_no: [''],
            sch_correction_reason: ['', Validators.required],
            correction_reason_id: [''],
        });
    }

    ngOnInit() {
        this.panelTitle = '수주 조정';
        this.inputFormTitle = '수주 조정';

        this.getAll();

        $(document).ready(function () {
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll(): void {
        this.selectedId = -1;

        let formData = this.searchForm.value;

        let params = {
            partner_code: this.listSltdPaCode,
            // sortby: ['order_no'],
            // order: ['asc']
            // maxResultCount: 10000
        };

        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData => {
                this.listData = listData as Item[];
                this.temp = listData['data'];
                this.rows = listData['data'].map(x => Object.assign({}, x));
                this.dataConvert();

                this.isLoadingProgress = false;
            }
        );
    }

    dataConvert(){  //같은 수주 번호 제품은 기본수주정보 제거
        let len = this.rows.length;
        for(let i = 0; i<len; i++){
            if(this.rows[i-1] != null && this.rows[i].id == this.rows[i-1].id){
                this.rows[i].order_no = '';
                this.rows[i].partner_name = '';
                this.rows[i].demand_date = '';
                this.rows[i].promised_date = '';
            }
        }
    }

    onSearchSelectListPartner(event: TypeaheadMatch): void {
        // console.log(event);
        let id = event.item['id'];
        if (id == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = id;
        }

        this.getAll();
    }

    updateFilter(event) {
        const val = event.target.value;
        // filter data
        let tempArr = this.temp.map(x => Object.assign({}, x));
        let temp = tempArr.filter(function (d) {
            return d.product_name.indexOf(val) !== -1 || !val;
        });
        // update the rows
        this.rows = temp;
        this.dataConvert()
        // 필터 변경될때마다 항상 첫 페이지로 이동.
        //this.table.offset = 0;
    }

    // copy_date(event): void {
    //     let formData = this.inputForm.value;
    //     if (formData.promised_date == null || formData.promised_date == '') {
    //         this.inputForm.patchValue({promised_date: event.target.value});
    //     }
    // }

    // onValueChange(value: Date): void {
    //     this.inputForm.patchValue({promised_date: value});
    // }

    AddComma(event) {
        var valArray = event.target.value.split('.');
        for (var i = 0; i < valArray.length; ++i) {
            valArray[i] = valArray[i].replace(/\D/g, '');
        }

        var newVal: string;

        if (valArray.length === 0) {
            newVal = '0';
        } else {
            let matches = valArray[0].match(/[0-9]{3}/mig);

            if (matches !== null && valArray[0].length > 3) {
                let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
                let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

                newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
            } else {
                newVal = valArray[0];
            }

            if (valArray.length > 1) {
                newVal += '.' + valArray[1].substring(0, 2);
            }
        }
        this.inputForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
        //this.inputForm.patchValue({'combi_product_price' : this.utils.addComma(newVal)});
    }

    Save() {
        let inputData = this.inputForm.value;
        let afterProductQty = parseInt(this.utils.removeComma(inputData.product_qty));
        switch (inputData.correction_reason_id) {
            case 2:
                if(this.beforeProductQty < afterProductQty){
                    alert('이전 수주량보다 많습니다.');
                    return false;
                }
                break;
            case 3:
                if(this.beforeProductQty > afterProductQty){
                    alert('이전 수주량 보다 작습니다.');
                    return false;
                }
                break;
        }

        let formData = {
            'correction_reason_id': inputData.correction_reason_id,
            'promised_date': this.datePipe.transform(inputData.promised_date, 'yyyy-MM-dd'),
            'product_qty': afterProductQty,
            'price': parseInt(this.utils.removeComma(inputData.price))
        };

        console.log('save', this.selectedId, formData);
        this.Modify(formData);
    }

    Modify(data): void {
        this.dataService.Modify(this.selectedId, data)
            .subscribe(
                data => {
                    if (data['result'] == 'success') {
                        this.inputForm.reset();
                        this.getAll();
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

    openModal(row) {
        // console.log('openModal', row);
        // 실행권한
        if (this.isExecutable == true) {
            this.inputFormModal.show();
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        // 입력폼 리셋
        this.inputForm.reset();
        this.buildInputFormGroup();

        this.selectedId = row.sales_order_detail_id;

        // 수주번호
        this.dataService.GetById(this.selectedId)
            .subscribe(
                data => {
                    if (data['result'] == 'success') {
                        // console.log('GetById', data['data']);
                        this.inputForm.controls['product_name'].setValue(data['data']['product_name']);
                        this.inputForm.controls['product_type'].setValue(data['data']['product_type']);
                        this.inputForm.controls['order_type'].setValue(data['data']['order_type']);
                        this.inputForm.controls['demand_date'].setValue(data['data']['demand_date']);
                        this.inputForm.controls['product_qty'].setValue(this.utils.addComma(data['data']['product_qty']));
                        this.beforeProductQty = data['data']['product_qty'];
                        this.inputForm.controls['price'].setValue(this.utils.addComma(data['data']['price']));
                        this.inputForm.controls['product_price'].setValue(this.utils.addComma(data['data']['product_price']));
                        // this.inputForm.controls['input_date'].setValue(data['data']['input_date']);
                        this.inputForm.controls['first_input_date'].setValue(data['data']['first_input_date']);
                        this.inputForm.controls['partner_name'].setValue(data['data']['partner_name']);
                        this.inputForm.controls['order_no'].setValue(data['data']['order_no']);
                        this.inputForm.controls['promised_date'].setValue(data['data']['promised_date']);
                        this.inputForm.controls['line_no'].setValue(data['data']['line_no']);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    onSelect({selected}) {
        this.selectedId = selected[0].sales_order_detail_id;
    }

    onSelectListCollectionReason(event: TypeaheadMatch): void {
        // console.log('onSelectListPartner', event.item);
        this.inputForm.controls['correction_reason_id'].setValue(event.item.id);
    }

    onSelectListWorkLine(event: TypeaheadMatch, index): void {
        // console.log('onSelectListWorkLine', event.item, index);
        this.inputForm.controls['product_workline_id_' + index].setValue(event.item.id);
    }

    calculatePrice(event) {
        // console.log('calculatePrice', event);
        let formData = this.inputForm.value;

        // console.log(formData['product_qty'], formData['product_price']);
        let mQty = this.utils.removeComma( formData['product_qty'] );
        let mPrice = this.utils.removeComma( formData['product_price'] );

        let result = mQty * mPrice;
        result = this.utils.addComma(result);
        this.inputForm.controls['price'].setValue(result);

        this.AddComma(event);
        // console.log('calculatePrice', this.inputForm.value);
    }

}
