import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {ConfigService} from '../../../../config.service';
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

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
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
    this.getAll();
    this.searchForm.controls['sch_sdate'].setValue(this.InputDate);
    this.searchForm.controls['sch_edate'].setValue(this.InputDate);
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
      }
    );
  }


}
