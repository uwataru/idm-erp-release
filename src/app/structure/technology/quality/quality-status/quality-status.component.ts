import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../../message.service';

import { Item } from './quality-status.item';

@Component({
  selector: 'app-quality-status',
  templateUrl: './quality-status.component.html',
  styleUrls: ['./quality-status.component.scss']
})
export class QualityStatusComponent implements OnInit {
  
  panelTitle: string;
  searchForm: FormGroup;
  tDate = this.globals.tDate;

  isLoadingProgress: boolean = false;

  listData : Item[];
  formData: Item['data'];
  sch_partner_name: string;
  listPartners: any[] = this.globals.configs['type5Partners'];
  listSltdPaCode: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_product_name: string;
  rows = [];
  messages = this.globals.datatableMessages;
  errorMessage: string;
  gridHeight = this.globals.gridHeight;

  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';


  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private globals: AppGlobals,
    private utils: UtilsService,
    private messageService: MessageService
  ) { 
    this.searchForm = fb.group({
      sch_date: ''
  });
  }

  ngOnInit() {
    this.panelTitle = "품질현황";

    this.searchForm.controls['sch_date'].setValue(this.tDate);
  }

}
