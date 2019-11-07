import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';

@Component({
    selector: 'app-layout',
    templateUrl: './auth-layout.component.html',
    styleUrls: ['./auth-layout.component.scss']
})

export class AuthLayoutComponent implements OnInit {

    constructor(private electronService: ElectronService) {}

    ngOnInit() {}

    closeWindow() {
        this.electronService.exitApp();
    }

}
