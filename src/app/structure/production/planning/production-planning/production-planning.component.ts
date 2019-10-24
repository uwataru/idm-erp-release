import {Component, ElementRef, Inject, OnInit, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DragulaService} from 'ng2-dragula';
import {DatePipe} from '@angular/common';
import {ProductionPlanningService} from './production-planning.service';
import {AppGlobals} from '../../../../app.globals';
import {UtilsService} from '../../../../utils.service';
import {WindowRefService} from '../../../../structure/shared/popup/window-ref.service';
import {MessageService} from '../../../../message.service';
import {Item} from './production-planning.item';
import {ElectronService} from '../../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './production-planning.component.html',
  styleUrls: ['./production-planning.component.css'],
  providers: [ProductionPlanningService, DragulaService, DatePipe, WindowRefService, ElectronService],
  encapsulation: ViewEncapsulation.None
})
export class ProductionPlanningComponent implements OnInit {
  tDate = this.globals.tDate;
  nativeWindow: any;
  panelTitle: string = '생산계획조정';
  updateConfirmTitle: string;
  updateConfirmMsg: string;
  deleteConfirmTitle: string;
  deleteConfirmMsg: string;
  orderConfirmTitle: string;
  orderConfirmMsg: string;
  orderType: string;
  printViewTitle: string;
  printViewMsg: string;

  isLoadingProgress: boolean = false;

  gridHeight = this.globals.gridHeight - 45;
  searchForm: FormGroup;
  materialForm: FormGroup;
  printPageTotCnt: number;

  listData: Item[];
  formData: Item['data'];
  productionLines: any[] = this.globals.configs['productionLine'];
  rows = [];
  selected = [];
  materialRows = [];
  printViewRows = [];
  totalItemCnt: number;
  totalInputWeight: number;
  totalProductQty: number;
  totalProductWeight: number;
  totalSalesPrice: number;
  isInitPlanDate: boolean = false;
  selectedId: string;
  selectedOrderNo: string;

  messages = this.globals.datatableMessages;

  // 수정
  changedReason: string;

  beforeDateValue: string;
  afterDateValue: string;
  beforeQtyValue: string;
  afterQtyValue: string;

  updateOk: boolean = false;

  //외주단조발주
  outsForgingForm: FormGroup;


  // 라인변경
  changeLineForm: FormGroup;
  order_no: string;
  product_code: string;
  product_name: string;
  order_qty: number;
  production_line: string;

  // 절단작업지시서 발행
  cuttingOrderForm: FormGroup;
  inputPartners: any[] = this.globals.configs['type4Partners'];
  releaseType: number;

  // 절단작업지시서
  viewModalHeight: number = window.innerHeight - 70;
  cuttingWorkAllocationTitle: string;
  cuttingWorkAllocationToday: number;
  pocNo: string;
  cut_use_weight: number;
  sum_remaining_weight: number;
  standby_weight: number;

  title = 'app';
  elementType = 'svg';
  cuttingValue = 'C2016120301';
  forgingValue = 'P2016120301';
  format = 'CODE39';
  lineColor = '#000000';
  width = 1;
  height = 50;
  displayValue = true;
  fontOptions = '';
  font = 'monospace';
  textAlign = 'center';
  textPosition = 'bottom';
  textMargin = 2;
  fontSize = 14;
  background = '#ffffff';
  margin = 0;
  marginTop = 0;
  marginBottom = 0;
  marginLeft = 0;
  marginRight = 0;

  v_input_date: string;
  v_poc_no: string;
  v_order_no: string;
  v_product_code: string;
  v_product_name: string;
  v_partner_code: number;
  v_partner_name: string;
  v_product_type: string;
  v_drawing_no: string;
  v_cutting_qty: number;
  v_assembly_qty: number;
  v_sub_drawing_no: string;
  v_order_qty: number;
  v_material: string;
  v_size: string;
  v_cut_length: number;
  v_steel_maker: string;
  v_ms_no: string;
  v_material_weight: number;
  v_input_weight: number;
  v_product_weight: string;
  v_product_price: number;
  v_production_line: string;
  v_working_stime: string;
  v_production_time: number;
  v_outs_partner_code: number;
  v_outs_partner_name: string;
  v_mold_no: string;
  v_mold_size: number;
  v_mold_storage: string;
  v_release_type: number;

