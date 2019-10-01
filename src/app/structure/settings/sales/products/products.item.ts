export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        partner_code: string;
        partner_name: string;
        product_code: string;
        is_combi: string;
        product_type: string;
        product_name: string;
        product_price: number;
        is_tmp_price: string;
        drawing_no: string;
        sub_drawing_no: string;
        material: string;
        sub_material: string;
        steel_maker: string;
        size: number;
        cut_length: number;
        material_weight: number;
        product_weight: number;
        input_weight: number;
        production_line: string;
        preparation_time: string;
        ct: number;
        ea_m: number;
        cutting_method: string;
        heating_process: string;
        heating_spec: string;
        special_process: string;
        sq: string;
        inspection: string;
        selection: string;
        ann_qt: number;
        lot_qt: number;
        st: number;

        combi_id: number;
        combi_product_code: string;
        combi_product_price: number;
        combi_product_weight: number;
        combi_heating_spec: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
