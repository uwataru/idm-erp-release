import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../../app.globals';
import { ElectronService } from '../../../../providers/electron.service';
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
        public electronService: ElectronService,
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
                    if (this.formData.user_phone != null){
                        this.formData.user_phone = this.addHyphen_2(this.formData.user_phone);
                      }
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

         if (formData.user_phone != null) {
            formData.user_phone = formData.user_phone.replace(/\-/g, '');
          }

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

    addHyphen(event) {
        var number = event.target.value.replace(/[^0-9]/g, "");
        var tel = "";
    
        // 서울 지역번호(02)가 들어오는 경우
        if (number.substring(0, 2).indexOf('02') == 0) {
          if (number.length < 3) {
            return number;
          } else if (number.length < 6) {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2);
          } else if (number.length < 10) {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2, 3);
            tel += "-";
            tel += number.substr(5);
          } else {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2, 4);
            tel += "-";
            tel += number.substr(6);
          }
    
          // 서울 지역번호(02)가 아닌경우
        } else {
          if (number.length < 4) {
            return number;
          } else if (number.length < 7) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3);
          } else if (number.length < 11) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3, 3);
            tel += "-";
            tel += number.substr(6);
          } else if (number.length < 12) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3, 4);
            tel += "-";
            tel += number.substr(7);
          } else {
            tel += number.substr(0, 4);
            tel += "-";
            tel += number.substr(4, 4);
            tel += "-";
            tel += number.substr(8);
          }
        }
        event.target.value = tel;
      }

      addHyphen_2(value) {
        var number = value.replace(/[^0-9]/g, "");
        var tel = "";
    
        // 서울 지역번호(02)가 들어오는 경우
        if (number.substring(0, 2).indexOf('02') == 0) {
          if (number.length < 3) {
            return number;
          } else if (number.length < 6) {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2);
          } else if (number.length < 10) {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2, 3);
            tel += "-";
            tel += number.substr(5);
          } else {
            tel += number.substr(0, 2);
            tel += "-";
            tel += number.substr(2, 4);
            tel += "-";
            tel += number.substr(6);
          }
    
          // 서울 지역번호(02)가 아닌경우
        } else {
          if (number.length < 4) {
            return number;
          } else if (number.length < 7) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3);
          } else if (number.length < 11) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3, 3);
            tel += "-";
            tel += number.substr(6);
          } else if (number.length < 12) {
            tel += number.substr(0, 3);
            tel += "-";
            tel += number.substr(3, 4);
            tel += "-";
            tel += number.substr(7);
          } else {
            tel += number.substr(0, 4);
            tel += "-";
            tel += number.substr(4, 4);
            tel += "-";
            tel += number.substr(8);
          }
        }
        value = tel;
        return value;
      }

}
