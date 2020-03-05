import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { PermissionsService } from './permissions.service';
import { ElectronService } from '../../../../providers/electron.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../../message.service';
import { Item } from './permissions.item';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './permissions.component.html',
    styleUrls: ['./permissions.component.scss'],
    providers: [PermissionsService]
})

export class PermissionsComponent implements OnInit {
    panelTitle: string;

    listData : Item[];
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];

    inputFormTitle: string;
    users = this.globals.configs['users'] || [];
    selectedAuthType: string;
    selectedMenuId: number;
    selectedMenuName: string;
    inputForm: FormGroup;
    approvalForm: FormGroup;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('ApprovalFormModal') approvalFormModal: ModalDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        public electronService: ElectronService,
        private dataService: PermissionsService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
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

        this.inputForm = fb.group({});
        this.approvalForm = fb.group({
            approval_user_name1: '',
            approval_user_name2: '',
            approval_user_name3: '',
            approval_user_name4: '',
            approval_user_name5: '',
            approval_user_id1: ['', [Validators.required]],
            approval_user_id2: '',
            approval_user_id3: '',
            approval_user_id4: '',
            approval_user_id5: ''
        });

        this.users.forEach((user) => {
            this.inputForm.addControl('id_' + user.user_id, new FormControl(''));
        });
    }

    ngOnInit() {
        this.panelTitle = '사용자 권한';

        this.GetAll();
        this.GetUser();

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
        this.dataService.GetAll().subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
            }
        );
    }

    GetUser(){
        this.dataService.GetUser().subscribe(
            data =>
            {
                this.users = data['data'];
            }
        )
    }

    Edit (menuId, authType) {
        this.dataService.GetAuth(menuId, authType).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    let users = editData['data'];
                    users.forEach((user) => {
                        //let data = lineData.split(':#:');
                        (<HTMLInputElement>document.getElementById('id_' + user.user_id)).checked = true;
                    });
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    Save () {
        let formData = this.inputForm.value;
        let idArr = [];
        this.users.forEach((user) => {
            if ( (<HTMLInputElement>document.getElementById('id_' + user.user_id)).checked == true ) {
                idArr.push(user.user_id);
            }
        });
        formData.menu_id = this.selectedMenuId * 1;
        formData.auth_type = this.selectedAuthType;
        formData.users = idArr.join(',');
        this.Update(formData);
    }

    Update (data): void {
        this.dataService.Update(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.GetAll();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.inputFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(authType, menuId, menuName) {
        // 실행권한
        if (this.isExecutable == true) {
            if (authType == 'approval') {
                this.approvalFormModal.show();
                this.approvalForm.reset();
            } else {
                this.inputFormModal.show();
                this.inputForm.reset();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

        this.selectedAuthType = authType;
        this.selectedMenuId = menuId;
        this.selectedMenuName = menuName;

        switch (authType) {
            case 'access': this.inputFormTitle = '조회권한 등록'; break;
            case 'execution': this.inputFormTitle = '실행권한 등록'; break;
            case 'print': this.inputFormTitle = '인쇄권한 등록'; break;
            case 'approval': this.inputFormTitle = '결재라인 등록'; break;
        }

        if (authType == 'approval') {
            this.ApprovalLineEdit(menuId);
        } else {
            this.Edit(menuId, authType);
        }
    }

    ApprovalLineEdit (menuId) {
        this.dataService.GetApprovalLine(menuId).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    let users = editData['data'];
                    for (let n=1;n<=5;n++) {
                        this.approvalForm.controls['approval_user_id'+n].setValue(users['appr_user_id'+n]);
                        this.approvalForm.controls['approval_user_name'+n].setValue(users['appr_user_name'+n]);
                    }
                } else {
                    this.messageService.add(editData['errorMessage']);
                }
            }
        );
    }

    onSelectApprovalUser(event: TypeaheadMatch, n): void {
        if (event.item['user_id'] == '') {
            this.approvalForm.controls['approval_user_id' + n].setValue('');
        } else {
            this.approvalForm.controls['approval_user_id' + n].setValue(event.item['user_id']);
        }
    }

    SaveApprovalLine () {
        let formData = this.approvalForm.value;
        formData.menu_id = this.selectedMenuId * 1;
        if (formData.approval_user_name1 == '') {
            formData.approval_user_id1 = '';
        }
        if (formData.approval_user_name2 == '') {
            formData.approval_user_id2 = '';
        }
        if (formData.approval_user_name3 == '') {
            formData.approval_user_id3 = '';
        }
        if (formData.approval_user_name4 == '') {
            formData.approval_user_id4 = '';
        }
        if (formData.approval_user_name5 == '') {
            formData.approval_user_id5 = '';
        }
        this.UpdateApprovalLine(formData);
    }

    UpdateApprovalLine (data): void {
        this.dataService.UpdateApprovalLine(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.approvalForm.reset();
                        this.GetAll();
                        this.messageService.add(this.editOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.approvalFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }

}
