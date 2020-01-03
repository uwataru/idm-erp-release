import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OrderRegistrationService } from './order-registration.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './order-registration.item';

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
  listData: Item[];
  formData: Item['data'];
  sch_partner_name: string;
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
  partnerList: any[] = this.globals.configs['partnerList'];
  productionLines: any[] = this.globals.configs['productionLine'];
  productList: any[] = this.globals.configs['productList'];
  prodTypeStr: string;
  combiTypeStr: string;
  product_price: number;
  isTmpPrice: boolean;
  order_qty: number;
  editData: Item;
  data: Date;

  productDataCnt: number;

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
    private dataService: OrderRegistrationService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
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

  buildInputFormGroup() {
    this.inputForm = this.fb.group({
      input_date: ['', Validators.required],
      order_no: ['', Validators.required],
      partner_id: [''],
      sch_partner_name: ['', Validators.required],
      order_type: ['', Validators.required],
      demand_date: ['', Validators.required],
      promised_date: ['', Validators.required],
      sch_product_1: ['', Validators.required],
      product_id_1: [''],
      product_type_1: ['', Validators.required],
      product_qty_1: ['', Validators.required],
      product_unit_price_1: ['', Validators.required],
      product_base_unit_price_1: [''],
      product_price_1: ['', Validators.required],
      // sch_work_line_1: ['', Validators.required],
      // product_workline_id_1: [''],
    });
  }

  ngOnInit() {
    this.panelTitle = '수주 현황';
    this.inputFormTitle = '수주 등록';

    this.productDataCnt = 1;

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
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
    setTimeout(() => {

      this.selectedId = '';

      let formData = this.searchForm.value;

      let params = {
        partner_name: formData.sch_partner_name,
        product_name: formData.sch_product_name.trim(),
        // maxResultCount: 10000
      };

      this.isLoadingProgress = true;
      this.dataService.GetAll(params).subscribe(
        listData => {
          this.listData = listData;
          this.temp = [];
          this.rows = [];
          if (listData['totalCount'] > 0) {
            this.temp = listData['data'];
            this.rows = listData['data'].map(x => Object.assign({}, x));
            this.dataConvert();
          }

          this.isLoadingProgress = false;
        }
      );
    }, 10);
  }

  dataConvert() {  //같은 수주 번호 제품은 기본수주정보 제거
    let len = this.rows.length;
    for (let i = 0; i < len; i++) {
      if (this.rows[i - 1] != null && this.rows[i].id == this.rows[i - 1].id) {
        this.rows[i].order_no = '';
        this.rows[i].partner_name = '';
        this.rows[i].demand_date = '';
        this.rows[i].promised_date = '';
      }
    }
  }

  onSearchSelectListPartner(event: TypeaheadMatch): void {
    console.log(event);
    let id = event.item['id'];
    if (id == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = id;
    }

    const val = this.listSltdPaCode;

    this.getAll();
  }

  updateFilter(event) {
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
    setTimeout(() => {
      const val = event.target.value.trim();
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
    }, 10);
  }

  copy_date(event): void {
    let formData = this.inputForm.value;
    if (formData.promised_date == null || formData.promised_date == '') {
      this.inputForm.patchValue({ promised_date: event.target.value });
    }
  }

  onValueChange(value: Date): void {
    this.inputForm.patchValue({ promised_date: value });
  }

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
    let formData = this.inputForm.value;
    // if (!formData.production_line) {
    //   alert('작업라인을 선택해주세요!');
    //   return false;
    // }
    // if (this.isEditMode == true && !formData.modi_reason) {
    //   alert('정정사유를 선택해주세요!');
    //   return false;
    // }

    formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');
    formData.demand_date = this.datePipe.transform(formData.demand_date, 'yyyy-MM-dd');
    formData.promised_date = this.datePipe.transform(formData.promised_date, 'yyyy-MM-dd');

    formData.sales_orders_detail = [];
    for (let i = 1; i <= this.productDataCnt; i++) {
      if (formData['product_id_' + i] != -1) {  //-1 은 삭제된 행
        let product = {
          product_id: formData['product_id_' + i],
          product_qty: parseInt(this.utils.removeComma(formData['product_qty_' + i])),
          product_price: parseInt(this.utils.removeComma(formData['product_price_' + i])),
          production_wrokline_id: formData['product_workline_id_' + i],
        }
        formData.sales_orders_detail.push(product);
      }

      delete formData['sch_product_' + i];
      delete formData['product_id_' + i];
      delete formData['product_type_' + i];
      delete formData['product_qty_' + i];
      delete formData['product_unit_price_' + i];
      delete formData['product_base_unit_price_' + i];
      delete formData['product_price_' + i];
      // delete formData['sch_work_line_'+i];
      // delete formData['product_workline_id_'+i];
    }

    console.log('save', this.selectedId, formData);
    this.Create(formData);
  }

  Create(data): void {
    this.dataService.Create(data)
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
    this.buildInputFormGroup();

    // 수주구분1 기본값
    this.inputForm.controls['order_type'].setValue('Y');

    // 입력일
    this.inputForm.controls['input_date'].setValue(this.tDate);

    // 수주번호
    this.dataService.createOrderNo()
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.inputForm.controls['order_no'].setValue(data['order_no']);
          } else {
            this.messageService.add(data['errorMessage']);
          }
        },
        error => this.errorMessage = <any>error
      );
  }

  onSelect({ selected }) {
    this.selectedId = selected[0].product_code;
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    console.log('onSelectListPartner', event.item);
    this.inputForm.controls['partner_id'].setValue(event.item.id);
  }

  onSelectListProduct(event: TypeaheadMatch, index): void {
    console.log('onSelectListProduct', event.item, index);
    this.inputForm.controls['product_unit_price_' + index].setValue(this.utils.addComma(event.item.product_price));
    this.inputForm.controls['product_base_unit_price_' + index].setValue(event.item.product_price);
    this.inputForm.controls['product_id_' + index].setValue(event.item.id);
    this.inputForm.controls['product_type_' + index].setValue(event.item.type);
  }

  onSelectListWorkLine(event: TypeaheadMatch, index): void {
    console.log('onSelectListWorkLine', event.item, index);
    this.inputForm.controls['product_workline_id_' + index].setValue(event.item.id);
  }

  calculatePrice(event, index) {
    console.log('calculatePrice', event, index);
    let formData = this.inputForm.value;

    console.log(formData['product_qty_' + index], formData['product_base_unit_price_' + index]);
    let mQty = this.utils.removeComma((formData['product_qty_' + index]));
    let mPrice = parseInt(formData['product_base_unit_price_' + index]);

    let result = mQty * mPrice;
    result = this.utils.addComma(result);
    this.inputForm.controls['product_price_' + index].setValue(result);

    this.AddComma(event);
    // console.log('calculatePrice', this.inputForm.value);
  }

  addMaterialRow() {
    console.log('addMaterialRow');
    this.productDataCnt++;
    let index = this.productDataCnt;

    this.inputForm.addControl('sch_product_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('product_id_' + index, new FormControl(''));
    this.inputForm.addControl('product_type_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('product_qty_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('product_unit_price_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('product_base_unit_price_' + index, new FormControl(''));
    this.inputForm.addControl('product_price_' + index, new FormControl('', Validators.required));
    // this.inputForm.addControl('sch_work_line_' + index, new FormControl('', Validators.required));
    // this.inputForm.addControl('product_workline_id_' + index, new FormControl(''));
  }

  removeMaterialRow(index) {
    console.log('removeMaterialRow', index);
    this.inputForm.controls['product_id_' + index].setValue(-1); //save() 할 때 이 값을 기준으로 삭제된 행인지 판단.
    if (this.isEditMode == false) {
      this.inputForm.controls['sch_product_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
      this.inputForm.controls['product_type_' + index].setValue(-1);
      this.inputForm.controls['product_qty_' + index].setValue(-1);
      this.inputForm.controls['product_unit_price_' + index].setValue(-1);
      this.inputForm.controls['product_price_' + index].setValue(-1);
      // this.inputForm.controls['sch_work_line_' + index].setValue(-1);
    }
  }

  chkViewAddBtn(index) {
    let len = this.productDataCnt;
    let unVisibleItemCnt = 0;
    for (let i = index + 1; i <= len; i++) {
      if (this.inputForm.value['product_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    // console.log(index, len , unVisibleItemCnt);
    if ((len - unVisibleItemCnt) == index) {
      return true;
    }
    return false;

  }

  chkViewRemoveBtn(index) {
    let len = this.productDataCnt;
    let unVisibleItemCnt = 0;
    for (let i = 1; i <= len; i++) {
      if (this.inputForm.value['product_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    if (len - unVisibleItemCnt > 1) {
      return true;
    }
    return false;
  }

}
