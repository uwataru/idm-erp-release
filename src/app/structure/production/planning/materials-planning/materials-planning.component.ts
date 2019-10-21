import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DragulaService } from 'ng2-dragula';
import { DatePipe } from '@angular/common';
import { MaterialsPlanningService } from './materials-planning.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './materials-planning.item';
import {ElectronService} from "../../../../providers/electron.service";
import { saveAs as importedSaveAs } from "file-saver";

@Component({
  selector: 'app-page',
  templateUrl: './materials-planning.component.html',
  styleUrls: ['./materials-planning.component.css'],
  providers: [MaterialsPlanningService, DragulaService, DatePipe]
})
export class MaterialsPlanningComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData : Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];
    totalQuantity: number;
    totalSalesPrice: number;
    isInitPlanDate: boolean = false;

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
        private dragulaService: DragulaService,
        private dataService: MaterialsPlanningService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: ''
        });

        // 생산계획 수립일, 출력기한
        this.dataService.GetPlanningDate().subscribe(
            view => {
                this.searchForm.controls['sch_sdate'].setValue(view['planning-date']);
                this.searchForm.controls['sch_edate'].setValue(view['end-date']);
                this.GetAll();
            }
        );
    }

    ngOnInit() {
        this.panelTitle = '자재계획';
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sortby: ['seq_no'],
            order: ['asc']
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData => {
                this.listData = listData;
                this.rows = listData['data'];

                this.rows.sort(function (a, b) {
                    return a.subKey > b.subKey ? 1 : -1;
                });
                for (let i = 0; i < this.rows.length; i++) {
                    this.rows[i].subData.sort(function (a, b) {
                        return a.working_date.localeCompare(b.working_date)
                            || b.product_code.localeCompare(a.product_code)
                            || a.production_line.localeCompare(b.production_line);
                    });
                }

                //this.totalQty = listData['sumData']['total_qty'];
                //this.totalSalesPrice = listData['sumData']['total_sales_price'];

                this.isLoadingProgress = false;
                if (this.isInitPlanDate == false) {
                    this.isInitPlanDate = true;
                }
            }
        );
    }





    excelDown(): void {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(blob, "자제계획.xlsx");

                let win = this.elSrv.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {

                    const filename = item.getFilename();

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
