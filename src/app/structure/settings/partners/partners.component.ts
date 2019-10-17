import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {ElectronService} from '../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PartnersService} from './partners.service';
import {AppGlobals} from '../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {ConfigService} from '../../../config.service';
import {MessageService} from '../../../message.service';
import {Item} from './partners.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './partners.component.html',
  styleUrls: ['./partners.component.css'],
  providers: [PartnersService]
})
export class PartnersComponent implements OnInit {

  panelTitle: string;
  inputFormTitle: string;
  statusFormTitle: string;
  statusConfirmMsg: string;
  statusConfirmBtn: string;
  statusFormValue: number;
  uploadFormTitle: string;

  isEditMode: boolean = false;
  ptype4Checked: boolean = false;
  selectedId: string;
  listData: Item[];
  editData: Item;
  sch_ptype: number;
  sch_partner_name: string;
  sch_st: number;
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  formData: Item['data'];
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  searchForm: FormGroup;
  inputForm: FormGroup;
  tDate = this.globals.tDate;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
  @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
  @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;

  constructor(
    private electronService: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private dataService: PartnersService,
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

    this.searchForm = fb.group({
      sch_ptype: '',
      sch_partner_name: ''
    });
    this.inputForm = fb.group({
      input_date: ['', Validators.required],
      ptype1: '',
      ptype2: '',
      ptype3: '',
      ptype4: '',
      ptype41: '',
      ptype42: '',
      ptype43: '',
      ptype44: '',
      ptype45: '',
      ptype5: '',
      biz_no: ['', Validators.required],
      name: ['', Validators.required],
      alias: ['', Validators.required],
      ceo: ['', Validators.required],
      addr: ['', Validators.required],
      addr2: '',
      zipcode: '',
      email: '',
      phone_no: '',
      fax_no: '',
      biz_cate1: ['', Validators.required],
      biz_cate2: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.panelTitle = '거래처 등록 현황';
    this.inputFormTitle = '거래처 등록';
    this.uploadFormTitle = '거래처 엑셀업로드';

    this.changeSubMenu(1);

    $(document).ready(function () {
      let modalContent: any = $('.modal-content');
      let modalHeader = $('.modal-header');
      modalHeader.addClass('cursor-all-scroll');
      modalContent.draggable({
        handle: '.modal-header'
      });
    });
  }

  changeSubMenu(st): void {
    this.sch_st = st;
    this.getAll();
  }

  onSelect({selected}) {
    // console.log('Select Event', selected, this.selected);

    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  getAll(): void {
    this.selected = [];

    let formData = this.searchForm.value;
    let params = {
      partner_name: formData.sch_partner_name,
      ptype: formData.sch_ptype,
      st: this.sch_st,
      sortby: ['alias', 'ptype'],
      order: ['asc', 'asc'],
      maxResultCount: 10000
    };
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];
      }
    );
  }

