export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        partner_code: string;
        partner_name: string;
        product_code: string;
        product_type: string;
        product_name: string;
        product_price: number;
        is_tmp_price: string;
        material: string;
        size: number;
        production_line: string;
        preparation_time: string;
        assembly_method: string;
        sq: string;
        inspection: string;
        selection: string;
        ann_qt: number;
        lot_qt: number;
        st: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class MaterialItem{
    material_name: string;
    material_qty: number;
    material_price: number;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
