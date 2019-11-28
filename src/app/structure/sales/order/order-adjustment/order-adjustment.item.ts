export class Item {
    //id: number;
    totalCount: number;
    data: {
        "id": number,
        "input_date": string,
        "first_input_date": string,
        "order_no": string,
        "partner_id": number,
        "order_type": string,
        "demand_date": string,
        "promised_date": string,
        "sales_order_detail_id": number,
        "partner_name": string,
        "product_name": string,
        "product_type": string,
        "product_qty": number,
        "price": number,
        "line_no": string,
        "product_price": number
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
