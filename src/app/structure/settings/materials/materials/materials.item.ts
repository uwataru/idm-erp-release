export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        input_date: string;
        name: string;
        partner_id: number;
        size: string;
        price: number;
        price_date: string;
        partner_alias: string;
        partner_name: string;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}

export class PartnerItem {
    partner_code: string;
    partner_name: string;
}
