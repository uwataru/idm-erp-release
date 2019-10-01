import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SalesOrderDInvoiceService } from './invoice.service';

@Component({
    selector: 'print-page',
    templateUrl: './invoice.component.html',
    styleUrls: ['./invoice.component.css'],
    providers: [SalesOrderDInvoiceService]
})
export class SalesOrderDInvoicePrintComponent implements OnInit {

    panel1Title: string;
    panel2Title: string;
    isEditMode: boolean = false;
    invoiceNo: number;
    orderNo: string;
    pocNo: string;
    productType: string;
    drawingNo: string;
    productName: string;
    productPrice: number;
    deliveryPrice: number;
    deliveryQty: number;

    partnerName: string;
    partnerBizNo: string;
    partnerCeo: string;
    partnerAddr: string;

    constructor(
        private activatedRoute: ActivatedRoute,
        private dataService: SalesOrderDInvoiceService,
    ) {}

    ngOnInit() {
        this.panel1Title = '거 래 명 세 서 (공급자용)';
        this.panel2Title = '거 래 명 세 서 (공급받는자용)';

        this.activatedRoute.queryParams.subscribe((params: Params) => {
            if (params['id']) {
                this.dataService.GetById(params['id']).subscribe(
                    editData =>
                    {
                        if (editData['result'] == "success") {
                            let data = editData['data'];
                            this.invoiceNo = data.id;
                            this.orderNo = data.order_no;
                            this.pocNo = data.poc_no;
                            this.productType = data.product_type;
                            this.drawingNo = data.drawing_no;
                            this.productName = data.product_name;
                            this.deliveryPrice = data.delivery_price;
                            this.deliveryQty = data.delivery_qty;
                            this.productPrice = data.product_price;

                            this.partnerName = data.ptn_name;
                            this.partnerBizNo = data.ptn_biz_no;
                            this.partnerCeo = data.ptn_ceo;
                            this.partnerAddr = data.ptn_addr;
                        }
                    }
                );
            }
        })
    }

}
