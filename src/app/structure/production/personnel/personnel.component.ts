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
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';

declare var $: any;

@Component({
  selector: 'app-personnel',
  templateUrl: './personnel.component.html',
  styleUrls: ['./personnel.component.scss'],
  providers: [PersonnelService, DatePipe]
})
export class PersonnelComponent implements OnInit {
    tDate = this.globals.tDate;

    panelTitle: string;
    inputFormTitle: string;
    editFormTitle: string;
    deleteFormTitle: string;
    worktimeFormTitle: string;
    deleteConfirmMsg: string;

    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;
    selectedId: string;
    listData : Item[];
    enumData: Item;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    selectedCnt: number;
    editData: Item;
    formData: Item['data'];
    rows = [];
    delId = [];
    selected = [];
    searchForm: FormGroup;
    inputForm: FormGroup;
    editForm: FormGroup;
    inputWorktimeForm: FormGroup;

    affiliationList: any[] = this.globals.configs['affiliationList'];
    listSltdAfilId: number = 0;

    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    workHistoryDataCnt: number;
    name: string;
    employee_num: string;

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;
    @ViewChild('WorkTimeFormModal') workTimeFormModal: ModalDirective;

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
        group_name: ['', [Validators.required]],
        group_id: ['', [Validators.required]],
        name: ['', [Validators.required]],
        employee_num: ['', [Validators.required]],
        phone: ['', [Validators.required]],
        addr: ['', [Validators.required]],
        input_date: ['', [Validators.required]],
        specialnote: ''
        
      });
      this.searchForm = fb.group({
        sch_affiliation_name: '',
        sch_group_id: ''
      });

  }

  ngOnInit() {
    this.panelTitle = '생산인력현황';
    this.inputFormTitle = '생산인력 등록';
    this.editFormTitle = '생산인력 수정';
    this.deleteFormTitle = '생산인력 삭제';
    this.worktimeFormTitle = '근무시간 산출';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.workHistoryDataCnt = 1;

    this.getAll();

    // this.inputForm.controls['input_date'].setValue(this.InputDate);

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
    this.selectedCnt = selected.length;
    if (this.selectedCnt == 1) {
      this.selectedId = selected[0].id;
    //   this.inputForm.controls['id'].setValue(this.selectedId);
    }
}

