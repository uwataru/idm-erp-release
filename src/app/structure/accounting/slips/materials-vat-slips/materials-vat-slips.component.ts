import { ElectronService } from '../../../../providers/electron.service';
import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { MaterialsVatSlipsService } from './materials-vat-slips.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { saveAs as importedSaveAs } from "file-saver";
import { MessageService } from '../../../../message.service';
import { Item } from './materials-vat-slips.item';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './materials-vat-slips.component.html',
  styleUrls: ['./materials-vat-slips.component.css'],
  providers: [MaterialsVatSlipsService],
  encapsulation: ViewEncapsulation.None
})
export class MaterialsVatSlipsComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    statusConfirmBtn: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;
    inputForm: FormGroup;
    AcctCode: string;

    selectedId: string;
    listData : Item[];
    formData: Item['data'];
    listAccounts: any[] = this.globals.configs['acct'];

    rcvDate = this.globals.tDate;
    st: number;
    rows = [];
    selected = [];
    totalOrderAmount: number;
    totalRcvWeight: number;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '저장되었습니다.';

    //@ViewChild('writeFormClose') writeFormClose: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private datePipe: DatePipe,
        private dataService: MaterialsVatSlipsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
            if (route.routeConfig.data.id in this.globals.userPermission) {
                console.log(route.routeConfig.data.id);
                if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
                    this.isExecutable = true;
                }
                if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
                    this.isPrintable = true;
                }
            }
        }

        this.searchForm = fb.group({
            sch_year: '',
            sch_month: ''
        });

        this.inputForm = fb.group({
            acct_name: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '원자재 부가세 현황';
        let ym = this.rcvDate.split('-');
        this.searchForm.controls['sch_year'].setValue(ym[0]);
        this.searchForm.controls['sch_month'].setValue(ym[1]);
        this.GetAll();

        // 대변계정
        this.inputForm.controls['acct_name'].setValue('외상매입금');
        this.AcctCode = '210012';

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    onValueChange(value: Date): void {
        this.rcvDate = this.datePipe.transform(value, 'yyyy-MM-dd');
        this.GetAll();
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        let params = {
            sch_year: formData.sch_year,
            sch_month: formData.sch_month,
            grp_no: 200
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];

                this.totalOrderAmount = listData['totalOrderAmount'];
                this.totalRcvWeight = listData['totalRcvWeight'];

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
                importedSaveAs(res, "원자재 부가세 현황.xlsx");

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
        }
    }

    Save() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let formData = this.searchForm.value;

        let idArr = [];
        this.selected.forEach((e:any) => {
            let vat_amount = this.utils.removeComma((<HTMLInputElement>document.getElementById('vat_amount_' + e.partner_code)).value) * 1;
            idArr.push(e.partner_code + ':#:' + e.amount + ':#:' + vat_amount);
        });
        let params = {
            sch_year: formData.sch_year,
            sch_month: formData.sch_month,
            grp_no: '200',
            slip_ids: idArr.join('=||='),
            acct_code: this.AcctCode
        }
        this.dataService.Create(params)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.GetAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

}
