import { Component, Inject, OnInit } from '@angular/core';
import { TypeaheadMatch } from 'ngx-bootstrap/typeahead/typeahead-match.class';
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

  inputPartners: any[] = this.globals.configs['type4Partners'];


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

  Save() {
    // 실행권한
    // if (this.isExecutable == false) {
    //   alert(this.globals.isNotExecutable);
    //   return false;
    // }

    let formData = this.inputForm.value;
    // if (formData.inventory_classification == 3 && !formData.outs_partner_code) {
    //   alert('거래처를 선택해주세요!');
    //   return false;
    // }

    // formData.inventory_classification = formData.inventory_classification * 1;
    // formData.inspection_date = this.datePipe.transform(formData.inspection_date, 'yyyy-MM-dd');
    // formData.input_date = this.datePipe.transform(formData.input_date, 'yyyy-MM-dd');

    this.Create(formData);
  }

  Reset() {
    this.inputForm.reset();
    // this.inputForm.controls['input_date'].setValue(this.tDate);
  }

  Create(data): void {
    // this.dataService.Create(data)
    //   .subscribe(
    //     data => {
    //       if (data['result'] == 'success') {
    //         this.Reset();
    //         //this.getAll();
    //         this.messageService.add(this.addOkMsg);
    //       } else {
    //         this.messageService.add(data['errorMessage']);
    //       }
    //     },
    //     error => this.errorMessage = <any>error
    //   );
  }

  onSelectInputPartner(event: TypeaheadMatch): void {
    if (event.item == '') {
        this.inputForm.controls['outs_partner_code'].setValue(0);
    } else {
        this.inputForm.controls['outs_partner_code'].setValue(event.item.Code);
    }
}

  // loadInfo(event) {
  //   let OrderNo = event.target.value;
  //   if (!OrderNo) {
  //     return false;
  //   }

  //   // 내용
  //   this.dataService.GetById(OrderNo).subscribe(
  //     editData => {
  //       if (editData['result'] == 'success') {
  //         this.editData = editData;
  //         this.formData = editData['data'];

  //         this.screeningQty = editData['screeningQty'] * 1;
  //         console.log(this.formData.normal_qty);
  //         this.inputForm.patchValue({
  //           order_no: OrderNo,
  //           production_date: this.formData.input_date,
  //           product_name: this.formData.product_name,
  //           product_code: this.formData.product_code,
  //           production_qty: this.formData.screening_qty,
  //           normal_qty: this.formData.normal_qty,
  //           defective_qty: this.formData.defective_qty,
  //           defective_classification: this.formData.defective_classification
  //         });
  //       }
  //     }
  //   );
  // }

}
