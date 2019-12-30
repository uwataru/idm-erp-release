import {Component, EventEmitter, Output, OnInit, Inject} from '@angular/core';
import { LotTrackerService } from './lot-tracker.service';
import { Item } from './lot-tracker.item';
import {FormBuilder, FormGroup} from "@angular/forms";
import {DatePipe} from "@angular/common";
import {AppGlobals} from "../../../../app.globals";
import {UtilsService} from "../../../../utils.service";
import {MessageService} from "../../../../message.service";
import {ElectronService} from "../../../../providers/electron.service";

@Component({
    selector: 'app-page',
    templateUrl: './lot-tracker.component.html',
    styleUrls: ['./lot-tracker.component.css'],
    providers: [LotTrackerService]
})
export class LotTrackerComponent implements OnInit {
    tDate = this.globals.tDate;
    gridHeight = (this.globals.gridHeight - 50) / 3;
    panelTitle: string;
    isLoadingProgress: boolean = false;

    searchForm: FormGroup;

    formData: Item['data'];
    productionLines: any[] = this.globals.configs['productionLine'];
    rowsSales = [];
    rowsDelivery = [];
    rowsMaterial = [];
    selected = [];

    messages = this.globals.datatableMessages;

    errorMessage: string;

    constructor(
        @Inject(FormBuilder) fb: FormBuilder,
        private datePipe: DatePipe,
        private dataService: LotTrackerService,
        private globals: AppGlobals,
        private utils: UtilsService,
        private messageService: MessageService,
        public elSrv: ElectronService
    ) {
        this.searchForm = fb.group({
            sch_order_no: '',
        });
    }

    ngOnInit() {
        this.panelTitle = 'LOT추적표';

        this.getAll();
    }

    getAll() {
        let formData = this.searchForm.value;
        if (!formData.sch_order_no) {
            this.messageService.add('수주번호를 입력해주세요!');
            return false;
        }

        let params = {
            order_no: formData.sch_order_no.trim(),
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.rowsSales = listData['salesData'];
                this.rowsDelivery = listData['deliveryData'];
                this.rowsMaterial = listData['materialData'];

                this.isLoadingProgress = false;
            }
        );
    }

    totalSale(){
        let totalVal = 0;
        for(let i in this.rowsSales){
            totalVal += parseInt(this.rowsSales[i].qty);
        }
        return totalVal;
    }

    totalDelivery(){
        let totalVal = 0;
        for(let i in this.rowsDelivery){
            totalVal += parseInt(this.rowsDelivery[i].qty);
        }
        return totalVal;
    }

    totalMaterial(key){
        let totalVal = 0;
        for(let i in this.rowsMaterial){
            switch (key) {
                case 'qty':
                    totalVal += parseInt(this.rowsMaterial[i].qty);
                    break;
                case 'insert_qty':
                    totalVal += parseInt(this.rowsMaterial[i].insert_qty);
                    break;
                case 'remaining_qty':
                    totalVal += parseInt(this.rowsMaterial[i].remaining_qty);
                    break;
            }

        }
        return totalVal;
    }
}
