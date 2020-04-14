import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { AppGlobals } from '../../app.globals';
import { ConfigService } from '../../config.service';
import { MessageService } from '../../message.service';
import { UtilsService } from '../../utils.service';
import { DatePipe } from '@angular/common';
// import { FormBuilder } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { BsDatepickerConfig } from "ngx-bootstrap";
import { BsDatepickerViewMode } from "ngx-bootstrap/datepicker";

@Component({
    selector: 'app-page',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    providers: []
})

export class DashboardComponent implements OnInit {
    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    PlannedSaleAmount: number;
    planned_sales_amount: number;
    isLoadingProgress: boolean = false;

    // searchForm: FormGroup;

    lineChartLabels = [0,1,2,3,4,5,6,7,8,9,10,11,12];
    lineChartData: Array<any> = [
        { lineTension: 0, data: [], label: '목표(단위:천원)', pointRadius: 3 },
        { lineTension: 0, data: [], label: '매출(단위:천원)', pointRadius: 3 }
    ];
    lineChartData_2: Array<any> = [
        { lineTension: 0, data: [], label: '불량율', pointRadius: 3 },
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
    ];
    lineChartData_3: Array<any> = [
        { lineTension: 0, data: [], label: '납품소요기간', pointRadius: 3 },
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
    ];
    salesTargetChartData = [0,25000,50000,75000,100000,125000,150000,175000,200000,225000,250000,275000,300000];
    salesChartData = [0,27170,27720,72710,96947,121183,145420,169657,193893,218130,242367,266603,290840];
    salesRealData = [27170,550,44990]
    // salesTargetData = [27170000,550000,44990000]
    defectData = [0,2.02,2.01,1.09];
    necessaryPeriodData = [0,43,20,26];
    selected = [];
    rows = [];
    isEditMode: boolean = false;
    // inputForm: FormGroup;
    // formData: Item;
    // editData: Item;

    salesTarget:number;
    expectedSales:number;
    targetAttainmentRate:number;

    yy = 0;
    mm = 0;
    public lineChartOptions: any = {
        responsive: true,
    };
    public lineChartColors: Array<any> = [
        { // grey
            backgroundColor: 'rgba(255,0,0,0.2)',
            borderColor: 'rgba(255,0,0,1)',
            pointBackgroundColor: 'rgba(255,0,0,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255,0,0,0.8)'
        },
        { // dark grey
            backgroundColor: 'rgba(0,0,255,0.2)',
            borderColor: 'rgba(0,0,255,1)',
            pointBackgroundColor: 'rgba(0,0,255,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(0,0,255,0.8)'
        }
    ];
    public lineChartLegend: boolean = true;
    public lineChartType: string = 'line';

    errorMessage: string;

    @ViewChild(BaseChartDirective) public chart: BaseChartDirective;
    constructor(        
        // @Inject(FormBuilder) fb: FormBuilder,
        private globals: AppGlobals,
        private utils: UtilsService,
        private datePipe: DatePipe,
        private messageService: MessageService
    ) {
    }

    ngOnInit() {
        this.panelTitle = '종합현황판';
        this.salesTarget = 300000;
        this.expectedSales = 290840;
        this.targetAttainmentRate = 97;

        this.loadData();
        this.tDate = this.datePipe.transform(this.tDate, 'yyyy.MM.dd');
    }

    loadData() {
        this.isLoadingProgress = true;


        for (let i = 0; i < this.lineChartLabels.length; i++) {
            this.lineChartData[0].data[i] = this.salesTargetChartData[i];
            this.lineChartData[1].data[i] = this.salesChartData[i];
            this.lineChartData_2[0].data[i] = this.defectData[i];
            this.lineChartData_2[1].data[i] = 1.0;
            this.lineChartData_3[0].data[i] = this.necessaryPeriodData[i];
            this.lineChartData_3[1].data[i] = 30;
        }

        setTimeout(() => {
            this.chart.chart.update();
        }, 250);
    }


    public chartClicked(e: any): void {
        console.log(e);
    }

    public chartHovered(e: any): void {
        console.log(e);
    }

}
