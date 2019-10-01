import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { CuttingWorkAllocationService } from './cutting-work-allocation.service';
import { Item } from './cutting-work-allocation.item';

@Component({
    selector: 'print-page',
    templateUrl: './cutting-work-allocation.component.html',
    styleUrls: ['./cutting-work-allocation.component.css'],
    providers: [CuttingWorkAllocationService]
})
export class CuttingWorkAllocationPrintComponent implements OnInit {

    panelTitle: string;
    today: number;
    isEditMode: boolean = false;

    title = 'app';
    elementType = 'svg';
    cuttingValue = 'C2016120301';
    forgingValue = 'P2016120301';
    format = 'CODE39';
    lineColor = '#000000';
    width = 1;
    height = 50;
    displayValue = true;
    fontOptions = '';
    font = 'monospace';
    textAlign = 'center';
    textPosition = 'bottom';
    textMargin = 2;
    fontSize = 14;
    background = '#ffffff';
    margin = 0;
    marginTop = 0;
    marginBottom = 0;
    marginLeft = 0;
    marginRight = 0;

    data = Item['data'];

    constructor(
        private activatedRoute: ActivatedRoute,
        private dataService: CuttingWorkAllocationService
    ) {}

    ngOnInit() {
        this.panelTitle = '절 단 작 업 지 시 서';
        this.today = Date.now();

        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['id']) {
                this.dataService.GetById(params['id']).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            this.data = editData['data'];
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
