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
import { QualityStatusService } from './quality-status.service';

@Component({
  selector: 'app-quality-status',
  templateUrl: './quality-status.component.html',
  styleUrls: ['./quality-status.component.scss'],
  providers: [QualityStatusService]
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
    private dataService: QualityStatusService,
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

    this.getAll();
  }

  getAll(): void {
    // this.dataService.GetAll().subscribe(
    //     listData =>
    //     {
    //         this.listData = listData;
    //         this.rows = listData['data'];
    //     }
    // );
    let formData = this.searchForm.value;

    let params = {
        sch_date: this.datePipe.transform(formData.sch_date, 'yyyy-MM-dd'),
        sortby: ['id'],
        order: ['asc'],
        maxResultCount: 10000
    }
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
        listData =>
        {
            this.listData = listData;
            this.rows = listData['data'];


            this.isLoadingProgress = false;
        }
    );
}

}
