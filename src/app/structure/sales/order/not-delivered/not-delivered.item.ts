export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        delivery_date: string;
        partner_name: string;
        product_name: string;
        product_type: string;
        order_qty: number;
        current_qty: number;
        delivery_qty: number;
        product_price: number;
        delivery_price: string;
        delivered_qty: number;
        order_no: string;
        transport_vehicle: string;
        unload_place: string;
        unload_place_id: number;
        sales_orders_detail_id: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
