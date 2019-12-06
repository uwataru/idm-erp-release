import { Component, EventEmitter, Output, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder,FormGroup, Validators } from '@angular/forms';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
import { saveAs as importedSaveAs } from "file-saver";
import { DatePipe } from '@angular/common';
import { MaterialsInOutService } from './materials-in-out.service';
import { AppGlobals } from '../../../../app.globals';
import { UtilsService } from '../../../../utils.service';
import { ElectronService} from '../../../../providers/electron.service';
import { MessageService } from '../../../../message.service';
import { Item } from './materials-in-out.item';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './materials-in-out.component.html',
    styleUrls: ['./materials-in-out.component.css'],
    providers: [MaterialsInOutService, DatePipe],
    encapsulation: ViewEncapsulation.None

})
export class MaterialsInOutComponent implements OnInit {

    tDate = this.globals.tDate;
    panelTitle: string;
    inputFormTitle: string;
    searchForm: FormGroup;
    historyForm: FormGroup;
    
    isEditMode: boolean = false;
    isLoadingProgress: boolean = false;
    
    formData: Item[];
    searchValue: string;
    rows: Item['rowData'][];
    temp = [];
    listSltdPaCode: number = 0;
    listPartners: any[] = this.globals.configs['partnerList'];
    listMaterials: any[] = this.globals.configs['schMaterials'];


    totalBalance: number;
    totalBalanceAmount: number;

    totalOrderAmount: number;
    totalRcvWeight: number;
    totalUsedWeight: number;
    totalUsedAmount: number;
    totalWeight: number;
    totalRemaingAmount: number;

    detail_sch_sdate: string;
    detail_sch_edate: string;

    messages = this.globals.datatableMessages;

    errorMessage: string;

    constructor(
        private fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: MaterialsInOutService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public electronService: ElectronService
    ) {
        this.historyForm = fb.group({
            sch_maker_name: '',
            sch_partner_name: ''
        });

        this.searchForm = fb.group({
            sch_sdate: '',
            sch_edate: '',
            sch_material: '',
            sch_size: '',
            sch_partner_name: '',
        });

        // if( this.listPartners.filter(v => v.Code == 0).length < 1 ) {
        //     this.listPartners.unshift({Code:0, Name:'전체', name:'전체'});
        // }
    }

    ngOnInit() {
        this.panelTitle = '원자재수불명세서';
        // this.inputFormTitle = '원자재수불내역서';

        this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
        this.searchForm.controls['sch_edate'].setValue(this.tDate);
        this.getAll();

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
    }

    getAll(): void {
        let formData = this.searchForm.value;

        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            sch_material: formData.sch_material,
            sch_size: formData.sch_size,
            sch_partner_name: formData.sch_partner_name,
            // sortby: ['rcv_date'],
            // order: ['asc'],
            // maxResultCount: 10000
        }
        this.isLoadingProgress = true;

        this.dataService.GetAll(params).subscribe(
            data =>
            {
                this.rows = data['data'];
                this.temp = data['data'];

                let len = this.rows.length;
                for(let i=0; i<len; i++){
                    this.rows[i].remain_qty = this.rows[i].transfer_qty + this.rows[i].receiving_qty - this.rows[i].insert_qty - this.rows[i].output_qty;
                }

                // this.totalBalance = data['totalBalance'];
                // this.totalBalanceAmount = data['totalBalanceAmount'];
                //
                // this.totalOrderAmount = data['totalOrderAmount'];
                // this.totalRcvWeight = data['totalRcvWeight'];
                // this.totalUsedWeight = data['totalUsedWeight'];
                // this.totalUsedAmount = data['totalUsedAmount'];
                // this.totalWeight = data['totalWeight'];
                // this.totalRemaingAmount = data['totalRemaingAmount'];
                
                this.isLoadingProgress = false;
            }
        );
    }

    onSelectListPartner(event: TypeaheadMatch): void {
        if (event.item['id'] == '') {
            this.listSltdPaCode = 0;
        } else {
            this.listSltdPaCode = event.item['id'];
        }

        const val = this.listSltdPaCode;
    }

    updateFilterSize(event) {
        const val = event.target.value;
        // filter data
        let tempArr = this.temp.map(x => Object.assign({}, x));
        let temp = tempArr.filter(function (d) {
            return d.size.indexOf(val) !== -1 || !val;
        });

        this.rows = temp;
    }
}
