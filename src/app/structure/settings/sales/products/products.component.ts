import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {ModalDirective} from 'ngx-bootstrap/modal';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {ElectronService} from '../../../../providers/electron.service';
import {saveAs as importedSaveAs} from 'file-saver';
import {ProductsService} from './products.service';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item, MaterialItem} from './products.item';

declare var $: any;

@Component({
  selector: 'app-page',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  providers: [ProductsService]
})
export class ProductsComponent implements OnInit {
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
  selectedId: string;
  listData: Item[];
  editData: Item;

  sch_partner_name: string;
  //listPartners = [];
  listPartners: any[] = this.globals.configs['type5Partners'];
  listSltdPaCode: number = 0;
  listSltdMaterialId: number = 0;
  searchValue: string;
  filteredPartners: any[] = [];
  sch_product_name: string;
  sch_st: number;
  st: number;
  formData: Item['data'];
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  searchForm: FormGroup;
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  materialData: MaterialItem[] = [];

  inputForm: FormGroup;
  prodTypeStr: string;

  tDate = this.globals.tDate;
  inputPartners: any[] = this.globals.configs['type5Partners'];
  listMaterials: any[] = this.globals.configs['schMaterials'];
  productionLines: any[] = this.globals.configs['productionLine'];
  product_price: number;
  ann_qt: number;
  lot_qt: number;

  isExecutable: boolean = false;
  isPrintable: boolean = false;

  errorMessage: string;
  addOkMsg = '등록이 완료되었습니다.';
  editOkMsg = '수정이 완료되었습니다.';
  delOkMsg = '단종처리되었습니다.';

