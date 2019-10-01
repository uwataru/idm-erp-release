import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { manItemsLedgerService } from './man-items-ledger.service';
import { MessageService } from '../../../../message.service';
import { Item } from './man-items-ledger.item';
import { saveAs as importedSaveAs } from "file-saver";
import { AppGlobals } from '../../../../app.globals';

@Component({
    selector: 'app-page',
    templateUrl: './man-items-ledger.component.html',
    styleUrls: ['./man-items-ledger.component.css'],
    providers: [manItemsLedgerService],
    encapsulation: ViewEncapsulation.None
})
export class ManItemsLedgerComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listAccounts: any[] = this.globals.configs['acct'];
    listMgmtItems = [];
    listMgmtItemValues = [];
    tmpListData = [];

    AcctCode: string;
    MgmtItemNo: string;

    listData: Item[];

    rows: Item[];
    drAmountSum: number;
    crAmountSum: number;
    totalDrAmountSum: number;
    totalCrAmountSum: number;

    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private datePipe: DatePipe,
        private dataService: manItemsLedgerService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_sdate: ['', [Validators.required]],
            sch_edate: ['', [Validators.required]],
            acct_name: ['', [Validators.required]],
            sch_item_text: ['', [Validators.required]],
            sch_item_value_text: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '관리내역별 원장';
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            acct_code: this.AcctCode,
            sch_item_no: this.MgmtItemNo,
            sch_item_value_text: formData.sch_item_value_text,
            sortby: ['slip_no', 'entry_no'],
            order: ['asc', 'asc']
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                this.drAmountSum = listData['drAmountSum'];
                this.crAmountSum = listData['crAmountSum'];
                this.totalDrAmountSum = listData['prevDrAmountSum'] + listData['drAmountSum'];
                this.totalCrAmountSum = listData['prevCrAmountSum'] + listData['crAmountSum'];

                this.isLoadingProgress = false;
            }
        );
    }

    excelDown() {
        let path = this.electronService.path;
        let app = this.electronService.remote.app;
        //let dialog = this.electronService.remote.dialog;
        //let toLocalPath = path.resolve(app.getPath("desktop"), "원자재마스터.xlsx");
        //let userChosenPath = dialog.showSaveDialog({ defaultPath: toLocalPath });

        //if (userChosenPath) {
        this.dataService.GetExcelFile().subscribe(
            res => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(res, "관리내역별 원장.xlsx");
 
                let win = this.electronService.remote.getCurrentWindow();

                win.webContents.session.on('will-download', (event, item, webContents) => {
                    // Set the save path, making Electron not to prompt a save dialog.
                    //item.setSavePath('d:\project\원자재마스터.xlsx')
                    //item.setSavePath('d:\\project\\원자재마스터.xlsx');

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
        //}
    }

    onSelectAccounts(event: TypeaheadMatch): void {
        if (event.item['AcctCode'] == '') {
            this.AcctCode = '';
        } else {
            this.AcctCode = event.item['AcctCode'];
            this.dataService.GetMgmtItems(this.AcctCode).subscribe(
                data => {    
                    this.tmpListData = data['data'];
                    this.listMgmtItems = [];
                    this.listMgmtItemValues = [];

                    if (data['data']['mgmt_item1_no'] != '') {
                        this.listMgmtItems.push({mgmt_item_no: data['data']['mgmt_item1_no'], mgmt_item_name: data['data']['mgmt_item1_name']});
                    }
                    if (data['data']['mgmt_item2_no'] != '') {
                        this.listMgmtItems.push({mgmt_item_no: data['data']['mgmt_item2_no'], mgmt_item_name: data['data']['mgmt_item2_name']});
                    }
                    if (data['data']['mgmt_item3_no'] != '') {
                        this.listMgmtItems.push({mgmt_item_no: data['data']['mgmt_item3_no'], mgmt_item_name: data['data']['mgmt_item3_name']});
                    }
                    if (data['data']['mgmt_item4_no'] != '') {
                        this.listMgmtItems.push({mgmt_item_no: data['data']['mgmt_item4_no'], mgmt_item_name: data['data']['mgmt_item4_name']});
                    }
                    this.searchForm.patchValue({sch_item_text: '', sch_item_value_text: ''});
                }
            );
        }
    }

    onSelectMgmtItems(event: TypeaheadMatch): void {
        
        if (event.item['mgmt_item_no'] == '') {
            this.MgmtItemNo = '';
        } else {
            this.listMgmtItemValues = [];
            this.MgmtItemNo = event.item['mgmt_item_no'];
            this.dataService.GetMgmtItemValues({acct_code:this.AcctCode, mgmt_item_no: this.MgmtItemNo}).subscribe(
                data => {
                    if(data['data'] == null) {
                        this.listMgmtItemValues.push(null);
                    } else {
                        this.listMgmtItemValues = data['data'];     
                    } 
                    this.searchForm.patchValue({sch_item_value_text: ''});             
                }
            );
        }
    }

}
