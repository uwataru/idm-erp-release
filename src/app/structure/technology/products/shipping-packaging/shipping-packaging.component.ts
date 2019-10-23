import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';



import { ShippingPackagingService } from './shipping-packaging.service';
import { Item } from './shipping-packaging.item';
@Component({
  selector: 'app-shipping-packaging',
  templateUrl: './shipping-packaging.component.html',
  styleUrls: ['./shipping-packaging.component.scss'],
  providers: [ShippingPackagingService]
})
export class ShippingPackagingComponent implements OnInit {

  panelTitle: string;
  inputFormTitle: string;
  isLoadingProgress: boolean = false;

  messages = this.globals.datatableMessages;

  inputForm: FormGroup;

  constructor(
    @Inject(FormBuilder) fb: FormBuilder,
    private globals: AppGlobals,
    private dataService: ShippingPackagingService,
    private route: ActivatedRoute,
    private utils: UtilsService,
    private messageService: MessageService
  ) { 
    this.inputForm = fb.group({
      sp_date: ['', Validators.required],
      partner_code: ['', Validators.required],
      partner_name: ['', Validators.required],
      product_code: ['', Validators.required],
      product_name: ['', Validators.required],
      order_no: ['', Validators.required],
      qty: '',
      product_price: ['', Validators.required],
      price: '',
      type: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.panelTitle = '출하/포장관리';
  }

}
