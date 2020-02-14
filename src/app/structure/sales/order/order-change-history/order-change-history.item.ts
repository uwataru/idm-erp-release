export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        partner_code: number;
        partner_name: string;
        input_date: string;
        order_type1: string;
        order_type2: string;
        order_no: string;
        product_code: string;
        product_type: string;
        // drawing_no: string;
        sub_drawing_no: string;
        product_name: string;
        order_qty: number;
        product_price: number;
        is_tmp_price: string;
        production_line: string;
        delivery_date: string;
        promised_date: string;
        modi_reason: string;
        st: number;
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
        before_value: number;
        after_promised_date: string;
        after_value: number;
        set_value: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
