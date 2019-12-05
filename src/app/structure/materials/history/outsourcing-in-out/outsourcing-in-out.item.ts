export class Item {
    rowData: RowData;
    totalCount: number;
    maxResultCount: number;

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
    transfer_qty: number;
    receiving_qty: number;
    insert_qty: number;
    retrun_qty: number;
    remain_qty: number;
    sch_sdate: string;
    sch_edate: string;
}
