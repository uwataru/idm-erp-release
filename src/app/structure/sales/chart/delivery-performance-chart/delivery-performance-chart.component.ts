import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeliveryPerformanceChartService } from './delivery-performance-chart.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './delivery-performance-chart.item';
import { BaseChartDirective } from 'ng2-charts';
import { BsDatepickerConfig } from "ngx-bootstrap";
import { BsDatepickerViewMode } from "ngx-bootstrap/datepicker";
import { DatePipe } from "@angular/common";

@Component({
    selector: 'app-page',
    templateUrl: './delivery-performance-chart.component.html',
    styleUrls: ['./delivery-performance-chart.component.css'],
    providers: [DeliveryPerformanceChartService]
})
export class DeliveryPerformanceChartComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    PlannedSaleAmount: number;
    planned_sales_amount: number;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    lineChartLabels = [];
    lineChartData: Array<any> = [
        { lineTension: 0, data: [], label: '계획(단위:백만)', pointRadius: 0 },
        { lineTension: 0, data: [], label: '실적(단위:백만)', pointRadius: 0 }
    ];
    selected = [];
    rows = [];
    isEditMode: boolean = false;
    inputForm: FormGroup;
    formData: Item;
    editData: Item;

    yy = 0;
    mm = 0;
    public lineChartOptions: any = {
        responsive: true,
    };
    public lineChartColors: Array<any> = [
        { // grey
            backgroundColor: 'rgba(148,159,177,0.2)',
            borderColor: 'rgba(148,159,177,1)',
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)'
        },
        { // dark grey
            backgroundColor: 'rgba(77,83,96,0.2)',
            borderColor: 'rgba(77,83,96,1)',
            pointBackgroundColor: 'rgba(77,83,96,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(77,83,96,1)'
        }
    ];
    public lineChartLegend: boolean = true;
    public lineChartType: string = 'line';

    errorMessage: string;

    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';

    bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
        minMode: 'month' as BsDatepickerViewMode,
        dateInputFormat: 'YYYY-MM'
    });

    @ViewChild('writeFormClose') writeFormClose: ElementRef;
    @ViewChild(BaseChartDirective) public chart: BaseChartDirective;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: DeliveryPerformanceChartService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private datePipe: DatePipe,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_yearmonth: ''
        });

        this.inputForm = fb.group({
            yearmonth: ['', Validators.required],
            planned_sales_amount: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.panelTitle = '납품실적차트';
        this.inputFormTitle = '월목표 입력';
        this.searchForm.controls['sch_yearmonth'].setValue(this.tDate);
        // this.loadData();
    }

    loadData() {
        this.PlannedSaleAmount = 0;
        this.lineChartLabels = [];
        let formData = this.searchForm.value;
        // let yearmonth:string = formData.sch_yearmonth.replace(/[^0-9]/g,'');
        // if (yearmonth.length != 6) {
        //     console.log(yearmonth.length);
        //     this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
        //     return false;
        // }

        console.log('Sch_yM', this.datePipe.transform(formData.sch_yearmonth, 'yyyyMM'));

        this.yy = parseInt(this.datePipe.transform(formData.sch_yearmonth, 'yyyy'));
        this.mm = parseInt(this.datePipe.transform(formData.sch_yearmonth, 'MM'));
        var lastDay = (new Date(this.yy, this.mm, 0)).getDate();
        console.log('LAST DAY', lastDay);

        for (let i = 0; i <= lastDay; i++) {
            this.lineChartLabels[i] = i;
        }
        let params = {
            sch_yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM'),
        };
        this.isLoadingProgress = true;

        this.dataService.loadData(params).subscribe(
            data => {

                for (let i = 0; i < this.lineChartLabels.length; i++) {
                    this.lineChartData[0].data[i] = 0;
                    this.lineChartData[1].data[i] = 0;
                }

                if (data['totalCount'] > 0 || data['performance_data'] != null) {
                    // this.lineChartLabels = data['labels'];
                    if (data['performance_data'] == null) {
                        this.PlannedSaleAmount = 0;
                    } else {
                        this.PlannedSaleAmount = data['performance_data'].price;
                    }
                    this.rows = data['data'];
                    // console.log(this.rows);
                    // console.log('!!!!!!!' ,this.lineChartLabels.length);
                    // console.log(this.lineChartLabels[0]);

                    for (let i = 0; i < this.lineChartLabels.length; i++) {
                        this.lineChartData[0].data[i] = this.PlannedSaleAmount;
                        this.lineChartData[1].data[i] = 0;
                    }

                    if (this.rows != null) {
                        for (let i = 0; i < this.rows.length; i++) {
                            let tmpPrice = this.rows[i]['input_date'] * 1;
                            this.lineChartData[1].data[tmpPrice] = this.rows[i]['price'];
                        }
                    }
                    // console.log('DATA',this.lineChartData[0].data);
                }

                this.isLoadingProgress = false;
            }
        );
        setTimeout(() => {
            this.chart.chart.update();
        }, 250);
    }

    convertYearMonth(ym) {
        this.yy = ym.substring(0, 4);
        this.mm = ym.substring(4, 6);
        // return yy + '-' + mm;
    }


    Save() {
        let formModel = this.inputForm.value;
        let formData = {
            price: this.utils.removeComma(formModel.planned_sales_amount) * 1,
            input_date: formModel.yearmonth
        };
        console.log(formData);
        this.Create(formData);
    }

    Create(data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.loadData();
                        this.messageService.add(this.addOkMsg);
                    } else {
                        this.messageService.add(data['errorMessage']);
                    }
                    this.closeWriteModal();
                },
                error => this.errorMessage = <any>error
            );
    }

    openModal(method) {
        let formData = this.searchForm.value;
        // let yearmonth:string = formData.sch_yearmonth.replace(/[^0-9]/g,'');
        if (method == 'edit') {
            this.isEditMode = true;
            // this.Edit(this.convertYearMonth(yearmonth));
            this.inputForm.patchValue({
                yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM'),
                planned_sales_amount: this.utils.addComma(this.PlannedSaleAmount * 1000000)
            });
        } else {
            this.isEditMode = false;
            this.inputForm.patchValue({ yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM') });
        }
    }

    private closeWriteModal(): void {
        this.writeFormClose.nativeElement.click();
    }

    // events
    public chartClicked(e: any): void {
        console.log(e);
    }

    public chartHovered(e: any): void {
        console.log(e);
    }

    onValueChange(value: Date): void {
        // console.log(this.searchForm.controls['sch_yearmonth'].value);
        this.searchForm.controls['sch_yearmonth'].setValue(value);
        this.loadData();
    }
}
