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
  deleteAllTitle: string;
  deleteAllMsg: string;
  deleteConfirmTitle: string;
  deleteConfirmMsg: string;
  batchInsertTitle: string;
  batchInsertMsg: string;
  isEditMode: boolean = false;

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
  messages = this.globals.datatableMessages;
  is_selected_prdline: boolean = false;

  productionLines: any[] = this.globals.configs['productionLine'];
  productionWorkingPattern: any[] = this.globals.configs['productionWorkingPattern'];
  productionLineWorkers: any[] = this.globals.configs['productionLineWorkers'];
  lastDay: number;
  product_price: number;
  isTmpPrice: boolean;
  editData: Item;
  data: Date;

  batchInsertForm: FormGroup;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('BatchInsertFormModal') batchInsertFormModal: ModalDirective;
  @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
  @ViewChild('DeleteAllFormModal') deleteAllFormModal: ModalDirective;

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

    this.batchInsertForm = fb.group({
      pattern_code: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '라인별 가동 계획';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.searchForm.controls['sch_yearmonth'].setValue(this.tDate.replace(/[^0-9]/g, '').substring(0, 6));
    this.getAll();
  }

  getAll() {
    let formData = this.searchForm.value;
    if (!formData.sch_yearmonth) {
      this.messageService.add('작업년월을 입력해주세요!');
      return false;
    }
    let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    if (yearmonth.length != 6) {
      this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
      return false;
    }

    if (!formData.sch_prdline) {
      this.messageService.add('작업라인을 선택해주세요!');
      return false;
    } else {
      this.is_selected_prdline = true;
    }

    let params = {
      sch_yearmonth: this.convertYearMonth(yearmonth),
      sch_prdline: formData.sch_prdline,
      sortby: ['working_date'],
      order: ['asc']
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];
        this.lastDay = listData['lastDay'];

        this.isLoadingProgress = false;
      }
    );
  }

  convertYearMonth(ym) {
    let yy = ym.substring(0, 4);
    let mm = ym.substring(4, 6);
    return yy + '-' + mm;
  }

  insert_time(event, id) {
    const val = event.target.value;
    if (!val) {
      (<HTMLTableDataCellElement>document.getElementById('working_stime_' + id)).textContent = '';
      (<HTMLTableDataCellElement>document.getElementById('working_etime_' + id)).textContent = '';
      (<HTMLTableDataCellElement>document.getElementById('working_time_per_day_' + id)).textContent = '';
    } else {
      let t = this.get_time_from_pattern_code(val);

      (<HTMLTableDataCellElement>document.getElementById('working_stime_' + id)).textContent = t.Group1Stime;
      (<HTMLTableDataCellElement>document.getElementById('working_etime_' + id)).textContent = t.Group1Etime;
      (<HTMLTableDataCellElement>document.getElementById('working_time_per_day_' + id)).textContent = t.WorkingTimePerDay;
    }
  }

  get_time_from_pattern_code(code) {
    var filtered = this.productionWorkingPattern.filter(function (e) {
      return e.PatternCode === code;
    });
    return filtered[0];
  }

  get_groupcode_from_lineworkers(code) {
    var filtered = this.productionLineWorkers.filter(function (e) {
      return e.LineCode === code;
    });
    return filtered[0];
  }

  BatchInsert() {
    let searchFormData = this.searchForm.value;
    let batchInsertFormData = this.batchInsertForm.value;
    this.rows.forEach((e: any) => {
      let t = this.get_time_from_pattern_code(batchInsertFormData.pattern_code);
      console.log(e.id);
      (<HTMLSelectElement>document.getElementById('pattern_code_' + e.id)).value = batchInsertFormData.pattern_code;
      (<HTMLTableDataCellElement>document.getElementById('working_stime_' + e.id)).textContent = t.Group1Stime;
      (<HTMLTableDataCellElement>document.getElementById('working_etime_' + e.id)).textContent = t.Group1Etime;
      (<HTMLTableDataCellElement>document.getElementById('working_time_per_day_' + e.id)).textContent = t.WorkingTimePerDay;
    });
    this.batchInsertFormModal.hide();
  }

  DeleteAll() {
    for (let i = 0; i < this.rows.length; i++) {
      this.rows[i].pattern_code = '';
      this.rows[i].working_stime = '';
      this.rows[i].working_etime = '';
      this.rows[i].working_time_per_day = '';
      this.rows[i].group1 = '';
      this.rows[i].group2 = '';
      this.rows[i].group3 = '';

    }
    this.deleteAllFormModal.hide();
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

    let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    if (yearmonth.length != 6) {
      this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
      return false;
    }

    if (!formData.sch_prdline) {
      this.messageService.add('작업라인을 선택해주세요!');
      return false;
    }

    let planDada = [];
    this.rows.forEach((e) => {
      if (<HTMLSelectElement>document.getElementById('pattern_code_' + e.id) != null) {
        if ((<HTMLSelectElement>document.getElementById('pattern_code_' + e.id)).value != '') {
          let dayData = [];
          dayData.push(e.id);
          dayData.push((<HTMLSelectElement>document.getElementById('pattern_code_' + e.id)).value);
          dayData.push((<HTMLTableDataCellElement>document.getElementById('working_stime_' + e.id)).textContent);
          dayData.push((<HTMLTableDataCellElement>document.getElementById('working_etime_' + e.id)).textContent);
          dayData.push((<HTMLTableDataCellElement>document.getElementById('working_time_per_day_' + e.id)).textContent);
          planDada.push(dayData.join(':#:'));
        }
      }
    });

    const saveData = {
      yearmonth: this.convertYearMonth(formData.sch_yearmonth),
      line_code: formData.sch_prdline,
      plan_data: planDada.join('=||=')
    };

    // console.log(saveData);
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

  Delete() {
    let formData = this.searchForm.value;
    if (!formData.sch_yearmonth) {
      this.messageService.add('작업년월을 입력해주세요!');
      return false;
    }

    let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    if (yearmonth.length != 6) {
      this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
      return false;
    }

    if (!formData.sch_prdline) {
      this.messageService.add('작업라인을 선택해주세요!');
      return false;
    }

    this.dataService.Delete(this.convertYearMonth(yearmonth), formData.sch_prdline)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.getAll();
            this.messageService.add(this.delOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }

          this.deleteFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  openModal(method) {
    // 실행권한
    if (this.isExecutable == true) {
      if (method == 'batchInsert') {
        this.batchInsertFormModal.show();
      } else if (method == 'delete') {
        this.deleteFormModal.show();
      } else if (method == 'deleteAll') {
        this.deleteAllFormModal.show();
      }
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }

    switch (method) {
      case 'deleteAll':
        this.deleteAllTitle = '일괄삭제';
        this.deleteAllMsg = '전체삭제하시겠습니까?';
        break;
      case 'delete':
        this.deleteConfirmTitle = '라인별 가동계획 삭제';
        this.deleteConfirmMsg = '선택하신 라인별 가동계획을 삭제하시겠습니까?';
        break;
      case 'batchInsert':
        this.batchInsertTitle = '일괄입력';
        this.batchInsertMsg = '근무패턴을 선택해주세요?';
        break;
    }
  }

  excelDown(): void {
    this.dataService.GetExcelFile().subscribe(
      blob => {
        if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
          window.navigator.msSaveBlob(blob, 'Report.xlsx');
        } else { // for chrome and firfox
          var link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = 'Report.xlsx';
          link.click();
        }
      },
      error => this.errorMessage = <any>error
    );
  }
}
