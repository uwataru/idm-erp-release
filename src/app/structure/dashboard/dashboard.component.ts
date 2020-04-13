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
        { lineTension: 0, data: [], label: '불량율', pointRadius: 3 }
    ];
    lineChartData_3: Array<any> = [
        { lineTension: 0, data: [], label: '불량율', pointRadius: 3 }
    ];
    salesChartData = [0,200000,400000,600000,800000,1000000,1200000,1400000,1600000,1800000,2000000,2200000,2400000];
    salesData = [0,200000,400000,600000,800000,1000000,1200000,1400000,1600000,1800000,2000000,2200000,2400000];
    defectData = [0,0.33,0.50,0.33];
    necessaryPeriodData = [0,28,26,24];
    selected = [];
    rows = [];
    isEditMode: boolean = false;
    // inputForm: FormGroup;
    // formData: Item;
    // editData: Item;

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

        this.loadData();
    }

    loadData() {
        this.isLoadingProgress = true;


        for (let i = 0; i < this.lineChartLabels.length; i++) {
            this.lineChartData[0].data[i] = this.salesChartData[i];
            this.lineChartData[1].data[i] = this.salesData[i];
            this.lineChartData_2[0].data[i] = this.defectData[i];
            this.lineChartData_3[0].data[i] = this.necessaryPeriodData[i];
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
