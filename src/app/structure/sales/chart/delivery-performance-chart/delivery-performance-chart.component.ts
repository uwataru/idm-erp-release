import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeliveryPerformanceChartService } from './delivery-performance-chart.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { MessageService } from '../../../../message.service';
import { Item } from './delivery-performance-chart.item';

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

    lineChartLabels: Array<any>;
    lineChartData: Array<any> = [
        {lineTension: 0, data:[], label:'계획(단위:백만)', pointRadius:0},
        {lineTension: 0, data:[], label:'실적(단위:백만)', pointRadius:0}
    ];
    selected = [];

    isEditMode: boolean = false;
    inputForm: FormGroup;
    formData: Item;
    editData: Item;

    public lineChartOptions:any = {
        responsive: true,
    };
    public lineChartColors:Array<any> = [
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
    public lineChartLegend:boolean = true;
    public lineChartType:string = 'line';

    errorMessage: string;

    addOkMsg = '등록이 완료되었습니다.';
    editOkMsg = '수정이 완료되었습니다.';

    @ViewChild('writeFormClose') writeFormClose: ElementRef;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: DeliveryPerformanceChartService,
        private globals: AppGlobals,
        private utils: UtilsService,
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
        this.searchForm.controls['sch_yearmonth'].setValue(this.tDate.replace(/[^0-9]/g,'').substring(0,6));
        this.loadData();
    }

    loadData() {
        let formData = this.searchForm.value;
        let yearmonth:string = formData.sch_yearmonth.replace(/[^0-9]/g,'');
        if (yearmonth.length != 6) {
            console.log(yearmonth.length);
            this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
            return false;
        }
        let params = {
            //partner_name: formData.sch_partner_name,
            sch_yearmonth: this.convertYearMonth(yearmonth),
            sortby: ['order_no'],
            order: ['asc'],
            maxResultCount: 10000
        }
        this.isLoadingProgress = true;
        this.dataService.loadData(params).subscribe(
            data => {
                this.lineChartLabels = data['labels'];
                this.PlannedSaleAmount = data['plannedSalesAmount'];

                let i = 0;
                data['rows'].forEach(e => {
                    this.lineChartData[i].data = e;
                    i++;
                });

                this.isLoadingProgress = false;
            }
        );
    }

    convertYearMonth(ym) {
        let yy = ym.substring(0,4);
        let mm = ym.substring(4,6);
        return yy + '-' + mm;
    }

    Edit (id) {
        this.dataService.GetById(id).subscribe(
            editData =>
            {
                if (editData['result'] == "success") {
                    this.editData = editData;
                    this.formData = editData['data'];
                    this.inputForm.patchValue({
                        yearmonth: this.formData.yearmonth,
                        planned_sales_amount: this.utils.addComma(this.formData.planned_sales_amount)
                    });
                }
            }
        );
    }

    Save () {
         let formData = this.inputForm.value;
         formData.planned_sales_amount = this.utils.removeComma(formData.planned_sales_amount) * 1;

         if (this.isEditMode == true) {
             this.Update(formData.yearmonth, formData);
         } else {
             this.Create(formData);
         }
    }

    Create (data): void {
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

    Update (id, data): void {
        this.dataService.Update(id, data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        this.inputForm.reset();
                        this.loadData();
                        this.messageService.add(this.editOkMsg);
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
        let yearmonth:string = formData.sch_yearmonth.replace(/[^0-9]/g,'');
        if (method == 'edit') {
            this.isEditMode = true;
            this.Edit(this.convertYearMonth(yearmonth));
        } else {
            this.isEditMode = false;
            this.inputForm.patchValue({yearmonth: this.convertYearMonth(yearmonth)});
        }
    }

    private closeWriteModal(): void {
        this.writeFormClose.nativeElement.click();
    }

    // events
    public chartClicked(e:any):void {
        console.log(e);
    }

    public chartHovered(e:any):void {
        console.log(e);
    }
}
