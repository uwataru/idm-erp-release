import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../message.service';

import { PersonnelService } from './personnel.service';
import { Item } from './personnel.item';

declare var $: any;

@Component({
  selector: 'app-personnel',
  templateUrl: './personnel.component.html',
  styleUrls: ['./personnel.component.scss'],
  providers: [PersonnelService]
})
export class PersonnelComponent implements OnInit {

    InputDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    editFormTitle: string;
    deleteFormTitle: string;
    deleteConfirmMsg: string;

    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    selectedCnt: number;
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    inputForm: FormGroup;
    editForm: FormGroup;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('EditFormModal') editFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;

    constructor(
      @Inject(FormBuilder) fb: FormBuilder,
      private datePipe: DatePipe,
      private dataService: PersonnelService,
      private globals: AppGlobals,
      private route: ActivatedRoute,
      private configService: ConfigService,
      private messageService: MessageService
    ) {
      // 접근권한 체크
    //   if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
    //     if (route.routeConfig.data.id in this.globals.userPermission) {
    //         console.log(route.routeConfig.data.id);
    //         if (this.globals.userPermission[route.routeConfig.data.id]['executive_auth'] == true) {
    //             this.isExecutable = true;
    //         }
    //         if (this.globals.userPermission[route.routeConfig.data.id]['print_auth'] == true) {
    //             this.isPrintable = true;
    //         }
    //     }
    //   }

      this.inputForm = fb.group({
        group: ['', [Validators.required]],
        name: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        input_date: ['', [Validators.required]]
      });
      this.editForm = fb.group({
          group: ['', [Validators.required]],
          name: ['', [Validators.required]],
          input_process: ['', Validators.required],
          work_skill: ['', Validators.required],
          working_time: ['', Validators.required]
      })
  }

  ngOnInit() {
    this.panelTitle = '생산인력관리';
    this.inputFormTitle = '생산인력 등록';
    this.editFormTitle = '생산인력 수정';
    this.deleteFormTitle = '생산인력 삭제';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.getAll();

    this.inputForm.controls['input_date'].setValue(this.InputDate);

    $(document).ready(function(){
        let modalContent: any = $('.modal-content');
        let modalHeader = $('.modal-header');
        modalHeader.addClass('cursor-all-scroll');
        modalContent.draggable({
            handle: '.modal-header'
        });
    });
  }

  getAll(): void {
    this.selectedId = '';
    this.selected = [];

    let params = {
        sortby: ['id'],
        order: ['asc'],
        maxResultCount: 10000
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

// onValueChange(value: Date): void {
//     this.InputDate = this.datePipe.transform(value, 'yyyy-MM-dd');
// }


  Edit (id) {
    this.dataService.GetById(id).subscribe(
        editData =>
        {
            if (editData['result'] == "success") {
                this.editData = editData;
                this.formData = editData['data'];
                this.editForm.patchValue({
                  group: this.formData.group,
                  name: this.formData.name,
                  input_process: this.formData.input_process,
                  work_skill: this.formData.work_skill,
                  working_time: this.formData.working_time
                });
            } else {
                this.messageService.add(editData['errorMessage']);
            }
        }
    );
  }

  Save () {
     //disabled="!inputForm.valid"
    //  let formData

     if (this.isEditMode == true) {
         let formData = this.editForm.value;
         console.log(formData.working_time)
         this.Update(this.selectedId, formData);
     } else {
        let formData = this.inputForm.value;

        console.log(formData.input_date);
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
                    // this.configService.load();
                    this.messageService.add(this.addOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.inputFormModal.hide();
                console.log(this.formData);
            },
            error => this.errorMessage = <any>error
            );
  }

  Update (id, data): void {
      console.log(data);
    this.dataService.Update(id, data)
        .subscribe(
            data => {
                if (data.result == "success") {
                    // this.inputForm.reset();
                    this.getAll();
                    // this.configService.load();
                    this.messageService.add(this.editOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.editFormModal.hide();
                // console.log(this.formData);
            },
            error => this.errorMessage = <any>error
        );
  }

  Delete (id): void {
    this.dataService.Delete(id)
        .subscribe(
            data => {
                if (data.result == "success") {
                    this.getAll();
                    // this.configService.load();
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
    // if (this.isExecutable == true) {
        if (method == 'delete') {
            this.deleteFormModal.show();
        } else if (method == 'write') {
            this.inputFormModal.show();
            this.inputForm.controls['input_date'].setValue(this.InputDate);
            this.isEditMode = false;
        } else if (method == 'edit') {
            this.editFormModal.show();
            this.Edit(id);
            this.isEditMode = true;
        }
    // } else {
    //     alert(this.globals.isNotExecutable);
    //     return false;
    // }

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

  }

}
