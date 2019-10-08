export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        material: string;
        material_type: string;
        size: string;
        partner_code: string;
        partner_name: string;
        price: number;
        price_date: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
