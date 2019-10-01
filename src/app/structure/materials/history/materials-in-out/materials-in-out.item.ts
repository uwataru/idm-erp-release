export class ViewData {
    material_code: string;
    size: number;
    steel_maker_code:string;
    partner_code: string;
    sch_sdate: string;
    sch_edate: string;
    constructor() {
    }
}


export class RowData {
    id: number;
    rcv_date: string;
    partner_code: string;
    partner_name: string;
    size: number;
    steel_maker_code: string;
    steel_maker: string;
    quantity: string;
    material: string;
    material_code: string;
    price_per_unit: number;
    order_amount: number;
    rcv_weight: string;
    used_weight: number;
    remaining_weight: number;
    remaining_amount: number;
}
export class DetailsData {
    process_date: string;
    material: string;
    material_code: string;
    size: number;
    steel_maker: string;
    partner_code: number;
    partner_name: string;
    rcv_weight: number;
    used_weight: number;
    remaining_weight: number;
}

export class Item {
    //id: number;
    rowData: RowData;
    viewData: ViewData;
    detailsData: DetailsData;

    maxResultCount: number;
    totalCount: number;
    totalOrderAmount: number;
    totalRemaingAmount: number;
    totalWeight: number;
    totalRcvWeight: number;
    totalUsedWeight: number;
    constructor() {
        
    }
}