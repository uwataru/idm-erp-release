import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ReceivableNotesService } from './receivable-notes.service';
import { saveAs as importedSaveAs } from "file-saver";
import { MessageService } from '../../../../message.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppGlobals } from '../../../../app.globals';
import { Item } from './receivable-notes.item';

@Component({
    selector: 'app-page',
    templateUrl: './receivable-notes.component.html',
    styleUrls: ['./receivable-notes.component.css'],
    providers: [ReceivableNotesService],
    encapsulation: ViewEncapsulation.None
})
export class ReceivableNotesComponent implements OnInit {

    panelTitle: string;
    errorMessage: string;
    isLoadingProgress: boolean = false;
    rows: Item[];

    messages = this.globals.datatableMessages;
    rcvDate = this.globals.tDate;
    searchForm: FormGroup;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: ReceivableNotesService,
        private globals: AppGlobals,
        private messageService: MessageService) {

        this.searchForm = fb.group({
            sch_year: ['', [Validators.required]],
            sch_month: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '받을어음명세서';

        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.searchForm.controls['sch_month'].setValue(ym[1]);

        this.GetAll();
    }

    GetAll(): void {
        
        let formData = this.searchForm.value;
        let sch_year = formData.sch_year.trim();
        let sch_month = formData.sch_month.trim();

        if(!sch_year || !sch_month) {
            this.messageService.add('검색년월을 빠짐없이 입력하세요.');
            return;
        }

        let params = {
            sch_year: sch_year,
            sch_month: sch_month
        };

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
                importedSaveAs(res, "받을어음명세서.xlsx");

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
        let rt = '';
        if(row.is_all_sum_row == 'Y') {
            rt = 'all-row-color';
        }      
        return rt;
    }

}
