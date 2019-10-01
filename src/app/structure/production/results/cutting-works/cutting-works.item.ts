export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_no: string;
        poc_no: string;
        release_type: number;
        product_code: string;
        product_name: string;
        order_cutting_qty: number;
        order_qty: number;
        cutting_qty: number;
        cutting_total: number;
        order_material: string;
        production_line: string;
        drawing_no: string;
        material: string;
        order_size: number;
        size: number;
        order_steel_maker: string;
        steel_maker: string;
        order_ms_no: string;
        ms_no: string;
        order_input_weight: number;
        input_weight: number;
        is_combi: boolean;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class matlReceivingItem {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        material_code: number;
        material: string;
        size: number;
        steel_maker: string;
        rcv_date: string;
        ms_no: string;
        remaining_weight: number;
        partner_code: number;
        partner_name: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
