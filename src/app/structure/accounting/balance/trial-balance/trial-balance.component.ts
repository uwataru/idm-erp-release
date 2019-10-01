import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TrialBalanceService } from './trial-balance.service';
import { saveAs as importedSaveAs } from "file-saver";
import { Item } from './trial-balance.item';
import { MessageService } from '../../../../message.service';
import { AppGlobals } from '../../../../app.globals';
import {ElectronService} from '../../../../providers/electron.service';
import { UtilsService } from '../../../../utils.service';

@Component({
    selector: 'app-page',
    templateUrl: './trial-balance.component.html',
    styleUrls: ['./trial-balance.component.css'],
    providers: [TrialBalanceService],
    encapsulation: ViewEncapsulation.None
})
export class TrialBalanceComponent implements OnInit {

    panelTitle: string;    
    uploadFormTitle: string;

    isLoadingProgress: boolean = false;
    inputFormTitle: string;
    deleteFormTitle: string;
    isEditMode: boolean = false;
    rows: Item[];
    selected = [];
    rcvDate = this.globals.tDate;

    errorMessage: string;
    searchForm: FormGroup;
    years: number[];
    months: number[];
    currYear = Number(this.rcvDate.split('-')[0]);
    currMonth = Number(this.rcvDate.split('-')[1]);

    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;


    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('excel_sch_year') excelSchYear: ElementRef;
    @ViewChild('excel_sch_month') excelSchMonth: ElementRef;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: TrialBalanceService,
        private globals: AppGlobals,
        private messageService: MessageService,
        public electronService: ElectronService,
        private utils: UtilsService
        ) {

            this.searchForm = fb.group({
                sch_year: [this.currYear, [Validators.required]],
                sch_month: [this.currMonth, [Validators.required]]
            });

        }

    ngOnInit() {
        this.panelTitle = '시산표';
        this.inputFormTitle = '등록';
        this.deleteFormTitle = '삭제';
        
        this.uploadFormTitle = '시산표 엑셀업로드';

        this.years = Array.from({length: 10}, (x, i) => (Number(this.currYear)-5)+i);
        this.months = Array.from({length: 12}, (x, i) => i+1);

        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;        
        let params = {
            sch_year: formData.sch_year,
            sch_month: formData.sch_month
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


    openModal(method, id) {
    
        if (method == 'upload') {
            this.uploadFormModal.show();
        }
        
    }


    excelDown(): void {    
        let ym = this.excelSchYear.nativeElement.value + "-" + this.excelSchMonth.nativeElement.value
        this.dataService.GetExcelFile(ym).subscribe(
            blob => {
                // Filesaver.js 1.3.8
                // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
                importedSaveAs(blob, "시산표.xlsx");

                let win = this.electronService.remote.getCurrentWindow();

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
                            this.uploadFormModal.hide();
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


    fileSelected (event) {
        let fileList: FileList = this.uploadFileSrc.nativeElement.files;
        if(fileList.length > 0) {
            let file: File = fileList[0];
            let formData:FormData = new FormData();
            
            let ym = this.excelSchYear.nativeElement.value + "-" + this.excelSchMonth.nativeElement.value
            formData.append('uploadFile', file, file.name);
            this.excelUpload(formData, ym);
        }
    }

    excelUpload (data, ym): void {
        this.dataService.UploadExcelFile(data, ym).subscribe(
            data => {
                if (data['result'] == "success") {
                    this.getAll();
                    this.messageService.add('업로드가 완료되었습니다.');
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.uploadFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }
    
}