  updateFilter(event) {
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.name.indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // 필터 변경될때마다 항상 첫 페이지로 이동.
    //this.table.offset = 0;
  }

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          let ptype1 = false;
          if (this.formData.ptype1 == 'Y') {
            ptype1 = true;
          }
          let ptype2 = false;
          if (this.formData.ptype2 == 'Y') {
            ptype2 = true;
          }
          let ptype3 = false;
          if (this.formData.ptype3 == 'Y') {
            ptype3 = true;
          }
          let ptype4 = false;
          if (this.formData.ptype4 == 'Y') {
            ptype4 = true;
            this.ptype4Checked = true;
          } else {
            this.ptype4Checked = false;
          }
          let ptype41 = false;
          if (this.formData.ptype41 == 'Y') {
            ptype41 = true;
          }
          let ptype42 = false;
          if (this.formData.ptype42 == 'Y') {
            ptype42 = true;
          }
          let ptype43 = false;
          if (this.formData.ptype43 == 'Y') {
            ptype43 = true;
          }
          let ptype44 = false;
          if (this.formData.ptype44 == 'Y') {
            ptype44 = true;
          }
          let ptype45 = false;
          if (this.formData.ptype45 == 'Y') {
            ptype45 = true;
          }
          let ptype5 = false;
          if (this.formData.ptype5 == 'Y') {
            ptype5 = true;
          }
          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            ptype1: ptype1,
            ptype2: ptype2,
            ptype3: ptype3,
            ptype4: ptype4,
            ptype41: ptype41,
            ptype42: ptype42,
            ptype43: ptype43,
            ptype44: ptype44,
            ptype45: ptype45,
            ptype5: ptype5,
            biz_no: this.formData.biz_no,
            name: this.formData.name,
            alias: this.formData.alias,
            ceo: this.formData.ceo,
            addr: this.formData.addr,
            addr2: this.formData.addr2,
            zipcode: this.formData.zipcode,
            email: this.formData.email,
            phone_no: this.formData.phone_no,
            fax_no: this.formData.fax_no,
            biz_cate1: this.formData.biz_cate1,
            biz_cate2: this.formData.biz_cate2
          });
        } else {
          this.messageService.add(editData['errorMessage']);
        }
      }
    );
  }

  Save() {
    let formData = this.inputForm.value;

    if (!formData.ptype1 && !formData.ptype2 && !formData.ptype3 && !formData.ptype4 && !formData.ptype5) {
      alert('구분은 최소 1개 이상 선택하셔야 합니다!');
      return false;
    }

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
            this.configService.load();
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

  Update(id, data): void {
    this.dataService.Update(id, data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.inputForm.reset();
            this.configService.load();
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

  changeStatus(id, st): void {
    const formData: FormData = new FormData();
    formData.append('st', st);
    this.dataService.changeStatus(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
            this.configService.load();
            this.getAll();
            this.messageService.add(this.delOkMsg);
          } else {
            this.messageService.add(data['errorMessage']);
          }
          this.selectedId = '';
          this.selected = [];
          this.statusFormModal.hide();
        },
        error => this.errorMessage = <any>error
      );
  }

  toggleSubCate() {
    this.ptype4Checked = this.ptype4Checked === true ? false : true;
  }

  openModal(method, id) {
    // 실행권한
    if (this.isExecutable == true) {
      if (method == 'delete' || method == 'hide' || method == 'use') {
        this.statusFormModal.show();
      } else if (method == 'write') {
        this.inputFormModal.show();
      } else if (method == 'upload') {
        this.uploadFormModal.show();
      }
    } else {
      alert(this.globals.isNotExecutable);
      return false;
    }

    switch (method) {
      case 'delete':
        this.statusFormTitle = '거래처 삭제';
        this.statusFormValue = -1;
        this.statusConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
        break;
      case 'hide':
        this.statusFormTitle = '거래처 숨김';
        this.statusFormValue = 0;
        this.statusConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';
        break;
      case 'use':
        this.statusFormTitle = '거래처 사용';
        this.statusFormValue = 1;
        this.statusConfirmMsg = '선택하신 데이터를 사용처리하시겠습니까?';
        break;
    }
    if (id) {
      if (id == 'selected') {
        let idArr = [];
        this.selected.forEach((e: any) => {
          idArr.push(e.id);
        });
        this.selectedId = idArr.join(',');
        console.log(this.selectedId);
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
        this.ptype4Checked = false;
        this.inputForm.controls['input_date'].setValue(this.tDate);
        this.isEditMode = false;
      }
    }
  }

  excelDown(): void {
    this.dataService.GetExcelFile().subscribe(
      blob => {
        // Filesaver.js 1.3.8
        // 사용자가 지정한 저장위치를 읽을 수 있는 방법이 없어 저장된 파일의 링크를 제공할 수 없음.
        importedSaveAs(blob, '거래처마스터.xlsx');

        let win = this.electronService.remote.getCurrentWindow();

        win.webContents.session.on('will-download', (event, item, webContents) => {

          const filename = item.getFilename();

          item.on('updated', (event, state) => {
            if (state === 'interrupted') {
              console.log('Download is interrupted but can be resumed');
            } else if (state === 'progressing') {
              if (item.isPaused()) {
                console.log('Download is paused');
              } else {
                console.log(`Received bytes: ${item.getReceivedBytes()}`);
              }
            }
          });
          item.once('done', (event, state) => {
            if (state === 'completed') {
              console.log(filename + ' 저장 완료');
              this.uploadFormModal.hide();
            } else {
              alert('저장하려는 파일이 열려져 있습니다. 파일을 닫은 후 다시 진행해주세요');
              console.log(`Download failed: ${state}`);
            }
          });
        });
      },
      error => this.errorMessage = <any>error
    );
  }

  fileSelected(event) {
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let formData: FormData = new FormData();
      formData.append('uploadFile', file, file.name);

      this.excelUpload(formData);
    }
  }

  excelUpload(data): void {
    this.dataService.UploadExcelFile(data).subscribe(
      data => {
        if (data['result'] == 'success') {
          this.inputForm.reset();
          this.getAll();
          this.messageService.add(this.editOkMsg);
        } else {
          this.messageService.add(data['errorMessage']);
        }
        this.uploadFormModal.hide();
      },
      error => this.errorMessage = <any>error
    );
  }
}
