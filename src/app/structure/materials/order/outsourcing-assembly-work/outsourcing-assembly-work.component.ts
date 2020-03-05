import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { OutsourcingAssemblyWorkService } from './outsourcing-assembly-work.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './outsourcing-assembly-work.item';
declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './outsourcing-assembly-work.component.html',
  styleUrls: ['./outsourcing-assembly-work.component.css'],
  providers: [OutsourcingAssemblyWorkService, DatePipe]
})
export class OutsourcingAssemblyWorkComponent implements OnInit {
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
  listPartners: any[] = this.globals.configs['partnerList'];
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
  selectedName: string;
  selectedSize: string;
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  lossForm: FormGroup;
  inputPartners: any[] = this.globals.configs['partnerList'];
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
    private dataService: OutsourcingAssemblyWorkService,
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
      material_id: ['', Validators.required],
      name: ['', Validators.required],
      size: ['', Validators.required],
      input_date: ['', Validators.required],
      qty: ['', Validators.required],
    });

    // if (this.locationPartners.filter(v => v.id == 0).length < 1) {
    //   this.locationPartners.unshift({id: 0, name: '자가', alias: '자가'});
    // }

  }


  ngOnInit() {
    this.panelTitle = '외주발주';

    // 입력일
    this.inputFormTitle = '외주발주';
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
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
      this.selectedId = '';
      this.selected = [];
      this.rows = [];

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
      this.dataService.GetPaList().subscribe(
        listData => {
          this.listPartners = listData['data'];
        }
      );
    }, 10);
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['id'] == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = event.item['id'];
    }

    const val = this.listSltdPaCode;
  }


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
    this.inputForm.patchValue({ promised_date: value });
  }


  lossSave() {
    let formData = this.lossForm.value;
    let params = {
      material_id: formData.material_id,
      input_date: this.datePipe.transform(formData.input_date, 'yyyy-MM-dd'),
      qty: parseInt(formData.qty)
    };

    console.log(params);
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


    let formData = {
      order_type: false,
      receiving_date: input_date,
      input_date: input_date,
      order_qty: order_qty,
      order_price: order_price,
      material_id: formModel.material_id,
      promised_date: promised_date,
      receiving_location_id: formModel.receiving_location_id,
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
              input_date: this.tDate
            });

          }
        }
      );
    } else if (type == 'loss') {
      this.lossFormModal.show();
      this.lossForm.reset();
      myForm = this.lossForm;

      myForm.patchValue({
        input_date: this.tDate,
        material_id: this.selectedId,
        name: this.selectedName,
        size: this.selectedSize,
      });
    }


  }

  onSelect({ selected }) {
    //this.selectedId = selected[0].material_code;
    console.log(selected);
    this.selectedId = selected[0].id;
    this.selectedName = selected[0].name;
    this.selectedSize = selected[0].size;
    this.inputForm.controls['material_id'].setValue(this.selectedId);
    console.log(this.inputForm.value['material_id']);
  }


  onSelectLocationPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['receiving_location_id'].setValue('');
    } else {
      this.inputForm.controls['receiving_location_id'].setValue(event.item.id);
    }
  }
}