  // 단조작업지시서
  forgingWorkAllocationTitle: string;
  orderTime: string;
  fRows = [];

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  updateOkMsg = '수정되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('UpdateConfirmModal') updateConfirmModal: ModalDirective;
  @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
  @ViewChild('ChangeLineConfirmModal') changeLineConfirmModal: ModalDirective;
  @ViewChild('ForgingOrderConfirmModal') forgingOrderConfirmModal: ModalDirective;
  @ViewChild('OutsForgingModal') outsForgingModal: ModalDirective;
  @ViewChild('CuttingOrderConfirmModal') cuttingOrderConfirmModal: ModalDirective;
  @ViewChild('CuttingWorkAllocationModal') cuttingWorkAllocationModal: ModalDirective;
  @ViewChild('ForgingWorkAllocationModal') forgingWorkAllocationModal: ModalDirective;

  @ViewChild('PrintViewModal') printViewModal: ModalDirective;
  @ViewChild('ProductionPlanningPrintViewModal') productionPlanningPrintViewModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe,
    private dragulaService: DragulaService,
    private dataService: ProductionPlanningService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private winRef: WindowRefService,
    private utils: UtilsService,
    private messageService: MessageService,
    public elSrv: ElectronService,
    private renderer: Renderer2,
    private el: ElementRef
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

    this.nativeWindow = winRef.getNativeWindow();

    this.searchForm = fb.group({
      // start_date: '',
      end_date: '',
      sch_prdline: ''
    });

    this.materialForm = fb.group({
      material: ['', Validators.required],
      size: ['', Validators.required]
    });

    this.cuttingOrderForm = fb.group({
      outs_partner_code: ['', Validators.required],
      outs_partner_name: ['', Validators.required]
    });

    this.outsForgingForm = fb.group({
      product_code: '',
      product_name: '',
      drawing_no: '',
      product_reg_no: '',
      outs_partner_code: '',
      outs_partner_name: '',
      ref_matl_supl_type: '',
      matl_cost: '',
      forging_cost: '',
      outs_cost: '',
      material: '',
      size: '',
      input_weight: '',
      order_date: ['', Validators.required],
      partner_code: '',
      partner_name: ['', Validators.required],
      matl_supl_type: ['', Validators.required],
      order_qty: ['', Validators.required],
      rcv_req_date: ['', Validators.required],
      steel_maker: '',
      storage: '',
      ms_no: '',
      estimated_weight: '',
      used_rcv_items: ''
    });

    this.changeLineForm = fb.group({
      order_no: '',
      production_line: ''
    });

    // dragulaService.drag.subscribe((value) => {
    //     //console.log(`drag: ${value[0]}`);
    //     this.onDrag(value.slice(1));
    // });
    dragulaService.drop.subscribe((value) => {
      //console.log(`drop: ${value[0]}`);
      this.onDrop(value.slice(1));
    });
    // dragulaService.over.subscribe((value) => {
    //     //console.log(`over: ${value[0]}`);
    //     this.onOver(value.slice(1));
    // });
    // dragulaService.out.subscribe((value) => {
    //     //console.log(`out: ${value[0]}`);
    //     this.onOut(value.slice(1));
    // });

    // 생산계획 수립일, 출력기한
    this.dataService.GetPlanningDate().subscribe(
      view => {
        // this.searchForm.controls['start_date'].setValue(view['planning-date']);
        this.searchForm.controls['end_date'].setValue(view['end-date']);
      }
    );


