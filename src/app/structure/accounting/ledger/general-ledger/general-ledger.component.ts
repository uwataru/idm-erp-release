import { Component, Inject, OnInit, ViewChild, ElementRef, Renderer2, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { saveAs as importedSaveAs } from "file-saver";
import { ModalDirective } from 'ngx-bootstrap/modal';
import { GeneralLedgerService } from './general-ledger.service';
import { MessageService } from '../../../../message.service';
import { Item } from './general-ledger.item';
import { AppGlobals } from '../../../../app.globals';
import { delay } from 'q';
import {ElectronService} from '../../../../providers/electron.service';
import { UtilsService } from '../../../../utils.service';

@Component({
    selector: 'app-page',
    templateUrl: './general-ledger.component.html',
    styleUrls: ['./general-ledger.component.css'],
    providers: [GeneralLedgerService],
    encapsulation: ViewEncapsulation.None
})
export class GeneralLedgerComponent implements OnInit {

    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;
    listData: Item[];
    rows: Item[];
    selected = [];
    rcvDate = this.globals.tDate;

    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    errorMessage: string;
    excelUploadMsg = '업로드가 완료되었습니다.';
    
    @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
    @ViewChild('printArea') printArea: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: GeneralLedgerService,
        private globals: AppGlobals,
        private messageService: MessageService,
        public electronService: ElectronService,
        private utils: UtilsService,
        private renderer: Renderer2
    ) {

        this.searchForm = fb.group({
            sch_year: ['', [Validators.required]],
            sch_month: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.searchForm.controls['sch_month'].setValue(ym[1]);
        this.panelTitle = '총계정원장';

        this.getAll();
    }

    getAll(): void {
        let formData = this.searchForm.value;        
        let params = {
            sch_year: formData.sch_year,
            sch_month: formData.sch_month,
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
                importedSaveAs(res, "총계정원장.xlsx");

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

    openModal(method, id) {
        this.uploadFormModal.show();
    }

    fileSelected(event) {
        let fileList: FileList = event.target.files;
        if(fileList.length > 0) {
            let file: File = fileList[0];
            let formData:FormData = new FormData();
            formData.append('uploadFile', file, file.name);

            this.excelUpload(formData);
        }
    }


    excelUpload(data): void {
        this.isLoadingProgress = true;
        this.dataService.UploadExcelFile(data).subscribe(
            data => {
                if(data['result'] == "success") {
                    this.getAll();
                    this.messageService.add(this.excelUploadMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.uploadFormModal.hide();     
                this.isLoadingProgress = false;              
            },
            error => this.errorMessage = <any>error
        );
    }

    getRowClass(row) {
       let rt = row.is_sum_row == 'Y' ? 'row-color' : '';
       return rt;
    }

    // setPrint(): void {
    //     const tbody: HTMLParagraphElement = this.renderer.createElement('tbody');        
    //     for(var i in this.rows) {            
    //         tbody.innerHTML += `
    //             <tr>
    //                 <td class="text-right">` + this.utils.addComma(this.rows[i].debit_carryover) + `</td>
    //                 <td class="text-right">` + this.utils.addComma(this.rows[i].debit) + `</td>
    //                 <td class="text-center">` + this.rows[i].account + `</td>
    //                 <td class="text-right">` + this.utils.addComma(this.rows[i].credit) + `</td>
    //                 <td class="text-right">` + this.utils.addComma(this.rows[i].credit_carryover) + `</td>
    //             </tr>
    //         `;
    //     }
    //     this.renderer.appendChild(this.printArea.nativeElement, tbody);
    //     this.electronService.readyPrint('print_area');
    // }

    
}
