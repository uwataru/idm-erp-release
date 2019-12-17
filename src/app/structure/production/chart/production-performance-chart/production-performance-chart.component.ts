import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProductionPerformanceChartService} from './production-performance-chart.service';
import {AppGlobals} from '../../../../app.globals';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';
import { BaseChartDirective } from 'ng2-charts';
import {Item} from './production-performance-chart.item';

@Component({
  selector: 'app-page',
  templateUrl: './production-performance-chart.component.html',
  styleUrls: ['./production-performance-chart.component.css'],
  providers: [ProductionPerformanceChartService]
})
export class ProductionPerformanceChartComponent implements OnInit {
  tDate = this.globals.tDate;
  panelTitle: string;
  inputFormTitle: string;
  targetProductionQty: number;
  targetProductionAmount: number;
  isLoadingProgress: boolean = false;

  searchForm: FormGroup;

  lineChartLabels = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
  lineChartData: Array<any> = [
    {lineTension: 0, data: [], label: '계획(단위:백만)', pointRadius: 0},
    {lineTension: 0, data: [], label: '실적(단위:백만)', pointRadius: 0}
  ];
  selected = [];
  rows = [];

  isEditMode: boolean = false;
  inputForm: FormGroup;
  formData: Item;
  editData: Item;


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

  @ViewChild('writeFormClose') writeFormClose: ElementRef;
  @ViewChild(BaseChartDirective) public chart: BaseChartDirective;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private dataService: ProductionPerformanceChartService,
    private globals: AppGlobals,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    this.searchForm = fb.group({
      sch_yearmonth: '',
      sch_type: ''
    });

    this.inputForm = fb.group({
      yearmonth: ['', Validators.required],
      target_production_qty: ['', Validators.required],
      target_production_amount: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.targetProductionAmount = 0;
    this.targetProductionQty = 0;
    this.panelTitle = '생산실적차트';
    this.inputFormTitle = '월목표 입력';
    this.searchForm.controls['sch_yearmonth'].setValue(this.tDate.replace(/[^0-9]/g, '').substring(0, 6));
    this.searchForm.controls['sch_type'].setValue('Qty');
    
    this.loadData();
  }

  loadData() {
    
    this.targetProductionAmount = 0;
    this.targetProductionQty = 0;
    let formData = this.searchForm.value;
    let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    if (yearmonth.length != 6) {
      console.log(yearmonth.length);
      this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
      return false;
    }
    

    switch (formData.sch_type) {
      case 'Qty':
        this.lineChartData = [
          {lineTension: 0, data: [], label: '계획(단위:개)', pointRadius: 0},
          {lineTension: 0, data: [], label: '실적(단위:개)', pointRadius: 0}
        ];

        let params_qty = {
          sch_yearmonth: this.convertYearMonth(yearmonth),
          // sch_type: formData.sch_type,
        };
          this.isLoadingProgress = true;
          this.dataService.loadData(params_qty).subscribe(
            data => {
                for (let i=0; i<this.lineChartLabels.length; i++){
                    this.lineChartData[0].data[i] = 0;
                    this.lineChartData[1].data[i] = 0;
                }
              
                if(data['totalCount']>0 || data['performance_data'] != null){
                    // this.lineChartLabels = data['labels'];
                    if(data['performance_data'] == null){
                        this.targetProductionAmount = 0;
                        this.targetProductionQty = 0;
                    }else{
                        this.targetProductionQty = data['performance_data'].qty;
                        this.targetProductionAmount = data['performance_data'].price;
                    }
                    this.rows = data['data'];
                    console.log(this.rows);
                    console.log('!!!!!!!' ,this.lineChartLabels.length);
                    console.log(this.lineChartLabels[0]);
                  
                  
                    for (let i=0; i<this.lineChartLabels.length; i++){
                        this.lineChartData[0].data[i] = this.targetProductionQty;
                        this.lineChartData[1].data[i] = 0;
                    } 
                  
                    if(this.rows != null){
                        for (let i=0; i<this.rows.length; i++){
                            let tmpPrice = Number(this.rows[i]['input_date']) * 1;
                            this.lineChartData[1].data[tmpPrice] = this.rows[i]['qty'];
                        } 
                    }
                  
                        console.log('DATA',this.lineChartData[0].data);
                }
              
              
                this.isLoadingProgress = false;
            }

          );

        break;
      
      
        case 'Amount':
          this.lineChartData = [
            {lineTension: 0, data: [], label: '계획(단위:백만)', pointRadius: 0},
            {lineTension: 0, data: [], label: '실적(단위:백만)', pointRadius: 0}
          ];

          let params = {
            sch_yearmonth: this.convertYearMonth(yearmonth),
            // sch_type: formData.sch_type,
          };
          this.isLoadingProgress = true;
          this.dataService.loadData(params).subscribe(
            data => {
                for (let i=0; i<this.lineChartLabels.length; i++){
                    this.lineChartData[0].data[i] = 0;
                    this.lineChartData[1].data[i] = 0;
                }
              
                if(data['totalCount']>0 || data['performance_data'] != null){
                    // this.lineChartLabels = data['labels'];
                    if(data['performance_data'] == null){
                        this.targetProductionAmount = 0;
                        this.targetProductionQty = 0;
                    }else{
                        this.targetProductionQty = data['performance_data'].qty;
                        this.targetProductionAmount = data['performance_data'].price;
                    }
                    this.rows = data['data'];
                    console.log(this.rows);
                    console.log('!!!!!!!' ,this.lineChartLabels.length);
                    console.log(this.lineChartLabels[0]);
                  
                  
                    for (let i=0; i<this.lineChartLabels.length; i++){
                        this.lineChartData[0].data[i] = this.targetProductionAmount;
                        this.lineChartData[1].data[i] = 0;
                    } 
                  
                    if(this.rows != null){
                        for (let i=0; i<this.rows.length; i++){
                            let tmpPrice = Number(this.rows[i]['input_date']) * 1;
                            this.lineChartData[1].data[tmpPrice] = this.rows[i]['price'];
                        } 
                    }
                  
                        console.log('DATA',this.lineChartData[0].data);
                }
              
              
                this.isLoadingProgress = false;
            }
          
          );

        break;
    }

  setTimeout(() => {
      this.chart.chart.update();
  }, 250);
  }

  changeData(Case) {
    console.log(Case);
    this.searchForm.controls['sch_type'].setValue(Case);
    this.loadData();
  }

  convertYearMonth(ym) {
    let yy = ym.substring(0, 4);
    let mm = ym.substring(4, 6);
    return yy + '-' + mm;
  }


  Save () {
    let formModel = this.inputForm.value;
    let formData = {
       price: this.utils.removeComma(formModel.target_production_amount) * 1,
       qty: this.utils.removeComma(formModel.target_production_qty) * 1,
       input_date: formModel.yearmonth
    }
   console.log(formData);
   this.Create(formData);
}

  Create(data): void {
    this.dataService.Create(data)
      .subscribe(
        data => {
          if (data['result'] == 'success') {
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
    let yearmonth: string = formData.sch_yearmonth.replace(/[^0-9]/g, '');
    if (method == 'edit') {
      this.isEditMode = true;
      // this.Edit(this.convertYearMonth(yearmonth));
      this.inputForm.patchValue({
        yearmonth: this.convertYearMonth(yearmonth),
        target_production_qty: this.utils.addComma(this.targetProductionQty),
        target_production_amount: this.utils.addComma(this.targetProductionAmount*1000000)
    });

    } else {
      this.isEditMode = false;
      this.inputForm.patchValue({yearmonth: this.convertYearMonth(yearmonth)});
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
}
