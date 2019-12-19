import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { ExpendablesSlipsService } from './expendables-slips.service';
import { MessageService } from '../../../../message.service';
import { Item } from './expendables-slips.item';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
declare var $: any;
var brief_summary_dr: string;
@Component({
    selector: 'app-page',
    templateUrl: './expendables-slips.component.html',
    styleUrls: ['./expendables-slips.component.scss'],
    providers: [ExpendablesSlipsService]
})

export class ExpendablesSlipsComponent implements OnInit {
    panelTitle: string;
    isLoadingProgress: boolean = false;
    searchFormTitle: string;
    deleteFormTitle: string;
    isTmpEditMode: boolean = false;
    isEditMode: boolean = false;
    selectedSlipId: number;
    listData: Item[];
    editData: Item;
    formData: Item['data'];
    rows = [];
    drAmountSum: number;
    crAmountSum: number;
    delId = [];
    selected = [];
    totalCount: number;

    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    tDate = this.globals.tDate;
    SlipNo: string;
    TmpSlipCode: string;
    selectedEntryNo: number;
    maxEntryNo: number;
    InputDate = this.globals.tDate;
    AuthCode: string;
    AcctCode: string;
    MgmtItem1No: number;
    MgmtItem2No: number;
    MgmtItem3No: number;
    MgmtItem4No: number;
    MgmtItem1Name: string;
    MgmtItem2Name: string;
    MgmtItem3Name: string;
    MgmtItem4Name: string;
    MgmtItem1Values: any[];
    MgmtItem2Values: any[];
    MgmtItem3Values: any[];
    MgmtItem4Values: any[];
    MgmtItem1ValueId: number;
    MgmtItem2ValueId: number;
    MgmtItem3ValueId: number;
    MgmtItem4ValueId: number;
    acctItems : any[];

    searchForm: FormGroup;
    schInputDate: string;
    schSlipRows = [];

    isConfirm: boolean = false;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('SearchFormModal') searchFormModal: ModalDirective;
    @ViewChild('DeleteConfirmModal') deleteConfirmModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: ExpendablesSlipsService,
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

        this.inputForm = fb.group({
            tmp_slip_code: ['', [Validators.required]],
            input_date: ['', [Validators.required]],
            slip_no: ['', [Validators.required]],
            entry_no: ['', [Validators.required]],
            acct_name: ['', [Validators.required]],
            amount: ['', [Validators.required]],
            dr_cr: ['', [Validators.required]],
            brief_summary: ['', [Validators.required]],
            mgmt_item1_name: '',
            mgmt_item2_name: '',
            mgmt_item3_name: '',
            mgmt_item4_name: '',
            mgmt_item1: '',
            mgmt_item2: '',
            mgmt_item3: '',
            mgmt_item4: ''
        });

