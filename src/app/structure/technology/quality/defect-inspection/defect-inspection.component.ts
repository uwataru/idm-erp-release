import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {DefectInspectionService} from './defect-inspection.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './defect-inspection.item';

@Component({
  selector: 'app-page',
  templateUrl: './defect-inspection.component.html',
  styleUrls: ['./defect-inspection.component.scss'],
  providers: [DefectInspectionService, DatePipe]
})
export class DefectInspectionComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  isLoadingProgress: boolean = false;
  isEditMode: boolean = false;

  selectedCnt: number;
  selectedId: string;
  listData: Item[];
  formData: Item['data'];
  rows = [];
  materialRows = [];
  delId = [];
  selected = [];
  selectedRcvItems = [];
  usedRcvItems: string;
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  screeningQty: number;
  normalQty: number;
  inputPartners: any[];
  defectiveClassification: any[] = this.globals.configs['defectiveClassification'];
  sltdInvenClass: number;
  cuttingInvenQty: number;
  assemblyInvenQty: number;
  forgingInvenQty: number;
  sltdOutsInvenClass: string;
  outsInvenQty: number;
  outsCuttingInvenQty: number;
  outsAssemblyInvenQty: number;
  outsForgingInvenQty: number;
  outsHeatingInvenQty: number;
  outsMachiningInvenQty: number;
  prodInvenQty: number;
  unsoldInvenQty: number;
  totalWeight: number;
  cutting_total: number;
  assembly_total: number;
  product_price: number;
  isTmpPrice: boolean;
  order_qty: number;
  cutting_qty: number;
  assembly_qty: number;
  input_weight: number;
  input_weight_total: number;
  editData: Item;
  data: Date;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  noScreeningOkMsg = '무선별 처리되었습니다.';

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: DefectInspectionService,
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
      order_no: ['', Validators.required],
      product_code: ['', Validators.required],
      product_name: ['', Validators.required],
      poc_no: '',
      production_date: '',
      production_qty: '',
      inventory_classification: '',
      outs_inven_type: '',
      outs_partner_name: '',
      outs_partner_code: '',
      defective_qty: '',
      defective_classification: ['', Validators.required],
      refer_etc: '',
      inspector: '',
      inspection_date: '',
      input_date: '',
      normal_qty: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '검사불량입력';
    // this.inputForm.controls['input_date'].setValue(this.tDate);
    //this.getAll();
  }

  // getAll(): void {
  //     let params = {}
  //     this.isLoadingProgress = true;
  //     this.dataService.GetAll(params).subscribe(
  //         listData =>
  //         {
  //             this.listData = listData;
  //             this.rows = listData['data'];
  //
  //             this.isLoadingProgress = false;
  //         }
  //     );
  // }
  // loadInputPartners(code): void {
  //   switch (code) {
  //     case 'C':
  //       this.inputPartners = this.globals.configs['type42Partners'];
  //       break;
  //     case 'F':
  //       this.inputPartners = this.globals.configs['type41Partners'];
  //       break;
  //     case 'H':
  //       this.inputPartners = this.globals.configs['type43Partners'];
  //       break;
  //     case 'M':
  //       this.inputPartners = this.globals.configs['type44Partners'];
  //       break;
  //   }
  //   //this.sltdOutsInvenClass = 'C';
  // }

  // onSelectInputPartner(event: TypeaheadMatch): void {
  //   if (event.item == '') {
  //     this.inputForm.controls['outs_partner_code'].setValue(0);
  //   } else {
  //     this.inputForm.controls['outs_partner_code'].setValue(event.item.Code);
  //   }
  // }

  Save() {
    // 실행권한
    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    let formData = this.inputForm.value;
    // if (formData.inventory_classification == 3 && !formData.outs_partner_code) {
    //   alert('거래처를 선택해주세요!');
    //   return false;
    // }

    // formData.inventory_classification = formData.inventory_classification * 1;
    formData.defective_classification = formData.defective_classification * 1;
    formData.screening_qty = this.utils.removeComma(formData.screening_qty) * 1;
    formData.defective_qty = this.utils.removeComma(formData.defective_qty) * 1;
    // formData.inspection_date = this.datePipe.transform(formData.inspection_date, 'yyyy-MM-dd');
    // formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');

    this.Create(formData);
  }

  Reset() {
    this.inputForm.reset();
    this.sltdInvenClass = 0;
    this.cuttingInvenQty = 0;
    this.forgingInvenQty = 0;
    this.outsInvenQty = 0;
    this.outsCuttingInvenQty = 0;
    this.outsForgingInvenQty = 0;
    this.outsHeatingInvenQty = 0;
    this.outsMachiningInvenQty = 0;
    // this.inputForm.controls['input_date'].setValue(this.tDate);
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.Reset();
            //this.getAll();
            this.messageService.add(this.addOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
        },
        error => this.errorMessage = <any>error
      );
  }

  loadInfo(event) {
    let OrderNo = event.target.value;
    if (!OrderNo) {
      return false;
    }

    // 내용
    this.dataService.GetById(OrderNo).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];

          this.screeningQty = editData['screeningQty'] * 1;
          console.log(this.formData.normal_qty);
          this.inputForm.patchValue({
            order_no: OrderNo,
            production_date: this.formData.input_date,
            product_name: this.formData.product_name,
            product_code: this.formData.product_code,
            production_qty: this.formData.screening_qty,
            normal_qty: this.formData.normal_qty,
            defective_qty: this.formData.defective_qty,
            defective_classification: this.formData.defective_classification
          });
        }
      }
    );
  }

}
