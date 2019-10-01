export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        product_code: string;
        product_reg_no: string;
        forging_partner_code: number;
        forging_partner_name: string;
        material_supply_type: number;
        material_cost: number;
        forging_cost: number;
        outsourcing_cost: number;
        partner_code: number;
        partner_name: string;
        product_type: string;
        drawing_no: string;
        sub_drawing_no: string;
        product_name: string;
        production_line: string;
        product_price: string;
        is_tmp_price: string;
        material: string;
        size: string;
        cut_length: number;
        material_weight: number;
        input_weight: number;
        st: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
