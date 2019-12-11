export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        partner_name: string;
        product_name: string;
        product_type: string;
        order_qty: number;
        delivery_qty: number;
        product_price: number;
        delivery_price: string;
        sales_qty: number;
        order_no: string;
        sales_completions_data: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
