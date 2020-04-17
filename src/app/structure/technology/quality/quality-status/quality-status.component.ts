import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../../message.service';
import {BsDatepickerConfig, BsDatepickerViewMode} from "ngx-bootstrap/datepicker";

import { Item } from './quality-status.item';
import { QualityStatusService } from './quality-status.service';
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";
import { ElectronService, EXPORT_EXCEL_MODE } from "../../../../providers/electron.service";
import { saveAs as importedSaveAs } from "file-saver";
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
  searchProductForm: FormGroup;
  tDate = this.globals.tDate;
  isLoadingProgress: boolean = false;

  inputForm: FormGroup;
  productsForm: FormGroup;

  schYM: string;
  detailData = [];
  editData: Item;
  listData: Item[];
  formData: Item['data'];
  sch_partner_name: string;
  listSltdPaCode: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_product_name: string;
  rows = [];
  ProductRows = [];
  ProductDetailRows = [];

  product_name: string;
  sch_year_month: string;

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

  bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
    minMode : 'month' as BsDatepickerViewMode,
    dateInputFormat: 'YYYY-MM'
  });

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('ProductsFormModal') ProductsFormModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    public elSrv: ElectronService,
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
    this.searchProductForm = fb.group({
      sch_yyMM: '',
    });

  }

  ngOnInit() {
    this.panelTitle = "품질현황";
    this.inputFormTitle = '불량내역';

    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);
    this.searchProductForm.controls['sch_yyMM'].setValue(this.tDate);

    this.getAll();
    this.getAllProductList();
  }

  onValueChange(value: Date): void {
    // console.log(this.searchForm.controls['sch_yearmonth'].value);
    this.searchProductForm.controls['sch_yyMM'].setValue(value);
    this.getAllProductList();
}

  getAllProductList(): void {
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
      this.ProductRows = [];

      let formData = this.searchProductForm.value;

      let params = {
          sch_yearmonth: this.datePipe.transform(formData.sch_yyMM, 'yyyy-MM')
      };
        this.schYM = params.sch_yearmonth;
      this.isLoadingProgress = true;
      this.dataService.GetAllProductList(params).subscribe(
        listData => {
          this.listData = listData;
          this.ProductRows = listData['data'];

          this.isLoadingProgress = false;
        }
      );
    }, 10);
  }
  getAll(): void {
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
      this.rows = [];
      this.qty_0 = 0;
      this.qty_1 = 0;
      this.qty_2 = 0;
      this.qty_3 = 0;
      this.qty_4 = 0;
      this.qty_5 = 0;
      this.qty_6 = 0;
      let formData = this.searchForm.value;

      let params = {
        sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
        sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
        order: ['asc'],
        maxResultCount: 10000
      }
      this.isLoadingProgress = true;
      this.dataService.GetAll(params).subscribe(
        listData => {
          this.listData = listData;
          this.rows = listData['data'];

          this.isLoadingProgress = false;
        }
      );
    }, 10);
  }

  openModal(type,id) {
    if (type == 'list'){
      this.inputFormModal.show();
      // this.inputForm.reset();
      this.dataService.GetById(id).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.editData = editData;
            this.formData = editData['data'];
            console.log('!!!!!!!', this.formData);
  
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
    }else{
      this.ProductsFormModal.show();
      this.detailData = [];
      let params = {
        sch_yearmonth: this.schYM,
        order: ['asc'],
        maxResultCount: 10000
      }

      this.dataService.GetAllProductListDetail(id,params).subscribe(
        editData => {
          if (editData['result'] == 'success') {
            this.detailData = editData;
            this.formData = editData['data'];
            console.log('!!!!!!!', this.formData);
            
            this.product_name = this.detailData['product_name'];
            this.sch_year_month = this.detailData['sch_year_month'];
  
          }
        }
      );
    }

  }

  exportExcel(type: EXPORT_EXCEL_MODE, fileName,setData) {
    if (this.elSrv.checkExportExcel()) {
      let data;
      if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
        // data = this.dataService.GetMasterExcelData()['data'];
      } else { //리스트는 기존 가져온 데이터로 생성
        if(setData == 'detail'){
          data = this.ProductDetailRows;
        }else{
          data = this.rows;
        }
      }

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet(this.panelTitle);
      if(setData == 'detail'){
        worksheet.getColumn(1).width = 15;
        worksheet.getColumn(2).width = 15;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 15;

        let header = ["생산일자", "불량수량", "불량자재", "불량유형"];
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
          jsonValueToArray.push(d.production_date);
          jsonValueToArray.push(d.qty);
          jsonValueToArray.push(d.name);
          jsonValueToArray.push(d.value);
  
          let row = worksheet.addRow(jsonValueToArray);
          row.font = this.globals.bodyFontStyle as Font;
          row.getCell(1).alignment = { horizontal: "center" };
          row.getCell(2).alignment = { horizontal: "center" };
          row.getCell(3).alignment = { horizontal: "center" };
          row.getCell(4).alignment = { horizontal: "center" };
          row.eachCell((cell, number) => {
            cell.border = this.globals.bodyBorderStyle as Borders;
          });
        }
        );

      }else{
        worksheet.getColumn(1).width = 15;
        worksheet.getColumn(2).width = 25;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(4).width = 12;
        worksheet.getColumn(5).width = 12;
        worksheet.getColumn(6).width = 12;
        worksheet.getColumn(7).width = 12;
  
        let header = ["수주번호", "제품명", "규격", "총생산수량", "양품수량", "불량수량", "불량율(%)"];
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
          jsonValueToArray.push(d.order_no);
          jsonValueToArray.push(d.product_name);
          jsonValueToArray.push(d.product_type);
          jsonValueToArray.push(d.total_qty);
          jsonValueToArray.push(d.normal_qty);
          jsonValueToArray.push(d.defect_qty);
          jsonValueToArray.push(d.defect_probability);
  
          let row = worksheet.addRow(jsonValueToArray);
          row.font = this.globals.bodyFontStyle as Font;
          row.getCell(1).alignment = { horizontal: "center" };
          row.getCell(4).alignment = { horizontal: "right" };
          row.getCell(5).alignment = { horizontal: "right" };
          row.getCell(6).alignment = { horizontal: "right" };
          row.getCell(7).alignment = { horizontal: "right" };
          row.eachCell((cell, number) => {
            cell.border = this.globals.bodyBorderStyle as Borders;
          });
        }
        );
      }


      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }

}
