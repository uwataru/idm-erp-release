import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AppGlobals} from '../../../../app.globals';
import {ActivatedRoute} from '@angular/router';
import {UtilsService} from '../../../../utils.service';
import {MessageService} from '../../../../message.service';



import { ShippingPackagingService } from './shipping-packaging.service';

@Component({
  selector: 'app-shipping-packaging',
  templateUrl: './shipping-packaging.component.html',
  styleUrls: ['./shipping-packaging.component.scss'],
  providers: [ShippingPackagingService]
})
export class ShippingPackagingComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
