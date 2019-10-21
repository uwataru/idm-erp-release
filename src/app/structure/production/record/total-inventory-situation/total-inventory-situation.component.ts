import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {TotalInventorySituationService} from './total-inventory-situation.service';
import {AppGlobals} from '../../../../app.globals';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './total-inventory-situation.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './total-inventory-situation.component.html',
  styleUrls: ['./total-inventory-situation.component.scss'],
  providers: [TotalInventorySituationService, DatePipe]
})
export class TotalInventorySituationComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  isLoadingProgress: boolean = false;

  searchForm: FormGroup;

  formData: Item['data'];
  sch_partner_name: string;
  listPartners: any[] = this.globals.configs['type5Partners'];
  listSltdPaCode: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];

  rows: Item['data'];

  detailsTitle: string;

  detail_product_code: string;
  detail_product_name: string;
  detail_drawing_no: string;
  detail_partner_name: string;
  detail_sch_sdate: string;
  detail_sch_edate: string;

  detailrows: Item['data'];

  detailsums_cutting_qty: number;
  detailsums_assembly_qty: number;
  detailsums_forwarding_weight: number;
  detailsums_forging_qty: number;
  detailsums_defective_qty: number;
  detailsums_loss_qty: number;
  detailsums_lucre_qty: number;
  detailsums_inventory_qty: number;

  messages = this.globals.datatableMessages;

  errorMessage: string;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: TotalInventorySituationService,
    private globals: AppGlobals,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    this.searchForm = fb.group({
      sch_partner_name: '',
      production_line: '',
      sch_sdate: '',
      sch_edate: ''
    });
  }

  ngOnInit() {
    this.panelTitle = '종합재고상황판(Ⅰ)';
    this.detailsTitle = '종합재고상황판(Ⅱ)';

    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);
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
      partner_code: formData.sch_partner_name,
      sch_prdline: formData.production_line,
      sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
      sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
      sortby: ['input_date'],
      order: ['asc'],
      maxResultCount: 10000
    };
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      data => {
        this.rows = data['data'];

        this.isLoadingProgress = false;
      }
    );
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['Code'] == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = event.item['Code'];
    }

    const val = this.listSltdPaCode;
  }

  openModal(poc_no) {

    // 검색폼 리셋
    // this.inputForm.reset();

    // POC No로 내역 조회
    let formData = this.searchForm.value;
    let params = {
      poc_no: poc_no,
      //sch_prdline: formData.production_line,
      sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
      sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
      sortby: ['input_date'],
      order: ['asc'],
      maxResultCount: 10000
    };
    this.isLoadingProgress = true;
    this.dataService.GetDetails(params).subscribe(
      data => {
        this.detail_product_code = data['viewData']['product_code'];
        this.detail_product_name = data['viewData']['product_name'];
        this.detail_drawing_no = data['viewData']['drawing_no'];
        this.detail_partner_name = data['viewData']['partner_name'];
        this.detail_sch_sdate = data['viewData']['sch_sdate'];
        this.detail_sch_edate = data['viewData']['sch_edate'];

        this.detailrows = data['data'];

        this.detailsums_cutting_qty = data['sumData']['cutting_qty'];
        this.detailsums_assembly_qty = data['sumData']['assembly_qty'];
        this.detailsums_forwarding_weight = data['sumData']['forwarding_weight'];
        this.detailsums_forging_qty = data['sumData']['forging_qty'];
        this.detailsums_defective_qty = data['sumData']['defective_qty'];
        this.detailsums_loss_qty = data['sumData']['loss_qty'];
        this.detailsums_lucre_qty = data['sumData']['lucre_qty'];
        this.detailsums_inventory_qty = data['sumData']['inventory_qty'];

        this.isLoadingProgress = false;
      }
    );
  }
}
