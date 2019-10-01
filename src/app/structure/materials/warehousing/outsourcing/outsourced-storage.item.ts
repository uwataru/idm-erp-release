export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;

        poc_no: string;
        line_code: string;
        product_code: string;
        drawing_no: string;
        product_name: string;
        input_date: string;
        production_qty: number;

        outs_id: number;
        rcv_date: string,
        order_type: string,
        order_qty: number,
        partner_code: number,
        partner_name: string,
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
