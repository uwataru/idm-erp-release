import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  searchGroupForm: FormGroup;

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
  groupRows = [];
  groupInfoRows = [];
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
  groupForm: FormGroup;
  inputPartners: any[] = this.globals.configs['partnerList'];
  locationPartners: any[] = this.globals.configs['partnerList'];
  currTab: number;
  inputMakers: any[] = this.globals.configs['maker'];
  product_price: number;
  isTmpPrice: boolean;
  editData: Item;
  data: Date;
  order_qty:number;
  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('LossFormModal') lossFormModal: ModalDirective;
  @ViewChild('GroupFormModal') groupFormModal: ModalDirective;

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
    this.searchGroupForm = fb.group({
      sch_product_name: '',
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
    this.groupForm = fb.group({
      production_plan_id: ['', Validators.required],
      order_qty: ['', Validators.required],
      order_price: ['', Validators.required],
      input_date: ['', Validators.required],
      promised_date: ['', Validators.required],
      receiving_location: ['', Validators.required],
      receiving_location_id: ['', Validators.required],
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

  calRowHeight(row) {
    if (row.height === undefined) {
      let addHeight = 0;
      if (row.material.length > 1) {
        addHeight = (row.material.length - 1) * 21;
      }
      return 30 + addHeight;
    }
  }

  materialTab(type) {

    if(type == 1) {
        this.getAllGroup();
    } else {
        this.getAll();
    }
  }

  getAllGroup(): void {
    this.currTab = 1;
    setTimeout(() => {
      document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
    }, 10);

    setTimeout(() => {
      this.groupRows = [];
      

      this.isLoadingProgress = true;
      this.dataService.GetAllGroup().subscribe(
        listData => {
          this.listData = listData;
          this.temp = listData['data'];
          this.groupRows = listData['data'];
          this.isLoadingProgress = false;
        }
        );

          
        }, 15);
  }

  getAll(): void {
    this.currTab = 2;
    setTimeout(() => {
      document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
    }, 10);

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
          
        }, 15);
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
      return d.product_name.indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.groupRows = temp;
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
  CalculOrderAmountGroup(event): void {
    console.log(this.groupInfoRows[0].qty);
    let formData = this.groupForm.value;
    this.order_qty = formData.order_qty;
    let price = 0;
    for(let i=0; i<this.groupInfoRows.length; i++){
      let qty = this.groupInfoRows[i]['qty'] * this.order_qty;
      let tmp_price = qty * this.groupInfoRows[i]['price'];

      price += tmp_price;
    }
    // let f = event.target.id.replace('order_qty', 'order_price');
    // let q = this.utils.removeComma(event.target.value) * 1;
    // let p = formData.price * 1;
    // let dp = this.utils.addComma(q * p);
    this.groupForm.controls['order_price'].setValue(this.utils.addComma(price));
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
      order_type: true,
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
  SaveGroup() {
    let formModel = this.groupForm.value;


    let input_date = this.datePipe.transform(formModel['input_date'], 'yyyy-MM-dd');

    let production_plan_id = this.utils.removeComma(formModel['production_plan_id']) * 1;

    let order_qty = this.utils.removeComma(formModel['order_qty']) * 1;

    let order_price = this.utils.removeComma(formModel['order_price']) * 1;

    let promised_date = this.datePipe.transform(formModel['promised_date'], 'yyyy-MM-dd');


    let formData = {
      production_plan_id: production_plan_id,
      order_type: true,
      order_qty: order_qty,
      promised_date: promised_date,
      receiving_location_id: formModel.receiving_location_id,
      input_date: input_date,
    };

    console.log(formData);
    this.CreateGroup(formData);
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

  CreateGroup(data): void {
    this.dataService.CreateGroup(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.groupForm.reset();
            this.getAllGroup();
            this.messageService.add(this.addOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.groupFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  openModal(type,id) {
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
    }else {
      this.groupForm.reset();

      this.groupFormModal.show();
      
      this.groupForm.controls['input_date'].setValue(this.tDate);
      this.groupForm.controls['production_plan_id'].setValue(id);
      myForm = this.groupForm;
      
      this.dataService.GetGroupInfo(id).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];
            this.groupInfoRows = this.editData['data']['material'];
            // let price_per_unit = this.utils.addComma(this.formData.order_price);
            
            console.log(this.groupInfoRows);
            
            myForm.patchValue({
              order_qty: this.formData['qty'],
            });
            
          }
          this.order_qty = this.formData['qty'];
          this.CalculOrderAmountGroup('');
        }
      );

      this.dataService.GetPaList().subscribe(
        listData => {
          this.listPartners = listData['data'];
        }
      );
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
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
  onSelectLocationPartnerGroup(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.groupForm.controls['receiving_location_id'].setValue('');
    } else {
      this.groupForm.controls['receiving_location_id'].setValue(event.item.id);
    }
  }

}
