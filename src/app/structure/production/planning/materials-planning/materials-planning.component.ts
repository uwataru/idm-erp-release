import {Component, Inject, OnInit, ViewChild, ElementRef} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead/typeahead-match.class';
import {DatePipe} from '@angular/common';
import {MaterialsPlanningService} from './materials-planning.service';
import {AppGlobals} from '../../../../app.globals';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import {Item} from './materials-planning.item';

@Component({
    selector: 'app-page',
    templateUrl: './materials-planning.component.html',
    styleUrls: ['./materials-planning.component.css'],
    providers: [MaterialsPlanningService, DatePipe]
})
export class MaterialsPlanningComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    listData: Item[];
    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rows = [];
    temp = [];
    totalQuantity: number;
    totalSalesPrice: number;
    isInitPlanDate: boolean = false;

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
        this.GetAll();
    }

    GetAll(): void {
        document.getElementsByTagName('datatable-body')[0].scrollTop = 1;

        setTimeout(() => {
            let formData = this.searchForm.value.trim();
            let params = {
                order_no: formData.sch_order_no
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

    onSelect({selected}) {
        // console.log('onSelected', selected[0].id);
        this.selectedId = selected[0].id;
    }

}
