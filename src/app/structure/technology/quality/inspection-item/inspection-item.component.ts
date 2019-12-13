import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {ConfigService} from '../../../../config.service';
import {UtilsService} from "../../../../utils.service";
import {DatePipe} from '@angular/common';
import {MessageService} from '../../../../message.service';

import {Item} from './inspection-item.item';
import {InspectionItemService} from './inspection-item.service';

declare var $: any;

@Component({
  selector: 'app-inspection-item',
  templateUrl: './inspection-item.component.html',
  styleUrls: ['./inspection-item.component.scss'],
  providers: [InspectionItemService]
})
export class InspectionItemComponent implements OnInit {

  InputDate = this.globals.tDate;
  panelTitle: string;

  searchForm: FormGroup;

  isLoadingProgress: boolean = false;
  listData: Item[];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;
  editData: Item;
  formData: Item['data'];
  rows = [];
  isExecutable: boolean = false;
  isPrintable: boolean = false;
  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';


  totalVal1 = 0;
  totalVal2 = 0;
  totalVal3 = 0;
  totalVal4 = 0;
  totalVal5 = 0;
  totalVal6 = 0;
  totalVal7 = 0;
  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private utils: UtilsService,
    private datePipe: DatePipe,
    private dataService: InspectionItemService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private messageService: MessageService
  ) {
    this.searchForm = fb.group({
      sch_sdate: ['', [Validators.required]],
      sch_edate: ['', [Validators.required]],
  });
  }

  ngOnInit() {
    this.panelTitle = '검사항목현황';
    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.InputDate));
    this.searchForm.controls['sch_edate'].setValue(this.InputDate);
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
      maxResultCount: 10000
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.rows = listData['data'];
        this.isLoadingProgress = false;
        this.total_defect_count();
      }
    );
  }

  total_defect_count(){
    for(let i in this.rows){
        this.totalVal1 += parseInt(this.rows[i].defect_count1);
        this.totalVal2 += parseInt(this.rows[i].defect_count2);
        this.totalVal3 += parseInt(this.rows[i].defect_count3);
        this.totalVal4 += parseInt(this.rows[i].defect_count4);
        this.totalVal5 += parseInt(this.rows[i].defect_count5);
        this.totalVal6 += parseInt(this.rows[i].defect_count6);
        this.totalVal7 += parseInt(this.rows[i].defect_count7);
    }
  }


}