        this.searchForm = fb.group({
            input_date: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '소모품입고전표처리';
        this.searchFormTitle = '전표 검색';
        this.deleteFormTitle = '전표 삭제';

        this.inputForm.controls['input_date'].setValue(this.InputDate);
        this.Reset();

        // 전표테이블과 임시테이블 조회 후 전표번호 및 분개번호 생성
        this.GetSlipCode('new');

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    GetSlipCode(slipCode): void {
        if (slipCode) {
            this.dataService.GetSlipCode(slipCode).subscribe(
                data =>
                {
                    if (data['result'] == "success") {
                        this.TmpSlipCode = data['tmpSlipCode'];
                        this.inputForm.patchValue({
                            tmp_slip_code: data['tmpSlipCode'],
                            entry_no: data['entryNo']
                        });
                        this.GetAll();
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                }
            );
        }
    }
    
    MgmtItemReset() {
        this.inputForm.patchValue({
            mgmt_item1_name: '',
            mgmt_item2_name: '',
            mgmt_item3_name: '',
            mgmt_item4_name: '',
            mgmt_item1: '',
            mgmt_item2: '',
            mgmt_item3: '',
            mgmt_item4: ''
        });

        this.MgmtItem1No = 0;
        this.MgmtItem2No = 0;
        this.MgmtItem3No = 0;
        this.MgmtItem4No = 0;

        this.MgmtItem1Values = [];
        this.MgmtItem2Values = [];
        this.MgmtItem3Values = [];
        this.MgmtItem4Values = [];

        this.MgmtItem1Name = '';
        this.MgmtItem2Name = '';
        this.MgmtItem3Name = '';
        this.MgmtItem4Name = '';
    }

    onSelectAccounts(event: TypeaheadMatch): void {
        if (event.item['AcctCode'] == '') {
            this.AcctCode = '';
            //this.searchForm.controls['sch_acc_code'].setValue(0);
        } else {
            this.MgmtItemReset();
            this.AcctCode = event.item['AcctCode'];
            
            let el : HTMLElement = document.getElementById('panel') as HTMLElement;
            el.click();

            this.onSelectAcctItems(this.AcctCode);
        }
    }

    onSelectAcctItems(acctCode):void {
        if (acctCode != '') {
            this.dataService.GetAcctItems(acctCode).subscribe(
                acctData =>
                {
                    if (acctData['data']['mgmt_item1_no'] != '') {
                        this.MgmtItem1No = acctData['data']['mgmt_item1_no'];
                        this.MgmtItem1Name = acctData['data']['mgmt_item1_name'];
                        if (acctData['data']['mgmt_item1_values'] != null) {
                            this.MgmtItem1Values = acctData['data']['mgmt_item1_values'];
                        }
                    }
                    if (acctData['data']['mgmt_item2_no'] != '') {
                        this.MgmtItem2No = acctData['data']['mgmt_item2_no'];
                        this.MgmtItem2Name = acctData['data']['mgmt_item2_name'];
                        if (acctData['data']['mgmt_item2_values'] != null) {
                            this.MgmtItem2Values = acctData['data']['mgmt_item2_values'];
                        }
                    }
                    if (acctData['data']['mgmt_item3_no'] != '') {
                        this.MgmtItem3No = acctData['data']['mgmt_item3_no'];
                        this.MgmtItem3Name = acctData['data']['mgmt_item3_name'];
                        if (acctData['data']['mgmt_item3_values'] != null) {
                            this.MgmtItem3Values = acctData['data']['mgmt_item3_values'];
                        }
                    }
                    if (acctData['data']['mgmt_item4_no'] != '') {
                        this.MgmtItem4No = acctData['data']['mgmt_item4_no'];
                        this.MgmtItem4Name = acctData['data']['mgmt_item4_name'];
                        if (acctData['data']['mgmt_item4_values'] != null) {
                            this.MgmtItem4Values = acctData['data']['mgmt_item4_values'];
                        }
                    }
                    setTimeout(() => {
                        document.getElementById('amount').focus();
                    }, 100);
                }
            );
        }
    }

    onSelectItemValues(event: TypeaheadMatch, n): void {
        let MgmtItemValue = 0;
        if (event.item['mgmt_item_value_id'] != '') {
            MgmtItemValue = event.item['mgmt_item_value_id'];
        }

        this.inputForm.controls['mgmt_item' + n].patchValue(MgmtItemValue);

        switch (n) {
            case 1: this.MgmtItem1ValueId = MgmtItemValue; break;
            case 2: this.MgmtItem2ValueId = MgmtItemValue; break;
            case 3: this.MgmtItem3ValueId = MgmtItemValue; break;
            case 4: this.MgmtItem4ValueId = MgmtItemValue; break;
        }

        // 포커스 이동
        this.nextFocus();
    }

    GetAll(): void {
        let params = {
            tmp_slip_code: this.TmpSlipCode,
            sortby: ['entry_no'],
            order: ['asc']
        }
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                this.drAmountSum = listData['drAmountSum'];
                this.crAmountSum = listData['crAmountSum'];
                this.totalCount = listData['totalCount'];

                let maxEntryNo = 0;
                this.rows.forEach((e)=>{
                    if (e.dr_acct_name != '') {
                        maxEntryNo = e.entry_no;
                    }
                });
                this.maxEntryNo = maxEntryNo + 1;

                // 첫행 입력시
                if (this.maxEntryNo == 1) {
                    setTimeout(()=>{
                        this.onSelectEntry(1, 'dr');
                    }, 100);
                }

                this.isLoadingProgress = false;
            }
        );
    }

    onSelectEntry(entryNo, dcType) {
        if (this.selectedEntryNo > 0) {
            (<HTMLInputElement>document.getElementById('dr_acct_name_' + this.selectedEntryNo)).style.borderLeft = 'none';
            (<HTMLInputElement>document.getElementById('dr_acct_name_' + this.selectedEntryNo)).style.borderTop = 'none';
            (<HTMLInputElement>document.getElementById('dr_acct_name_' + this.selectedEntryNo)).style.borderBottom = 'none';
            (<HTMLInputElement>document.getElementById('dr_amount_' + this.selectedEntryNo)).style.borderRight = 'none';
            (<HTMLInputElement>document.getElementById('dr_amount_' + this.selectedEntryNo)).style.borderTop = 'none';
            (<HTMLInputElement>document.getElementById('dr_amount_' + this.selectedEntryNo)).style.borderBottom = 'none';

            (<HTMLInputElement>document.getElementById('cr_acct_name_' + this.selectedEntryNo)).style.borderLeft = 'none';
            (<HTMLInputElement>document.getElementById('cr_acct_name_' + this.selectedEntryNo)).style.borderTop = 'none';
            (<HTMLInputElement>document.getElementById('cr_acct_name_' + this.selectedEntryNo)).style.borderBottom = 'none';
            (<HTMLInputElement>document.getElementById('cr_amount_' + this.selectedEntryNo)).style.borderRight = 'none';
            (<HTMLInputElement>document.getElementById('cr_amount_' + this.selectedEntryNo)).style.borderTop = 'none';
            (<HTMLInputElement>document.getElementById('cr_amount_' + this.selectedEntryNo)).style.borderBottom = 'none';
        }
        let t = dcType.toLowerCase();
        (<HTMLInputElement>document.getElementById(t + '_acct_name_' + entryNo)).style.borderLeft = 'solid 1px #FF3300';
        (<HTMLInputElement>document.getElementById(t + '_acct_name_' + entryNo)).style.borderTop = 'solid 1px #FF3300';
        (<HTMLInputElement>document.getElementById(t + '_acct_name_' + entryNo)).style.borderBottom = 'solid 1px #FF3300';
        (<HTMLInputElement>document.getElementById(t + '_amount_' + entryNo)).style.borderRight = 'solid 1px #FF3300';
        (<HTMLInputElement>document.getElementById(t + '_amount_' + entryNo)).style.borderTop = 'solid 1px #FF3300';
        (<HTMLInputElement>document.getElementById(t + '_amount_' + entryNo)).style.borderBottom = 'solid 1px #FF3300';
        this.selectedEntryNo = entryNo;
    }

    showRows(e) {
        let formData = this.inputForm.value;
        this.onSelectEntry(e.target.value, formData.dr_cr);
    }

    NewInput() {
        this.GetSlipCode(this.SlipNo);
        this.Reset();
    }

    Add(entryNo, dcType) {
        this.onSelectEntry(entryNo, dcType);
        this.Reset();
        if (entryNo > this.maxEntryNo) {
            entryNo = this.maxEntryNo;
        }
      
        this.inputForm.patchValue({
            slip_no: this.SlipNo,
            entry_no: entryNo,
            dr_cr: dcType
        });
    }

    nextFocus(): void {
        let id: string;
        let formData = this.inputForm.value;
        let amount = formData.amount;

        if (this.MgmtItem4No > 0) {
            if (this.MgmtItem4Values.length > 0) {
                let el : HTMLElement = document.getElementById('panel') as HTMLElement;
                el.click();
                if (formData.mgmt_item4_name == '' || formData.mgmt_item4_name == null) {
                    id = 'mgmt_item4_name';
                }
            } else {
                if (formData.mgmt_item4 == '' || formData.mgmt_item4 == null) {
                    id = 'mgmt_item4';
                }
            }
        }
        if (this.MgmtItem3No > 0) {
            if (this.MgmtItem3Values.length > 0) {
                let el : HTMLElement = document.getElementById('panel') as HTMLElement;
                el.click();
                if (formData.mgmt_item3_name == '' || formData.mgmt_item3_name == null) {
                    id = 'mgmt_item3_name';
                }
            } else {
                if (formData.mgmt_item3 == '' || formData.mgmt_item3 == null) {
                    id = 'mgmt_item3';
                }
            }
        }
        if (this.MgmtItem2No > 0) {
            if (this.MgmtItem2Values.length > 0) {
                let el : HTMLElement = document.getElementById('panel') as HTMLElement;
                el.click();
                if (formData.mgmt_item2_name == '' || formData.mgmt_item2_name == null) {
                    id = 'mgmt_item2_name';
                }
            } else {
                if (formData.mgmt_item2 == '' || formData.mgmt_item2 == null) {
                    id = 'mgmt_item2';
                }
            }
        }
        if (this.MgmtItem1No > 0) {
            if (this.MgmtItem1Values.length > 0) {
                let el : HTMLElement = document.getElementById('panel') as HTMLElement;
                el.click();
                if (formData.mgmt_item1_name == '' || formData.mgmt_item1_name == null) {
                    id = 'mgmt_item1_name';
                }
            } else {
                if (formData.mgmt_item1 == '' || formData.mgmt_item1 == null) {
                    id = 'mgmt_item1';
                }
            }
        }
        if (this.MgmtItem1Name == '' && this.MgmtItem2Name == '' && this.MgmtItem3Name == '' && this.MgmtItem4Name == '') {
            id = 'brief_summary';
        }
        if (amount == '' || amount == null) {
            id = 'amount';
        }
        if (this.AcctCode == '' || this.AcctCode == null) {
            id = 'acct_name';
        }
        if (id == '' || id == null) {
            id = 'brief_summary';
        }
        setTimeout(() => {
            document.getElementById(id).focus();
        }, 100);
    }

    Edit(id) {
        this.Reset();
        this.selectedSlipId = id;
        this.isTmpEditMode = true;
        this.dataService.GetById(id).subscribe(
            editData => {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        slip_no: this.SlipNo,
                        entry_no: this.formData.entry_no,
                        acct_code: this.formData.acct_code,
                        acct_name: this.formData.acct_name,
                        amount: this.utils.addComma(this.formData.amount),
                        dr_cr: this.formData.dr_cr,
                        brief_summary: this.formData.brief_summary
                    });

                    this.onSelectEntry(this.formData.entry_no, this.formData.dr_cr);

                    this.AcctCode = this.formData.acct_code;
                    //this.onSelectAcctItems(this.AcctCode);
                    this.dataService.GetAcctItems(this.AcctCode).subscribe(
                        acctData => {
                            if (acctData['data']['mgmt_item1_no'] != '') {
                                this.MgmtItem1No = acctData['data']['mgmt_item1_no'];
                                this.MgmtItem1Name = acctData['data']['mgmt_item1_name'];
                                if (acctData['data']['mgmt_item1_values'] != null) {
                                    this.MgmtItem1Values = acctData['data']['mgmt_item1_values'];
                                }
                            }
                            if (acctData['data']['mgmt_item2_no'] != '') {
                                this.MgmtItem2No = acctData['data']['mgmt_item2_no'];
                                this.MgmtItem2Name = acctData['data']['mgmt_item2_name'];
                                if (acctData['data']['mgmt_item2_values'] != null) {
                                    this.MgmtItem2Values = acctData['data']['mgmt_item2_values'];
                                }
                            }
                            if (acctData['data']['mgmt_item3_no'] != '') {
                                this.MgmtItem3No = acctData['data']['mgmt_item3_no'];
                                this.MgmtItem3Name = acctData['data']['mgmt_item3_name'];
                                if (acctData['data']['mgmt_item3_values'] != null) {
                                    this.MgmtItem3Values = acctData['data']['mgmt_item3_values'];
                                }
                            }
                            if (acctData['data']['mgmt_item4_no'] != '') {
                                this.MgmtItem4No = acctData['data']['mgmt_item4_no'];
                                this.MgmtItem4Name = acctData['data']['mgmt_item4_name'];
                                if (acctData['data']['mgmt_item4_values'] != null) {
                                    this.MgmtItem4Values = acctData['data']['mgmt_item4_values'];
                                }
                            }
                            if (editData['items'] != null) {
                                let itemRows: any = editData['items'];
                                itemRows.forEach((e: any) => {
                                    let val = (e.item_value_code > 0) ? e.item_value_code : e.item_value_text;
                                    if (e.item_value_code > 0) {
                                        if (e.item_code == this.MgmtItem1No) {
                                            this.inputForm.controls['mgmt_item1_name'].patchValue(e.item_value_text);
                                            this.inputForm.controls['mgmt_item1'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem2No) {
                                            this.inputForm.controls['mgmt_item2_name'].patchValue(e.item_value_text);
                                            this.inputForm.controls['mgmt_item2'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem3No) {
                                            this.inputForm.controls['mgmt_item3_name'].patchValue(e.item_value_text);
                                            this.inputForm.controls['mgmt_item3'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem4No) {
                                            this.inputForm.controls['mgmt_item4_name'].patchValue(e.item_value_text);
                                            this.inputForm.controls['mgmt_item4'].patchValue(val);
                                        }
                                    }else{
                                        if (e.item_code == this.MgmtItem1No) {
                                            this.inputForm.controls['mgmt_item1'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem2No) {
                                            this.inputForm.controls['mgmt_item2'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem3No) {
                                            this.inputForm.controls['mgmt_item3'].patchValue(val);
                                        }
                                        if (e.item_code == this.MgmtItem4No) {
                                            this.inputForm.controls['mgmt_item4'].patchValue(val);
                                        }
                                    }

                                });
                            }
                        }
                    );
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let formData = this.inputForm.value;
        formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');
        formData.acct_code = this.AcctCode;
        var no = formData.entry_no;
        
        if (!formData.tmp_slip_code) {
            this.messageService.add('장애가 발생하였습니다.(No TmpSlipCode)');
            return false;
        }

        if (!formData.entry_no) {
            this.messageService.add('분개번호를 입력해주세요');
            document.getElementById('entry_no').focus();
            return false;
        }
        formData.entry_no = formData.entry_no * 1;

        // 계정과목 선택여부 체크
        if (formData.acct_code == '' || formData.acct_name == '') {
            this.messageService.add('계정과목은 필수사항입니다.');
            document.getElementById('acct_name').focus();
            return false;
        }

        if (formData.amount == '' || formData.amount == null) {
            this.messageService.add('금액은 필수사항입니다.');
            document.getElementById('amount').focus();
            return false;
        }

        // 관리항목 입력여부 체크
        // Item_Code, Item_Value_Code, Item_Value_Text

        let mgmtItems = [];
        if (this.MgmtItem1No > 0) {
            if (this.MgmtItem1Values.length > 0) {
                if (formData.mgmt_item1_name == '' || formData.mgmt_item1_name == null) {
                    this.messageService.add(this.MgmtItem1Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item1_name').focus();
                    return false;
                }
            } else if (this.MgmtItem1Values.length == 0) {
                if (formData.mgmt_item1 == '' || formData.mgmt_item1 == null) {
                    this.messageService.add(this.MgmtItem1Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item1').focus();
                    return false;
                }
            }

            if (formData.mgmt_item1_name!='') {
                mgmtItems.push(this.MgmtItem1No + ':#:' + formData.mgmt_item1 + ':#:' + formData.mgmt_item1_name);
            } else {
                mgmtItems.push(this.MgmtItem1No + ':#:0:#:' + formData.mgmt_item1);
            }
        }
        if (this.MgmtItem2No > 0) {
            if (this.MgmtItem2Values.length > 0) {
                if (formData.mgmt_item2_name == '' || formData.mgmt_item2_name == null) {
                    this.messageService.add(this.MgmtItem2Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item2_name').focus();
                    return false;
                }
            } else if (this.MgmtItem2Values.length == 0) {
                if (formData.mgmt_item2 == '' || formData.mgmt_item2 == null) {
                    this.messageService.add(this.MgmtItem2Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item2').focus();
                    return false;
                }
            }

            if (formData.mgmt_item2_name!='') {
                mgmtItems.push(this.MgmtItem2No + ':#:' + formData.mgmt_item2 + ':#:' + formData.mgmt_item2_name);
            } else {
                mgmtItems.push(this.MgmtItem2No + ':#:0:#:' + formData.mgmt_item2);
            }
        }
        if (this.MgmtItem3No > 0) {
            if (this.MgmtItem3Values.length > 0) {
                if (formData.mgmt_item3_name == '' || formData.mgmt_item3_name == null) {
                    this.messageService.add(this.MgmtItem3Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item3_name').focus();
                    return false;
                }
            } else if (this.MgmtItem3Values.length == 0) {
                if (formData.mgmt_item3 == '' || formData.mgmt_item3 == null) {
                    this.messageService.add(this.MgmtItem3Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item3').focus();
                    return false;
                }
            }

            if (formData.mgmt_item3_name!='') {
                mgmtItems.push(this.MgmtItem3No + ':#:' + formData.mgmt_item3 + ':#:' + formData.mgmt_item3_name);
            } else {
                mgmtItems.push(this.MgmtItem3No + ':#:0:#:' + formData.mgmt_item3);
            }
        }
        if (this.MgmtItem4No > 0) {
            if (this.MgmtItem4Values.length > 0) {
                if (formData.mgmt_item4_name == '' || formData.mgmt_item4_name == null) {
                    this.messageService.add(this.MgmtItem4Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item4_name').focus();
                    return false;
                }
            } else if (this.MgmtItem4Values.length == 0) {
                if (formData.mgmt_item4 == '' || formData.mgmt_item4 == null) {
                    this.messageService.add(this.MgmtItem4Name + ' 입력은 필수사항입니다.');
                    document.getElementById('mgmt_item4').focus();
                    return false;
                }
            }

            if (formData.mgmt_item4_name!='') {
                mgmtItems.push(this.MgmtItem4No + ':#:' + formData.mgmt_item4 + ':#:' + formData.mgmt_item4_name);
            } else {
                mgmtItems.push(this.MgmtItem4No + ':#:0:#:' + formData.mgmt_item4);
            }
        }
        // 적요체크
        if (formData.dr_cr == 'DR' && (formData.brief_summary == '' || formData.brief_summary == null)) {
            this.messageService.add('적요 입력은 필수사항입니다.');
            document.getElementById('brief_summary').focus();
            return false;
        }else if(formData.dr_cr == 'CR' && (formData.brief_summary == '' || formData.brief_summary == null)){
            this.rows.forEach((e) => {
                if (e.entry_no == no && e.dr_id > 0) {
                    brief_summary_dr = e.brief_summary;
                }
            });
            if(brief_summary_dr!=''){
                this.messageService.add('내용이 없을 경우 차변과 같습니다.');
                formData.brief_summary=brief_summary_dr;
                return false;
            }else if(brief_summary_dr==''){
                this.messageService.add('적요 입력은 필수사항입니다.');
                document.getElementById('brief_summary').focus();
                return false;
            }

        }

        formData.mgmt_items = mgmtItems.join('=||=');
        formData.amount = this.utils.removeComma(formData.amount) * 1;

        if (this.isTmpEditMode == true) {
            this.Update(this.selectedSlipId, formData);
        } else {
            this.Create(formData);
        }
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                ret => {
                    if (ret['result'] == "success") {

                        this.Reset();

                        // let drcr = 'CR';
                        // if (data.dr_cr == 'CR') {
                        //     this.GetSlipCode(this.TmpSlipCode);
                        //     drcr = 'DR';
                        // }
                        //
                        // this.inputForm.patchValue({
                        //     tmp_slip_code: this.TmpSlipCode,
                        //     dr_cr: drcr
                        // });
                        //
                        // if (drcr == 'CR') {
                        //     this.inputForm.controls['amount'].patchValue(this.utils.addComma(data.amount));
                        // }
                        //
                        // document.getElementById('acct_name').focus();
                        document.getElementById('entry_no').focus();
                        this.GetAll();

                        this.messageService.add(this.addOkMsg);

                    } else {
                        this.messageService.add(ret['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data.result == "success") {
                        this.Reset();
                        this.GetSlipCode(this.TmpSlipCode);
                        document.getElementById('entry_no').focus();
                        this.GetAll();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    Delete() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        let idArr = [];
        this.selected.forEach((e:any) => {
            idArr.push(e.entry_no);
        });
        // console.log(idArr.join(','));
        this.dataService.Delete(this.TmpSlipCode, idArr.join(','))
            .subscribe(
                data => {
                    if (data.result == "success") {
                        this.Reset();
                        this.GetSlipCode(this.TmpSlipCode);
                        this.selected = [];
                        this.inputForm.patchValue({
                            tmp_slip_code: this.TmpSlipCode,
                            entry_no: '',
                            dr_cr: 'DR'
                        });
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                },
                error => this.errorMessage = <any>error
            );
    }

    Confirm() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        // 전표 작성여부 체크
        if (this.maxEntryNo < 2) {
            this.messageService.add('작성된 전표가 없습니다');
            return false;
        }

        // 계정과목 선택여부 체크
        if (this.drAmountSum != this.crAmountSum) {
            this.messageService.add('차대변 금액이 일치하지 않습니다.');
            return false;
        }

        this.isConfirm = true;
    }

    Cancel() {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.isConfirm = false;
    }

    SaveSlip () {
        let formData = this.inputForm.value;
        let params = {
            'input_date': this.datePipe.transform(formData.input_date, 'yyyyMMdd'),
            'is_edit': this.isEditMode,
            'slip_no': this.SlipNo,
            'grp_no': 400,
            'tmp_slip_code': this.TmpSlipCode
        }
        this.dataService.SaveSlip(params)
            .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.isEditMode = false;
                    this.InputDate = this.tDate;
                    this.panelTitle = '전표 입력';
                    this.selectedEntryNo = 0;
                    this.isConfirm = false;
                    this.Reset();
                    this.SlipNo = data['slipNo'];
                    this.GetSlipCode('new');
                    this.inputForm.patchValue({
                        dr_cr: 'DR'
                    });
                    let resultMsg = '';
                    if (this.isEditMode) {
                        resultMsg = '수정완료';
                    } else {
                        resultMsg = '등록완료';
                    }
                    this.messageService.add(resultMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
            },
            error => this.errorMessage = <any>error
        );
    }

    LoadSlipsToTemp (slipNo) {
        this.dataService.LoadSlipsToTemp(slipNo)
            .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.isEditMode = true;
                    this.InputDate = data['inputDate'];
                    this.Reset();
                    this.panelTitle = '전표 수정';
                    this.SlipNo = data['slipNo'];
                    this.inputForm.controls['slip_no'].setValue(slipNo);
                    this.GetSlipCode(data['tmpSlipCode']);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
            },
            error => this.errorMessage = <any>error
        );
    }

    ResetSlip () {
        // 실행권한
        if (this.isExecutable == false) {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.dataService.ResetSlip(this.TmpSlipCode)
            .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.isEditMode = false;
                    this.InputDate = this.tDate;
                    this.panelTitle = '전표 입력';
                    this.SlipNo = '';
                    this.selectedEntryNo = 0;
                    this.Reset();
                    this.GetSlipCode('new');
                    this.inputForm.patchValue({
                        tmp_slip_code: this.TmpSlipCode,
                        entry_no: 1,
                        dr_cr: 'DR'
                    });
                    this.GetAll();
                    this.messageService.add('초기화되었습니다.');
                } else {
                    this.messageService.add(data['errorMessage']);
                }
            },
            error => this.errorMessage = <any>error
        );
    }

    DeleteSlip () {
        this.dataService.DeleteSlip(this.SlipNo)
            .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.Reset();
                    this.GetSlipCode('new');
                    this.inputForm.patchValue({
                        entry_no: 1,
                        dr_cr: 'DR'
                    });
                    this.GetAll();
                    this.deleteConfirmModal.hide();
                    this.messageService.add(this.addOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
            },
            error => this.errorMessage = <any>error
        );
    }

    Reset() {
        this.inputForm.controls['dr_cr'].setValue('DR');

        this.inputForm.patchValue({
            slip_no: '',
            entry_no: '',
            acct_name: '',
            amount: '',
            dr_cr: 'DR',
            brief_summary: '',
            mgmt_item1_name: '',
            mgmt_item2_name: '',
            mgmt_item3_name: '',
            mgmt_item4_name: '',
            mgmt_item1: '',
            mgmt_item2: '',
            mgmt_item3: '',
            mgmt_item4: ''
        });
        this.isTmpEditMode = false;
        this.selectedSlipId = 0;

        this.AcctCode = '';
        this.MgmtItem1No = 0;
        this.MgmtItem2No = 0;
        this.MgmtItem3No = 0;
        this.MgmtItem4No = 0;
        this.MgmtItem1Name = '';
        this.MgmtItem2Name = '';
        this.MgmtItem3Name = '';
        this.MgmtItem4Name = '';
        this.MgmtItem1Values = [];
        this.MgmtItem2Values = [];
        this.MgmtItem3Values = [];
        this.MgmtItem4Values = [];
        this.MgmtItem1ValueId = 0;
        this.MgmtItem2ValueId = 0;
        this.MgmtItem3ValueId = 0;
        this.MgmtItem4ValueId = 0;
        brief_summary_dr='';
    }

    AddComma(event) {
        var valArray = event.target.value.split('.');
        for(var i = 0; i < valArray.length; ++i) {
            valArray[i] = valArray[i].replace(/\D/g, '');
        }

        var newVal: string;

        if (valArray.length === 0) {
            newVal = '0';
        } else {
            let matches = valArray[0].match(/[0-9]{3}/mig);

            if(matches !== null && valArray[0].length > 3) {
                let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
                let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

                newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
            } else {
                newVal = valArray[0];
            }

            if(valArray.length > 1) {
                newVal += "." + valArray[1].substring(0,2);
            }
        }
        this.inputForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
    }

    // AddHyphen(event) {
    //     var val = event.target.value.replace('-','');
    //
    //     let numbers = [];
    //     for (let i = 0; i < val.length; i += 2) {
    //         if (i == 2) continue;
    //         numbers.push(val.substr(i, 4));
    //     }
    //
    //     this.inputForm.controls[event.target.id].setValue(numbers.join('-'));
    // }

    openModal(method) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'search') {
                this.searchFormModal.show();
            } else if (method == 'delete') {
                this.deleteConfirmModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        switch (method) {
            case 'search':
                this.searchForm.reset();
                this.searchForm.controls['input_date'].setValue(this.InputDate);
            break;
            case 'delete':
            break;
        }
    }

    onValueChange(value: Date): void {
        this.schInputDate = this.datePipe.transform(value, 'yyyy-MM-dd');
        this.SearchSlipByDate();
    }

    SearchSlipByDate(): void {
        let formData = this.searchForm.value;
        let inputDate = this.schInputDate
        this.isLoadingProgress = true;
        this.dataService.SearchSlipByDate(inputDate).subscribe(
            listData =>
            {
                this.schSlipRows = listData['searchData'];
                this.isLoadingProgress = false;
            }
        );
    }

    onSelectSlip(event): void {
        this.LoadSlipsToTemp(event.selected[0].slip_no);
        this.searchFormModal.hide();
    }

}
