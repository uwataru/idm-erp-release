export class Item {
    //id: number;
    totalCount: number;
    data: {
        order_no: string;
        product_name: string;
        partner_name: string;
        qty: number;
        return_qty: number;
        product_price: number;
        sales_price: number;
        input_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