getAll(): void {

    this.selectedId = '';
    this.selected = [];

    let params = {
        group_id: this.searchForm.value['sch_group_id'],
    }
    console.log(this.searchForm.value['sch_group_id']);
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

Edit (id) {
    this.dataService.GetById(id).subscribe(
        editData =>
        {
            if (editData['result'] == "success") {
                this.editData = editData;
                this.formData = editData['data'];
                this.inputForm.patchValue({
                    group_name: this.formData.group_name,
                    group_id: this.formData.group_id,
                    name: this.formData.name,
                    employee_num: this.formData.employee_num,
                    phone: this.formData.phone,
                    addr: this.formData.addr,
                    input_date: this.formData.input_date,
                    specialnote: this.formData.specialnote,
                });
            } else {
                this.messageService.add(editData['errorMessage']);
            }
        }
    );
}

Save () {
    let formModel = this.inputForm.value;


      let input_date = this.datePipe.transform(formModel['input_date'], 'yyyy-MM-dd');


     if (this.isEditMode == true) {
        let formData = {
            input_date: input_date,
            group_id: formModel.group_id,
            name: formModel.name,
            work_skill: formModel.work_skill,
            employee_num: formModel.employee_num,
            phone: formModel.phone,
            addr: formModel.addr,
            specialnote:"",
          };
         this.Update(this.selectedId, formData);
     } else {
        let formData = {
            input_date: input_date,
            group_id: formModel.group_id,
            name: formModel.name,
            work_skill: "",
            employee_num: formModel.employee_num,
            phone: formModel.phone,
            addr: formModel.addr,
            specialnote:"",
          };
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
                    this.messageService.add(this.delOkMsg);
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.deleteFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
}

getWorkHistory (id): void {
    this.dataService.GetWorkHistory(id)
        .subscribe(
            data => {
                if (data['result'] == "success") {
                    console.log(data);
                    this.name = data['data']['name'];
                    this.employee_num = data['data']['employee_num'];
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.deleteFormModal.hide();
            }
        )
}

openModal(method, id) {
    // 실행권한
    // if (this.isExecutable == true) {
        if (method == 'delete') {
            this.deleteFormModal.show();
        } else if (method == 'write') {
            this.inputFormModal.show();
            this.inputForm.controls['input_date'].setValue(this.tDate);

        } else if (method == 'worktime'){
            this.workTimeFormModal.show();
            this.getWorkHistory(id);
        }
    // } else {
        // alert(this.globals.isNotExecutable);
        // return false;
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
    if (method == 'write') {
        if (id) {
            this.isEditMode = true;
            this.Edit(id);
        } else {
            this.inputForm.reset();
            this.inputForm.controls['input_date'].setValue(this.tDate);
            this.getEmployeeNum();

        }
    }
}

getEmployeeNum(){
    this.dataService.GetEmployeeNum().subscribe(
        enumData =>
        {
            this.enumData = enumData;
            console.log(enumData);

            this.inputForm.controls['employee_num'].setValue(enumData['employee_num']);


            this.isLoadingProgress = false;
        }
    );
    this.isEditMode = false;
}

onSearchAffiliationList(event: TypeaheadMatch): void {
    console.log(event);
    let id = event.item['id'];
    if (id == '') {
        this.listSltdAfilId = 0;
    } else {
        this.listSltdAfilId = id;
        this.searchForm.controls['sch_group_id'].setValue(this.listSltdAfilId);
    }

    const val = this.listSltdAfilId;

    this.getAll();
}
InputAffiliationList(event: TypeaheadMatch): void {
    console.log(event);
    let id = event.item['id'];
    if (id == '') {
        this.listSltdAfilId = 0;
    } else {
        this.listSltdAfilId = id;
        this.inputForm.controls['group_id'].setValue(this.listSltdAfilId);
    }


}



// // onValueChange(value: Date): void {
// //     this.InputDate = this.datePipe.transform(value, 'yyyy-MM-dd');
// // }


//   Edit (id) {
//     this.dataService.GetById(id).subscribe(
//         editData =>
//         {
//             if (editData['result'] == "success") {
//                 this.editData = editData;
//                 this.formData = editData['data'];
//                 this.editForm.patchValue({
//                   group: this.formData.group,
//                   name: this.formData.name,
//                   employee_num: this.formData.employee_num,
//                   phone: this.formData.phone,
//                   addr: this.formData.addr,
//                   specialnote: this.formData.specialnote
//                 });
//             } else {
//                 this.messageService.add(editData['errorMessage']);
//             }
//         }
//     );
//   }

//   Save () {
//      //disabled="!inputForm.valid"
//     //  let formData

//      if (this.isEditMode == true) {
//          let formData = this.editForm.value;
//          console.log(formData.working_time)
//          this.Update(this.selectedId, formData);
//      } else {
//         let formData = this.inputForm.value;

//         this.Create(formData);
//      }
//   }

//   Create (data): void {
//     this.dataService.Create(data)
//         .subscribe(
//             data => {
//                 if (data['result'] == "success") {
//                     this.inputForm.reset();
//                     this.getAll();
//                     // this.configService.load();
//                     this.messageService.add(this.addOkMsg);
//                 } else {
//                     this.messageService.add(data['errorMessage']);
//                 }
//                 this.inputFormModal.hide();
//                 console.log(this.formData);
//             },
//             error => this.errorMessage = <any>error
//             );
//   }

//   Update (id, data): void {
//       console.log(data);
//     this.dataService.Update(id, data)
//         .subscribe(
//             data => {
//                 if (data.result == "success") {
//                     // this.inputForm.reset();
//                     this.getAll();
//                     // this.configService.load();
//                     this.messageService.add(this.editOkMsg);
//                 } else {
//                     this.messageService.add(data['errorMessage']);
//                 }
//                 this.inputFormModal.hide();
//                 // console.log(this.formData);
//             },
//             error => this.errorMessage = <any>error
//         );
//   }

//   Delete (id): void {
//     this.dataService.Delete(id)
//         .subscribe(
//             data => {
//                 if (data.result == "success") {
//                     this.getAll();
//                     // this.configService.load();
//                     this.messageService.add(this.delOkMsg);
//                 } else {
//                     this.messageService.add(data['errorMessage']);
//                 }
//                 this.deleteFormModal.hide();
//             },
//             error => this.errorMessage = <any>error
//         );
//   }

//   openModal(method, id) {
//     // 실행권한
//     // if (this.isExecutable == true) {
//         if (method == 'delete') {
//             this.deleteFormModal.show();
//         } else if (method == 'write') {
//             this.inputFormModal.show();
//             this.isEditMode = false;
//         } else if (method == 'edit') {
//             this.inputFormModal.show();
//             this.Edit(id);
//             // this.editForm.controls['input_date'].setValue(this.InputDate);
//             this.isEditMode = true;
//         }
//     // } else {
//     //     alert(this.globals.isNotExecutable);
//     //     return false;
//     // }

//     if (id) {
//         if (id == 'selected') {
//             let idArr = [];
//             this.selected.forEach((e:any) => {
//                 idArr.push(e.id);
//             });
//             this.selectedId = idArr.join(',');
//         } else {
//             this.selectedId = id;
//         }
//     }

//   }

}
