import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {CuttingMethodService} from './cutting-method.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {ConfigService} from '../../../../config.service';
import {MessageService} from '../../../../message.service';
import {Item} from './cutting-method.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './cutting-method.component.html',
  styleUrls: ['./cutting-method.component.css'],
  providers: [CuttingMethodService]
})

export class CuttingMethodComponent implements OnInit {
  panelTitle: string;
  inputFormTitle: string;
  deleteFormTitle: string;
  deleteConfirmMsg: string;
  isEditMode: boolean = false;
  selectedId: string;
  listData: Item[];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  editData: Item;
  formData: Item['data'];
  rows = [];
  delId = [];
  selected = [];
  inputForm: FormGroup;
  errorMessage: string;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('DeleteFormModal') deleteFormModal: ModalDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private dataService: CuttingMethodService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private messageService: MessageService
  ) {
    // 접근권한 체크
    if (route.routeConfig.path && ('id' in route.routeConfig.data)) {
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
      cfg_code: ['', [Validators.required]],
      cfg_name: ['', [Validators.required]],
      cfg_value: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.panelTitle = '조립공정';
    this.inputFormTitle = '조립공정 등록';
    this.deleteFormTitle = '조립공정 삭제';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';

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

  GetAll(): void {
    this.dataService.GetAll().subscribe(
      listData => {
        this.listData = listData;
        this.rows = listData['data'];
      }
    );
  }

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          this.inputForm.patchValue({
            cfg_code: this.formData.cfg_code,
            cfg_name: this.formData.cfg_name,
            cfg_value: this.formData.cfg_value,
          });
        } else {
          this.messageService.add(editData['errorMessage']);
        }
      }
    );
  }

  Save() {
    //disabled="!inputForm.valid"
    let formData = this.inputForm.value;

    if (this.isEditMode == true) {
      this.Update(this.selectedId, formData);
    } else {
      this.Create(formData);
    }
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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

  Update(id, data): void {
    this.dataService.Update(id, data)
      .subscribe(
        data => {
          if (data.result == 'success') {
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

  Delete(id): void {
    this.dataService.Delete(id)
      .subscribe(
        data => {
          if (data.result == 'success') {
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
        this.selected.forEach((e: any) => {
          idArr.push(e.cfg_id);
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
}
