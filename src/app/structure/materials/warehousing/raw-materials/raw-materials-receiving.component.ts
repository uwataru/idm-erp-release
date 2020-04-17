import { Component, Inject, OnInit, ViewChild, ElementRef, ViewEncapsulation  } from '@angular/core';
import {ElectronService, EXPORT_EXCEL_MODE} from '../../../../providers/electron.service';
import { saveAs as importedSaveAs } from "file-saver";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { RawMaterialsReceivingService } from './raw-materials-receiving.service';
import { AppGlobals } from '../../../../app.globals';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './raw-materials-receiving.item';
import {Alignment, Border, Borders, Fill, Font, Workbook} from "exceljs";
declare var $: any;
@Component({
    selector: 'app-page',
    templateUrl: './raw-materials-receiving.component.html',
    styleUrls: ['./raw-materials-receiving.component.css'],
    providers: [RawMaterialsReceivingService, DatePipe],
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialsReceivingComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    statusFormTitle: string;
    statusConfirmMsg: string;
    isLoadingProgress: boolean = false;
    isEditMode: boolean = false;

    searchForm: FormGroup;

    selected = [];
    selectedId: string;
    selectedCnt: number;

    listData : Item[];
    formData: Item['data'];
    sch_partner_name: string;
    //listPartners = [];
    listPartners: any[] = this.globals.configs['partnerList'];
    listSltdPaCode: number = 0;
    searchValue: string;
    filteredPartners: any[] = [];
    sch_product_name: string;
    sch_st: number;
    st: number;
    rows = [];
    groupRows = [];
    groupInfoRows = [];
    delId = [];
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;
    currTab: number;

    inputForm: FormGroup;
    groupForm: FormGroup;
    inputPartners: any[] = this.globals.configs['partnerList'];
    storagePartners: any[] = this.globals.configs['partnerList'];
    inputMakers: any[] = this.globals.configs['maker'];
    receiving_qty: number;
    editData: Item;
    data: Date;
    isExecutable: boolean = false;
    isPrintable: boolean = false;

    errorMessage: string;
    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';
    delOkMsg = '삭제되었습니다.';

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;
    @ViewChild('GroupFormModal') groupFormModal: ModalDirective;
    @ViewChild('StatusFormModal') statusFormModal: ModalDirective;

    constructor(
        public elSrv: ElectronService,
        @Inject(FormBuilder) fb: FormBuilder,
        private router: Router,
        private datePipe: DatePipe,
        private dataService: RawMaterialsReceivingService,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        // 접근권한 체크
        if (route.routeConfig.path && ("id" in route.routeConfig.data) ) {
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
            receiving_date: ['', Validators.required],
            id: ['', Validators.required],
            material_id: ['', Validators.required],
            partner_name: ['', Validators.required],
            partner_id: ['', Validators.required],
            price: ['', Validators.required],
            // receiving_type: ['', Validators.required],
            receiving_qty: ['', Validators.required],
            order_qty: ['', Validators.required],
            name: '',
            receiving_price: '',
            // is_report: '',
            // is_mealsheet: '',
            size: ['', Validators.required],
            // ms_no: ['', Validators.required],
            receiving_location_name: ['', Validators.required],
            receiving_location_id: ['', Validators.required],
        });
        this.groupForm = fb.group({
            receiving_date: ['', Validators.required],
            id: ['', Validators.required],
            receiving_qty: ['', Validators.required],
            order_qty: ['', Validators.required],
            receiving_price: '',
            receiving_location_name: ['', Validators.required],
            receiving_location_id: ['', Validators.required],
        });


        // if( this.storagePartners.filter(v => v.Code == 0).length < 1 ) {
        //     this.storagePartners.unshift({Code:0, Name:'자가', Alias:'자가'});
        // }
    }

    ngOnInit() {
        this.panelTitle = '원자재발주현황';
        this.inputFormTitle = '원자재입고처리';

        this.getAll();
        this.getPaList();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    materialTab(type) {

        if(type == 1) {
            this.getAllGroup();
        } else {
            this.getAll();
        }
      }

    getPaList(){
        this.dataService.GetPaList().subscribe(
            listData => {
              this.listPartners = listData['data'];
            }
          );
    }

    getAllGroup(): void {
        this.currTab = 1;
        setTimeout(() => {
          document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
        }, 10);
    
        setTimeout(() => {
          this.groupRows = [];
          
    
          this.isLoadingProgress = true;
          this.dataService.GetAllGroup().subscribe(
            listData => {
              this.listData = listData;
            //   this.temp = listData['data'];
              this.groupRows = listData['data'];
              this.isLoadingProgress = false;
            }
            );
    
              
            }, 15);
    }

    calRowHeight(row) {
        if (row.height === undefined) {
          let addHeight = 0;
          if (row.material.length > 1) {
            addHeight = (row.material.length - 1) * 21;
          }
          return 30 + addHeight;
        }
    }

    getAll(): void {
        this.currTab = 2;

        this.selectedCnt = 0;
        this.selectedId = '';
        this.selected = [];

        let formData = this.searchForm.value;
        let params = {
            // partner_name: formData.sch_partner_name,
            // product_name: formData.sch_product_name,
            // st: 0,
            // sortby: ['material_id'],
            // order: ['asc'],
            // maxResultCount: 10000
        };
        if (this.listSltdPaCode > 0 && formData.sch_partner_name != '') {
            params['partner_id'] = this.listSltdPaCode;
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

    onSelectInputPartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['partner_id'].setValue(0);
        } else {
            this.inputForm.controls['partner_id'].setValue(event.item.id);
        }
    }

    onSelectStoragePartner(event: TypeaheadMatch): void {
        if (event.item == '') {
            this.inputForm.controls['receiving_location_id'].setValue(0);
        } else {
            this.inputForm.controls['receiving_location_id'].setValue(event.item.receiving_location_id);
        }
    }

    CalculOrderAmount (event): void {
        let formData = this.inputForm.value;
        if(parseInt(formData.order_qty)<parseInt(formData.receiving_qty)){
            alert('입고수량이 발주수량보다 많습니다!');
            this.inputForm.controls['receiving_qty'].setValue('');
            this.inputForm.controls['receiving_price'].setValue('');

        }else{
            let f = event.target.id.replace('order_qty', 'receiving_price');
            let q = this.utils.removeComma(event.target.value) * 1;
            let p = this.utils.removeComma(formData.price) * 1;
            let dp = this.utils.addComma(q * p)
            this.inputForm.controls['receiving_price'].setValue(dp);
        }
    }
    CalculOrderAmountGroup (event): void {
        let formData = this.groupForm.value;
        if(parseInt(formData.order_qty)<parseInt(formData.receiving_qty)){
            alert('입고수량이 발주수량보다 많습니다!');
            this.inputForm.controls['receiving_qty'].setValue('');
            this.inputForm.controls['receiving_price'].setValue('');

        }else{
            console.log(this.groupInfoRows[0].qty);
            let formData = this.groupForm.value;
            this.receiving_qty = formData.receiving_qty;
            let price = 0;
            for(let i=0; i<this.groupInfoRows.length; i++){
              let qty = this.groupInfoRows[i]['qty'] * this.receiving_qty;
              let tmp_price = qty * this.groupInfoRows[i]['price'];
        
              price += tmp_price;
            }
            
            this.groupForm.controls['receiving_price'].setValue(this.utils.addComma(price));
        }
    }

    Save () {
        let formModel = this.inputForm.value;
    
        let receiving_price = this.utils.removeComma(formModel['receiving_price']) * 1;
        let receiving_qty = this.utils.removeComma(formModel['receiving_qty']) * 1;

        // let receiving_type = this.utils.removeComma(formModel['receiving_type']) * 1;

        let receiving_date = this.datePipe.transform(formModel['receiving_date'], 'yyyy-MM-dd');

        let formData = {
            material_id: formModel.material_id,
            receiving_type: 1,
            receiving_qty: receiving_qty,
            receiving_price: receiving_price,
            receiving_date: receiving_date,
            // order_price: order_price,
            receiving_location_id: formModel.receiving_location_id
            // id: formModel.id,
            // name: formModel.name,
            // size: formModel.size * 1,
            // partner_name: formModel.partner_name,
            // price_per_unit: this.utils.removeComma(formModel.price_per_unit) * 1,
        };

        this.Create(this.selectedId,formData);
        // console.log(this.selectedId,formData);
    }
    SaveGroup() {
        let formModel = this.groupForm.value;
    
        let receiving_price = this.utils.removeComma(formModel['receiving_price']) * 1;
        let receiving_qty = this.utils.removeComma(formModel['receiving_qty']) * 1;

        // let receiving_type = this.utils.removeComma(formModel['receiving_type']) * 1;

        let receiving_date = this.datePipe.transform(formModel['receiving_date'], 'yyyy-MM-dd');

        let formData = {
            receiving_type: 1,
            receiving_qty: receiving_qty,
            receiving_price: receiving_price,
            receiving_date: receiving_date,
            receiving_location_id: formModel.receiving_location_id
        };

        console.log(formModel.id,formData);
        this.CreateGroup(formModel.id,formData);
    }

    CreateGroup(id,data): void {
        this.dataService.CreateGroup(id,data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.groupForm.reset();
                        this.getAllGroup();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.groupFormModal.hide();
                },
                error => this.errorMessage = <any>error
            );
    }
    Create (id,data): void {
        this.dataService.Create(id,data)
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

    getRowClass(row) {

        let rt = '';
        if(row.is_sum_row == 'Y') {
            rt = 'row-color';
        } else if(row.is_all_sum_row == 'Y') {
            rt = 'all-row-color';
        }
        return rt;
     }

    deleteOrder(id) {
        this.dataService.Delete(id)
        .subscribe(
            data => {
                if (data['result'] == "success") {
                    this.getAll();
                    this.messageService.add('입고취소되었습니다.');
                } else {
                    this.messageService.add(data['errorMessage']);
                }
                this.selectedCnt = 0;
                this.selectedId = '';
                this.selected = [];
                this.statusFormModal.hide();
            },
            error => this.errorMessage = <any>error
        );
    }

    openModal(method ,id) {
        // 실행권한
        if (this.isExecutable == true) {
            if (method == 'receiving') {
                this.inputFormModal.show();

            } else if (method == 'cancel') {

                //입고가 있으면 리턴
                // this.dataService.GetInventory(this.selectedId).subscribe(
                    // inventoryData =>
                    // {
                        // if(inventoryData['data'] && Object.keys(inventoryData['data']).length > 0) {
                        //     this.messageService.add('입고처리된 데이터가 존재하여 삭제할수 없습니다.');
                        //     return false;
                        // } else {
                            // this.isLoadingProgress = false;
                            this.statusFormModal.show();
                        // }
                    // }
                // );

            }else{
                this.groupFormModal.show();
            }
        } else {
            alert(this.globals.isNotExecutable);
            return false;
        }

         if(method == 'cancel') {
            this.statusFormTitle = '입고 취소';
            this.statusConfirmMsg = '선택하신 데이터를 취소하시겠습니까?';
        } else if(method == 'receiving') {

            // 입력폼 리셋
            this.inputForm.reset();
            // 주문 ID
            this.inputForm.controls['id'].setValue(this.selectedId);

            // 입력일
            this.inputForm.controls['receiving_date'].setValue(this.tDate);

            // 입고구분
            // this.inputForm.controls['receiving_type'].setValue('1');


            // 단조품정보
            this.dataService.GetById(this.selectedId).subscribe(
                editData =>
                {
                    if (editData['result'] == "success") {
                        this.editData = editData;
                        this.formData = editData['data'];

                        let price = this.utils.addComma(this.formData.price);
                        let receiving_price = this.utils.addComma(this.formData.receiving_price);
                        this.inputForm.patchValue({
                            material_id: this.formData.material_id,
                            partner_id: this.formData.partner_id,
                            partner_name: this.formData.partner_name,
                            order_qty: this.formData.order_qty,
                            name: this.formData.name,
                            size: this.formData.size,
                            // receiving_qty: this.formData.receiving_qty,
                            price: price,
                            receiving_location_name: this.formData.receiving_location_name,
                            receiving_location_id: this.formData.receiving_location_id,
                        });

                        console.log(this.inputForm.value['material_id']);
                        console.log("order_qty",this.inputForm.controls['order_qty'].value);
                    }
                }
            );
        }else {
            this.groupInfoRows = [];
            this.groupForm.reset();
            // 주문 ID
            this.groupForm.controls['id'].setValue(id);

            // 입력일
            this.groupForm.controls['receiving_date'].setValue(this.tDate);

            this.receiving_qty = 10;


            // 단조품정보
            this.dataService.GetByIdGroup(id).subscribe(
                editData =>
                {
                    if (editData['result'] == "success") {
                        this.editData = editData;
                        this.formData = editData['data'];
                        this.groupInfoRows = this.editData['data']['material'];

                        // let receiving_price = this.utils.addComma(this.formData.receiving_price);
                        this.groupForm.patchValue({
                            order_qty: this.formData.order_qty,
                            receiving_qty: this.receiving_qty,
                            // receiving_price: receiving_price,
                            receiving_location_name: this.formData.receiving_location_name,
                            receiving_location_id: this.formData.receiving_location_id,
                        });

                        console.log("order_qty",this.groupForm.controls['order_qty'].value);
                    }
                    this.CalculOrderAmountGroup('');
                }
            );
        }
    }

    onSelect({selected}) {
        this.selectedCnt = selected.length;
        if (this.selectedCnt == 1) {
          this.selectedId = selected[0].id;
          this.inputForm.controls['id'].setValue(this.selectedId);
        }
      }

    // checkSelect(event) {
    //     return event.id > 0 ? true : false;
    // }

    exportExcel(type: EXPORT_EXCEL_MODE, fileName: string = '') {
        if (this.elSrv.checkExportExcel()) {
            let data;
            if (type == EXPORT_EXCEL_MODE.MASTER) { //마스터파일은 서버에서 자료가져와 생성
                // data = this.dataService.GetMasterExcelData()['data'];
            } else { //리스트는 기존 가져온 데이터로 생성
                data = this.rows;
            }

            let workbook = new Workbook();
            let worksheet = workbook.addWorksheet(this.panelTitle);

            worksheet.getColumn(1).width = 25;
            worksheet.getColumn(2).width = 25;
            worksheet.getColumn(3).width = 15;
            worksheet.getColumn(4).width = 12;
            worksheet.getColumn(5).width = 8;
            worksheet.getColumn(6).width = 10;
            worksheet.getColumn(7).width = 12;

            const header = ["거래처", "제품명", "규격", "발주일자", "발주수량", "단가", "금액"];
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
                    jsonValueToArray.push(d.partner_name);
                    jsonValueToArray.push(d.name);
                    jsonValueToArray.push(d.size);
                    jsonValueToArray.push(d.receiving_date);
                    jsonValueToArray.push(d.order_qty);
                    jsonValueToArray.push(d.price);
                    jsonValueToArray.push(d.order_price);

                    let row = worksheet.addRow(jsonValueToArray);
                    row.font = this.globals.bodyFontStyle as Font;
                    row.getCell(4).alignment = {horizontal: "center"};
                    row.getCell(5).alignment = {horizontal: "right"};
                    row.getCell(6).alignment = {horizontal: "right"};
                    row.getCell(7).alignment = {horizontal: "right"};
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
