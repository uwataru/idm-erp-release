import { ElectronService } from '../../../../providers/electron.service';
import { Component, EventEmitter, Output, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { VatSumService } from './vat-sum.service';
import { MessageService } from '../../../../message.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppGlobals } from '../../../../app.globals';
import { Item } from './vat-sum.item';
import { saveAs as importedSaveAs } from "file-saver";
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-page',
    templateUrl: './vat-sum.component.html',
    styleUrls: ['./vat-sum.component.css'],
    providers: [VatSumService],
    encapsulation: ViewEncapsulation.None
})
export class VatSumComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;
    rows: Item[];

    gridHeight = this.globals.gridHeight - 100;
    messages = this.globals.datatableMessages;
    rcvDate = this.globals.tDate;
    searchForm: FormGroup;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: VatSumService,
        private datePipe: DatePipe,
        private globals: AppGlobals,
        private messageService: MessageService) {

        this.searchForm = fb.group({
            sch_sdate: ['', [Validators.required]],
            sch_edate: ['', [Validators.required]],
            acct_code: ['111110', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '부가세집계표';

        let myDate = new Date(this.rcvDate);
        let prevYmd = new Date( myDate.setMonth(myDate.getMonth()-1) );        
        this.searchForm.controls['sch_sdate'].setValue( this.datePipe.transform( prevYmd , 'yyyy-MM-dd') );
        this.searchForm.controls['sch_edate'].setValue( this.datePipe.transform( prevYmd , 'yyyy-MM-dd') );

        this.GetAll();
    }

    GetAll(): void {
        
        let formData = this.searchForm.value;
        let sch_sdate = this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd');
        let sch_edate = this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd');
        let acct_code = formData.acct_code;

        let params = {
            sch_sdate: sch_sdate,
            sch_edate: sch_edate,
            acct_code: acct_code
        };


        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.rows = listData['data'];
                this.isLoadingProgress = false;
            }
        );
        let tmpEL = document.getElementById("acct_code_text") as HTMLInputElement;
        switch (acct_code) {
           case '111110': tmpEL.value ="부가세대급금"; break;
           case '210110': tmpEL.value ="부가세예수금"; break;
       }

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
                importedSaveAs(res, "부가세집계표.xlsx");

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
        return row.is_sum_row == 'Y' ? 'row-color' : '';
    }

}
