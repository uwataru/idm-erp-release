import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import {Component, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {OutsourcingInOutService} from './outsourcing-in-out.service';
import {AppGlobals} from '../../../../app.globals';
import {saveAs as importedSaveAs} from 'file-saver';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './outsourcing-in-out.item';
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";
declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './outsourcing-in-out.component.html',
  styleUrls: ['./outsourcing-in-out.component.css'],
  providers: [OutsourcingInOutService],
  encapsulation: ViewEncapsulation.None
})
export class OutsourcingInOutComponent implements OnInit {
  gridHeight = this.globals.gridHeight;
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  searchForm: FormGroup;
  historyForm: FormGroup;

  isEditMode: boolean = false;
  isLoadingProgress: boolean = false;

  formData: Item[];
  searchValue: string;
  rows: Item['rowData'][];
  temp = [];
  listSltdPaCode: number = 0;
  listPartners: any[] = this.globals.configs['partnerList'];
  listMaterials: any[] = this.globals.configs['schMaterials'];


  totalBalance: number;
  totalBalanceAmount: number;

  totalOrderAmount: number;
  totalRcvWeight: number;
  totalUsedWeight: number;
  totalUsedAmount: number;
  totalWeight: number;
  totalRemaingAmount: number;

  detail_sch_sdate: string;
  detail_sch_edate: string;

  messages = this.globals.datatableMessages;

  errorMessage: string;

  constructor(
    public elSrv: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: OutsourcingInOutService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    this.historyForm = fb.group({
      sch_maker_name: '',
      sch_partner_name: ''
    });

    this.searchForm = fb.group({
      sch_sdate: '',
      sch_edate: '',
      sch_material: '',
      sch_size: '',
      sch_partner_name: '',
    });

    // if( this.listPartners.filter(v => v.Code == 0).length < 1 ) {
    //     this.listPartners.unshift({Code:0, Name:'전체', name:'전체'});
    // }
  }

  ngOnInit() {
    this.panelTitle = '외주수불명세서';
    // this.inputFormTitle = '외주수불내역서';

    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);
    this.getAll();

    $(document).ready(function(){
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
      sch_material: formData.sch_material,
      sch_size: formData.sch_size,
      sch_partner_name: formData.sch_partner_name,
      // sortby: ['rcv_date'],
      // order: ['asc'],
      // maxResultCount: 10000
    }
    this.isLoadingProgress = true;

    this.dataService.GetAll(params).subscribe(
        data =>
        {
          this.rows = data['data'];
          this.temp = data['data'];

          let len = this.rows.length;
          for(let i=0; i<len; i++){
            this.rows[i].remain_qty = this.rows[i].transfer_qty + this.rows[i].receiving_qty - this.rows[i].insert_qty - this.rows[i].output_qty;
          }

          // this.totalBalance = data['totalBalance'];
          // this.totalBalanceAmount = data['totalBalanceAmount'];
          //
          // this.totalOrderAmount = data['totalOrderAmount'];
          // this.totalRcvWeight = data['totalRcvWeight'];
          // this.totalUsedWeight = data['totalUsedWeight'];
          // this.totalUsedAmount = data['totalUsedAmount'];
          // this.totalWeight = data['totalWeight'];
          // this.totalRemaingAmount = data['totalRemaingAmount'];

          this.isLoadingProgress = false;
        }
    );
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['id'] == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = event.item['id'];
    }

    const val = this.listSltdPaCode;
  }

  updateFilterSize(event) {
    const val = event.target.value;
    // filter data
    let tempArr = this.temp.map(x => Object.assign({}, x));
    let temp = tempArr.filter(function (d) {
      return d.size.indexOf(val) !== -1 || !val;
    });

    this.rows = temp;
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

      worksheet.getColumn(1).width = 12;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 15;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 12;
      worksheet.getColumn(6).width = 12;
      worksheet.getColumn(7).width = 12;
      worksheet.getColumn(8).width = 12;
      worksheet.getColumn(9).width = 12;

      const header = ["일자", "자재명", "규격", "거래처", "전기이월수량", "입고수량", "투입수량", "기타반출수량", "재고수량"];
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
            jsonValueToArray.push(d.input_date);
            jsonValueToArray.push(d.name);
            jsonValueToArray.push(d.size);
            jsonValueToArray.push(d.partner_name);
            jsonValueToArray.push(d.transfer_qty);
            jsonValueToArray.push(d.receiving_qty);
            jsonValueToArray.push(d.insert_qty);
            jsonValueToArray.push(d.output_qty);
            jsonValueToArray.push(d.remain_qty);

            let row = worksheet.addRow(jsonValueToArray);
            row.font = this.globals.bodyFontStyle as Font;
            row.getCell(1).alignment = {horizontal: "center"};
            row.getCell(4).alignment = {horizontal: "right"};
            row.getCell(5).alignment = {horizontal: "right"};
            row.getCell(6).alignment = {horizontal: "right"};
            row.getCell(7).alignment = {horizontal: "right"};
            row.getCell(8).alignment = {horizontal: "right"};
            row.getCell(9).alignment = {horizontal: "right"};
            row.eachCell((cell, number) => {
              cell.border = this.globals.bodyBorderStyle as Borders;
            });
          }
      );

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }

}
