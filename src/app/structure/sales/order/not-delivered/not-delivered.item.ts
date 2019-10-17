export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        delivery_date: string;
        partner_code: number;
        partner_name: string;
        product_code: string;
        product_name: string;
        order_qty: number;
        delivery_qty: number;
        // production_qty: number;
        normal_qty: number;
        product_price: number;
        delivery_price: string;
        delivered_qty: number;
        order_no: string;
        poc_no: string;
        ms_no: string;
        transport_vehicle: string;
        unload_place: string;
        invoice_id: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
