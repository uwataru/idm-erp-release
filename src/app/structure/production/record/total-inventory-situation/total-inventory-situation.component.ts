import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { TotalInventorySituationService } from './total-inventory-situation.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './total-inventory-situation.item';
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";
import { ElectronService, EXPORT_EXCEL_MODE } from "../../../../providers/electron.service";
import { saveAs as importedSaveAs } from "file-saver";
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
  listPartners: any[] = this.globals.configs['partnerList'];
  searchValue: string;
  filteredPartners: any[] = [];

  rows = [];

  detailsTitle: string;

  detail_product_code: string;
  detail_product_name: string;
  detail_partner_name: string;
  detail_sch_sdate: string;
  detail_sch_edate: string;

  detailrows: Item['data'];

  detailsums_assembly_qty: number;
  detailsums_forwarding_weight: number;
  detailsums_defective_qty: number;
  detailsums_loss_qty: number;
  detailsums_lucre_qty: number;
  detailsums_inventory_qty: number;

  messages = this.globals.datatableMessages;

  errorMessage: string;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    public elSrv: ElectronService,
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
    this.panelTitle = '종합재고상황판';
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
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
      this.rows = [];
      let formData = this.searchForm.value;
      let params = {
        partner_name: formData.sch_partner_name,
        sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
        sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
        // sortby: ['input_date'],
        // order: ['asc'],
        // maxResultCount: 10000
      };
      this.isLoadingProgress = true;
      this.dataService.GetAll(params).subscribe(
        data => {
          this.rows = data['data'];

          for (let i in this.rows) {
            this.rows[i].not_delivered_qty = this.rows[i].order_qty - this.rows[i].delivery_qty;
          }

          this.isLoadingProgress = false;
        }
      );
    }, 10);
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['name'] == '') {
      this.searchForm.controls['sch_partner_name'].setValue('');
    } else {
      this.searchForm.controls['sch_partner_name'].setValue(event.item['name']);
    }
  }

  openModal(poc_no) {
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
        this.detail_partner_name = data['viewData']['partner_name'];
        this.detail_sch_sdate = data['viewData']['sch_sdate'];
        this.detail_sch_edate = data['viewData']['sch_edate'];

        this.detailrows = data['data'];

        this.detailsums_assembly_qty = data['sumData']['assembly_qty'];
        this.detailsums_forwarding_weight = data['sumData']['forwarding_weight'];
        this.detailsums_defective_qty = data['sumData']['defective_qty'];
        this.detailsums_loss_qty = data['sumData']['loss_qty'];
        this.detailsums_lucre_qty = data['sumData']['lucre_qty'];
        this.detailsums_inventory_qty = data['sumData']['inventory_qty'];

        this.isLoadingProgress = false;
      }
    );
  }

  exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
    if (this.elSrv.checkExportExcel()) {
      let data;
      if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
        // data = this.dataService.GetMasterExcelData()['data'];
      } else { //리스트는 기존 가져온 데이터로 생성
        data = this.rows;
      }

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet(this.panelTitle);

      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 15;
      worksheet.getColumn(4).width = 10;
      worksheet.getColumn(5).width = 10;
      worksheet.getColumn(6).width = 10;
      worksheet.getColumn(7).width = 12;

      const header = ["거래처", "제품명", "수주번호", "수주수량", "납품수량", "미납수량", "요구일"];
      let headerRow = worksheet.addRow(header);
      headerRow.font = this.globals.headerFontStyle as Font;
      headerRow.eachCell((cell, number) => {
        cell.fill = this.globals.headerFillColor as Fill;
        cell.border = this.globals.headerBorderStyle as Borders;
        cell.alignment = this.globals.headerAlignment as Alignment;
      });

      let jsonValueToArray;
      data.forEach(d => {
        jsonValueToArray = [];
        jsonValueToArray.push(d.partner_name);
        jsonValueToArray.push(d.product_name);
        jsonValueToArray.push(d.order_no);
        jsonValueToArray.push(d.order_qty);
        jsonValueToArray.push(d.delivery_qty);
        jsonValueToArray.push(d.not_delivered_qty);
        jsonValueToArray.push(d.demand_date);

        let row = worksheet.addRow(jsonValueToArray);
        row.font = this.globals.bodyFontStyle as Font;
        row.getCell(3).alignment = { horizontal: "center" };
        row.getCell(7).alignment = { horizontal: "center" };
        row.getCell(4).alignment = { horizontal: "right" };
        row.getCell(5).alignment = { horizontal: "right" };
        row.getCell(6).alignment = { horizontal: "right" };
        row.eachCell((cell, number) => {
          cell.border = this.globals.bodyBorderStyle as Borders;
        });
      }
      );

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }

}
