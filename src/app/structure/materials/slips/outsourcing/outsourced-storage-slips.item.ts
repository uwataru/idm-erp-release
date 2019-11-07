export class Item {
    totalCount: number;
    data: {
        product_type: string;
        product_name: string;
        outs_id: string;
        partner_name: string;
        rcv_qty: number;
        price_per_unit: number;
        order_amount: number;
        rcv_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
