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
        { lineTension: 0, data: [], label: '목표(단위:백만)', pointRadius: 3 },
        { lineTension: 0, data: [], label: '매출(단위:백만)', pointRadius: 3 }
    ];
    lineChartData_2: Array<any> = [
        { lineTension: 0, data: [], label: '불량율', pointRadius: 3 },
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
    ];
    lineChartData_3: Array<any> = [
        { lineTension: 0, data: [], label: '납품소요기간', pointRadius: 3 },
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
    ];
    salesTargetChartData = [0,25000000,50000000,75000000,100000000,1250000000,1500000000,1750000000,2000000000,2250000000,2500000000,2750000000,3000000000];
    salesChartData = [0,27170000,27720000,75000000,96946666,121183333,145420000,169656666,193893333,218130000,242366666,266603333,290840000];
    salesRealData = [27170000,550000,44990000]
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
        this.panelTitle = '메인화면';
        this.salesTarget = 300000000;
        this.expectedSales = 290840000;
        this.targetAttainmentRate = 97;

        this.loadData();
    }

    loadData() {
        this.isLoadingProgress = true;


        for (let i = 0; i < this.lineChartLabels.length; i++) {
            this.lineChartData[0].data[i] = this.salesTargetChartData[i];
            this.lineChartData[1].data[i] = this.salesChartData[i];
            this.lineChartData_2[0].data[i] = this.defectData[i];
            this.lineChartData_2[1].data[i] = 0.01;
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
