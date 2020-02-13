import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {AssemblyWorksService} from './assembly-works.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item, matlReceivingItem} from './assembly-works.item';
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './assembly-works.component.html',
  styleUrls: ['./assembly-works.component.css'],
  providers: [AssemblyWorksService, DatePipe]
})
export class AssemblyWorksComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  isLoadingProgress: boolean = false;
  isEditMode: boolean = false;

  selectedId: string;
  listData: Item[];
  materialData: matlReceivingItem[];
  formData: Item['data'];
  rows = [];
  materialRows = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  personnelList: any[] = this.globals.configs['personnelList'];
  productionLine: any[] = this.globals.configs['productionLine'];
  totalWeight: number;
  assembly_total: number;
  product_price: number;
  origin_material: string;
  origin_size: number;

  isTmpPrice: boolean;
  order_qty: number;
  assembly_qty: number;
  input_weight: number;
  input_weight_total: number;
  inputWeightTotal: number;   // 투입중량
  editData: Item;
  data: Date;

  personnelDataCnt: number;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  isNotNumberMsg = '숫자로만 입력하세요.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;

  constructor(
    public elSrv: ElectronService,
    @Inject(FormBuilder) public fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: AssemblyWorksService,
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

    this.buildInputFormGroup();
  }
  buildInputFormGroup(){
    this.inputForm = this.fb.group({
      order_no: ['', Validators.required],
      partner_name: ['', Validators.required],
      product_name: ['', Validators.required],
      product_type: ['', Validators.required],
      line_no: ['', Validators.required],
      production_work_line_id: ['', Validators.required],
      sales_orders_detail_id: ['', Validators.required],
      promised_date: '',
      qty: '',
      start_date: '',
      end_date: '',
      personnel_1: '',
      personnel_id_1: '',
      is_all_checked: false
    });
  }

  ngOnInit() {
    this.panelTitle = '조립작업 지시 현황';
    this.inputFormTitle = '조립작업입력';

    this.getAll();
    this.personnelDataCnt = 1;

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
    let params = {
      sortby: ['order_no'],
      order: ['asc'],
      maxResultCount: 10000
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.rows = listData['data'];
        for(let i in this.rows){
          let qty = parseInt(this.rows[i]['qty']);
          let production_qty = parseInt(this.rows[i]['Production_qty']);
          this.rows[i].remind_qty = qty - production_qty;
        }

        this.isLoadingProgress = false;
      }
    );
  }

  Save() {
    let formModel = this.inputForm.value;
    
    let formData = {
      sales_orders_detail_id: formModel.sales_orders_detail_id,
      start_date: this.datePipe.transform(formModel['start_date'], 'yyyy-MM-dd'),
      end_date: this.datePipe.transform(formModel['end_date'], 'yyyy-MM-dd'),
      production_work_line_id: parseInt(formModel['production_work_line_id']),
      production_personnel: []
    };



    for(let i=1; i<=this.personnelDataCnt; i++){
      if(formModel['personnel_id_'+i] != -1){
        formData.production_personnel.push( this.makePersonnels(i, formModel) );
      }

      delete formData['personnel_id_'+i];
      delete formData['personnel_'+i];
      // delete formData['personnel_'+i];
    }

    console.log('save', formData);

    this.Create(this.selectedId,formData);
  }

  makePersonnels(index, formModel){
    let production_personnel = {
      id: formModel['personnel_id_' + index],
    }
    return production_personnel;
  }

  Create(id, data): void {
    this.dataService.Create(id, data)
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

  
  getQtyCheck(id){
    this.dataService.GetQtyCheck(id).subscribe(
      data => {
        if (data['result'] == 'success') {
          this.openModal('write');
        } else {
          this.messageService.add(data['errorMessage']);
        }
      },
      error => this.errorMessage = <any>error
    );
  }

  openModal(method) {
    // 실행권한
    if (this.isExecutable == true) {
      if (method == 'write') {
        this.inputFormModal.show();
      }
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }

      // 입력폼 리셋
      this.personnelDataCnt = 1;
      this.inputForm.reset();
      this.buildInputFormGroup();

      // 절단작업지시 내용
      this.dataService.GetPersonnel().subscribe(
        editData => {
            this.personnelList = editData['data'];

            console.log('!!!!!!!success');

        }
      );
      this.dataService.GetById(this.selectedId).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];

            console.log('!!!!!!!' ,this.formData);

            this.inputForm.patchValue({
              start_date: this.tDate,
              end_date: this.tDate,
              // qty: this.formData.qty,
              sales_orders_detail_id: this.formData.sales_orders_detail_id,
              order_no: this.formData.order_no,
              partner_name: this.formData.partner_name,
              product_name: this.formData.product_name,
              product_type: this.formData.product_type,
              line_no: this.formData.line_no,
              production_work_line_id: this.formData.production_work_line_id,
              promised_date: this.formData.promised_date,
              qty: this.utils.addComma(this.formData.qty),
            });



          }
        }
      );
  }

  onSelect(event) {
    console.log(event);
    this.selectedId = event.selected[0].id;
  }

  addPersonnelRow() {
    // console.log('addMaterialRow', index);
    this.personnelDataCnt++;
    let index = this.personnelDataCnt;

    this.inputForm.addControl('personnel_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('personnel_id_' + index, new FormControl('', Validators.required));
  }
  removePersonnelRow(index) {
    console.log('removePersonnelRow', index);
    this.inputForm.controls['personnel_'+index].setValue(-1); //save() 할 때 이 값을 기준으로 삭제된 행인지 판단.
    this.inputForm.controls['personnel_id_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
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

  onSelectPersonnel(event, index){
    this.inputForm.controls['personnel_id_' + index].setValue(event.item.id);
  }
  onSelectLines(event){
    console.log('Event', event);
    this.inputForm.controls['production_work_line_id'].setValue(event.item.id);
    console.log('line_id',this.inputForm.controls['production_work_line_id'].value );
  }
  calculInputWeightTotal() {
    let formData = this.inputForm.value;
    let order_assembly_qty = this.utils.removeComma(formData.order_assembly_qty) * 1;
    let assembly_qty = this.utils.removeComma(formData.assembly_qty) * 1;
    let input_weight = this.utils.removeComma(formData.input_weight) * 1;
    let input_weight_total: number = Math.round(assembly_qty * input_weight * 10) * 0.1;

    if (input_weight_total > 0) {
      this.inputWeightTotal = input_weight_total;
      this.inputForm.patchValue({input_weight_total: this.utils.addComma(input_weight_total)});
    }

    // 이미 절단 입력된 수량(assembly_total)과 입력하려는 수량(assembly_qty)의 합이
    // 지시수량(order_assembly_qty)과 같거나 클때 절단작업입력이 완료된것으로 간주
    let st = false;
    if (this.assembly_total + assembly_qty >= order_assembly_qty) {
      st = true;
    }
    this.inputForm.patchValue({st: st});
  }

  checkInputWeightTotal(event): void {
    this.inputWeightTotal = event.target.value;
  }

  // chkAll(isChecked) {
  //   let formData = this.inputForm.value;
  //   let params = {};
  //   if (!isChecked) {
  //     params = {
  //       material: formData.order_material,
  //       size: formData.order_size,
  //       st: 0,
  //       sortby: ['material', 'size', 'steel_maker', 'rcv_date'],
  //       order: ['asc', 'asc', 'asc', 'asc'],
  //       maxResultCount: 1000
  //     };
  //   }

  //   this.isLoadingProgress = true;
  //   this.dataService.GetMaterialsReceiving(params).subscribe(
  //     listData => {
  //       this.materialRows = listData['data'];
  //       this.isLoadingProgress = false;
  //     });

  // }

  exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
    if (this.elSrv.checkExportExcel()) {
      let data;
      if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
        // data = this.dataService.GetMasterExcelData()['data'];
      } else { //리스트는 기존 가져온 데이터로 생성
        data = this.rows;
      }

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet(this.panelTitle);

      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 25;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(5).width = 8;
      worksheet.getColumn(6).width = 8;
      worksheet.getColumn(7).width = 8;
      worksheet.getColumn(8).width = 15;

      const header = ["수주번호", "거래처", "제품명", "구분", "수주수량", "생산수량", "잔여수량", "작업라인"];
      let headerRow = worksheet.addRow(header);
      headerRow.font = this.globals.headerFontStyle as Font;
      headerRow.eachCell((cell, number) => {
        cell.fill = this.globals.headerFillColor as Fill;
        cell.border = this.globals.headerBorderStyle as Borders;
        cell.alignment = this.globals.headerAlignment as Alignment;
      });

      let jsonValueToArray;
      data.forEach(d => {
            jsonValueToArray = [];
            jsonValueToArray.push(d.order_no);
            jsonValueToArray.push(d.partner_name);
            jsonValueToArray.push(d.product_name);
            jsonValueToArray.push(d.product_type);
            jsonValueToArray.push(d.qty);
            jsonValueToArray.push(d.Production_qty);
            jsonValueToArray.push(d.remind_qty);
            jsonValueToArray.push(d.line_no);

            let row = worksheet.addRow(jsonValueToArray);
            row.font = this.globals.bodyFontStyle as Font;
            row.getCell(1).alignment = {horizontal: "center"};
            row.getCell(8).alignment = {horizontal: "center"};
            row.getCell(5).alignment = {horizontal: "right"};
            row.getCell(6).alignment = {horizontal: "right"};
            row.getCell(7).alignment = {horizontal: "right"};
            row.eachCell((cell, number) => {
              cell.border = this.globals.bodyBorderStyle as Borders;
            });
          }
      );

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }

}
