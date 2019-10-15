import {Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ForgingResultService } from './forging-result.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './forging-result.item';
import { saveAs as importedSaveAs } from "file-saver";
import {ElectronService} from "../../../../providers/electron.service";

@Component({
  selector: 'app-page',
  templateUrl: './forging-result.component.html',
  styleUrls: ['./forging-result.component.scss'],
  providers: [ForgingResultService, DatePipe]
})
export class ForgingResultComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    productionLines: any[] = this.globals.configs['productionLine'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_order_no: string;
    sch_st: number;
    st: number;
    rows = [];
    totalQuantity: number;
    totalSalesPrice: number;

    messages = this.globals.datatableMessages;

    errorMessage: string;

    @ViewChild('salesCompletionClose') salesCompletionClose: ElementRef;
    @ViewChild('changeStatusClose') changeStatusClose: ElementRef;
    @ViewChild('hideFormClose') hideFormClose: ElementRef;
    @ViewChild('uploadFormClose') uploadFormClose: ElementRef;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: ForgingResultService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            production_line: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '조립작업실적서';
        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_prdline: formData.production_line,
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['sales_date'],
            order: ['asc'],
            maxResultCount: 10000
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];


                this.rows.sort(function(a,b) {
                    return a.dateKey > b.dateKey ? 1 : -1;
                });
                for (let i=0; i < this.rows.length; i++) {
                    this.rows[i].dateData.sort(function(a,b) {
                        return a.lineKey.localeCompare(b.lineKey)
                    })
                }

                this.isLoadingProgress = false;
            }
        );
    }


    excelDown(): void {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(blob, "조립작업실적서.xlsx");

                let win = this.elSrv.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {

                    var filename

                    if(win.destroy){
                        console.log("다운로드 취소")
                    }else{
                        filename = item.getFilename();
                    }

                    item.on('updated', (event, state) => {
                        if (state === 'interrupted') {
                            console.log('Download is interrupted but can be resumed')
                        } else if (state === 'progressing') {
                            if (item.isPaused()) {
                                console.log('Download is paused')
                            } else {
                                console.log(`Received bytes: ${item.getReceivedBytes()}`)
                            }
                        }
                    })

                    item.once('done', (event, state) => {
                        if (state === 'completed') {
                            console.log(filename + ' 저장 완료');
                        } else {
                            alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
                            console.log(`Download failed: ${state}`)
                        }
                    })

                });
            },
            error => this.errorMessage = <any>error
        );
    }




}
