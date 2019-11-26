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
import { FormArray } from '@angular/forms';

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
    @Inject(FormBuilder) public fb: FormBuilder,
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
    this.buildInputFormGroup();
  }
  buildInputFormGroup(){
    this.inputForm = this.fb.group({
      input_date: ['', Validators.required],
      type: '',
      name: ['', Validators.required],
      product_price: ['', Validators.required],
      is_tmp_price: '',
      material_id_1: '',
      id_1: '',
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
        // console.log('getAll', this.rows);

        this.isLoadingProgress = false;

        setTimeout(() => {
          document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
        }, 0);
      }
    );
  }

  onSelectListMaterials(event: TypeaheadMatch, index): void {
    // console.log('onSelectListMaterials', event.item, index);
    this.inputForm.controls['material_price_' + index].setValue(event.item.price);
    this.inputForm.controls['material_base_price_' + index].setValue(event.item.price);
    this.inputForm.controls['material_id_' + index].setValue(event.item.id);
    if(this.inputForm.controls['id_' + index] == null)
      this.inputForm.controls['id_' + index].setValue('');
  }

  updateFilter(event) {
    // let partner_code = this.listSltdPaCode;
    const val = event.target.value;
    // filter data
    const temp = this.temp.filter(function (d) {
      // console.log(d);
      return (d.name!=null &&  d.name.indexOf(val) !== -1) || !val;
    });

    // update the rows
    this.rows = temp;
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

  Edit(id) {
    this.dataService.GetById(id).subscribe(
      editData => {
        if (editData['result'] == 'success') {
          this.editData = editData;
          this.formData = editData['data'];
          this.formData['materials'] = editData['materials_data'];
          // console.warn(this.formData);
          let product_price = this.utils.addComma(this.formData.product_price);
          let is_tmp_price = false;
          if (this.formData.is_tmp_price == 'Y') {
            is_tmp_price = true;
          }

          for(let i=1; i<=this.formData['materials'].length; i++){
            if(i != 1) {
              this.addMaterialRow();
            }
            let matierialInfo = this.getMateriaInfo(this.formData['materials'][i-1].material_id);
            // console.log(matierialInfo);
            this.inputForm.controls['sch_materials_' + i].setValue(matierialInfo.name);
            this.inputForm.controls['id_' + i].setValue(this.formData['materials'][i-1].id);
            this.inputForm.controls['material_id_' + i].setValue(this.formData['materials'][i-1].material_id);
            this.inputForm.controls['material_qty_' + i].setValue(this.formData['materials'][i-1].qty);
            this.inputForm.controls['material_price_' + i].setValue(this.formData['materials'][i-1].price);
            this.inputForm.controls['material_base_price_' + i].setValue(matierialInfo.price);
          }

          this.inputForm.patchValue({
            input_date: this.formData.input_date,
            type: this.formData.type,
            name: this.formData.name,
            product_price: product_price,
            is_tmp_price: is_tmp_price,
            materials: this.formData.materials,
            assembly_method: this.formData.assembly_method,
          });
        }
      }
    );
  }

  Save() {
    let formData = this.inputForm.value;

    // 숫자필드 체크
    formData.product_price = this.utils.removeComma(formData.product_price) * 1;

    if (formData.is_tmp_price == null) {
      formData.is_tmp_price = false;
    }
    formData.materials = [];

    let state = 1;
    let id = '';
    for(let i=1; i<=this.materialData.length; i++){
      id = formData['id_'+i];
      if (this.isEditMode == true) {
        if(formData['material_id_'+i] == -1) {
          state = 3; //삭제
        } else{
          if(id == '') {
            state = 1; //추가
          } else{
            state = 2; //수정
          }
        }
      }
      if(formData['material_id_'+i] != -1 || this.isEditMode == true) {  //-1 은 삭제된 행
        let material = {
          id: id,
          material_id: formData['material_id_' + i],
          qty: parseInt(formData['material_qty_' + i]),
          price: formData['material_price_' + i],
          state: state
        }
        formData.materials.push(material);
      }

      delete formData['material_id_'+i];
      delete formData['id_'+i];
      delete formData['material_price_'+i];
      delete formData['material_base_price_'+i];
      delete formData['material_qty_'+i];
      delete formData['sch_materials_'+i];
    }

    console.log('save', this.selectedId, formData);
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
        console.log('selectedId=', this.selectedId);
      } else {
        this.selectedId = id;
      }
    }
    if (method == 'write') {
      this.materialData = [];
      let material = new MaterialItem();
      this.materialData.push(material);
      this.inputForm.reset();
      this.buildInputFormGroup();
      // console.log(this.inputForm);
      if (id) { //수정 모드
        this.isEditMode = true;
        this.Edit(id);
      } else {
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

  calRowHeight(row) {
    if (row.height === undefined) {
      let addHeight = 0;
      if(row.materials.length > 1){
        addHeight = (row.materials.length-1) * 21;
      }
      return 30 + addHeight;
    }
  }

  addMaterialRow() {
    // console.log('addMaterialRow', index);
    let material = new MaterialItem();
    this.materialData.push(material);
    let index = this.materialData.length;

    this.inputForm.addControl('sch_materials_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('id_' + index, new FormControl(''));
    this.inputForm.addControl('material_id_' + index, new FormControl(''));
    this.inputForm.addControl('material_qty_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('material_price_' + index, new FormControl('', Validators.required));
    this.inputForm.addControl('material_base_price_' + index, new FormControl(''));
  }
  removeMaterialRow(index) {
    console.log('removeMaterialRow', index);
    this.inputForm.controls['material_id_'+index].setValue(-1); //save() 할 때 이 값을 기준으로 삭제된 행인지 판단.
    if (this.isEditMode == false) {
      this.inputForm.controls['sch_materials_' + index].setValue(-1); //validator 위해서 임의에 값 넣어놈
      this.inputForm.controls['material_qty_' + index].setValue(-1);
      this.inputForm.controls['material_price_' + index].setValue(-1);
    }
  }

  calculatePrice(event, index) {
    console.log('calculatePrice', event, index);
    let formData = this.inputForm.value;

    // console.log(formData['material_qty_'+index], formData['material_base_price_'+index]);
    let mQty = Number(formData['material_qty_'+index]) * 1;
    let mPrice = Number(formData['material_base_price_'+index]) * 1;

    let result = mQty * mPrice;
    this.inputForm.controls['material_price_'+index].setValue(result);
    // console.log('calculatePrice', this.inputForm.value);
  }

  chkViewAddBtn(index) {
    let len = this.materialData.length;
    let unVisibleItemCnt = 0;
    for (let i = index + 1; i <= len; i++) {
      if (this.inputForm.value['material_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    // console.log(index, len , upItemCnt);
    if((len - unVisibleItemCnt) == index){
      return true;
    }
    return false;

  }

  chkViewRemoveBtn(index){
    let len = this.materialData.length;
    let unVisibleItemCnt = 0;
    for (let i = 1; i <= len; i++) {
      if (this.inputForm.value['material_id_' + i] == -1) {
        unVisibleItemCnt++;
      }
    }
    if(len - unVisibleItemCnt > 1){
      return true;
    }
    return false;
  }

  getMateriaInfo(id){
    for(let i=0; i<this.listMaterials.length; i++){
      if(this.listMaterials[i].id == id){
        return this.listMaterials[i];
      }
    }
  }
}
