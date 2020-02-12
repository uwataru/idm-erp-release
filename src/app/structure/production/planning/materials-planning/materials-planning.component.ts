import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { DatePipe } from '@angular/common';
import { MaterialsPlanningService } from './materials-planning.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './materials-planning.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './materials-planning.component.html',
    styleUrls: ['./materials-planning.component.css'],
    providers: [MaterialsPlanningService, DatePipe]
})
export class MaterialsPlanningComponent implements OnInit {
    tDate = this.globals.tDate;
    inputFormTitle: string;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    inputForm: FormGroup;
    searchForm: FormGroup;

    listData: Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];
    temp = [];
    totalQuantity: number;
    totalSalesPrice: number;
    isInitPlanDate: boolean = false;

    materialDataCnt: number;


    selected = [];
    selectedId: string;
    gridHeight = this.globals.gridHeight;
    messages = this.globals.datatableMessages;

    errorMessage: string;

    @ViewChild('salesCompletionClose') salesCompletionClose: ElementRef;
    @ViewChild('changeStatusClose') changeStatusClose: ElementRef;
    @ViewChild('hideFormClose') hideFormClose: ElementRef;
    @ViewChild('uploadFormClose') uploadFormClose: ElementRef;
    @ViewChild('uploadFileSrc') uploadFileSrc: ElementRef;
    @ViewChild('InputFormModal') inputFormModal: ModalDirective;


    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: MaterialsPlanningService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
    ) {
        this.searchForm = fb.group({
            sch_order_no: '',
        });

        this.inputForm = fb.group({
            order_no: '',
            product_name: '',
            product_type: '',
            qty: '',
            name_1: '',
            material_qty_1: '',
            price_1: '',
            current_qty_1: '',
            short_qty_1: '',
        });

        // 생산계획 수립일, 출력기한
        // this.dataService.GetPlanningDate().subscribe(
        //     view => {
        //         this.searchForm.controls['sch_sdate'].setValue(view['planning-date']);
        //         this.searchForm.controls['sch_edate'].setValue(view['end-date']);
        //         this.GetAll();
        //     }
        // );
    }

    ngOnInit() {
        this.panelTitle = '자재계획';
        this.inputFormTitle = '자재계획';
        this.GetAll();

        this.materialDataCnt = 1;

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
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

        setTimeout(() => {
            let formData = this.searchForm.value;
            let params = {
                order_no: formData.sch_order_no.trim()
            };
            this.isLoadingProgress = true;
            this.dataService.GetAll(params).subscribe(
                listData => {
                    this.listData = listData;
                    this.rows = listData['data'];
                    this.temp = listData['data'];

                    // console.log(this.rows);

                    // this.rows.sort(function (a, b) {
                    //     return a.subKey > b.subKey ? 1 : -1;
                    // });
                    // for (let i = 0; i < this.rows.length; i++) {
                    //     this.rows[i].subData.sort(function (a, b) {
                    //         return a.working_date.localeCompare(b.working_date)
                    //             || b.product_code.localeCompare(a.product_code)
                    //             || a.production_line.localeCompare(b.production_line);
                    //     });
                    // }

                    //this.totalQty = listData['sumData']['total_qty'];
                    //this.totalSalesPrice = listData['sumData']['total_sales_price'];

                    this.isLoadingProgress = false;
                    if (this.isInitPlanDate == false) {
                        this.isInitPlanDate = true;
                    }
                }
            );
        }, 10);
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

    openModal(id) {
        this.materialDataCnt = 1;

        this.inputFormModal.show();
        this.dataService.GetMaterialPlanningInfo(id).subscribe(
            editData => {
                if (editData['result'] == "success") {
                    let formData = editData['data'];
                    let materialData = editData['data']['material'];
                    this.inputForm.patchValue({
                        order_no: formData.order_no,
                        product_name: formData.product_name,
                        product_type: formData.product_type,
                        qty: formData.qty,
                    });
                    // this.productDetailInfo(formData.product_code);
                    let len2 = materialData.length;
                    for (let i = 1; i <= len2; i++) {
                        // console.error(workData[i]);
                        if (i != 1) {
                            this.addMaterialRow();
                        }
                        this.inputForm.controls['name_' + i].setValue(materialData[i - 1].name);
                        this.inputForm.controls['material_qty_' + i].setValue(materialData[i - 1].qty);
                        this.inputForm.controls['price_' + i].setValue(materialData[i - 1].price);
                        this.inputForm.controls['current_qty_' + i].setValue(materialData[i - 1].current_qty);
                        this.inputForm.controls['short_qty_' + i].setValue(materialData[i - 1].current_qty - materialData[i - 1].qty);
                    }
                }
            }
        );

    }
    addMaterialRow() {
        // console.log('addMaterialRow', index);
        this.materialDataCnt++;
        let index = this.materialDataCnt;

        this.inputForm.addControl('name_' + index, new FormControl('', Validators.required));
        this.inputForm.addControl('material_qty_' + index, new FormControl('', Validators.required));
        this.inputForm.addControl('price_' + index, new FormControl('', Validators.required));
        this.inputForm.addControl('current_qty_' + index, new FormControl('', Validators.required));
        this.inputForm.addControl('short_qty_' + index, new FormControl('', Validators.required));
    }

    updateFilter(event) {
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;
        setTimeout(() => {
            const val = event.target.value.trim();
            const temp = this.temp.filter(function (d) {
                return d.order_no.indexOf(val) !== -1 || !val;
            });
            this.rows = temp;
        }, 10);
    }

    onSelect({ selected }) {
        // console.log('onSelected', selected[0].id);
        this.selectedId = selected[0].id;
    }

}
