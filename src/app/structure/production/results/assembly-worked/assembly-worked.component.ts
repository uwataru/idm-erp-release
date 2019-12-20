import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ElectronService} from '../../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {AssemblyWorkedService} from './assembly-worked.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './assembly-worked.item';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './assembly-worked.component.html',
  styleUrls: ['./assembly-worked.component.scss'],
  providers: [AssemblyWorkedService, DatePipe]
})
export class AssemblyWorkedComponent implements OnInit {
  tDate = this.globals.tDate;
  gridHeight = this.globals.gridHeight;
  panelTitle: string;
  inputFormTitle: string;
  isLoadingProgress: boolean = false;

  inputForm: FormGroup;
  formData: Item['data'];
  defectiveClassification: any[] = this.globals.configs['defectiveClassification'];
  personnel: any[] = this.globals.configs['personnelList'];

  selectedId: string;
  personnelDataCnt: number;
  materialDataCnt: number;

  listData: Item[];
  editData: Item;
  selected = [];
  rows = [];
  temp = [];
  data: Date;
  remindQty: number;

  isExecutable: boolean = false;
  isPrintable: boolean = false;
  messages = this.globals.datatableMessages;
  
  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;

  constructor(
    public electronService: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: AssemblyWorkedService,
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

    this.inputForm = fb.group({
      id: ['', Validators.required],
      production_date: ['', Validators.required],
      order_no: ['', Validators.required],
      partner_name: ['', Validators.required],
      line_no: ['', Validators.required],
      product_name: ['', Validators.required],
      product_type: ['', Validators.required],
      qty: ['', Validators.required],
      add_production_qty: ['', Validators.required],
      personnel_1: ['', Validators.required],
      personnel_id_1: ['', Validators.required],
      work_time_1: ['', Validators.required],
      material_name_1: ['', Validators.required],
      material_qty_1: ['', Validators.required],
      hidden_material_qty_1: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.panelTitle = '조립작업 지시현황';
    this.inputFormTitle = '조립작업실적 입력';

    this.inputForm.controls['production_date'].setValue(this.tDate);
    this.getAll();
    this.personnelDataCnt = 1;
    this.materialDataCnt = 1;

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
    // this.selected = [];

    this.isLoadingProgress = true;
    this.dataService.GetAll().subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];

        for(let i=0; i<this.rows.length; i++){
          let qty = parseInt(this.rows[i]['qty']);
          let production_qty = parseInt(this.rows[i]['production_qty']);
          this.rows[i].remind_qty = qty-production_qty;
        }
        
      }
      );
      this.isLoadingProgress = false;
  }

  onValueChange(value: Date): void {
    this.inputForm.patchValue({promised_date: value});
  }

  Save() {
    let formModel = this.inputForm.value;

    let add_production_qty = parseInt(formModel['add_production_qty']);
    if(add_production_qty> this.remindQty){
      alert('생산수량이 수주수량을 초과했습니다. 잔여수량을 확인하세요');
    }else{
      let formData = {
        qty: add_production_qty,
        production_date: this.datePipe.transform(formModel['production_date'], 'yyyy-MM-dd'),
        production_personnel_performance: []
      };



      for(let i=1; i<=this.personnelDataCnt; i++){
        if(formModel['personnel_id_'+i] != -1){
          formData.production_personnel_performance.push( this.makePersonnels(i, formModel) );
        }

        delete formData['personnel_id_'+i];
        delete formData['personnel_'+i];
        delete formData['work_time_'+i];
      }

      for(let i=1; i<=this.materialDataCnt; i++){

        delete formData['material_name_'+i];
        delete formData['material_qty_'+i];
      }

      console.log('save', formData);

      this.Create(this.selectedId,formData);
    }
    
  }

  makePersonnels(index, formModel){
    let production_personnel_performance = {
      id: formModel['personnel_id_' + index],
      work_time: parseInt(formModel['work_time_' + index]),
    }
    return production_personnel_performance;
  }


  Create(id, data): void {
    console.log(data);
    this.dataService.Create(id, data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.inputForm.reset();
            this.messageService.add(this.addOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.inputFormModal.hide();
          this.getAll();
        },
        error => this.errorMessage = <any>error
      );
  }

  onSelect({selected}) {
    this.selectedId = selected[0].id;
  }

  openModal(method) {
    // 실행권한
    if(method == 'row') {
      this.inputFormModal.show();
      this.inputForm.reset();
      this.inputForm.controls['production_date'].setValue(this.tDate);

      this.personnelDataCnt = 1;
      this.materialDataCnt = 1;
      // this.selectedId = id;
      console.log('selectedId',this.selectedId);
      this.dataService.GetById(this.selectedId).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];
            let workData = editData['data']['assembly_work_personnel'];
            let materialData = editData['data']['material'];
            this.remindQty = this.formData.qty - this.formData.production_qty;
            console.log('remindqty!!!', this.remindQty);
            console.log('!!!!!!!' ,this.formData);

            this.inputForm.patchValue({
              id: this.selectedId,
              order_no: this.formData.order_no,
              partner_name: this.formData.partner_name,
              product_name: this.formData.product_name,
              product_type: this.formData.product_type,
              line_no: this.formData.line_no,
              promised_date: this.formData.promised_date,
              qty: this.utils.addComma(this.formData.qty),
            });
            let len = workData.length;
            for(let i = 1; i<=len; i++){
                // console.error(workData[i]);
                if(i != 1) {
                    this.addPersonnelRow();
                }
                this.inputForm.controls['personnel_' + i].setValue(workData[i-1].personnel_name);
                this.inputForm.controls['personnel_id_' + i].setValue(workData[i-1].personnel_id);
            }
            let len2 = materialData.length;
            for(let i = 1; i<=len2; i++){
              // console.error(workData[i]);
              if(i != 1) {
                  this.addMaterialRow();
              }
              this.inputForm.controls['material_name_' + i].setValue(materialData[i-1].name);
              this.inputForm.controls['hidden_material_qty_' + i].setValue(materialData[i-1].qty);
          }
            console.log(this.inputForm);



          }
        }
      );

    }else {
        alert(this.globals.isNotExecutable);
        return false;
      }
  }
  
  onSelectPersonnel (event, index): void{
    console.log('onSelectPersonnel', event.item, index);
    this.inputForm.controls['personnel_id_' + index].setValue(event.item.id);
  }

  addPersonnelRow() {
    // console.log('addMaterialRow', index);
    this.personnelDataCnt++;
    let index = this.personnelDataCnt;

    this.inputForm.addControl('personnel_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('personnel_id_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('work_time_' + index, new FormControl('', Validators.required));
  }

  addMaterialRow() {
    // console.log('addMaterialRow', index);
    this.materialDataCnt++;
    let index = this.materialDataCnt;

    this.inputForm.addControl('material_name_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('material_qty_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('hidden_material_qty_' + index, new FormControl('', Validators.required));
  }
  
  removePersonnelRow(index) {
    console.log('removePersonnelRow', index);
    this.inputForm.controls['personnel_'+index].setValue(-1); //save() 할 때 이 값을 기준으로 삭제된 행인지 판단.
    this.inputForm.controls['personnel_id_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
    this.inputForm.controls['work_time_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
  }

  chkViewAddBtn(index) {
    let len = this.personnelDataCnt;
    let unVisibleItemCnt = 0;
    for (let i = index + 1; i <= len; i++) {
      if (this.inputForm.value['personnel_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    // console.log(index, len , upItemCnt);
    if((len - unVisibleItemCnt) == index){
      return true;
    }
    return false;

  }

  chkViewRemoveBtn(index){
    let len = this.personnelDataCnt;
    let unVisibleItemCnt = 0;
    for (let i = 1; i <= len; i++) {
      if (this.inputForm.value['personnel_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    if(len - unVisibleItemCnt > 1){
      return true;
    }
    return false;
  }
  writeQty(event){
    let len = this.materialDataCnt;
    let tempQty = Number(event.target.value)*1;
    for(let i = 1; i<=len; i++){  
      let matQty  = Number(this.inputForm.controls['hidden_material_qty_' + i].value)*1;
      this.inputForm.controls['material_qty_' + i].setValue(tempQty * matQty);
  }

  }

}