    if (this.inputPartners.filter(v => v.Code == 0).length < 1) {
      this.inputPartners.unshift({Code: 0, Name: '자가', Alias: '자가'});
    }
  }

  ngOnInit() {
    console.log(process.versions);
    this.getAll();
  }

  getAll(): void {
    let formData = this.searchForm.value;
    let params = {
      sch_edate: this.datePipe.transform(formData.end_date, 'yyyy-MM-dd'),
      sch_prdline: formData.sch_prdline,
      //sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
      //sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
      sortby: ['seq_no'],
      order: ['asc']
    };
    this.isLoadingProgress = true;
    setTimeout(() => {
      this.dataService.GetAll(params).subscribe(
        listData => {
          this.listData = listData;
          //this.printViewRows = listData['data'];
          this.rows = listData['data'];
          this.totalItemCnt = listData['totalCount'];
          this.totalInputWeight = listData['totalInputWeight'];
          this.totalProductQty = listData['totalProductQty'];
          this.totalProductWeight = listData['totalProductWeight'];
          this.totalSalesPrice = listData['totalSalesPrice'];
          //this.totalQuantity = listData['sumData']['total_qty'];
          //this.totalSalesPrice = listData['sumData']['total_sales_price'];

          this.isLoadingProgress = false;
          if (this.isInitPlanDate == false) {
            this.isInitPlanDate = true;
          }
        }
      );
    }, 100);

  }

  scrollHandler(event) {
    (<HTMLDivElement>document.getElementById('dnd_head')).scrollLeft = event.target.scrollLeft;
    //console.log(event.target.scrollLeft);
  }

  // private onDrag(args) {
  //     let [e, el] = args;
  //     // do something
  //     console.log(e);
  // }

  private onDrop(args) {
    let formData = this.searchForm.value;

    let [e, el] = args;

    // args[3].id는 drop시 이동하려는 위치의 다음 라인의 값을 가져옴. 1에서 3으로 이동시 4의 값을 읽어옴.
    // drop시점을 기준으로
    // 위에서 아래로 이동시: 이동하려는 위치 다음으로 가기 때문에 drop시점에서는 이전 위치의 값(args[0].previousElementSibling.id)을 가져와야함.
    // 아래에서 위로 이동시: 이동하려는 위치 이전으로 가기 때문에 drop시점에서는 다음 라인의 값(args[3].id)을 가져오면 됨
    let currRow = args[0].id.split('_');
    let currSeq = currRow[2] * 1;

    let chgSeqData = args[0].id.replace('row_', '');
    let rowIdSeq = [];
    if (args[3] != null) {
      let chgRow = args[3].id.split('_');
      let chgSeq = chgRow[2] * 1;

      if (currSeq < chgSeq) {
        // 위에서 아래로 이동
        rowIdSeq = args[0].previousElementSibling.id.split('_');
      } else {
        // 아래에서 위로 이동
        rowIdSeq = args[3].id.split('_');
      }
    } else {
      rowIdSeq = args[0].previousElementSibling.id.split('_');
    }
    chgSeqData = chgSeqData + '_' + rowIdSeq[2];
    // console.log(args);
    this.dataService.changeSeqNo(formData.sch_prdline, chgSeqData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
          } else {
            this.messageService.add(data['errorMessage']);
          }
        },
        error => this.errorMessage = <any>error
      );
  }

  // private onOver(args) {
  //     let [e, el, container] = args;
  //     // do something
  //     console.log(e);
  // }
  //
  // private onOut(args) {
  //     let [e, el, container] = args;
  //     // do something
  //     console.log(e);
  // }

  // 작업일 변경
  changePlanningDate(field, date: Date): void {
    if (this.isInitPlanDate == true) {

      let formData = this.searchForm.value;
      if (field == 1) {
        // formData.start_date = this.datePipe.transform(date, 'yyyy-MM-dd');
      } else if (field == 2) {
        formData.end_date = this.datePipe.transform(date, 'yyyy-MM-dd');
      }

      this.dataService.changePlanningDate(formData)
        .subscribe(
          data => {
            if (data['result'] == 'success') {
              this.getAll();
            } else {
              this.messageService.add(data['errorMessage']);
            }
          },
          error => this.errorMessage = <any>error
        );
    }
  }

  // 계획수립-작업순서 지정
  resetSeqNo() {
    // 실행권한
    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    if (this.isInitPlanDate == true) {

      let formData = this.searchForm.value;
      if (formData.sch_prdline == 'outs') {
        this.messageService.add('외주라인은 계획을 수립할 수 없습니다!');
        return false;
      }

      // formData.start_date = this.datePipe.transform(formData.start_date, 'yyyy-MM-dd');
      formData.end_date = this.datePipe.transform(formData.end_date, 'yyyy-MM-dd');

      this.isLoadingProgress = true;
      this.dataService.ResetSeqNo(formData)
        .subscribe(
          data => {
            if (data['result'] == 'success') {
              this.getAll();
            } else {
              console.log(data['errorMessage']);
              this.messageService.add(data['errorMessage']);
            }
            this.isLoadingProgress = false;
          },
          error => this.errorMessage = <any>error
        );
    }
  }

  // 라인변경
  changeProductionLine(id): void {
    let formData = this.changeLineForm.value;
    formData.order_no = this.selectedOrderNo;
    this.isLoadingProgress = true;
    this.dataService.ChangeProductionLine(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.isLoadingProgress = false;
            this.getAll();
            this.changeLineForm.reset();
            this.changeLineConfirmModal.hide();
          } else {
            this.messageService.add(data['errorMessage']);
          }
        },
        error => this.errorMessage = <any>error
      );
  }

    onSelect(id, orderNo, isCwo, material, size) {
        this.selectedId = id;
        this.selectedOrderNo = orderNo;

    this.materialForm.patchValue({
      material: material,
      size: size
    });
  }

  onSelectRcvItems({selected}) {
    this.materialForm.patchValue({
      material: selected[0].material,
      size: selected[0].size
    });
  }

  loadMaterial() {

    let formData = this.materialForm.value;
    let material = formData.material.trim();
    let size = formData.size;

    if (!material || !size) {
      this.messageService.add('지시재질 또는 규격을 입력하세요.');
      return false;
    } else if (isNaN(size)) {
      this.messageService.add('지시규격은 숫자로 입력하세요.');
      return false;
    }

    let params = {
      material: material,
      size: size,
      st: 0,
      sortby: ['material', 'size', 'steel_maker', 'rcv_date'],
      order: ['asc', 'asc', 'asc', 'asc'],
      maxResultCount: 1000
    };
    this.isLoadingProgress = true;
    this.dataService.GetMaterialsReceiving(params).subscribe(
      listData => {
        this.materialRows = listData['data'];
        this.isLoadingProgress = false;
        this.sum_remaining_weight = 0;
        for (var i in this.materialRows) {
          this.sum_remaining_weight = this.sum_remaining_weight + this.materialRows[i].remaining_weight;
        }

      }
    );

    this.standby_weight = 0;
    this.dataService.GetStandbyWeight({material: material, size: size}).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.standby_weight = editData['data'];
        }
      }
    );

  }


  openModal(orderType, id) {
    this.orderType = orderType;

    // 실행권한
    if (this.isExecutable == true) {
      switch (orderType) {
        case 'update':
          this.updateConfirmModal.show();
          break;
        case 'delete':
          this.deleteFormModal.show();
          break;
        case 'line-change':
          this.changeLineConfirmModal.show();
          break;
        case 'cutting':
          this.cuttingOrderConfirmModal.show();
          break;
        case 'forging':
          this.forgingOrderConfirmModal.show();
          break;
        case 'outs-forging':
          this.outsForgingModal.show();
          break;
        case 'cutting-work-allocation':
          this.cuttingWorkAllocationModal.show();
          break;
        case 'forging-work-allocation':
          this.forgingWorkAllocationModal.show();
          break;
        case 'print-view':
          this.printViewModal.show();
          break;
        case 'production-planning-print-view':
          this.productionPlanningPrintViewModal.show();
          break;
      }
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }

    switch (orderType) {
      case 'print-view':

        this.printViewTitle = '인쇄 출력 화면';


        break;

      case 'line-change':
        this.dataService.GetPlanningInfo(this.selectedId).subscribe(
          editData => {
            if (editData['result'] == 'success') {
              let data = editData['data'];
              this.order_no = data.order_no;
              this.product_code = data.product_code;
              this.product_name = data.product_name;
              this.order_qty = data.order_qty;
              this.production_line = data.production_line;
            }
          }
        );
        break;

      case 'cutting':
        this.orderConfirmTitle = '조립작업지시서 발행';

        this.dataService.GetPlanningInfo(this.selectedId).subscribe(
          editData => {
            if (editData['result'] == 'success') {
              this.cut_use_weight = editData['data'].order_qty * editData['data'].input_weight;
            }
          }
        );

        this.loadMaterial();

        break;

      case 'cutting-work-allocation':
        this.cuttingWorkAllocationTitle = '조 립 작 업 지 시 서';
        this.cuttingWorkAllocationToday = Date.now();

        this.GetCuttingWorkAllocation(this.pocNo);
        break;

      case 'update':
        this.updateConfirmTitle = '수정';
        this.updateConfirmMsg = '수주등록현황에서 해당 작업이 수정되었습니다. 생산계획에 반영하시겠습니까?';

        this.dataService.GetOrdersAdjustment(id).subscribe(
          viewData => {
            if (viewData['result'] == 'success') {

              this.beforeDateValue = viewData['promised_date'];
              this.afterDateValue = viewData['modi_promised_date'];
              this.beforeQtyValue = viewData['order_qty'];
              this.afterQtyValue = viewData['modi_qty'];

              switch (viewData['modi_reason']) {
                case 'DELAY':
                  this.changedReason = '납기연기';
                  break;
                case 'INCREASE':
                  this.changedReason = '수주증량';
                  break;
                case 'DECREASE':
                  this.changedReason = '수주감량';
                  break;
                default:
                  this.changedReason = '';
                  this.beforeDateValue = '';
                  this.afterDateValue = '';
                  this.beforeQtyValue = '';
                  this.afterQtyValue = '';
                  break;
              }

            }
          }
        );
        break;

      case 'delete':
        this.deleteConfirmTitle = '삭제';
        this.deleteConfirmMsg = '수주등록현황에서 해당 작업이 삭제되었습니다. 생산계획에서 삭제하시겠습니까?';
        break;

      case 'forging':
        this.orderConfirmTitle = '단조작업지시서 발행';
        //this.orderConfirmMsg = '선택하신 작업의 절단작업지시서를 발행하시겠습니까?';
        break;

      case 'forging-work-allocation':
        this.forgingWorkAllocationTitle = '단 조 작 업 지 시 서';

        this.dataService.GetForgingWorkAllocation(this.pocNo).subscribe(
          listData => {
            if (listData['result'] == 'success') {
              this.orderTime = listData['order_time'];
              this.fRows = listData['data'];
              this.fRows.sort(function (a, b) {
                return a.subKey > b.subKey ? 1 : -1;
              });
            }

            for (let i in this.fRows) {
              for (let ii in this.fRows[i].subData) {
                console.log(ii);

                let tmp_material = '';
                let tmp_size = '';

                for (let iii in this.fRows[i].subData[ii]) {
                  let is_diff_material = false;

                  if (tmp_size == this.fRows[i].subData[ii][iii].size && tmp_material != this.fRows[i].subData[ii][iii].material) {
                    is_diff_material = true;
                    //이전 배열도 true 로 변경
                    this.fRows[i].subData[ii][parseInt(iii) - 1].is_diff_material = is_diff_material;
                  }
                  this.fRows[i].subData[ii][iii].is_diff_material = is_diff_material;
                  tmp_material = this.fRows[i].subData[ii][iii].material;
                  tmp_size = this.fRows[i].subData[ii][iii].size;
                }
              }
            }


          }
        );
        break;
    }
  }


  Update(id, data): void {

    const formData: FormData = new FormData();
    this.dataService.Update(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
            this.messageService.add(this.updateOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.updateConfirmModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  Delete(id): void {
    const formData: FormData = new FormData();
    formData.append('st', '-1');
    this.dataService.Delete(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
            this.messageService.add(this.delOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.selectedId = '';
          this.deleteFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }


  CreatePrintView(): void {
    let formData = this.searchForm.value;
    let params = {
      sch_edate: this.datePipe.transform(formData.end_date, 'yyyy-MM-dd'),
      sch_prdline: formData.sch_prdline,
      sortby: ['seq_no'],
      order: ['asc']
    };

    this.getAll();

    this.openModal('production-planning-print-view', '');
    this.printViewModal.hide();


    this.printViewRows = [];
    this.printPageTotCnt = Math.ceil(this.rows.length / 22);
    for (let i = 0, t = i + 22; i < this.printPageTotCnt; i++) {

      let tmp = [];
      let start = t * i;
      let end = t * (i + 1) - 1;
      let tmp_working_date = '';

      let sub_cnt = 0;

      for (let q in this.rows) {
        if (parseInt(q) >= start && parseInt(q) <= end) {

          let is_diff_date = false;
          if (sub_cnt != 0 && this.rows[q].working_date != tmp_working_date) {
            is_diff_date = true;
          }

          tmp.push({
            working_date: this.rows[q].working_date,
            is_diff_date: is_diff_date,
            production_time: this.rows[q].production_time,
            product_code: this.rows[q].product_code,
            drawing_no: this.rows[q].drawing_no,
            product_name: this.rows[q].product_name,
            order_qty: this.rows[q].order_qty,
            promised_date: this.rows[q].promised_date,
            material: this.rows[q].material,
            size: this.rows[q].size,
            cut_length: this.rows[q].cut_length,
            input_weight: this.rows[q].input_weight,
            product_weight: this.rows[q].product_weight,
            mold_size: this.rows[q].mold_size,
            mold_position: this.rows[q].mold_position,
            cutting_order: this.rows[q].cutting_order,
            assembly_order: this.rows[q].assembly_order,
            cutting_yn: this.rows[q].cutting_yn,
            assembly_yn: this.rows[q].assembly_yn,
            poc_no: this.rows[q].poc_no
          });

          tmp_working_date = this.rows[q].working_date;
          sub_cnt++;
        }
      }
      this.printViewRows.push(tmp);

    }


  }


  CreateForgingOrder(): void {
    this.dataService.CreateForgingOrder()
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.pocNo = data['order_id'];
            this.getAll();
          } else {
            this.messageService.add(data['errorMessage']);
          }

          this.printViewModal.hide();
          this.openModal('forging-work-allocation', '');
        },
        error => this.errorMessage = <any>error
      );
  }

  CreateCuttingOrder(id): void {

    let formData = this.cuttingOrderForm.value;
    if (this.releaseType == 2) {
      // 외주절단입력화면으로 이동
      this.router.navigate([
        '/materials/order/outsourcing-cutting-work',
        {
          id: this.selectedId,
          outs_name: formData.outs_partner_name,
          outs_code: formData.outs_partner_code
        }
      ]);
    } else {

      let matForm = this.materialForm.value;
      matForm.size = matForm.size * 1;

      if (!matForm.material.trim() || matForm.size < 1) {
        this.messageService.add('재질 또는 규격을 입력하세요.');
        return;
      }

      //formData.release_type = this.releaseType;
      this.dataService.CreateCuttingOrder(id, matForm)
        .subscribe(
          data => {
            if (data['result'] == 'success') {
              this.pocNo = data['order_id'];
              this.getAll();
            } else {
              this.messageService.add(data['errorMessage']);
            }

            this.closeWriteModal();
            this.openModal('cutting-work-allocation', '');
          },
          error => this.errorMessage = <any>error
        );
    }
  }

  GetCuttingWorkAllocation(pocNo): void {

    this.dataService.GetCuttingWorkAllocation(pocNo).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          let data = editData['data'];
          this.v_input_date = data.input_date;
          this.v_poc_no = data.poc_no;
          this.v_order_no = data.order_no;
          this.v_product_code = data.product_code;
          this.v_product_name = data.product_name;
          this.v_partner_code = data.partner_code;
          this.v_partner_name = data.partner_name;
          this.v_product_type = data.product_type;
          this.v_drawing_no = data.drawing_no;
          this.v_sub_drawing_no = data.sub_drawing_no;
          this.v_order_qty = data.order_qty;
          this.v_material = data.material;
          this.v_size = data.size;
          this.v_cut_length = data.cut_length;
          this.v_steel_maker = data.steel_maker;
          this.v_ms_no = data.ms_no;
          this.v_material_weight = data.material_weight;
          this.v_input_weight = data.input_weight;
          this.v_product_weight = data.product_weight + 'Kg';
          this.v_product_price = data.product_price;
          this.v_production_line = data.production_line;
          this.v_working_stime = data.working_stime;
          this.v_production_time = data.production_time;
          this.v_outs_partner_code = data.outs_partner_code;
          this.v_outs_partner_name = (data.release_type == 2) ? data.outs_partner_name : '자가';
          this.v_mold_no = data.mold_no;
          this.v_mold_size = data.mold_size;
          this.v_mold_storage = data.mold_storage;
          this.v_release_type = data.release_type;

          // 콤비 제품인 경우
          if (editData['combiData'] != '') {
            let combiData = editData['combiData'];
            this.v_product_code = this.v_product_code + ', ' + combiData.product_code;
            this.v_product_name = this.v_product_name + ', ' + combiData.product_name;
          }

          this.cuttingWorkAllocationTitle = '조 립 작 업 지 시 서';
        }
      }
    );
  }

  onSelectInputPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.cuttingOrderForm.controls['outs_partner_code'].setValue(0);
    } else {
      this.cuttingOrderForm.controls['outs_partner_code'].setValue(event.item.Code);
    }
  }

  private closeWriteModal(): void {
    this.cuttingOrderConfirmModal.hide();
    this.forgingOrderConfirmModal.hide();
  }


  excelDown(): void {
    this.dataService.GetExcelFile().subscribe(
      blob => {
        // Filesaver.js 1.3.8
        // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
        importedSaveAs(blob, '생산계획.xlsx');

        let win = this.elSrv.remote.getCurrentWindow();

        win.webContents.session.on('will-download', (event, item, webContents) => {

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
  }


  orderSave() {

    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    let formData = this.searchForm.value;
    if (formData.sch_prdline == 'outs') {
      this.messageService.add('외주라인은 계획을 수립할 수 없습니다!');
      return false;
    }

    formData.end_date = this.datePipe.transform(formData.end_date, 'yyyy-MM-dd');

    this.isLoadingProgress = true;
    this.dataService.orderSave(formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
          } else {
            console.log(data['errorMessage']);
            this.messageService.add(data['errorMessage']);
          }
          this.isLoadingProgress = false;
        },
        error => this.errorMessage = <any>error
      );

  }


  outsForgingSave(id) {
    let formData = this.outsForgingForm.value;
    if (!formData.partner_name) {
      alert('단조업체를 선택해주세요!');
      return false;
    }

    switch (formData.ref_matl_supl_type) {
      case '유상':
        formData.ref_matl_supl_type = 1;
        break;
      case '무상':
        formData.ref_matl_supl_type = 2;
        break;
      case '도급':
        formData.ref_matl_supl_type = 3;
        break;
    }

    formData.matl_cost = this.utils.removeComma(formData.matl_cost) * 1;
    formData.forging_cost = this.utils.removeComma(formData.forging_cost) * 1;
    formData.outs_cost = this.utils.removeComma(formData.outs_cost) * 1;

    formData.matl_supl_type = formData.matl_supl_type * 1;
    formData.order_qty = formData.order_qty * 1;

    formData.order_date = this.datePipe.transform(formData.order_date, 'yyyy-MM-dd');
    formData.rcv_req_date = this.datePipe.transform(formData.rcv_req_date, 'yyyy-MM-dd');

    this.dataService.outsForgingCreate(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.outsForgingForm.reset();
            this.getAll();
            this.messageService.add('등록되었습니다.');
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.outsForgingModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }


}
