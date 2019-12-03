export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_no: string;
        partner_name: string;
        product_name: string;
        product_type: string;
        line_no: string;
        qty: number;
        Production_qty: number;
        promised_date: string;
        start_date: string;
        end_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
