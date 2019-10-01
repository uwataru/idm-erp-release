import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../providers/electron.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

  constructor(private electronService: ElectronService) { }

  ngOnInit() {
  }
  reload(){
    location.reload();
  }
  closeWindow() {
    this.electronService.remote.getCurrentWindow().close();
}
}
