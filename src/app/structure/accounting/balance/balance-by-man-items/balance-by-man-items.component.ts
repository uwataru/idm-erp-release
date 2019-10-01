import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { AccountManItemsService } from './account-man-items.service';
import { BalanceByManItemsService } from './balance-by-man-items.service';
import { MessageService } from '../../../../message.service';
import { ManItemsItem } from './account-man-items.item';
import { SumItem } from './balance-by-man-items.item';
import { AppGlobals } from '../../../../app.globals';

@Component({
    selector: 'app-page',
    templateUrl: './balance-by-man-items.component.html',
    styleUrls: ['./balance-by-man-items.component.css'],
    providers: [AccountManItemsService, BalanceByManItemsService]
})
export class BalanceByManItemsComponent implements OnInit {

    panelTitle: string;
    inputFormTitle: string;
    deleteFormTitle: string;
    isEditMode: boolean = false;
    manItemsRows: ManItemsItem[];
    sumRows: SumItem[];
    selected = [];

    gridHeight = this.globals.gridHeight - 140;
    messages = this.globals.datatableMessages;

    constructor(
        private manItemsDataService: AccountManItemsService,
        private sumDataService: BalanceByManItemsService,
        private globals: AppGlobals,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.panelTitle = '관리내역별 잔액';

        this.loadData();
    }

    loadData(): void {
        this.manItemsDataService.loadData().subscribe(data => this.manItemsRows = data);
        this.sumDataService.loadData().subscribe(data => this.sumRows = data);
    }

    openModal(id:string) {
        if (id)
        {
            this.isEditMode = true;
        }
        else
        {
            this.isEditMode = false;
        }
    }
}
