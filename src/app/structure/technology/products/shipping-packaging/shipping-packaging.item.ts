export class Item {
    //id: number;
    totalCount: number;
    data: {
        sp_date: string;
        order_no: string;
        partner_name: string;
        partner_code: string;
        product_code: string;
        product_name: string;
        qty: number;
        product_price: number;
        price: number;
        type: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
