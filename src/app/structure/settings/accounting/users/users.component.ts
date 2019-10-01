import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from './users.service';
import { ValidationService } from './validation.service';
import { MessageService } from '../../../../message.service';
import { Item } from './users.item';
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css'],
    providers: [UsersService, ValidationService]
})

export class UsersComponent implements OnInit {
    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;
    
    inputForm: FormGroup;

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
        private dataService: UsersService,
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

        this.inputForm = fb.group({
            user_id: ['', [Validators.required, Validators.minLength(4)]],
            user_pw: ['', [Validators.required, Validators.minLength(4)]],
            user_name: '',
            dept_name: '',
            position_name: '',
            user_email: '',//['', ValidationService.emailValidator],
            joining_date: '',
            retirement_date: '',
            user_phone: '',
            user_addr: ''
        });

        console.log(this.inputForm);
    }

    ngOnInit() {
        this.panelTitle = '사용자 등록 현황';
        this.inputFormTitle = '사용자 등록';
        this.deleteFormTitle = '사용자 삭제';

        this.GetAll();

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

    GetAll(): void {
        this.dataService.GetAll().subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
            }
        );
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        user_id: this.formData.user_id,
                        user_pw: this.formData.user_pw,
                        user_name: this.formData.user_name,
                        dept_name: this.formData.dept_name,
                        position_name: this.formData.position_name,
                        user_email: this.formData.user_email,
                        user_phone: this.formData.user_phone,
                        user_addr: this.formData.user_addr,
                        joining_date: this.formData.joining_date,
                        retirement_date: this.formData.retirement_date
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
                this.isEditMode = false;
            }
        }
    }

    excelDown(): void {
        this.dataService.GetExcelFile().subscribe(
            blob => {
                if (navigator.appVersion.toString().indexOf('.NET') > 0) { // for IE browser
                    window.navigator.msSaveBlob(blob, "사용자등록현황.xlsx");
                }
                else { // for chrome and firfox
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = "사용자등록현황.xlsx";
                    link.click();
                }
            },
            error => this.errorMessage = <any>error
        );
    }
}
