import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { AppGlobals } from '../../../app.globals';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../../config.service';
import { DatePipe } from '@angular/common';
import { MessageService } from '../../../message.service';

import { Item } from './personnel-management.item';
import { PersonnelManagementService } from './personnel-management.service';
import {UtilsService} from "../../../utils.service";
import {ElectronService} from "../../../providers/electron.service";

declare var $: any;

@Component({
  selector: 'app-personnel-management',
  templateUrl: './personnel-management.component.html',
  styleUrls: ['./personnel-management.component.scss'],
  providers: [PersonnelManagementService]
})
export class PersonnelManagementComponent implements OnInit {
  panelTitle: string;

  isLoadingProgress: boolean = false;
  selectedId: string;
  listData : Item[];
  gridHeight = this.globals.gridHeight;
  messages = this.globals.datatableMessages;

  selectedCnt: number;
  editData: Item;
  formData: Item['data'];
  rows = [];
  temp = [];
  delId = [];
  selected = [];
  searchForm: FormGroup;
  tDate = this.globals.tDate;

  errorMessage: string;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private datePipe: DatePipe,
    private dataService: PersonnelManagementService,
    private globals: AppGlobals,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private utils: UtilsService,
    public elSrv: ElectronService
  ) {
      this.searchForm = fb.group({
          sch_sdate: '',
          sch_edate: '',
          sch_worker_name: ''
      });
   }

  ngOnInit() {
    this.panelTitle = '생산인력투입기록';
    this.getAll();

    this.searchForm.controls['sch_sdate'].setValue(this.utils.getFirstDate(this.tDate));
    this.searchForm.controls['sch_edate'].setValue(this.tDate);

    $(document).ready(function(){
        let modalContent: any = $('.modal-content');
        let modalHeader = $('.modal-header');
        modalHeader.addClass('cursor-all-scroll');
        modalContent.draggable({
            handle: '.modal-header'
        });
    });
  }

  onSelect({ selected }) {
    // console.log('Select Event', selected, this.selected);

    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
}

    getAll(): void {
        let formData = this.searchForm.value;

        this.selectedId = '';
        this.selected = [];

        let params = {
            sch_sdate: this.datePipe.transform(formData.sch_sdate, 'yyyy-MM-dd'),
            sch_edate: this.datePipe.transform(formData.sch_edate, 'yyyy-MM-dd'),
            maxResultCount: 1000
        };
        this.isLoadingProgress = true;
        this.dataService.GetAll(params).subscribe(
            listData =>
            {
                this.listData = listData;
                this.temp = listData['data'];
                this.rows = listData['data'];

                this.isLoadingProgress = false;
            }
        );
    }

    updateFilter(event) {
        // let partner_code = this.listSltdPaCode;
        const val = event.target.value;
        // filter data
        const temp = this.temp.filter(function (d) {
            // console.log(d);
            return (d.personnel_name!=null &&  d.personnel_name.indexOf(val) !== -1) || !val;
        });

        // update the rows
        this.rows = temp;
    }

    totalWorkTime(){
        let totalVal = 0;
        for(let i in this.rows){
            totalVal += parseInt(this.rows[i].work_time);
        }
        return this.utils.addComma(totalVal);
    }
}
