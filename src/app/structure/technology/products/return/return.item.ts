export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        sales_orders_detail_id: number;
        product_id: number;
        product_name: string;
        product_type: string;
        partner_name: string;
        qty: number;
        return_date: number;
        price: number;
        type: boolean;
        settings_type: string,
        settings_type_id: number,
        etc: string,
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class NoteItem {
    //id: number;
    totalCount: number;
    data: {
        return_type: string;
        return_date: string;
        set_value: string;
        qty: number;
        etc: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