  @ViewChild('InputFormModal') inputFormModal: ModalDirective;
  @ViewChild('StatusFormModal') statusFormModal: ModalDirective;
  @ViewChild('UploadFormModal') uploadFormModal: ModalDirective;
  @ViewChild('UploadFileSrc') uploadFileSrc: ElementRef;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    public electronService: ElectronService,
    private dataService: ProductsService,
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
      type: '',
      name: ['', Validators.required],
      product_price: ['', Validators.required],
      is_tmp_price: '',
      material_id_1: '',
      sch_materials_1: ['', Validators.required],
      material_qty_1: ['', Validators.required],
      material_price_1: ['', Validators.required],
      material_base_price_1: ['', ]
    });
  }

  ngOnInit() {
    this.panelTitle = '제품 등록 현황';
    this.inputFormTitle = '제품 등록';
    this.uploadFormTitle = '제품 엑셀업로드';

    this.changeSubMenu(1);

    let material = new MaterialItem();
    this.materialData.push(material);

    $(document).ready(function () {
      let modalContent: any = $('.modal-content');
      let modalHeader = $('.modal-header');
      modalHeader.addClass('cursor-all-scroll');
      modalContent.draggable({
        handle: '.modal-header'
      });
    });
    console.log("list~~~~~~~"+this.listMaterials['name']);
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
      //partner_name: formData.sch_partner_name,
      product_name: formData.sch_product_name,
      st: this.sch_st,
      sortby: ['sort_no'],
      order: ['asc'],
      maxResultCount: 10000
    };
    if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
      params['partner_code'] = this.listSltdPaCode;
    }
    if (formData.sch_partner_name != '' && !this.listSltdPaCode) {
      this.messageService.add('거래처 코드를 거래처목록에서 선택하세요.');
      return;
    }

    this.isLoadingProgress = true;
    this.dataService.GetAll(params).subscribe(
      listData => {
        this.listData = listData;
        this.temp = listData['data'];
        this.rows = listData['data'];


        let tRows = [];
        let len = this.rows.length;
        for (let i = 0; i < len; i++) {
          let row;
          if (this.rows[i].materials) {
            let lenMat = this.rows[i].materials.length;
            for (let j = 0; j < lenMat; j++) {
              row = [];
              if(j==0){
                row = {...this.rows[i]};
              }
              row.material = this.rows[i].materials[j];
              tRows.push(row);
            }
          } else {
            row = {...this.rows[i]};
            tRows.push(row);
          }
        }
        this.rows = tRows;
        console.log(this.rows);

        this.isLoadingProgress = false;

        setTimeout(() => {
          document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
        }, 0);
      }
    );
  }

  onSelectListPartner(event: TypeaheadMatch): void {
    if (event.item['id'] == '') {
      this.listSltdPaCode = 0;
    } else {
      this.listSltdPaCode = event.item['id'];
    }

    let partner_code = this.listSltdPaCode;
    let formData = this.searchForm.value;
    let product_val = formData.sch_product_name;

    const temp = this.temp.filter(function (d) {
      d.partner_code = String(d.partner_code);
      return d.partner_code.indexOf(partner_code) !== -1 && (d.product_code.indexOf(product_val) !== -1 || d.product_name.indexOf(product_val) !== -1) || !partner_code && !product_val;
    });

    this.rows = temp;

  }
  onSelectListMaterials(event: TypeaheadMatch): void {
    console.log(event.item);
    if (event.item == '') {
      this.inputForm.controls['material_price_'+this.materialData.length].setValue(0);
    } else {
      this.inputForm.controls['material_price_'+this.materialData.length].setValue(event.item.price);
      this.inputForm.controls['material_base_price_'+this.materialData.length].setValue(event.item.price);
      this.inputForm.controls['material_id_'+this.materialData.length].setValue(event.item.id);
      let formData = this.inputForm.value;

      console.log(typeof(formData.material_price_+this.materialData.length));
    }
  }


  updateFilter(event) {

    let partner_code = this.listSltdPaCode;
    const val = event.target.value;

    // filter data
    const temp = this.temp.filter(function (d) {
      return d.partner_code.indexOf(partner_code) !== -1 && (d.product_code.indexOf(val) !== -1 || d.product_name.indexOf(val) !== -1) || !val && !partner_code;
    });

    // update the rows
    this.rows = temp;
  }


  onSelectInputPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
      this.inputForm.controls['partner_code'].setValue(0);
    } else {
      this.inputForm.controls['partner_code'].setValue(event.item.Code);
    }
  }

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          let product_price = this.utils.addComma(this.formData.product_price);
          let ann_qt = this.utils.addComma(this.formData.ann_qt);
          let lot_qt = this.utils.addComma(this.formData.lot_qt);

          let is_tmp_price = false;
          if (this.formData.is_tmp_price == 'Y') {
            is_tmp_price = true;
          }
          let sq = false;
          if (this.formData.sq == 'Y') {
            sq = true;
          }
          let inspection = false;
          if (this.formData.inspection == 'Y') {
            inspection = true;
          }
          let selection = false;
          if (this.formData.selection == 'Y') {
            selection = true;
          }

          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            partner_code: this.formData.partner_code,
            partner_name: this.formData.partner_name,
            product_code: this.formData.product_code,
            product_type: this.formData.product_type,
            name: this.formData.name,
            product_price: product_price,
            is_tmp_price: is_tmp_price,
            material: this.formData.material,
            size: this.formData.size,
            production_line: this.formData.production_line,
            preparation_time: this.formData.preparation_time,
            assembly_method: this.formData.assembly_method,
            sq: sq,
            inspection: inspection,
            selection: selection,
            ann_qt: ann_qt,
            lot_qt: lot_qt,
          });
        }
      }
    );
  }

  AddComma(event) {
    var valArray = event.target.value.split('.');
    for (var i = 0; i < valArray.length; ++i) {
      valArray[i] = valArray[i].replace(/\D/g, '');
    }

    var newVal: string;

    if (valArray.length === 0) {
      newVal = '0';
    } else {
      let matches = valArray[0].match(/[0-9]{3}/mig);

      if (matches !== null && valArray[0].length > 3) {
        let commaGroups = Array.from(Array.from(valArray[0]).reverse().join('').match(/[0-9]{3}/mig).join()).reverse().join('');
        let replacement = valArray[0].replace(commaGroups.replace(/\D/g, ''), '');

        newVal = (replacement.length > 0 ? replacement + ',' : '') + commaGroups;
      } else {
        newVal = valArray[0];
      }

      if (valArray.length > 1) {
        newVal += '.' + valArray[1].substring(0, 2);
      }
    }
    this.inputForm.controls[event.target.id].setValue(this.utils.addComma(newVal));
    //this.inputForm.patchValue({'combi_product_price' : this.utils.addComma(newVal)});
  }

  Save() {
    let formData = this.inputForm.value;

    // 숫자필드 체크
    formData.product_price = this.utils.removeComma(formData.product_price) * 1;

    if (this.isEditMode == true) {
      this.Update(this.selectedId, formData);
    } else {
      formData.is_tmp_price = false;  //todo 체크박스 체크해서 설정.
      formData.materials = []
      for(let i=1; i<=this.materialData.length; i++){
        let material = {
          id: '',
          materials_id: formData['material_id_'+i],
          qty: formData['material_id_'+i],
          price: formData['material_price_'+i],
          state: '1'
        }
        formData.materials.push(material);
      }

      delete formData.material_base_price_1;
      delete formData.material_id_1;
      delete formData.material_price_1;
      delete formData.material_qty_1;
      delete formData.sch_materials_1;

      this.Create(formData);
    }
  }

  Create(data): void {
    console.warn(data);
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
        this.statusFormTitle = '제품 단종';
        this.statusFormValue = -1;
        this.statusConfirmMsg = '선택하신 제품을 단종처리하시겠습니까?';
        break;
      case 'hide':
        this.statusFormTitle = '제품 숨김';
        this.statusFormValue = 0;
        this.statusConfirmMsg = '선택하신 제품을 숨김처리하시겠습니까?';
        break;
      case 'use':
        this.statusFormTitle = '제품 사용';
        this.statusFormValue = 1;
        this.statusConfirmMsg = '선택하신 제품을 사용처리하시겠습니까?';
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
        // document.getElementById('material_title_{{index+1}}').
        console.log(this.listMaterials);
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

  addMaterialRow() {
    let material = new MaterialItem();
    this.materialData.push(material);
    let len = this.materialData.length;

    this.inputForm.addControl('sch_materials_' + len, new FormControl('', Validators.required));
    this.inputForm.addControl('material_qty_' + len, new FormControl('', Validators.required));
    this.inputForm.addControl('material_price_' + len, new FormControl('', Validators.required));
    this.inputForm.addControl('material_base_price_' + len, new FormControl(''));
    this.inputForm.addControl('material_id_' + len, new FormControl(''));

  }
  priceMulQty(event) {
    console.log('event', event);
    let formData = this.inputForm.value;

    let mQty = Number(formData['material_qty_'+this.materialData.length]) * 1;
    let mPrice = Number(formData['material_base_price_'+this.materialData.length]) * 1;

    let result = mQty*mPrice;
    this.inputForm.controls['material_price_'+this.materialData.length].setValue(result);
    }
}
