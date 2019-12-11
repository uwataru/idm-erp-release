export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_no: string;
        partner_name: string;
        input_date: string;
        product_name: string;
        product_type: string;
        product_price: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
export class NoteItem {
    //id: number;
    totalCount: number;
    data: {
        input_date: string;
        set_value: string;
        qty: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
