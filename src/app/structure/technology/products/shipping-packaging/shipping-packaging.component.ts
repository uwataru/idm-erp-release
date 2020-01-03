import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import { ShippingPackagingService } from './shipping-packaging.service';
import { Item, NoteItem } from './shipping-packaging.item';

declare var $: any;

@Component({
  selector: 'app-shipping-packaging',
  templateUrl: './shipping-packaging.component.html',
  styleUrls: ['./shipping-packaging.component.scss'],
  providers: [ShippingPackagingService, DatePipe]
})
export class ShippingPackagingComponent implements OnInit {

  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  noteTitle: string;
  isLoadingProgress: boolean = false;
  isEditMode: boolean = false;

  searchForm: FormGroup;
  inputForm: FormGroup;
  
  selectedId: string;
  listData: Item[];
  noteData: NoteItem[];
  formData: Item['data'];
  rows = [];
  notes = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  PackageShipment: any[] = this.globals.configs['PackageShipmentList'];
  totalWeight: number;
  assembly_total: number;
  product_price: number;

  editData: Item;
  data: Date;


  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '입력이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('NoteModal') NoteModal: ModalDirective;



  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private globals: AppGlobals,
    private datePipe: DatePipe,
    private dataService: ShippingPackagingService,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) { 
    this.searchForm = fb.group({
      sch_sdate: '',
      sch_edate: ''
    });

    this.inputForm = fb.group({
      id: ['', Validators.required],
      input_date: ['', Validators.required],
      order_no: ['', Validators.required],
      partner_name: ['', Validators.required],
      product_name: ['', Validators.required],
      qty: ['', Validators.required],
      product_price: ['', Validators.required],
      price: ['', Validators.required],
      package_shipment_type: ['', Validators.required],
      package_shipment_type_id: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.panelTitle = '출하/포장관리';
    this.inputFormTitle = '출하/포장 입력';
    this.noteTitle = '출하/포장 내역';

    this.selectedId = '';
    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);
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
    this.rows = [];
      let formData = this.searchForm.value;
      let params = {
      sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
      sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
      sortby: ['order_no'],
      order: ['asc'],
      maxResultCount: 10000
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.rows = listData['data'];

        this.isLoadingProgress = false;
      }
    );
  }, 10);
}

  Save() {
    // 실행권한
    // if (this.isExecutable == false) {
    //   alert(this.globals.isNotExecutable);
    //   return false;
    // }

    let formModel = this.inputForm.value;

    formModel.input_date = this.datePipe.transform(formModel.input_date, 'yyyy-MM-dd');
    let formData = {
      sales_orders_detail_id: formModel.id,
      settings_id: formModel.package_shipment_type_id,
      qty: parseInt(formModel.qty),
      input_date: formModel.input_date
    }
    console.log(formData);
    this.Create(this.selectedId,formData);
  }


  Create(id, data): void {
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

  onSelect(event) {
    console.log(event);
    this.selectedId = event.selected[0].id;
  }

  openModal(method,id) {
    // 실행권한
    if (method == 'write') {
      this.inputFormModal.show();
      this.inputForm.reset();

      this.dataService.GetById(this.selectedId).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];

            console.log('!!!!!!!' ,this.formData);

            this.inputForm.patchValue({
              id: this.formData.id,
              order_no: this.formData.order_no,
              partner_name: this.formData.partner_name,
              product_name: this.formData.product_name,
              product_type: this.formData.product_type,
              input_date: this.formData.input_date,
              product_price: this.utils.addComma(this.formData.product_price),
            });

            console.log(this.inputForm.controls['product_price'].value);

          }
        }
      );
    }
    else{
      this.NoteModal.show();
      console.log(id);
      this.notes = [];
      this.dataService.GetNote(id).subscribe(
        editData => {
          this.noteData = editData;
          this.notes = editData['data'];

        }
      );
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 250);
    }
 
  }

  onSelectPackageShipment(event){
    this.inputForm.controls['package_shipment_type_id'].setValue(event.item.id);
    console.log(this.inputForm.controls['package_shipment_type_id'].value);
  }

  CalculationPrice(event){
    console.log(event.target.value);
    let qty = parseInt(event.target.value);
    let product_price = this.utils.removeComma(this.inputForm.controls['product_price'].value);
    let totalQty = qty*product_price;

    this.inputForm.controls['price'].setValue(this.utils.addComma(totalQty));
  }

}
