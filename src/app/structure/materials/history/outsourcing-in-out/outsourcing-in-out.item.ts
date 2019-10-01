export class Item {
    rowData: RowData;
    viewData: ViewData;
    detailsData: DetailsData;

    totalCount: number;
    totalOrderQty: number;
    totalRcvQty: number;
    maxResultCount: number;

    constructor() {
        
    }
}

export class ViewData {
    partner_name: string;
    sch_sdate: string;
    sch_edate: string;
    product_code: string;
    drawing_no: string;
    product_name:string;
    constructor() {
    }
}


export class RowData {
    id: string;
    rcv_date: string;
    partner_code: string;
    partner_name: string;
    product_code: string;
    product_name: string;
    drawing_no: string;
    rcv_qty: number;
    order_qty: number;

    order_type: string;
    sch_sdate: string;
    sch_edate: string;
}

export class DetailsData{
    id: string;
    process_date: string;
    poc_no: string;
    order_qty: number;
    rcv_qty: number;
    //불량:
    //LOSS:
    //LUCRE:
    //기말재고:
}