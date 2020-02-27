import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import {DomSanitizer} from '@angular/platform-browser';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {MaterialsService} from './materials.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {MessageService} from '../../../../message.service';
import {Item} from './materials.item';
import {UtilsService} from "../../../../utils.service";
import {saveAs as importedSaveAs} from "file-saver";
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css'],
  providers: [MaterialsService, DatePipe]
})
export class MaterialsComponent implements OnInit {
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
  // listPartners = [];
  listPartners: any[] = this.globals.configs['partnerList'];
  listSltdPaId: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_st: number;
  st: number;
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  inputForm: FormGroup;
  inputPartners: any[];
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
    private sanitizer: DomSanitizer,
    private dataService: MaterialsService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    // 접근권한 체크
    if (route.routeConfig.path && ('id' in route.routeConfig.data)) {
      if (route.routeConfig.data.id in this.globals.userPermission) {
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
      size: ['', Validators.required],
      name: ['', Validators.required],
      partner_alias: ['', Validators.required],
      partner_id: ['', Validators.required],
      price: ['', Validators.required],
      price_date: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.panelTitle = '원자재물품 현황';
    this.inputFormTitle = '자재 등록';
    this.uploadFormTitle = '자재 엑셀업로드';
    this.deleteConfirmMsg = '선택하신 데이터를 삭제하시겠습니까?';
    this.hideConfirmMsg = '선택하신 데이터를 숨김처리하시겠습니까?';

    this.changeSubMenu(1);

    this.getPaList();

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

  getPaList(){
    this.dataService.GetPaList()
    .subscribe(
      data => {
        this.listPartners = data['data']
      }
    );
  }

  getAll(): void {
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
    this.selected = [];
    this.rows = [];
    this.temp = [];
    let formData = this.searchForm.value;
    let params = {
      partner_name: formData.sch_partner_name,
      st: this.sch_st
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
  }, 10);
}

  onSelectListPartner(event: TypeaheadMatch): void {

    if (event.item['id'] == '') {
      this.listSltdPaId = 0;
    } else {
      this.listSltdPaId = event.item['id'];
    }

    this.getAll();

  }

  // updateFilter(event) {

  //   let material = event.target.value;
  //   let partner_id = this.listSltdPaId;

  //   let rt = this.temp.filter(function (d) {
  //     return (d.material.indexOf(material) !== -1 && d.partner_id.indexOf(partner_id) !== -1) || !material && !partner_id;
  //   });

  //   this.rows = rt;
  // }


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
    formData.price = Number(formData.price) * 1;
    formData.is_type = true;
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

  exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
    if (this.electronService.checkExportExcel()) {
      let data;
      if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
        // data = this.dataService.GetMasterExcelData()['data'];
      } else { //리스트는 기존 가져온 데이터로 생성
        data = this.rows;
      }

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet(this.panelTitle);

      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 15;

      const header = ["등록일자", "자재명", "규격", "거래처", "단가", "단가적용일"];
      let headerRow = worksheet.addRow(header);
      headerRow.font = this.globals.headerFontStyle as Font;
      headerRow.eachCell((cell, number) => {
        cell.fill = this.globals.headerFillColor as Fill;
        cell.border = this.globals.headerBorderStyle as Borders;
        cell.alignment = this.globals.headerAlignment as Alignment;
      });

      let jsonValueToArray;
      data.forEach(d => {
            jsonValueToArray = [];
            jsonValueToArray.push(d.input_date);
            jsonValueToArray.push(d.name);
            jsonValueToArray.push(d.size);
            jsonValueToArray.push(d.partner_name);
            jsonValueToArray.push(d.price);
            jsonValueToArray.push(d.price_date);

            let row = worksheet.addRow(jsonValueToArray);
            row.font = this.globals.bodyFontStyle as Font;
            row.getCell(1).alignment = {horizontal: "center"};
            row.getCell(6).alignment = {horizontal: "center"};
            row.getCell(5).alignment = {horizontal: "right"};
            row.eachCell((cell, number) => {
              cell.border = this.globals.bodyBorderStyle as Borders;
            });
          }
      );

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }
}
