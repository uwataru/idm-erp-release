export class RowData {
    line_code: number;
    order_no: string;
    delivery_no: number;
    product_code: string;
    product_name: string;
    production_line: string;
    drawing_no: string;
    partner_code: number;
    partner_name: string;
    poc_no: string;
    sales_qty: number;
    product_price: number;
    sales_price: number;
    sales_date: string;
    delivery_date: string;
    inventory_qty: number;
    constructor() {
    }
}

export class Item {
    //id: number;
    totalCount: number;
    rowData: RowData;
    maxResultCount: number;
    result: string;
    errorMessage: string;
    constructor() {
    }
}
