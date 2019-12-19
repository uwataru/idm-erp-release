import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { AccountsService } from './accounts.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { MessageService } from '../../../../message.service';
import { Item } from './accounts.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.css'],
    providers: [AccountsService]
})
export class AccountsComponent implements OnInit {

    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    uploadFormTitle: string;
    deleteConfirmMsg: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;
    selectedId: string;
    param: string;
    listData : Item[];
    editData: Item;
    formData: Item['data'];
    searchForm: FormGroup;
    listAccounts: any[] = this.globals.configs['acct'];
    AcctCode: string = '';
    rows = [];
    delId = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    inputForm: FormGroup;
    tDate = this.globals.tDate;
    mgmtItems = this.globals.configs['acctMgmtItems'];

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
        private dataService: AccountsService,
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
            acct_name: ['', [Validators.required]]
        });
        this.inputForm = fb.group({
            input_date: ['', [Validators.required]],
            acct_code: ['', [Validators.required]],
            acct_name: ['', [Validators.required]],
            mgmt_item1: '',
            mgmt_item2: '',
            mgmt_item3: '',
            mgmt_item4: '',
            output_tb: '',
            output_pp: ''
        });
    }

    ngOnInit() {
        this.panelTitle = '계정과목 조회';
        this.inputFormTitle = '계정과목 등록';
        this.deleteFormTitle = '계정과목 삭제';
        this.uploadFormTitle = '계정과목 엑셀업로드';
        this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

        this.getAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    onSelect({ selected }) {
        // console.log('Select Event', selected, this.selected);

        this.selected.splice(0, this.selected.length);
        this.selected.push(...selected);
    }

    getAll(): void {
        let searchForm = this.searchForm.value;
        this.param = 'order=acct_code';
        if (searchForm.acct_name != "" && this.AcctCode != '') {
            this.param += '&acct_code=' + this.AcctCode;
        }
        this.dataService.GetAll(this.param).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
            }
        );
    }

    onSelectAccounts(event: TypeaheadMatch): void {
        if (event.item['AcctCode'] == '') {
            this.AcctCode = '';
        } else {
            this.AcctCode = event.item['AcctCode'];
        }

        this.getAll();
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    let output_tb = false;
                    if (this.formData.output_tb == 'Y') {
                        output_tb = true;
                    }
                    let output_pp = false;
                    if (this.formData.output_pp == 'Y') {
                        output_pp = true;
                    }
                    console.log(this.formData)
                    this.inputForm.patchValue({
                        input_date: this.formData.input_date,
                        acct_code: this.formData.acct_code,
                        acct_name: this.formData.acct_name,
                        mgmt_item1: this.formData.mgmt_item1,
                        mgmt_item2: this.formData.mgmt_item2,
                        mgmt_item3: this.formData.mgmt_item3,
                        mgmt_item4: this.formData.mgmt_item4,
                        output_tb: output_tb,
                        output_pp: output_pp
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save () {
         let formData = this.inputForm.value;

         formData.mgmt_item1 = formData.mgmt_item1 * 1;
         formData.mgmt_item2 = formData.mgmt_item2 * 1;
         formData.mgmt_item3 = formData.mgmt_item3 * 1;
         formData.mgmt_item4 = formData.mgmt_item4 * 1;
         console.log("====="+ formData.mgmt_item1)

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
                        this.getAll();
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
                        this.getAll();
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
                        this.getAll();
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
                    idArr.push(e.acct_code);
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
                this.inputForm.controls['mgmt_item1'].setValue('0');
                this.inputForm.controls['mgmt_item2'].setValue('0');
                this.inputForm.controls['mgmt_item3'].setValue('0');
                this.inputForm.controls['mgmt_item4'].setValue('0');
                this.isEditMode = false;
            }
        }
    }

}
