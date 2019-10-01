import { Component, EventEmitter, Output, OnInit } from '@angular/core';

@Component({
    selector: 'print-page',
    templateUrl: './production-planning.component.html',
    styleUrls: ['./production-planning.component.css']
})
export class ProductionPlanningPrintComponent implements OnInit {

    panelTitle: string;
    today: number;
    isEditMode: boolean = false;

    constructor() {}

    ngOnInit() {
        this.panelTitle = '생 산 계 획 서';
        this.today = Date.now();
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
