import {ElectronService} from '../../../../providers/electron.service';
import {Component, Inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {OutsourcedStorageService} from './outsourced-storage.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './outsourced-storage.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './outsourced-storage.component.html',
  styleUrls: ['./outsourced-storage.component.css'],
  providers: [OutsourcedStorageService, DatePipe],
  encapsulation: ViewEncapsulation.None
})
export class OutsourcedStorageComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  statusFormTitle: string;
  statusConfirmMsg: string;
  isLoadingProgress: boolean = false;
  isEditMode: boolean = false;

  searchForm: FormGroup;
  selectedCnt: number;
  selectedId: string;
  listData: Item[];
  formData: Item['data'];
  orderType: string = 'H';
  filteredPartners: any[] = [];
  rows = [];
  materialRows = [];
  selected = [];
  delId = [];
  selectedRcvItems = [];
  usedRcvItems: string;
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  heatingProcess: any[] = this.globals.configs['heatingProcess'];
  inputPartners: any[] = this.globals.configs['type43Partners'];

  price_per_unit: number;
  rcv_qty: number;
  outs_cost: number;
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
  product_weight: number;
  editData: Item;
  data: Date;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';
  noScreeningOkMsg = '무선별 처리되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('StatusFormModal') statusFormModal: ModalDirective;

  constructor(
    public elSrv: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    public electronService: ElectronService,
    private datePipe: DatePipe,
    private dataService: OutsourcedStorageService,
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
      sch_sdate: '',
      sch_edate: ''
    });
    this.inputForm = fb.group({
      outs_id: ['', Validators.required],
      rcv_date: ['', Validators.required],
      order_type: ['', Validators.required],
      heat_treatment_process: '',
      rcv_qty: ['', Validators.required],
      product_weight: ['', Validators.required],
      result_type: ['', Validators.required],
      partner_name: ['', Validators.required],
      partner_code: ['', Validators.required],
      product_code: ['', Validators.required],
      drawing_no: ['', Validators.required],
      product_name: ['', Validators.required],
      poc_no: ['', Validators.required],
      price_per_unit: '',
      outs_cost: '',
      ms_no: '',
      memo: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '외주발주현황';
    this.inputFormTitle = '외주입고처리';

    this.getAll(this.orderType);
    this.selectedCnt = 0;

    $(document).ready(function () {
      let modalContent: any = $('.modal-content');
      let modalHeader = $('.modal-header');
      modalHeader.addClass('cursor-all-scroll');
      modalContent.draggable({
        handle: '.modal-header'
      });
    });
  }

  getAll(ordType): void {
    this.selectedCnt = 0;
    this.selectedId = '';
    this.selected = [];
    this.orderType = ordType;
    let params = {
      order_type: ordType
    };
    let tmpEL = document.getElementById('order_type_text') as HTMLInputElement;
    switch (ordType) {
      case 'F':
        tmpEL.value = '단조';
        break;
      case 'C':
        tmpEL.value = '절단';
        break;
      case 'H':
        tmpEL.value = '열처리';
        break;
      case 'M':
        tmpEL.value = '가공';
        break;
    }

    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.rows = listData['data'];

        this.isLoadingProgress = false;
      }
    );
  }

  excelDown() {
    let path = this.elSrv.path;
    let app = this.elSrv.remote.app;
    //let dialog = this.electronService.remote.dialog;
    //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
    //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

    //if (userChosenPath) {
    this.dataService.GetExcelFile().subscribe(
      res => {
        // Filesaver.js 1.3.8
        // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
        importedSaveAs(res, '외주발주현황.xlsx');

        let win = this.elSrv.remote.getCurrentWindow();

        win.webContents.session.on('will-download', (event, item, webContents) => {
          // Set the save path, making Electron not to prompt a save dialog.
          //item.setSavePath('d:\project\원자재마스터.xlsx')
          //item.setSavePath('d:\\project\\원자재마스터.xlsx');

          const filename = item.getFilename();

          item.on('updated', (event, state) => {
            if (state === 'interrupted') {
              console.log('Download is interrupted but can be resumed');
            } else if (state === 'progressing') {
              if (item.isPaused()) {
                console.log('Download is paused');
              } else {
                console.log(`Received bytes: ${item.getReceivedBytes()}`);
              }
            }
          });
          item.once('done', (event, state) => {
            if (state === 'completed') {
              console.log(filename + ' 저장 완료');
            } else {
              alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
              console.log(`Download failed: ${state}`);
            }
          });
        });
      },
      error => this.errorMessage = <any>error
    );
    //}
  }

  getPricePerUnit() {
    let formData = this.inputForm.value;

    if (formData.order_type == 'H') {
      // 열처리단가
      this.dataService.GetPricePerUnit(formData.partner_code, formData.heat_treatment_process).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            let price = this.utils.addComma(editData['heatingPrice']);
            this.inputForm.controls['price_per_unit'].patchValue(price);

            this.calculOutsCost();
          }
        }
      );
    }
  }

  delPricePerUnit() {
    this.inputForm.controls['price_per_unit'].patchValue(0);
    this.inputForm.controls['outs_cost'].patchValue(0);
  }

  Save() {
    let formData = this.inputForm.value;

    formData.rcv_date = this.datePipe.transform(formData.rcv_date, 'yyyy-MM-dd');

    formData.rcv_qty = this.utils.removeComma(formData.rcv_qty) * 1;
    formData.price_per_unit = this.utils.removeComma(formData.price_per_unit) * 1;
    formData.outs_cost = this.utils.removeComma(formData.outs_cost) * 1;

    this.Create(formData);
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.inputForm.reset();
            this.getAll(this.orderType);
            this.messageService.add(this.addOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.inputFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  deleteOrder(id) {
    const formData: FormData = new FormData();
    this.dataService.Delete(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll(this.orderType);
            this.messageService.add(this.delOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.selectedId = '';
          this.selectedCnt = 0;
          this.statusFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }


  openModal(method) {
    // 실행권한
    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    if (method == 'delete') {

      if (this.selectedCnt > 0) {

        //입고가 있으면 리턴
        this.dataService.GetOutsReceiving(this.selectedId).subscribe(
          outsData => {
            if (outsData['data'] && Object.keys(outsData['data']).length > 0) {
              this.messageService.add('입고처리된 데이터가 존재하여 삭제할수 없습니다.');
              return false;
            } else {
              this.isLoadingProgress = false;
              this.statusFormModal.show();
              this.statusFormTitle = '발주 삭제';
              this.statusConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
            }
          }
        );

      }

    } else {

      this.inputFormModal.show();

      // 입력폼 리셋
      this.inputForm.reset();

      // 외주발주내용
      this.dataService.GetById(this.selectedId).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];

            let price_per_unit: string;
            if (editData['price_per_unit'] * 1 >= 1000) {
              price_per_unit = this.utils.addComma(editData['price_per_unit']);
            } else if (price_per_unit == '0') {
              price_per_unit = '';
            }
            let outs_cost = '';//this.formData.input_weight * 1;

            this.inputForm.patchValue({
              outs_id: this.formData.id,
              rcv_date: this.tDate,
              order_type: this.formData.order_type,
              heat_treatment_process: editData['heat_treatment_process'],
              product_weight: editData['product_weight'],
              rcv_qty: this.utils.addComma(this.formData.order_qty),
              partner_code: this.formData.partner_code,
              partner_name: this.formData.partner_name,
              product_code: this.formData.product_code,
              drawing_no: this.formData.drawing_no,
              product_name: this.formData.product_name,
              poc_no: this.formData.poc_no,
              price_per_unit: price_per_unit,
              outs_cost: outs_cost
            });
          }
        }
      );

    }

  }

  onSelectInputPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['partner_code'].setValue(0);
    } else {
      this.inputForm.controls['partner_code'].setValue(event.item.Code);
    }
  }

  onSelect({selected}) {
    this.selectedCnt = selected.length;

    let tmpArr = [];
    for (var i in selected) {
      tmpArr.push(selected[i].id);
    }
    this.selectedId = tmpArr.join(',');
  }

  calculOutsCost() {
    let formData = this.inputForm.value;
    let rcv_qty = this.utils.removeComma(formData.rcv_qty) * 1;
    let price_per_unit = this.utils.removeComma(formData.price_per_unit) * 1;

    this.inputForm.patchValue({outs_cost: this.utils.addComma(rcv_qty * price_per_unit)});
  }

}
