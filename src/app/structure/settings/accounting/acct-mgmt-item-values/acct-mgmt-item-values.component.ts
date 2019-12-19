import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { AcctMgmtItemValuesService } from './acct-mgmt-item-values.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { MessageService } from '../../../../message.service';
import { Item } from './acct-mgmt-item-values.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './acct-mgmt-item-values.component.html',
    styleUrls: ['./acct-mgmt-item-values.component.css'],
    providers: [AcctMgmtItemValuesService]
})
export class AcctMgmtItemValuesComponent implements OnInit {
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;
    isEditMode: boolean = false;
    selectedId: string;

    searchForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    listSltdPaCode: string = '';
    acctItems : any[];
    listData : Item[];
    rows = [];
    delId = [];
    selected = [];
    selectedCnt: number = 0;
    schMgmtItemNo: number = 0;

    gridHeight = this.globals.gridHeight;
    messages = {emptyMessage: '<div class="no-data">계정과목과 관리항목을 선택하세요!</div>'};

    inputForm: FormGroup;
    editData: Item;
    formData: Item['data'];
    tDate = this.globals.tDate;
    AcctName: string;
    MgmtItemName: string;
    manItems = this.globals.configs['acctMgmtItems'];

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: AcctMgmtItemValuesService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private configService: ConfigService,
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
            sch_acct_name: '',
            sch_mgmt_item_no: ''
        });
        this.inputForm = fb.group({
            input_date: ['', [Validators.required]],
            acct_code: ['', [Validators.required]],
            mgmt_item_no: ['', [Validators.required]],
            mgmt_item_value_name: ['', [Validators.required]],
            mgmt_item_value_name_alias: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.panelTitle = '관리내역 조회';
        this.inputFormTitle = '관리내역 등록';
        this.deleteFormTitle = '관리내역 삭제';
        this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

        //this.GetAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    GetAll(): void {
        let formData = this.searchForm.value;
        if (this.listSltdPaCode != '' && formData.sch_mgmt_item_no > 0) {
            this.schMgmtItemNo = formData.sch_mgmt_item_no;
            let params = {
                acct_code: this.listSltdPaCode,
                mgmt_item_no: formData.sch_mgmt_item_no
            }
            this.dataService.GetAll(params).subscribe(
                listData =>
                {
                    this.listData = listData;
                    this.rows = listData['data'];

                    if (listData['totalCount'] == 0) {
                        this.messages = this.globals.datatableMessages;
                    }
                }
            );
        }
    }

    schAcctItems(event): void {
        let selectedOptions = event.target['options'];
        let selectedIndex = selectedOptions.selectedIndex;
        this.MgmtItemName = selectedOptions[selectedIndex].text;

        this.GetAll();
    }

    onSelectAccounts(event: TypeaheadMatch): void {
        if (event.item['AcctCode'] == '') {
            this.listSltdPaCode = '';
            //this.searchForm.controls['sch_acc_code'].setValue(0);
        } else {
            this.listSltdPaCode = event.item['AcctCode'];
            //this.searchForm.controls['sch_acc_code'].setValue(event.item['AcctCode']);
        }

        this.onSelectAcctItems(this.listSltdPaCode);
    }

    onSelectAcctItems(acctCode) {
        if (acctCode != '') {
            this.acctItems = [];
            this.dataService.GetAcctItems(acctCode).subscribe(
                editData =>
                {
                    if (editData['data']['mgmt_item1_no'] != '') {
                        this.acctItems.push({code: editData['data']['mgmt_item1_no'], name: editData['data']['mgmt_item1_name']});
                    }
                    if (editData['data']['mgmt_item2_no'] != '') {
                        this.acctItems.push({code: editData['data']['mgmt_item2_no'], name: editData['data']['mgmt_item2_name']});
                    }
                    if (editData['data']['mgmt_item3_no'] != '') {
                        this.acctItems.push({code: editData['data']['mgmt_item3_no'], name: editData['data']['mgmt_item3_name']});
                    }
                    if (editData['data']['mgmt_item4_no'] != '') {
                        this.acctItems.push({code: editData['data']['mgmt_item4_no'], name: editData['data']['mgmt_item4_name']});
                    }
                }
            );
        }
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        input_date: this.formData.input_date,
                        acct_code: this.formData.acct_code,
                        mgmt_item_no: this.formData.mgmt_item_no,
                        mgmt_item_value_name: this.formData.mgmt_item_value_name,
                        mgmt_item_value_name_alias: this.formData.mgmt_item_value_name_alias
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save () {
         let formData = this.inputForm.value;

         if (this.isEditMode == true) {
             this.Update(this.selectedId, formData);
         } else {
             this.Create(formData);
         }
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.GetAll();
                        this.configService.load();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.GetAll();
                        this.configService.load();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    Delete (id): void {
        this.dataService.Delete(id)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.GetAll();
                        this.configService.load();
                        this.messageService.add(this.delOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.deleteFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method, id) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'delete') {
                this.deleteFormModal.show();
            } else if (method == 'write') {
                this.inputFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        if (id) {
            if (id == 'selected') {
                let idArr = [];
                this.selected.forEach((e:any) => {
                    idArr.push(e.id);
                });
                this.selectedId = idArr.join(',');
            } else {
                this.selectedId = id;
            }
        }
        if (method == 'write') {
            if (id) {
                this.isEditMode = true;
                this.Edit(id);
            } else {
                this.inputForm.reset();

                this.inputForm.controls['input_date'].setValue(this.tDate);
                this.inputForm.controls['acct_code'].setValue(this.listSltdPaCode);
                this.inputForm.controls['mgmt_item_no'].setValue(this.schMgmtItemNo);
                this.isEditMode = false;
            }
            this.AcctName = this.searchForm.controls['sch_acct_name'].value;
        }
    }

    onSelect({ selected }) {
        this.selectedCnt = selected.length;
    }

    // excelDown(): void {
        // this.dataService.GetExcelFile().subscribe(
        //     blob => {
        //         if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
        //             window.navigator.msSaveBlob(blob, "관리내역.xlsx");
        //         }
        //         else { // for chrome and firfox
        //             var link = document.createElement('a');
        //             link.href = window.URL.createObjectURL(blob);
        //             link.download = "관리내역.xlsx";
        //             link.click();
        //         }
        //     },
        //     error => this.errorMessage = <any>error
        // );
    // }
}
