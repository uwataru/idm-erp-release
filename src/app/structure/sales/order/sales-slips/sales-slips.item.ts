export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        product_code: string;
        partner_code: number;
        partner_name: string;
        drawing_no: string;
        product_name: string;
        sales_qty: number;
        product_price: number;
        sales_price: number;
        order_no: string;
        delivery_date: string;
        sales_date: string;
        poc_no: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
