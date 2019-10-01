import { Component, OnInit } from '@angular/core';
declare var $: any;

@Component({
    selector: 'app-page',
    templateUrl: './loss-handling.component.html',
    styleUrls: ['./loss-handling.component.css']
})
export class LossHandlingComponent implements OnInit {

    panelTitle: string;
    modalTitle: string;
    isEditMode: boolean = false;

    constructor() {}

    ngOnInit() {
        this.panelTitle = '종합재고현황';
        this.modalTitle = '정기LOSS처리';

        $(document).ready(function(){
            let modalContent: any = $('.modal-content');
            let modalHeader = $('.modal-header');
            modalHeader.addClass('cursor-all-scroll');
            modalContent.draggable({
                handle: '.modal-header'
            });
        });
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
