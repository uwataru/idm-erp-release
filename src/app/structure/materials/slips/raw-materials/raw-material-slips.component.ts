import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { RawMaterialsStorageSlipsService } from './raw-material-slips.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './raw-material-slips.item';
import { AppConfig } from '../../../../../environments/environment';
import { ElectronService } from '../../../../providers/electron.service';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './raw-material-slips.component.html',
    styleUrls: ['./raw-material-slips.component.css'],
    providers: [RawMaterialsStorageSlipsService],
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialSlipsComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    statusConfirmBtn: string;
    isLoadingProgress: boolean = false;
    deleteConfirmMsg: string;
    hideConfirmMsg: string;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selectedId: string;
    listData: Item[];
    formData: Item['data'];

    rcvDate = this.globals.tDate;
    rows = [];
    selected = [];
    totalOrderAmount: number;
    totalRcvWeight: number;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    drAcctCode: string;
    crAcctCode: string;
    resultRows = Item['data'];
    slipNo: string;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '저장되었습니다.';

    @ViewChild('PrintResultsModal') PrintResultsModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: RawMaterialsStorageSlipsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data)) {
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
            rcv_date: '',
            slip_no: ''
        });

        this.inputForm = fb.group({
            dr_acct_name: ['', [Validators.required]],
            cr_acct_name: ['', [Validators.required]]
        });

        // 차변계정
        this.inputForm.controls['dr_acct_name'].setValue('환봉');
        this.drAcctCode = '112033';

        // 대변계정
        this.inputForm.controls['cr_acct_name'].setValue('외상매입금');
        this.crAcctCode = '210012';
    }

    ngOnInit() {
        this.panelTitle = '원자재입고전표처리';
        this.searchForm.controls['rcv_date'].setValue(this.rcvDate);
        this.GetAll();

        $(document).ready(function () {
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
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

        setTimeout(() => {
            let params = {
                sch_sdate: this.rcvDate,
                // st: 2   // is_slip = 'N'
            }
            this.isLoadingProgress = true;
            this.dataService.GetAll(params).subscribe(
                listData => {
                    this.listData = listData;

                    this.rows = [];
                    for (let i in listData['data']) {
                        listData['data'][i].sales_price = listData['data'][i].receiving_qty * listData['data'][i].price;
                    }

                    this.rows = listData['data'];

                    // this.totalOrderAmount = listData['totalOrderAmount'];
                    // this.totalRcvWeight = listData['totalRcvWeight'];

                    this.isLoadingProgress = false;
                }
            );
        }, 10);
    }

    onSelect({ selected }) {
        console.log('Select Event', selected, this.selected);

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    onSelectAccounts(event: TypeaheadMatch, drcr): void {
        if (event.item['AcctCode'] == '') {
            this.drAcctCode = '';
            this.crAcctCode = '';
        } else {
            if (drcr == 'dr') {
                this.drAcctCode = event.item['AcctCode'];
            } else {
                this.crAcctCode = event.item['AcctCode'];
            }
        }
    }

    Save() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let checkedIdArr = [];
        this.selected.forEach((e: any) => {
            checkedIdArr.push(e.id);
        });
        let params = {
            'checked_id': checkedIdArr.join(','),
            // 'grp_no': '200',
            // 'rcv_date': this.rcvDate,
            // 'dr_acct_code': this.drAcctCode,
            // 'cr_acct_code': this.crAcctCode
        }
        this.dataService.Save(params)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.searchForm.controls['slip_no'].setValue(data['slipNo']);
                        //this.inputForm.reset();
                        this.selected = [];

                        // 전표 출력
                        this.openResultModal(data['slipNo']);

                        this.GetAll();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    // this.closeWriteModal();
                },
                error => this.errorMessage = <any>error
            );
    }

    private openResultModal(slipNo): void {
        this.dataService.GetSlip(slipNo).subscribe(
            data => {
                if (data['data'].length > 0) {
                    this.resultRows = data['data'];
                    this.slipNo = data['slip_no'];
                    this.PrintResultsModal.show();
                }
            }
        );
    }

}
