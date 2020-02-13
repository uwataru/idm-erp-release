import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {ProductionLinePlanningService} from './production-line-planning.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './production-line-planning.item';
import {ElectronService} from '../../../../providers/electron.service';
import {BsDatepickerConfig} from "ngx-bootstrap";
import {BsDatepickerViewMode} from "ngx-bootstrap/datepicker";

@Component({
  selector: 'app-page',
  templateUrl: './production-line-planning.component.html',
  styleUrls: ['./production-line-planning.component.scss'],
  providers: [ProductionLinePlanningService, DatePipe]
})
export class ProductionLinePlanningComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  isLoadingProgress: boolean = false;
  // deleteAllTitle: string;
  // deleteAllMsg: string;
  // deleteConfirmTitle: string;
  // deleteConfirmMsg: string;
  batchInsertTitle: string;
  batchInsertMsg: string;
  // isEditMode: boolean = false;

  searchForm: FormGroup;

  selectedId: string;
  listData: Item[];
  formData: Item['data'];
  searchValue: string;
  sch_product_name: string;
  sch_st: number;
  st: number;
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;
  is_selected_prdline: boolean = false;

  productionLines: any[] = this.globals.configs['productionLine'];
  // productionWorkingPattern: any[] = this.globals.configs['productionWorkingPattern'];
  productionLineWorkers: any[] = this.globals.configs['productionLineWorkers'];
  lastDay: number;
  product_price: number;
  isTmpPrice: boolean;
  editData: Item;
  // data: Date;

  // batchInsertForm: FormGroup;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  selectedIndex: number = -1;
  initHour: number = 9;
  initMinute: number = 0;

  bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
    minMode : 'month' as BsDatepickerViewMode,
    dateInputFormat: 'YYYY-MM'
  });

  // @ViewChild('BatchInsertFormModal') batchInsertFormModal: ModalDirective;
  // @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
  // @ViewChild('DeleteAllFormModal') deleteAllFormModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: ProductionLinePlanningService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService,
    public elSrv: ElectronService
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
      sch_yearmonth: '',
      sch_prdline: ''
    });

    // this.batchInsertForm = fb.group({
    //   pattern_code: ''
    // });
  }

  ngOnInit() {
    this.panelTitle = '라인별 가동 계획';
    // this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.searchForm.controls['sch_yearmonth'].setValue(this.tDate);
    this.getAll();
  }

  getAll() {
    let formData = this.searchForm.value;
    if (!formData.sch_yearmonth) {
      this.messageService.add('작업년월을 입력해주세요!');
      return false;
    }
    // let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    // if (yearmonth.length != 6) {
    //   this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
    //   return false;
    // }

    if (!formData.sch_prdline) {
      this.messageService.add('작업라인을 선택해주세요!');
      return false;
    } else {
      this.is_selected_prdline = true;
    }

    let params = {
      sch_yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM'),
      production_work_lines_id: formData.sch_prdline,
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];
        this.lastDay = listData['lastDay'];

        //temp
        let startDate: Date;
        let splitTime;
        for(let i = 0; i<this.rows.length; i++) {
          if(this.rows[i].working_stime != "") {
            startDate = new Date();
            splitTime = this.rows[i].working_stime.split(":");
            startDate.setHours(parseInt(splitTime[0]), parseInt(splitTime[1]), 0);
            this.rows[i].working_stime = startDate;
          }
          if(this.rows[i].working_etime != "") {
            startDate = new Date();
            splitTime = this.rows[i].working_etime.split(":");
            startDate.setHours(parseInt(splitTime[0]), parseInt(splitTime[1]), 0);
            this.rows[i].working_etime = startDate;
          }
        }

        this.isLoadingProgress = false;
      }
    );
  }

  convertYearMonth(ym) {
    let yy = ym.substring(0, 4);
    let mm = ym.substring(4, 6);
    return yy + '-' + mm;
  }

  updateFilter(event) {
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.product_code.indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // 필터 변경될때마다 항상 첫 페이지로 이동.
    //this.table.offset = 0;
  }

  Save() {
    // 실행권한
    if (this.isExecutable == false) {
      alert(this.globals.isNotExecutable);
      return false;
    }

    let formData = this.searchForm.value;
    if (!formData.sch_yearmonth) {
      this.messageService.add('작업년월을 입력해주세요!');
      return false;
    }

    // let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    // if (yearmonth.length != 6) {
    //   this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
    //   return false;
    // }

    if (!formData.sch_prdline) {
      this.messageService.add('작업라인을 선택해주세요!');
      return false;
    }

    let len = this.rows.length;
    let timePlanData = [];
    let sTimeStr, eTimeStr;
    for(let i=0; i<len; i++) {
      if(this.rows[i].working_stime != "" && this.rows[i].working_etime != "" && this.rows[i].working_total_time != 0 ){
        sTimeStr = this.makeTimeToString(this.rows[i].working_stime, false);
        eTimeStr = this.makeTimeToString(this.rows[i].working_etime, false);
        timePlanData.push(
            this.rows[i].id + ":#:" + sTimeStr + ":#:" + eTimeStr  + ":#:" + this.rows[i].working_total_time
        )
      }
    }

    const saveData = {
      yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM'),
      production_work_lines_id: parseInt(formData.sch_prdline),
      plan_data: timePlanData.join('=||=')
    };

    this.selectedIndex = -1;

    console.log(saveData);
    this.Create(saveData);
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
            this.messageService.add(this.addOkMsg);
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
      if (method == 'batchInsert') {
        // this.batchInsertFormModal.show();
      } else if (method == 'delete') {
        // this.deleteFormModal.show();
      } else if (method == 'deleteAll') {
        // this.deleteAllFormModal.show();
      }
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }
  }
  onSelect({selected}) {
    // console.log('onSelected', selected[0].id);
    this.selectedId = selected[0].id;
  }

  isEditTime(index){
    // console.log('isEditTime', index);
    return index == this.selectedIndex;
  }

  runEditMode(index, row){
    // console.log('runEditMode', index, row);
    if(this.selectedIndex == index){
      this.selectedIndex = -1;
    } else {
      if(this.rows[index].working_stime == "" || this.rows[index].working_stime == null) {
        let startDate: Date = new Date();
        startDate.setHours(this.initHour, this.initMinute, 0);
        this.rows[index].working_stime = startDate;
      }
      if(this.rows[index].working_etime == "" || this.rows[index].working_etime == null) {
        let endDate: Date = new Date();
        endDate.setHours(this.initHour + 1, this.initMinute, 0);
        this.rows[index].working_etime = endDate;
      }

      this.selectedIndex = index;
    }
  }

  runDeleteMode(index){
    // console.log('runDeleteMode', index);
    this.rows[index].working_stime = "";
    this.rows[index].working_etime = "";
    this.rows[index].working_total_time = 0;
  }

  makeTimeToString(src, space=true){
    if(src == ""){
      return "";
    }
    let format;
    if (space){
      format = 'HH : mm';
    } else{
      format = 'HH:mm';
    }
    return this.datePipe.transform(src, format);
  }

  calWorkTime(row){
    // console.log('calWorkTime', row);
    // row.working_total_time = row.working_stime.getHours();
  }

  timePickerFocusOut(event){
    // console.log('timePickerFocusOut', event.target);
    if(event.target.placeholder == 'HH'){
      if(event.target.value > 24){
        alert('잘못된 시간입니다');
      }
    }

    if(event.target.placeholder == 'MM'){
      if(event.target.value > 60){
        alert('잘못된 시간입니다');
      }
    }
    // this.selectedIndex = -1;
  }

  totalWorkTimeFocusOut(event, row, value){
    // console.log('totalWorkTimeFocusOut', event, row, value);
    row.working_total_time = event.target.value;
    this.selectedIndex = -1;
  }

  onValueChange(value: Date): void {
    // console.log(this.searchForm.controls['sch_yearmonth'].value);
    this.searchForm.controls['sch_yearmonth'].setValue(value);
    this.getAll();
  }
}
