import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';

import { ReturnService } from './return.service';
import { Item } from './return.item';


@Component({
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrls: ['./return.component.scss'],
  providers: [ReturnService]

})
export class ReturnComponent implements OnInit {

  panelTitle: string;
  inputFormTitle: string;
  isLoadingProgress: boolean = false;

  messages = this.globals.datatableMessages;

  inputForm: FormGroup;



  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private globals: AppGlobals,
    private dataService: ReturnService,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) {
    this.inputForm = fb.group({
      return_date: ['', Validators.required],
      partner_code: ['', Validators.required],
      partner_name: ['', Validators.required],
      product_code: ['', Validators.required],
      product_name: ['', Validators.required],
      return_reason: ['', Validators.required],
      other_reason: ['', Validators.required],
      return_qty: '',
      product_price: ['', Validators.required],
      price: '',
    });
   }

  ngOnInit() {
    this.panelTitle = '반품관리'
  }

}
