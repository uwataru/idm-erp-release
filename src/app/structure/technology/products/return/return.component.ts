import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';

import { ReturnService } from './return.service';
import { Item, NoteItem } from './return.item';

declare var $: any;

@Component({
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrls: ['./return.component.scss'],
  providers: [ReturnService, DatePipe]

})
export class ReturnComponent implements OnInit {

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

  returnReasonList: any[] = this.globals.configs['returnReasonList'];
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
    private dataService: ReturnService,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) { 
    this.searchForm = fb.group({
      sch_sdate: '',
      sch_edate: ''
    });
    this.inputForm = fb.group({
      sales_delivery_id: ['', Validators.required],
      return_date: ['', Validators.required],
      partner_name: ['', Validators.required],
      product_name: ['', Validators.required],
      product_type: ['', Validators.required],
      product_id: ['', Validators.required],
      type: ['', Validators.required],
      settings_type: ['', Validators.required],
      settings_type_id: ['', Validators.required],
      qty: ['', Validators.required],
      etc: '',
    });
  }

  ngOnInit() {
    this.panelTitle = '반품관리';
    this.inputFormTitle = '반품 입력';
    this.noteTitle = '반품 내역';
  
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
  }

  Save() {
    // 실행권한
    // if (this.isExecutable == false) {
    //   alert(this.globals.isNotExecutable);
    //   return false;
    // }

    let formModel = this.inputForm.value;

    formModel.return_date = this.datePipe.transform(formModel.return_date, 'yyyy-MM-dd');
    if(formModel.type == "true"){
      formModel.type = true;
    }else{
      formModel.type = false;
    }
    let formData = {
      sales_delivery_id: formModel.sales_delivery_id,
      product_id: formModel.product_id,
      settings_id: formModel.settings_type_id,
      return_type: Boolean(formModel.type),
      etc: formModel.etc,
      qty: parseInt(formModel.qty),
      return_date: formModel.return_date
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
      this.inputForm.controls['return_date'].setValue(this.tDate);
      this.dataService.GetById(this.selectedId).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];

            console.log('!!!!!!!' ,this.formData);

            this.inputForm.patchValue({
              sales_delivery_id: this.formData.id,
              partner_name: this.formData.partner_name,
              product_name: this.formData.product_name,
              product_id: this.formData.product_id,
              product_type: this.formData.product_type,
            });


          }
        }
      );
    }
    else{
      this.NoteModal.show();
      console.log(id);
      this.dataService.GetNote(id).subscribe(
        editData => {
          this.noteData = editData;
          this.notes = editData['data'];
          // console.log(this.notes['totalCount']);
          if(this.notes == null){
            alert('내역이 없습니다.');
          }

        }
      );
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 250);
    }

  }

  onSelectReturnReason(event){
    this.inputForm.controls['settings_type_id'].setValue(event.item.id);
    console.log(this.inputForm.controls['settings_type_id'].value);
  }


}
