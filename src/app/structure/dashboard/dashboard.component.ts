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
    mainList: any[] = this.globals.configs['main'];
    PlannedSaleAmount: number;
    planned_sales_amount: number;
    isLoadingProgress: boolean = false;
    totalQty=0;
    totalDefectQty=0;
    defectRate=[];
    totalDefectRate=0;

    defect_situation_data = [];
    delivery_situation_data = [];
    product_situation_data = [];
    sales_situation_data = [];
    sales_situation_data2 = [];

    // searchForm: FormGroup;

    lineChartLabels = [1,2,3,4,5,6,7,8,9,10,11,12];
    lineChartData: Array<any> = [
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
        { lineTension: 0, data: [], label: '매출', pointRadius: 3 }
    ];
    lineChartData_2: Array<any> = [
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
        { lineTension: 0, data: [], label: '불량율', pointRadius: 3 },
    ];
    lineChartData_3: Array<any> = [
        { lineTension: 0, data: [], label: '목표', pointRadius: 3 },
        { lineTension: 0, data: [], label: '납품소요기간', pointRadius: 3 },
    ];
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
        //  console.log(this.mainList);
        this.panelTitle = '종합현황판';
        this.targetAttainmentRate = Math.round((this.mainList['sales_expect_price']/this.mainList['sales_target_price'])*100);

        this.defect_situation_data = this.mainList['defect_situation_data'];
        this.delivery_situation_data = this.mainList['delivery_situation_data'];
        this.product_situation_data = this.mainList['product_situation_data'];
        this.sales_situation_data = this.mainList['sales_situation_data'];
        this.sales_situation_data2 = this.mainList['sales_situation_data2'];
        console.log('defect',this.defect_situation_data);
        this.totalData();
        this.loadData();
        this.tDate = this.datePipe.transform(this.tDate, 'yyyy.MM.dd');
    }
    totalData(){
        this.totalQty = 0;
        this.totalDefectQty = 0;
        this.totalDefectRate = 0;
        let sumDefectRate=0;
        for(let i=0;i<this.defect_situation_data.length;i++){
            this.totalQty+=this.defect_situation_data[i].qty;
            this.totalDefectQty+=this.defect_situation_data[i].defect_qty;
            this.defectRate[i] =((this.defect_situation_data[i].defect_qty/this.defect_situation_data[i].qty)*100).toFixed(2);
            sumDefectRate += Number(this.defectRate[i]);
            console.log(sumDefectRate,"sumRate");
        }
        this.totalDefectRate= Number((sumDefectRate/this.defect_situation_data.length).toFixed(2));
    }

    loadData() {
        this.isLoadingProgress = true;


        for (let i = 0; i < this.lineChartLabels.length; i++) {
            this.lineChartData[0].data[i] = this.sales_situation_data2[i].target_price;
            this.lineChartData[1].data[i] = this.sales_situation_data2[i].price;
            this.lineChartData_2[0].data[i] = 1.0;
            this.lineChartData_3[1].data[i] = this.delivery_situation_data[i].required_period;
            this.lineChartData_3[0].data[i] = 30;
        }
        for (let i = 0; i < this.defect_situation_data.length; i++) {
            this.lineChartData_2[1].data[i] = this.defectRate[i];
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
