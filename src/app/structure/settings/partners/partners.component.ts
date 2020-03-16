import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ElectronService, EXPORT_EXCEL_MODE } from '../../../providers/electron.service';
import { saveAs as importedSaveAs } from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PartnersService } from './partners.service';
import { AppGlobals } from '../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../config.service';
import { MessageService } from '../../../message.service';
import { Item } from './partners.item';
import { Alignment, Border, Borders, Fill, Font, Workbook } from "exceljs";

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

  listPartners: any[] = this.globals.configs['partnerList'];
  listSltdPaId: number = 0;
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
    public electronService: ElectronService,
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
      ptype5: '',
      ptype6: '',
      biz_no: '',
      mobile: ['', Validators.required],
      mobile2: '',
      name: ['', Validators.required],
      alias: ['', Validators.required],
      ceo: '',
      addr1: '',
      addr2: '',
      addr3: '',
      costumer: '',
      country: '',
      zipcode: '',
      zipcode2: '',
      email: '',
      phone: ['', Validators.required],
      fax: '',
      biz_cate1: '',
      biz_cate2: ''
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

  onSelect({ selected }) {
    // console.log('Select Event', selected, this.selected);

    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  getAll(): void {
    document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

    setTimeout(() => {
      this.selected = [];
      this.rows = [];

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
    }, 10);
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

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          let ptype1 = false;
          if (this.formData.ptype1 == "Y") {
            ptype1 = true;
          }
          let ptype2 = false;
          if (this.formData.ptype2 == "Y") {
            ptype2 = true;
          }
          let ptype3 = false;
          if (this.formData.ptype3 == "Y") {
            ptype3 = true;
          }
          let ptype4 = false;
          if (this.formData.ptype4 == "Y") {
            ptype4 = true;
          }
          let ptype5 = false;
          if (this.formData.ptype5 == "Y") {
            ptype5 = true;
          }
          let ptype6 = false;
          if (this.formData.ptype6 == "Y") {
            ptype6 = true;
          }
          if (this.formData.mobile != null){
            this.formData.mobile = this.addHyphen_2(this.formData.mobile);
          }
          if (this.formData.mobile2 != null){
            this.formData.mobile2 = this.addHyphen_2(this.formData.mobile2);
          }
          if (this.formData.phone != null){
            this.formData.phone = this.addHyphen_2(this.formData.phone);
          }
          if (this.formData.fax != null){
            this.formData.fax = this.addHyphen_2(this.formData.fax);
          }
          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            ptype1: ptype1,
            ptype2: ptype2,
            ptype3: ptype3,
            ptype4: ptype4,
            ptype5: ptype5,
            ptype6: ptype6,
            biz_no: this.formData.biz_no,
            mobile: this.formData.mobile,
            mobile2: this.formData.mobile2,
            country: this.formData.country,
            name: this.formData.name,
            alias: this.formData.alias,
            ceo: this.formData.ceo,
            addr1: this.formData.addr1,
            addr2: this.formData.addr2,
            zipcode: this.formData.zipcode,
            zipcode2: this.formData.zipcode2,
            email: this.formData.email,
            phone: this.formData.phone,
            costumer: this.formData.costumer,
            fax: this.formData.fax,
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
    var isNumber =  /[^0-9]/g;
    if(!isNumber)
    if (formData.mobile2 != null) {
      formData.mobile2 = formData.mobile2.replace(/\-/g, '');
    }
    if (formData.mobile != null) {
      formData.mobile = formData.mobile.replace(/\-/g, '');
    }
    if (formData.phone != null) {
      formData.phone = formData.phone.replace(/\-/g, '');
    }
    if (formData.fax != null) {
      formData.fax = formData.fax.replace(/\-/g, '');
    }
    // formData.mobile = formData.mobile.replace(/\-/g,'');

    if (!formData.ptype1 && !formData.ptype2 && !formData.ptype3 && !formData.ptype4 && !formData.ptype5 && !formData.ptype6) {
      alert('구분은 최소 1개 이상 선택하셔야 합니다!');
      return false;
    }

    if (this.isEditMode == true) {
      this.Update(this.selectedId, formData);
    } else {
      console.log(formData);
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
        document.getElementById('daum_address_pop_1').style.display = 'none';
        document.getElementById('daum_address_pop_2').style.display = 'none';
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

  //주소검색
  daumAddressOptions_1 = {
    class: ['btn-small', 'btn-primary'],
    type: 'layer',
    target: 'daum_address_pop_1',
    width: 400
  };
  daumAddressOptions_2 = {
    class: ['btn-small', 'btn-primary'],
    type: 'layer',
    target: 'daum_address_pop_2',
    width: 400
  };
  setAddressData(data) {
    // console.log(data);
    this.inputForm.patchValue({
      zipcode: data.zip,
      addr1: data.addr
    }
    );
  }
  setAddressData2(data) {
    // console.log(data);
    this.inputForm.patchValue({
      zipcode2: data.zip,
      addr2: data.addr
    }
    );
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
  // numberCheck(event) {
  //   if(event.keyCode < 48 || event.keyCode > 57) {
  //     if(event.keyCode != 8 && event.keyCode != 13){
  //       alert('숫자만 입력하세요.');
  //       event.target.value = '';
  //     }
      
  //   }else{
  //     this.addHyphen(event);
  //   }
    
  // }

  checkNumber(event){
    if(event.keyCode < 96 || event.keyCode >105){
      if(event.keyCode < 48 || event.keyCode > 57 ) {
        if(event.keyCode != 8 && event.keyCode != 13&& event.keyCode != 37 && event.keyCode != 39){
          alert('숫자만 입력하세요.');
          // var btn = document.getElementById('save_btn');
          console.log(event.keyCode);
          // event.target.value = '';
          this.inputForm.controls[event.target.id].reset();
        }
      }
      this.inputForm.controls[event.target.id].reset(event.target.value);
    }

  }

  addHyphen(event) {
  

  this.checkNumber(event);

    
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
    this.inputForm.controls[event.target.id].reset(tel);
    console.log(event);
    console.log(this.inputForm.valid);
    
    
  }

  //
  exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
    if (this.electronService.checkExportExcel()) {
      let data;
      if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
        data = this.dataService.GetMasterExcelData()['data'];
      } else { //리스트는 기존 가져온 데이터로 생성
        data = this.rows;
      }

      let workbook = new Workbook();
      let worksheet = workbook.addWorksheet(this.panelTitle);

      worksheet.getColumn(1).width = 6;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 12;
      worksheet.getColumn(5).width = 50;
      worksheet.getColumn(6).width = 15;
      worksheet.getColumn(7).width = 12;
      worksheet.getColumn(8).width = 15;
      worksheet.getColumn(9).width = 15;

      const header = ["구분", "풀네임", "약칭명", "대표자", "주소", "전화", "담당자", "휴대전화", "팩스"];
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
        jsonValueToArray.push(d.ptype_str);
        jsonValueToArray.push(d.name);
        jsonValueToArray.push(d.alias);
        jsonValueToArray.push(d.ceo);
        jsonValueToArray.push(d.addr1);
        jsonValueToArray.push(d.phone);
        jsonValueToArray.push(d.costumer);
        jsonValueToArray.push(d.mobile);
        jsonValueToArray.push(d.fax);
        // jsonValueToArray.push(d.st == 1 ? '사용' : d.st == -1 ? '삭제' : '숨김');

        let row = worksheet.addRow(jsonValueToArray);
        row.font = this.globals.bodyFontStyle as Font;
        row.getCell(1).alignment = { horizontal: "center" };
        row.getCell(4).alignment = { horizontal: "center" };
        row.getCell(7).alignment = { horizontal: "center" };
        row.eachCell((cell, number) => {
          cell.border = this.globals.bodyBorderStyle as Borders;
        });
      }
      );

      workbook.xlsx.writeBuffer().then((data) => {
        let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        fileName = fileName == '' ? this.panelTitle : fileName;
        importedSaveAs(blob, fileName + '.xlsx');
      })
    }
  }
}
