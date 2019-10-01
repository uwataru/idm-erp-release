export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        product_code: string;
        product_name: string;
        drawing_no: string;
        product_reg_no: number;
        outs_partner_code: number;
        outs_partner_name: string;
        forging_partner_code: number;
        forging_partner_name: string;
        ref_matl_supl_type: any;
        material_cost: number;
        matl_cost: number;
        forging_cost: number;
        outsourcing_cost: number;
        outs_cost: number;
        material: string;
        size: number;
        input_weight: number;
        order_date: string;
        partner_code: number;
        partner_name: string;
        material_supply_type: number;
        matl_supl_type: number;
        rcv_req_date: string;
        poc_no: string;
        steel_maker: string;
        storage: string;
        ms_no: string;
        estimated_weight: string;
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
