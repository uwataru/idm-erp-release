import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MonthlySumByManItemsService } from './monthly-sum-by-man-items.service';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { MessageService } from '../../../../message.service';
import { saveAs as importedSaveAs } from "file-saver";
import { ManItemsItem } from './aggregation-man-items.item';
import { SumItem } from './monthly-sum-by-man-items.item';
import { AppGlobals } from '../../../../app.globals';

@Component({
    selector: 'app-page',
    templateUrl: './monthly-sum-by-man-items.component.html',
    styleUrls: ['./monthly-sum-by-man-items.component.css'],
    providers: [MonthlySumByManItemsService],
    encapsulation: ViewEncapsulation.None
})
export class MonthlySumByManItemsComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;

    listAccounts: any[] = this.globals.configs['acct'];
    inputFormTitle: string;
    manItemsRows: ManItemsItem[];
    rows: SumItem[];
    selectAcctCode: string;
    selected = [];

    selectedMgmtItemNo: number;
    searchForm: FormGroup;

    rcvDate = this.globals.tDate;
    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: MonthlySumByManItemsService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {
          this.searchForm = fb.group({
            sch_year: ['', [Validators.required]],
            sch_acct_code: [''],
            sch_acct_name: [''],
            mgmt_item_name: ['']
        });
    }

    ngOnInit() {
        this.panelTitle = '관리내역별 월 집계';
        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.getManItems();
    }

    getManItems() {
        let formData = this.searchForm.value;      
        let schYear = formData.sch_year;

        if(isNaN(schYear)) {
            this.messageService.add('숫자만 입력하세요.');
            return false;
        }

        this.isLoadingProgress = true;
        this.dataService.GetManItems({sch_year : schYear}).subscribe(
            manItemData =>
            {                
                this.manItemsRows = manItemData['data'];
                this.rows = [];
                this.isLoadingProgress = false;
            }
        );
    }


    getAll(): void {
        let formData = this.searchForm.value;
        let sch_acct_name = formData.sch_acct_name;

        let params = {
            sch_year: formData.sch_year,
            mgmt_item_no: this.selectedMgmtItemNo,          
            sortby: ['acct_code'],
            order: ['asc']
        }
        if(sch_acct_name != '' && this.selectAcctCode != undefined) {
            params['acct_code'] = this.selectAcctCode;
        }

        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
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
                importedSaveAs(res, "관리내역별 월 집계.xlsx");

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
            this.selectAcctCode = '';
        } else {
            this.selectAcctCode = event.item['AcctCode'];
        }
    }

    onActivate(event) {
        if(event.type == 'click') {     
            let formData = this.searchForm.value;      
            let schYear = formData.sch_year;
            if(isNaN(schYear)) {
                this.messageService.add('숫자만 입력하세요.');
                return false;
            }
            this.selectedMgmtItemNo = event.row.mgmt_item_no;
            this.searchForm.controls['mgmt_item_name'].setValue(event.row.mgmt_item_name);
            this.getAll();
        }
    }


    getRowClass(row) {
        let rt = row.is_sum_row == 'Y' ? 'row-color' : '';
        return rt;
     }
}
