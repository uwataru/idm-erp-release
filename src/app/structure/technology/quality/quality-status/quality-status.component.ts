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
  inputFormTitle: string;
  searchForm: FormGroup;
  tDate = this.globals.tDate;
  isLoadingProgress: boolean = false;

  inputForm: FormGroup;
  
  editData: Item;
  listData : Item[];
  formData: Item['data'];
  sch_partner_name: string;
  listSltdPaCode: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_product_name: string;
  rows = [];

  qty_0 = 0;
  qty_1 = 0;
  qty_2 = 0;
  qty_3 = 0;
  qty_4 = 0;
  qty_5 = 0;
  qty_6 = 0;

  messages = this.globals.datatableMessages;
  errorMessage: string;
  gridHeight = this.globals.gridHeight;

  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private globals: AppGlobals,
    private dataService: QualityStatusService,
    private utils: UtilsService,
    private messageService: MessageService
  ) { 
    this.searchForm = fb.group({
      sch_sdate: '',
      sch_edate: '',
    });

  }

  ngOnInit() {
    this.panelTitle = "품질현황";
    this.inputFormTitle = '불량내역';

    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);

    this.getAll();
  }

  getAll(): void {
    let formData = this.searchForm.value;

    let params = {
        sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
        sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
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

  openModal(id){
    this.inputFormModal.show();
    // this.inputForm.reset();
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          console.log('!!!!!!!' ,this.formData);
        
            this.qty_0 = this.formData[0].qty
            this.qty_1 = this.formData[1].qty
            this.qty_2 = this.formData[2].qty
            this.qty_3 = this.formData[3].qty
            this.qty_4 = this.formData[4].qty
            this.qty_5 = this.formData[5].qty
            this.qty_6 = this.formData[6].qty

        }
      }
    );
  }

}
