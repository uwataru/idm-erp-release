import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SlipsApprovalService } from './slips-approval.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { saveAs as importedSaveAs } from "file-saver";
import { MessageService } from '../../../../message.service';
import { Item } from './slips-approval.item';
import { ElectronService } from '../../../../providers/electron.service';

@Component({
  selector: 'app-page',
  templateUrl: './slips-approval.component.html',
  styleUrls: ['./slips-approval.component.css'],
  providers: [SlipsApprovalService]
})
export class SlipsApprovalComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    statusConfirmBtn: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;
    currGrpNo: number = -1;
    currTotalCnt: number;
    sTotalCnt: number;
    s0Cnt: number;
    s200Cnt: number;
    s400Cnt: number;
    s600Cnt: number;
    s800Cnt: number;

    listData : Item[];
    rows = [];

    skipCount: number = 1;
    slipNo: string;
    drAmountSum: number;
    crAmountSum: number;

    inputForm: FormGroup;

    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '처리되었습니다.';

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private datePipe: DatePipe,
        private dataService: SlipsApprovalService,
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
            curr_total_cnt: '',
            curr_order_no: ''
        });

        this.inputForm = fb.group({
            appr_type: ''
        });

        this.inputForm.controls['appr_type'].patchValue('0');
    }

    ngOnInit() {
        this.panelTitle = '전표 결재';
        this.GetAll(this.currGrpNo);
    }

    GetAll(grpNo:number): void {
        let params = {
            user_id: this.globals.userId,
            skipCount: this.skipCount
        }
        if (grpNo >= 0) {
            params['grp_no'] = grpNo;
        }
        this.currGrpNo = grpNo;
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                this.skipCount = listData['skipCount'];
                this.slipNo = listData['slipNo'];
                this.drAmountSum = listData['drAmountSum'];
                this.crAmountSum = listData['crAmountSum'];

                this.sTotalCnt = listData['sumData']['total'];
                this.s0Cnt = listData['sumData']['s0'];
                this.s200Cnt = listData['sumData']['s200'];
                this.s400Cnt = listData['sumData']['s400'];
                this.s600Cnt = listData['sumData']['s600'];
                this.s800Cnt = listData['sumData']['s800'];

                switch (this.currGrpNo) {
                    case -1:  this.currTotalCnt = this.sTotalCnt; break;
                    case 0:   this.currTotalCnt = this.s0Cnt; break;
                    case 200: this.currTotalCnt = this.s200Cnt; break;
                    case 400: this.currTotalCnt = this.s400Cnt; break;
                    case 600: this.currTotalCnt = this.s600Cnt; break;
                    case 800: this.currTotalCnt = this.s800Cnt; break;
                }
                this.searchForm.controls['curr_total_cnt'].patchValue(this.currTotalCnt);
                this.searchForm.controls['curr_order_no'].patchValue(this.skipCount);

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
                importedSaveAs(res, "전표 결재.xlsx");

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

    GetGroupSlip(grpNo:number): void {
        this.skipCount = 1;
        this.GetAll(grpNo);
    }

    GetPrevSlip(): void {
        this.skipCount--;
        this.GetAll(this.currGrpNo);
    }

    GetNextSlip(): void {
        this.skipCount++;
        this.GetAll(this.currGrpNo);
    }

    Save () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let formData = this.inputForm.value;
        formData.slip_no = this.slipNo;

        // 계정과목 선택여부 체크
        formData.user_id = this.globals.userId;
        formData.appr_type = formData.appr_type * 1;
        if (formData.appr_type == 0) {
            this.messageService.add('결재/보류/부결 중 하나를 선택해주세요!');
            return false;
        }

        this.dataService.Approval(formData)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.GetGroupSlip(this.currGrpNo);
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

}
