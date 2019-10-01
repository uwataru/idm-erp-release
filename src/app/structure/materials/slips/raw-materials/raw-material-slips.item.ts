export class Item {
    totalCount: number;
    data: {
        rcv_date: string;
        material: string;
        size: number;
        partner_name: string;
        rcv_weight: number;
        price_per_unit: number;
        order_amount: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
