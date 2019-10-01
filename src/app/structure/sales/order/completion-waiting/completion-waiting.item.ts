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
        product_price: number;
        delivery_price: string;
        delivered_qty: number;
        order_no: string;
        poc_no: string;
        heat_no: string;
        transport_vehicle: string;
        unload_place: string;
        st: number;
        sales_completions_data: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
