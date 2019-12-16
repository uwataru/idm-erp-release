import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../message.service';

import { Item } from './personnel-management.item';
import { PersonnelManagementService } from './personnel-management.service';
import {UtilsService} from "../../../utils.service";
import {ElectronService, EXPORT_EXCEL_MODE} from "../../../providers/electron.service";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";
import {saveAs as importedSaveAs} from "file-saver";
declare var $: any;

@Component({
  selector: 'app-personnel-management',
  templateUrl: './personnel-management.component.html',
  styleUrls: ['./personnel-management.component.scss'],
  providers: [PersonnelManagementService]
})
export class PersonnelManagementComponent implements OnInit {
  panelTitle: string;

  isLoadingProgress: boolean = false;
  selectedId: string;
  listData : Item[];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  selectedCnt: number;
  editData: Item;
  formData: Item['data'];
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  searchForm: FormGroup;
  tDate = this.globals.tDate;

  errorMessage: string;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: PersonnelManagementService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private utils: UtilsService,
    public elSrv: ElectronService
  ) {
      this.searchForm = fb.group({
          sch_sdate: '',
          sch_edate: '',
          sch_worker_name: ''
      });
   }

  ngOnInit() {
    this.panelTitle = '생산인력투입기록';

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

  onSelect({ selected }) {
    // console.log('Select Event', selected, this.selected);

    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
}

    getAll(): void {
        let formData = this.searchForm.value;

        this.selectedId = '';
        this.selected = [];

        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            maxResultCount: 1000
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.temp = listData['data'];
                this.rows = listData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    updateFilter(event) {
        // let partner_code = this.listSltdPaCode;
        const val = event.target.value;
        // filter data
        const temp = this.temp.filter(function (d) {
            // console.log(d);
            return (d.personnel_name!=null &&  d.personnel_name.indexOf(val) !== -1) || !val;
        });

        // update the rows
        this.rows = temp;
    }

    totalWorkTime(){
        let totalVal = 0;
        for(let i in this.rows){
            totalVal += parseInt(this.rows[i].work_time);
        }
        return this.utils.addComma(totalVal);
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
            worksheet.getColumn(2).width = 15;
            worksheet.getColumn(3).width = 25;
            worksheet.getColumn(4).width = 25;
            worksheet.getColumn(5).width = 15;
            worksheet.getColumn(6).width = 12;
            worksheet.getColumn(7).width = 10;

            const header = ["작업일자", "수주번호", "거래처", "제품명", "규격", "작업자", "작업시간"];
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
                    jsonValueToArray.push(d.order_no);
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.product_name);
                    jsonValueToArray.push(d.product_type);
                    jsonValueToArray.push(d.personnel_name);
                    jsonValueToArray.push(d.work_time);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(1).alignment = {horizontal: "center"};
                    row.getCell(2).alignment = {horizontal: "center"};
                    row.getCell(6).alignment = {horizontal: "center"};
                    row.getCell(7).alignment = {horizontal: "right"};
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
