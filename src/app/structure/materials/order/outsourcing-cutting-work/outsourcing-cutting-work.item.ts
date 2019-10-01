export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        product_code: string;
        product_name: string;
        drawing_no: string;
        outs_partner_code: number;
        outs_partner_name: string;
        cutting_partner_code: number;
        cutting_partner_name: string;
        material: string;
        size: number;
        cut_length: number;
        input_weight: number;
        forwarding_weight: number;
        order_date: string;
        steel_maker: string;
        partner_code: number;
        partner_name: string;
        rcv_req_date: string;
        poc_no: string;
        order_qty: number;
        pp_id: number;
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
