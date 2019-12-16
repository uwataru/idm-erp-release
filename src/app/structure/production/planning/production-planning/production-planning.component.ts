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
  // nativeWindow: any;
  panelTitle: string;
  orderType: string;
  printViewTitle: string;

  isLoadingProgress: boolean = false;

  gridHeight = this.globals.gridHeight - 45;
  searchForm: FormGroup;
  printPageTotCnt: number;

  listData: Item[];
  formData: Item['data'];
  productionLines: any[] = this.globals.configs['productionLine'];
  rows = [];
  temp = [];
  printViewRows = [];

  totalItemCnt: number;
  totalProductQty: number;
  isInitPlanDate: boolean = false;
  selectedId: string;
  selectedOrderNo: string;

  messages = this.globals.datatableMessages;

  updateOk: boolean = false;

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


  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;


  // @ViewChild('PrintViewModal') printViewModal: ModalDirective;
  // @ViewChild('ProductionPlanningPrintViewModal') productionPlanningPrintViewModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private router: Router,
    private datePipe: DatePipe,
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

    // this.nativeWindow = winRef.getNativeWindow();

    this.searchForm = fb.group({
      sch_order_no: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '생산계획관리';
    this.getAll();
  }

  getAll(): void {
    let formData = this.searchForm.value;

    this.isLoadingProgress = true;
      this.dataService.GetAll().subscribe(
        listData => {
          this.listData = listData;
          this.rows = listData['data'];
          this.temp = listData['data'];

          for(let i=0; i<this.rows.length; i++){
            let qty = Number(this.rows[i]['qty'])*1;
            let productionQty = Number(this.rows[i]['Production_qty'])*1;
            // console.log(i, qty, productionQty);
            let remainQty = qty - productionQty;
            this.rows[i].remainQty = remainQty;

            this.rows[i].remainPrecent = Math.round(((productionQty / qty) * 100) * 10) / 10;
            // console.log(this.rows[i].remainPrecent);
          }

          this.isLoadingProgress = false;
        }
      );

  }

  updateFilter(event) {
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function(d){
        return d.order_no.indexOf(val) !== -1 || !val;
    })

    // update the rows
    this.rows = temp;
    // 필터 변경될때마다 항상 첫 페이지로 이동.
    //this.table.offset = 0;
}

  // CreatePrintView(): void {
  //   let formData = this.searchForm.value;
  //   let params = {
  //     sch_prdline: formData.sch_prdline,
  //     sortby: ['seq_no'],
  //     order: ['asc']
  //   };

  //   this.getAll();

  //   this.printViewModal.hide();


  //   this.printViewRows = [];
  //   this.printPageTotCnt = Math.ceil(this.rows.length / 22);
  //   for (let i = 0, t = i + 22; i < this.printPageTotCnt; i++) {

  //     let tmp = [];
  //     let start = t * i;
  //     let end = t * (i + 1) - 1;
  //     let tmp_working_date = '';

  //     let sub_cnt = 0;

  //     for (let q in this.rows) {
  //       if (parseInt(q) >= start && parseInt(q) <= end) {

  //         let is_diff_date = false;
  //         if (sub_cnt != 0 && this.rows[q].working_date != tmp_working_date) {
  //           is_diff_date = true;
  //         }

  //         tmp.push({
  //           working_date: this.rows[q].working_date,
  //           is_diff_date: is_diff_date,
  //           production_time: this.rows[q].production_time,
  //           product_code: this.rows[q].product_code,
  //           product_name: this.rows[q].product_name,
  //           order_qty: this.rows[q].order_qty,
  //           promised_date: this.rows[q].promised_date,
  //           material: this.rows[q].material,
  //           size: this.rows[q].size,
  //           assembly_order: this.rows[q].assembly_order,
  //           assembly_yn: this.rows[q].assembly_yn,
  //           poc_no: this.rows[q].poc_no
  //         });

  //         tmp_working_date = this.rows[q].working_date;
  //         sub_cnt++;
  //       }
  //     }
  //     this.printViewRows.push(tmp);

  //   }


  // }


}
