import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ForgingWorkAllocationService } from './forging-work-allocation.service';
import { Item } from './forging-work-allocation.item';

@Component({
    selector: 'print-page',
    templateUrl: './forging-work-allocation.component.html',
    styleUrls: ['./forging-work-allocation.component.css'],
    providers: [ForgingWorkAllocationService]
})
export class ForgingWorkAllocationPrintComponent implements OnInit {

    panelTitle: string;
    today: number;
    isEditMode: boolean = false;

    listData : Item[];
    rows = [];
    orderTime: string;

    constructor(
        private activatedRoute: ActivatedRoute,
        private dataService: ForgingWorkAllocationService
    ) {}

    ngOnInit() {
        this.panelTitle = '단 조 작 업 지 시 서';
        this.today = Date.now();

        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['id']) {
                this.dataService.GetById(params['id']).subscribe(
                    listData =>
                    {
                        if (listData['result'] == "success") {
                            this.orderTime = listData['order_time'];
                            this.rows = listData['data'];
                        }
                    }
                );
            }
        })
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
