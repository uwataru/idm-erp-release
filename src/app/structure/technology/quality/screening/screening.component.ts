import { Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ElectronService } from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ScreeningService } from './screening.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './screening.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './screening.component.html',
  styleUrls: ['./screening.component.css'],
  providers: [ScreeningService, DatePipe],
  encapsulation: ViewEncapsulation.None
})
export class ScreeningComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  statusFormTitle: string;
  statusConfirmMsg: string;
  statusConfirmBtn: string;
  statusFormValue: number;
  uploadFormTitle: string;
  isLoadingProgress: boolean = false;
  deleteConfirmMsg: string;
  hideConfirmMsg: string;
  isEditMode: boolean = false;
  etcMode: boolean = false;

  searchForm: FormGroup;

  selectedId: string;
  listData: Item[];
  formData: Item['data'];
  sch_partner_name: string;
  //listPartners = [];
  personnelList: any[] = this.globals.configs['personnelList'];
  listSltdPaCode: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_order_no: string;
  sch_st: number;
  st: number;
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  defectContent: any[] = this.globals.configs['defectList'];
  productionDate: any[] = [];
  inputMaterials: any[] = [];
  editData: Item;


  public isCorrect: boolean;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '무선별 처리되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;

  constructor(
    public electronService: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: ScreeningService,
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
      sch_order_no: ''
    });

    this.inputForm = fb.group({
      sales_orders_detail_id: ['', Validators.required],
      input_date: ['', Validators.required],
      personnel: [''],
      personnel_id: [''],
      product_name: [''],
      product_type: '',
      qty: ['', Validators.required],
      defect_content: ['', Validators.required],
      defect_content_id: ['', Validators.required],
      etc: '',
    });
  }

  ngOnInit() {
    this.panelTitle = '선별작업현황';
    this.inputFormTitle = '선별작업입력';

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
      this.selectedId = '';

      let formData = this.searchForm.value;
      let params = {
        order_no: formData.sch_order_no.trim(),
        sortby: ['order_no'],
        order: ['asc'],
        maxResultCount: 10000
      }
      this.isLoadingProgress = true;
      this.dataService.GetAll(params).subscribe(
        listData => {
          this.listData = listData;
          this.temp = listData['data'];
          this.rows = listData['data'];
        }
      );
      this.isLoadingProgress = false;
    }, 10);
  }

  onSelectPersonnel(event: TypeaheadMatch): void {
    this.inputForm.controls['personnel_id'].setValue(event.item['id']);
    console.log(this.inputForm.controls['personnel_id'].value);
  }

  onSelectDefectContent(event: TypeaheadMatch): void {
    this.inputForm.controls['defect_content_id'].setValue(event.item['id']);
    console.log(this.inputForm.controls['defect_content_id'].value);
    let id = this.inputForm.controls['defect_content_id'].value;
    if (id == 12) {
      this.etcMode = true;
    } else {
      this.etcMode = false;
      this.inputForm.controls['etc'].setValue('');
    }
    console.log(this.etcMode, this.inputForm.controls['etc'].value);
  }

  updateFilter(event) {
    const val = event.target.value.trim();

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.order_no.indexOf(val) !== -1 || !val;
    })

    // update the rows
    this.rows = temp;
    // 필터 변경될때마다 항상 첫 페이지로 이동.
    //this.table.offset = 0;
  }

  addCommaQty(): void {
    let formData = this.inputForm.value;
    this.inputForm.controls['qty'].setValue(this.utils.addComma(formData.qty));
  }

  save() {
    let formModel = this.inputForm.value;
    let qty = this.utils.removeComma(formModel.qty) * 1;
    formModel.input_date = this.datePipe.transform(formModel['input_date'], 'yyyy-MM-dd');


    let formData = {
      qty: qty,
      input_date: formModel.input_date,
      sales_orders_detail_id: formModel.sales_orders_detail_id,
      production_personnel_id: formModel.personnel_id,
      settings_id: formModel.defect_content_id,
      etc: formModel.etc

    };
    this.Create(formData);
    console.log(formData);
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == "success") {
            this.getAll();
            this.messageService.add(this.addOkMsg);
            //   this.isInvoice = true;
            //   this.invoiceNo = data['last_id'];
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.inputFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  openModal(action, id) {

    switch (action) {
      case 'create':
        // 실행권한
        if (this.isExecutable == false) {
          alert(this.globals.isNotExecutable);
          return false;
        }
        this.inputFormModal.show();

        // 입력폼 리셋
        this.inputForm.reset();

        this.dataService.GetById(this.selectedId).subscribe(
          editData => {
            if (editData['result'] == "success") {
              this.editData = editData;
              this.formData = editData['data'];

              this.inputForm.patchValue({
                input_date: this.tDate,
                sales_orders_detail_id: this.selectedId,
                order_no: this.formData.order_no,
                product_name: this.formData.product_name,
                product_type: this.formData.product_type,
              });
              console.log(this.inputForm.controls['sales_orders_detail_id'].value);
            }
          }
        );
        break;
    }

  }


  onSelect({ selected }) {
    this.selectedId = selected[0].id;
  }

}
