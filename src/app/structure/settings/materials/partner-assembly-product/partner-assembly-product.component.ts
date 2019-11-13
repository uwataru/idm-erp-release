import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {PartnerAssemblyProductService} from './partner-assembly-product.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './partner-assembly-product.item';
import {saveAs as importedSaveAs} from 'file-saver';
import {ElectronService} from '../../../../providers/electron.service';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './partner-assembly-product.component.html',
  styleUrls: ['./partner-assembly-product.component.css'],
  providers: [PartnerAssemblyProductService]
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
  listPartners: any[] = this.globals.configs['type41Partners'];
  listSltdPaCode: number = 0;
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
  inputAssemblyPartners: any[] = this.globals.configs['type4Partners'];
  inputPartners: any[] = this.globals.configs['type5Partners'];
  productionLines: any[] = this.globals.configs['productionLine'];
  material_cost: number;
  assembly_cost: number;
  outsourcing_cost: number;
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
      sch_product_name: ''
    });
    this.inputForm = fb.group({
      input_date: ['', Validators.required],
      product_code: ['', Validators.required],
      product_reg_no: ['', Validators.required],
      assembly_partner_code: '',
      assembly_partner_name: '',
      material_supply_type: ['', Validators.required],
      material_cost: '',
      assembly_cost: '',
      outsourcing_cost: ['', Validators.required],
      partner_code: '',
      product_name: '',
      product_price: '',
      is_tmp_price: '',
      material: '',
      size: '',
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
      product_name: formData.sch_product_name,
      st: this.sch_st,
      sortby: ['product_reg_no', 'product_code'],
      order: ['asc'],
      maxResultCount: 10000
    };
    if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
      params['partner_code'] = this.listSltdPaCode;
    }
    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];

        // 제품 목록에서 거래처 추출
        // let pcodes = [];
        // var temp = [];
        // temp['Code'] = '';
        // temp['Name'] = '　';
        // this.listPartners[0] = temp;
        // var n = 1;
        // for (var i=0; i<this.rows.length; i++) {
        //     var temp = [];
        //     temp['Code'] = this.rows[i]['partner_code'];
        //     temp['Name'] = this.rows[i]['partner_name'];
        //
        //     if (pcodes.indexOf(temp['Code']) == -1 && this.rows[i]['partner_name'] != '') {
        //         pcodes.push(this.rows[i]['partner_code']);
        //         this.listPartners[n] = temp;
        //         n++;
        //     }
        // }

        this.isLoadingProgress = false;
      }
    );
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['Code'] == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = event.item['Code'];
    }

    const val = this.listSltdPaCode;

    // filter data
    // const temp = this.temp.filter(function(d){
    //     return d.partner_code.indexOf(val) !== -1 || !val;
    // })
    //
    // // update the rows
    // this.rows = temp;
  }

  onSelectInputAssemblyPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['assembly_partner_code'].setValue(0);
    } else {
      this.inputForm.controls['assembly_partner_code'].setValue(event.item.Code);
    }
  }

  onSelectInputPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['partner_code'].setValue(0);
    } else {
      this.inputForm.controls['partner_code'].setValue(event.item.Code);
    }
  }

  updateFilter(event) {
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.product_code.indexOf(val) !== -1 || !val;
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
          if (this.formData.material_supply_type == 1) {

          }
          let material_cost = this.utils.addComma(this.formData.material_cost);
          let assembly_cost = this.utils.addComma(this.formData.assembly_cost);
          let outsourcing_cost = this.utils.addComma(this.formData.outsourcing_cost);
          let product_price = this.utils.addComma(this.formData.product_price);
          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            product_code: this.formData.product_code,
            product_reg_no: this.formData.product_reg_no,
            assembly_partner_code: this.formData.assembly_partner_code,
            assembly_partner_name: this.formData.assembly_partner_name,
            material_supply_type: this.formData.material_supply_type.toString(),
            material_cost: material_cost,
            assembly_cost: assembly_cost,
            outsourcing_cost: outsourcing_cost,
            // partner_code: this.formData.partner_code,
            // partner_name: this.formData.partner_name,
            // product_type: this.formData.product_type,
            product_name: this.formData.product_name,
            // production_line: this.formData.production_line,
            product_price: product_price,
            is_tmp_price: this.formData.is_tmp_price,
            material: this.formData.material,
            size: this.formData.size
          });
        }
      }
    );
  }

  loadProductInfo(event) {
    let productCode = event.target.value;
    this.dataService.GetProductInfo(productCode).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          let is_tmp_price = false;
          if (this.formData.is_tmp_price == 'Y') {
            is_tmp_price = true;
          }
          let product_price = this.utils.addComma(this.formData.product_price);
          this.inputForm.patchValue({
            partner_code: this.formData.partner_code,
            // partner_name: this.formData.partner_name,
            // product_type: this.formData.product_type,
            // drawing_no: this.formData.drawing_no,
            // sub_drawing_no: this.formData.sub_drawing_no,
            product_name: this.formData.product_name,
            // production_line: this.formData.production_line,
            product_price: product_price,
            is_tmp_price: is_tmp_price,
            // material: this.formData.material,
            // size: this.formData.size,
            // cut_length: this.formData.cut_length,
            // material_weight: this.formData.material_weight,
            // input_weight: this.formData.input_weight
          });
        }
      }
    );
  }

  Save() {
    let formData = this.inputForm.value;

    // 숫자필드
    formData.material_supply_type = formData.material_supply_type * 1;
    formData.material_cost = this.utils.removeComma(formData.material_cost) * 1;
    formData.assembly_cost = this.utils.removeComma(formData.assembly_cost) * 1;
    formData.outsourcing_cost = this.utils.removeComma(formData.outsourcing_cost) * 1;
    formData.product_price = this.utils.removeComma(formData.product_price) * 1;
    formData.size = formData.size * 1;

    if (this.isEditMode == true) {
      this.Update(this.selectedId, formData);
    } else {
      formData.is_tmp_price = false;
      formData.st = 1;
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
    console.log(data);
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
