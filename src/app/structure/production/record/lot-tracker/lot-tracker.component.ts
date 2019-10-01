import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { LotTrackerService } from './lot-tracker.service';
import { Item } from './lot-tracker.item';

@Component({
    selector: 'app-page',
    templateUrl: './lot-tracker.component.html',
    styleUrls: ['./lot-tracker.component.css'],
    providers: [LotTrackerService]
})
export class LotTrackerComponent implements OnInit {

    panelTitle: string;
    rows: Item[];
    selected = [];

    constructor(private dataService: LotTrackerService) {}

    ngOnInit() {
        this.panelTitle = 'LOT추적표';

        this.loadData();
    }

    loadData(): void {
        this.dataService.loadData().subscribe(data => this.rows = data);
    }
}
