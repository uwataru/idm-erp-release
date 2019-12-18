import { Component, Inject, OnInit, ViewChild, ElementRef} from '@angular/core';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DatePipe } from '@angular/common';
import {FormBuilder, FormGroup} from '@angular/forms';
import {AppGlobals} from '../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {LossHandlingService} from './loss-handling.service';
import {UtilsService} from '../../../utils.service';
import {MessageService} from '../../../message.service';
import {Item} from './loss-handling.item';
import {BsDatepickerConfig, BsDatepickerViewMode} from "ngx-bootstrap/datepicker";

declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './loss-handling.component.html',
    styleUrls: ['./loss-handling.component.css'],
    providers: [LossHandlingService]

})
export class LossHandlingComponent implements OnInit {
    tDate = this.globals.tDate;
    gridHeight = this.globals.gridHeight;
    panelTitle: string;
    inputFormTitle: string;
    isEditMode: boolean = false;
    isLoadingProgress: boolean = false;
    listPartners: any[] = this.globals.configs['partnerList'];
   
    searchForm: FormGroup;
    inputForm: FormGroup;

    formData: Item[];
    listData : Item[];
    rows = [];

    selectedId: string;
    product_id: number;
    selected = [];

    errorMessage: string;
    messages = this.globals.datatableMessages;
    addOkMsg = 'LOSS처리가 완료되었습니다.';

    bsConfig: Partial<BsDatepickerConfig> = Object.assign({}, {
        minMode : 'month' as BsDatepickerViewMode,
        dateInputFormat: 'YYYY-MM'
    });

    @ViewChild('InputFormModal') inputFormModal: ModalDirective;


    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private dataService: LossHandlingService,
        private datePipe: DatePipe,
        private globals: AppGlobals,
        private route: ActivatedRoute,
        private utils: UtilsService,
        private messageService: MessageService
    ) {
        this.searchForm = fb.group({
            sch_yearmonth: '',
            sch_partner_name: '',
          });
        this.inputForm = fb.group({
            history_type: '',
            product_id: '',
            input_date: '',
            qty: '',
          });
    }

    ngOnInit() {
        this.panelTitle = '종합재고현황';
        this.inputFormTitle = '정기LOSS처리';
        this.searchForm.controls['sch_yearmonth'].setValue(this.tDate);

        // this.getAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll() {
        this.selected = [];

        let formData = this.searchForm.value;
        // let yearmonth:string = formData.sch_yearmonth.replace(/[^0-9]/g,'');
        // if (yearmonth.length != 6) {
        //     console.log(yearmonth.length);
        //     this.messageService.add('입력된 값이 올바르지 않습니다(6자리 숫자만 가능)');
        //     return false;
        // }
        let params = {
            sch_yearmonth: this.datePipe.transform(formData.sch_yearmonth, 'yyyy-MM'),
            sch_partner_name:  formData.sch_partner_name,
        };
        this.isLoadingProgress = true;

        this.rows = [];
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.rows = listData['data'];
                
                for(let i=0; i<this.rows.length; i++){
                    listData['data'][i].total_qty = (listData['data'][i].transfer_qty + listData['data'][i].production_qty)
                                                    - listData['data'][i].sales_qty - listData['data'][i].defect_qty - listData['data'][i].loss_qty;
                }

              this.isLoadingProgress = false;
            }
        );
    }

    Save(){
        let formModel = this.inputForm.value;
        let formData = {
            input_date: this.datePipe.transform(formModel.input_date, 'yyyy-MM-dd'),
            history_type: 1,
            product_id: parseInt(formModel.product_id),
            qty:parseInt(formModel.qty)
        }
        console.log(formData);
        
        this.Create(formData);
    }

    Create (data): void {
        this.dataService.Create(data)
            .subscribe(
                data => {
                    if (data['result'] == "success") {
                        //this.inputForm.reset();
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

    openModal() {
        this.inputFormModal.show();

        this.inputForm.reset();

        this.inputForm.patchValue({
            input_date: this.tDate,
            product_id: this.product_id,
        });

        console.log(this.inputForm.value);

    }

    convertYearMonth(ym) {
        let yy = ym.substring(0,4);
        let mm = ym.substring(4,6);
        return yy + '-' + mm;
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['name'] == '') {
            this.searchForm.controls['sch_partner_name'].setValue('');
        } else {
            this.searchForm.controls['sch_partner_name'].setValue(event.item['name']);
        }
        this.getAll();
    }

    onSelect({ selected }) {
        this.selectedId = selected[0].id;
        this.product_id = selected[0].product_id;
    }

    onValueChange(value: Date): void {
        // console.log(this.searchForm.controls['sch_yearmonth'].value);
        this.searchForm.controls['sch_yearmonth'].setValue(value);
        this.getAll();
    }

}
