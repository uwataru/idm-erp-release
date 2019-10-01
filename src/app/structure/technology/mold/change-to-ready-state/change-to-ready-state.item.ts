export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_no: string;
        delivery_no: number;
        product_code: string;
        product_name: string;
        drawing_no: string;
        partner_code: number;
        partner_name: string;
        poc_no: string;
        product_price: number;
        sales_price: number;
        sales_date: string;
        delivery_date: string;
        mold_code: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class moldItem {
    //id: number;
    totalCount: number;
    data: {
        mold_code: string;
        management_no: string;
        production_date: string;
        repair_date: string;
        remaining_limits: number;
        mold_stand_no: string;
        production_line: string;
        working_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
