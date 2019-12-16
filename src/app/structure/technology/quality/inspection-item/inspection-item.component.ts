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
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../../providers/electron.service";
import {saveAs as importedSaveAs} from "file-saver";
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
    public elSrv: ElectronService,
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

      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 10;
      worksheet.getColumn(3).width = 10;
      worksheet.getColumn(4).width = 10;
      worksheet.getColumn(5).width = 10;
      worksheet.getColumn(6).width = 10;
      worksheet.getColumn(7).width = 10;
      worksheet.getColumn(8).width = 10;

      const header = ["생산일자", "찍힘", "깨짐", "인쇄불량", "색상불량", "성형불량", "작업불량", "기타"];
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
            jsonValueToArray.push(d.defect_count1);
            jsonValueToArray.push(d.defect_count2);
            jsonValueToArray.push(d.defect_count3);
            jsonValueToArray.push(d.defect_count4);
            jsonValueToArray.push(d.defect_count5);
            jsonValueToArray.push(d.defect_count6);
            jsonValueToArray.push(d.defect_count7);

            let row = worksheet.addRow(jsonValueToArray);
            row.font = this.globals.bodyFontStyle as Font;
            row.getCell(1).alignment = {horizontal: "center"};
            row.getCell(2).alignment = {horizontal: "right"};
            row.getCell(3).alignment = {horizontal: "right"};
            row.getCell(4).alignment = {horizontal: "right"};
            row.getCell(5).alignment = {horizontal: "right"};
            row.getCell(6).alignment = {horizontal: "right"};
            row.getCell(7).alignment = {horizontal: "right"};
            row.getCell(8).alignment = {horizontal: "right"};
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
