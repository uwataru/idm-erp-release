import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {DatePipe} from '@angular/common';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {PartnerAssemblyProductService} from './partner-assembly-product.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './partner-assembly-product.item';
import {ElectronService} from '../../../../providers/electron.service';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './partner-assembly-product.component.html',
  styleUrls: ['./partner-assembly-product.component.css'],
  providers: [PartnerAssemblyProductService, DatePipe]
})
export class PartnerAssemblyProductComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  statusFormTitle: string;
  statusConfirmMsg: string;
  statusConfirmBtn: string;
  statusFormValue: number;
  uploadFormTitle: string;
  isLoadingProgress: boolean = false;
  deleteConfirmMsg: string;
  hideConfirmMsg: string;
  isEditMode: boolean = false;

  searchForm: FormGroup;

  selectedId: string;
  listData: Item[];
  formData: Item['data'];
  sch_partner_name: string;
  //listPartners = [];
  listPartners: any[] = this.globals.configs['partnerList'];
  listSltdPaId: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_product_name: string;
  sch_st: number;
  st: number;
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  inputAssemblyPartners: any[] = this.globals.configs['partnerList'];
  inputPartners: any[] = this.globals.configs['partnerList'];
  productionLines: any[] = this.globals.configs['productionLine'];
  product_price: number;
  editData: Item;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '삭제되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
  @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
  @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

  constructor(
    public electronService: ElectronService,
    @Inject(FormBuilder) fb: FormBuilder,
    private dataService: PartnerAssemblyProductService,
    private globals: AppGlobals,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private utils: UtilsService,
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
      sch_partner_name: '',
    });
    this.inputForm = fb.group({
      input_date: ['', Validators.required],
      name: ['', Validators.required],
      partner_alias: ['', Validators.required],
      partner_id: '',
      size: ['', Validators.required],
      price: ['', Validators.required],
      price_date: ['', Validators.required],
      is_type: '',
    });
  }

  ngOnInit() {
    this.panelTitle = '외주물품 등록 현황';
    this.inputFormTitle = '외주물품 등록';
    this.uploadFormTitle = '외주단조품 엑셀업로드';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
    this.hideConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';

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
      // st: this.sch_st,
      sortby: ['name', 'size'],
      order: ['asc', 'asc'],
      maxResultCount: 10000
    };
    if (this.listSltdPaId > 0 && formData.sch_partner_name != '') {
      params['partner_id'] = this.listSltdPaId;
    }
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];

        this.isLoadingProgress = false;
      }
    );
  }

  onSelectListPartner(event: TypeaheadMatch): void {

    if (event.item['id'] == '') {
      this.listSltdPaId = 0;
    } else {
      this.listSltdPaId = event.item['id'];
    }
    let id = this.listSltdPaId;
    let formData = this.searchForm.value;
    const temp = this.temp.filter(function (d) {
      d.partner_code = String(d.id);
      return d.partner_code.indexOf(id) !== -1 || !id;
    });

    this.rows = temp;
  }

  updateFilter(event) {

    let material = event.target.value;
    let partner_id = this.listSltdPaId;

    let rt = this.temp.filter(function (d) {
      return (d.material.indexOf(material) !== -1 && d.partner_id.indexOf(partner_id) !== -1) || !material && !partner_id;
    });

    this.rows = rt;
  }


  onSelectInputPartner(event: TypeaheadMatch): void {
    console.log(event.item.id);
    if (event.item == '') {
      this.inputForm.controls['partner_id'].setValue(0);
    } else {
      this.inputForm.controls['partner_id'].setValue(event.item.id);
    }
  }

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            name: this.formData.name,
            size: this.formData.size,
            partner_alias: this.formData.partner_alias,
            partner_id: this.formData.partner_id,
            price: this.formData.price,
            price_date: this.formData.price_date,
          });
        }
      }
    );
  }

  Save() {
    let formData = this.inputForm.value;

    formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');
    formData.price_date = this.datePipe.transform(formData.price_date, 'yyyy-MM-dd');
    formData.price = parseInt(formData.price);
    formData.is_type = false;
    if (this.isEditMode == true) {
      this.Update(this.selectedId, formData);
    } else {
      formData.st = '1';
      this.Create(formData);
    }
  }

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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

  Update(id, data): void {
    this.dataService.Update(id, data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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

  changeStatus(id, st): void {
    const formData: FormData = new FormData();
    formData.append('st', st);
    this.dataService.changeStatus(id, formData)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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
        this.statusFormTitle = '자재 삭제';
        this.statusFormValue = -1;
        this.statusConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
        break;
      case 'hide':
        this.statusFormTitle = '자재 숨김';
        this.statusFormValue = 0;
        this.statusConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';
        break;
      case 'use':
        this.statusFormTitle = '자재 사용';
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
        this.inputForm.controls['price_date'].setValue(this.tDate);
        this.isEditMode = false;
      }
    }
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
    this.isLoadingProgress = true;
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
