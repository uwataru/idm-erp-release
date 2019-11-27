import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {RawMaterialsService} from './raw-materials.service';
import {AppGlobals} from '../../../../app.globals';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './raw-materials.item';

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

  listData: Item[];
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
  inputPartners: any[] = this.globals.configs['partnerList'] ;
  locationPartners: any[] = this.globals.configs['partnerList'];

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
    });
    this.inputForm = fb.group({
      material_id: '',
      input_date: ['', Validators.required],
      name: '',
      price: '',
      size: '',
      order_price: ['', Validators.required],
      partner_name: '',
      promised_date: ['', Validators.required],
      order_qty: '',
      receiving_location: '',
      receiving_location_id: ['', Validators.required],
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

    // if (this.locationPartners.filter(v => v.id == 0).length < 1) {
    //   this.locationPartners.unshift({id: 0, name: '자가', alias: '자가'});
    // }

  }

  ngOnInit() {
    this.panelTitle = '원자재발주';
    this.inputFormTitle = '원자재발주';
    this.lossFormTitle = 'LOSS처리';

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
    this.selectedCnt = 0;
    this.selectedId = '';
    this.selected = [];

    let formData = this.searchForm.value;
    let params = {
      partner_name: formData.sch_partner_name,
      st: 1,
      //sortby: ['material_name','size'],
      sortby: ['partner_name', 'material_name', 'size'],
      order: ['asc', 'asc'],
      maxResultCount: 10000
    };
    if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
      params['partner_id'] = this.listSltdPaCode;
    }
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
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

    const val = this.listSltdPaCode;
  }

  // onSelectInputPartner(event: TypeaheadMatch): void {
  //   if (event.item == '') {
  //     this.inputForm.controls['partner_code'].setValue(0);
  //   } else {
  //     this.inputForm.controls['partner_code'].setValue(event.item.id);
  //   }
  // }


  updateFilter(event) {
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.material.indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // 필터 변경될때마다 항상 첫 페이지로 이동.
    //this.table.offset = 0;
  }

  CalculOrderAmount(event): void {
    let formData = this.inputForm.value;
    let f = event.target.id.replace('order_qty', 'order_price');
    let q = this.utils.removeComma(event.target.value) * 1;
    let p = formData.price * 1;
    let dp = this.utils.addComma(q * p);
    this.inputForm.controls[f].setValue(dp);
  }

  onValueChange(value: Date): void {
    this.inputForm.patchValue({promised_date: value});
  }


  loadMaterial() {
    let formData = this.lossForm.value;
    let params = {
      name: formData.name,
      size: formData.size,
    };
    this.isLoadingProgress = true;
    setTimeout(() => {
      this.dataService.GetMaterialsReceiving(params).subscribe(
        listData => {
          //합계뺀다
          this.materialRows = listData['data'].filter(v => v.id != 0);
          this.isLoadingProgress = false;
        }
      );
    }, 100);
  }


  lossSave() {
    let formData = this.lossForm.value;
    let params = {
      material_code: formData.material_code,
      weight_used: formData.weight_used * 1,
      input_date: this.datePipe.transform(formData.input_date, 'yyyy-MM-dd'),
      inventory_id: this.selectedRcvItems[0].id
    };
    this.dataService.LossSave(params)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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

  Save() {
    let formModel = this.inputForm.value;

    let rowData = [];
      // let colData = [];

      let input_date = this.datePipe.transform(formModel['input_date'], 'yyyy-MM-dd');

      let order_qty = this.utils.removeComma(formModel['order_qty']) * 1;

      let order_price = this.utils.removeComma(formModel['order_price']) * 1;

      let promised_date = this.datePipe.transform(formModel['promised_date'], 'yyyy-MM-dd');

      // colData.push(formModel['rcv_location_id']);

      // rowData.push(colData.join(':#:'));

    let formData = {
      order_type: true,
      receiving_date: input_date,
      input_date: input_date,
      order_qty: order_qty,
      order_price: order_price,
      material_id: formModel.material_id,
      // order_price: order_price,
      promised_date: promised_date,
      receiving_location_id: formModel.receiving_location_id,
      // id: formModel.id,
      // name: formModel.name,
      // size: formModel.size * 1,
      // partner_name: formModel.partner_name,
      // price_per_unit: this.utils.removeComma(formModel.price_per_unit) * 1,
      // material_order: rowData.join('=||='),
      // 재고수량 추가
      // remaining_weight: formModel.remaining_weight
    };

    this.Create(formData);
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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
    if (type == 'order') {
      this.inputFormModal.show();
      this.inputForm.reset();
      this.inputForm.controls['input_date'].setValue(this.tDate);
      myForm = this.inputForm;
    } else if (type == 'loss') {
      this.lossFormModal.show();
      this.lossForm.reset();
      myForm = this.lossForm;
    }

    this.dataService.GetMaterialInfo(this.selectedId).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          // let price_per_unit = this.utils.addComma(this.formData.order_price);


          myForm.patchValue({
            name: this.formData.name,
            price: this.formData.price,
            size: this.formData.size,
            partner_name: this.formData.partner_name,
            order_type: this.formData.order_type,
            order_price: this.formData.order_price,
            material_id: this.formData.id,
            order_qty: this.formData.order_qty,
            receiving_qty: this.formData.receiving_qty,
            promised_date: this.formData.promised_date,
            receiving_location_id: this.formData.receiving_location_id,
            // order_price: this.formData.order_price,
            input_date: this.formData.input_date
          });

          if (type == 'loss') {
            this.loadMaterial();
          }
        }
      }
    );
  }

  onSelect({selected}) {
    //this.selectedId = selected[0].material_code;
    this.selectedCnt = selected.length;
    if (this.selectedCnt == 1) {
      this.selectedId = selected[0].id;
      this.inputForm.controls['material_id'].setValue(this.selectedId);
      console.log(this.inputForm.value['material_id']);
    }
  }


  onSelectLocationPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['receiving_location_id'].setValue('');
    } else {
      this.inputForm.controls['receiving_location_id'].setValue(event.item.id);
    }
  }

}
