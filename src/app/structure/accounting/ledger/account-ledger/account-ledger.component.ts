import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { AccountLedgerService } from './account-ledger.service';
import { MessageService } from '../../../../message.service';
import { Item } from './account-ledger.item';
import { AppGlobals } from '../../../../app.globals';
import { saveAs as importedSaveAs } from "file-saver";

@Component({
    selector: 'app-page',
    templateUrl: './account-ledger.component.html',
    styleUrls: ['./account-ledger.component.css'],
    providers: [AccountLedgerService],
    encapsulation: ViewEncapsulation.None
})
export class AccountLedgerComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    AcctCode: string;
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
        private dataService: AccountLedgerService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_sdate: ['', [Validators.required]],
            sch_edate: ['', [Validators.required]],
            acct_name: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '계정별 원장';

        //this.GetAll();
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        console.log()
        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            acct_code: this.AcctCode,
            sortby: ['slip_no', 'entry_no'],
            order: ['asc', 'asc']
        }
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
                importedSaveAs(res, "계정별 원장.xlsx");

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
            //this.searchForm.controls['sch_acc_code'].setValue(0);
        } else {
            this.AcctCode = event.item['AcctCode'];
        }
    }
}
