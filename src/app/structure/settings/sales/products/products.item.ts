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
        name: string;
        type: string;
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
    id: number;
    materials_id: number;
    name: string;
    qty: number;
    price: number;
    state: number;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
