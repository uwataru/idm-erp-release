import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../../message.service';

import { Item } from './inspection-item.item';
import { InspectionItemService } from './inspection-item.service';

declare var $: any;

@Component({
  selector: 'app-inspection-item',
  templateUrl: './inspection-item.component.html',
  styleUrls: ['./inspection-item.component.scss'],
  providers: [InspectionItemService]
})
export class InspectionItemComponent implements OnInit {

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
  @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: InspectionItemService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private messageService: MessageService
  ) { 
    this.inputForm = fb.group({
      production_date: ['', [Validators.required]],
      taken: '',
      crack: '',
      printfaulty: '',
      colorfaulty: '',
      cosmeticfaulty: '',
      etc: ''
      
    });
  }

  ngOnInit() {
    this.panelTitle = '검사항목현황';
    this.inputFormTitle = '검사항목 등록';
    // this.deleteFormTitle = '검사항목 삭제';
    // this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

    this.getAll();

    this.inputForm.controls['production_date'].setValue(this.InputDate);

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
    // this.dataService.GetAll().subscribe(
    //     listData =>
    //     {
    //         this.listData = listData;
    //         this.rows = listData['data'];
    //     }
    // );

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

Edit (id) {
    this.dataService.GetById(id).subscribe(
        editData =>
        {
            if (editData['result'] == "success") {
                this.editData = editData;
                this.formData = editData['data'];
                this.inputForm.patchValue({
                    production_date: this.formData.production_date,
                    taken: this.formData.taken,
                    crack: this.formData.crack,
                    printfaulty: this.formData.printfaulty,
                    colorfaulty: this.formData.colorfaulty,
                    cosmeticfaulty: this.formData.cosmeticfaulty,
                    etc: this.formData.etc,
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

openModal(method, id) {
    // 실행권한
    // if (this.isExecutable == true) {
        if (method == 'delete') {
            this.deleteFormModal.show();
        } else if (method == 'write') {
            this.inputFormModal.show();
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
  
}

}
