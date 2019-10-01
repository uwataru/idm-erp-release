import { Component, OnInit } from '@angular/core';
import { AppGlobals } from '../../app.globals';
import { ConfigService } from '../../config.service';
import { MessageService } from '../../message.service';

@Component({
    selector: 'app-page',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    providers: []
})

export class DashboardComponent implements OnInit {
    panelTitle: string;
    errorMessage: string;

    constructor(        
        private globals: AppGlobals
    ) {
    }

    ngOnInit() {
        this.panelTitle = '메인화면';
    }

}
