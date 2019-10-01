import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MonthlySumByAccountService } from './monthly-sum-by-account.service';
import { MessageService } from '../../../../message.service';
import { AccountItem } from './aggregation-account.item';
import { Item } from './monthly-sum-by-account.item';
import { saveAs as importedSaveAs } from "file-saver";
import { AppGlobals } from '../../../../app.globals';

@Component({
    selector: 'app-page',
    templateUrl: './monthly-sum-by-account.component.html',
    styleUrls: ['./monthly-sum-by-account.component.css'],
    providers: [MonthlySumByAccountService],
    encapsulation: ViewEncapsulation.None
})
export class MonthlySumByAccountComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    listData: Item[];
    rows: Item[];
    accountRows: AccountItem[];
    selectedAcctCode = [];
    selected = [];
    acct_name = [];

    rcvDate = this.globals.tDate;
    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: MonthlySumByAccountService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_year: ['', [Validators.required]],
            acct_name: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '계정별 월 집계';
        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.getAccounts();
    }

    getAccounts() {
        let formData = this.searchForm.value;      
        let schYear = formData.sch_year;
        if(isNaN(schYear)) {
            this.messageService.add('숫자만 입력하세요.');
            return false;
        }
        this.isLoadingProgress = true;
        this.dataService.GetAccounts({sch_year: schYear}).subscribe(
            acctData =>
            {                
                this.accountRows = acctData['data'];
                this.rows = [];
                this.isLoadingProgress = false;
            }
        );
    }

    onActivate(event) {
        if(event.type == 'click') {            
            let formData = this.searchForm.value;      
            let schYear = formData.sch_year;
            if(isNaN(schYear)) {
                this.messageService.add('숫자만 입력하세요.');
                return false;
            }
            this.selectedAcctCode = event.row.acct_code;
            this.acct_name = event.row.acct_name;

            this.searchForm.controls['acct_name'].setValue(this.acct_name);
            this.getAll();
        }
    }


    getAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_year: formData.sch_year,
            acct_code: this.selectedAcctCode,
            sortby: ['slip_no', 'entry_no'],
            order: ['asc', 'asc']
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
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
                importedSaveAs(res, "계정별 월 집계.xlsx");

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

    
    getRowClass(row) {
        let rt = row.is_sum_row == 'Y' ? 'row-color' : '';
        return rt;
    }


}
