export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_type: boolean;
        rcv_date: string;
        receiving_type: number;
        order_price: number;
        material_id: number;
        order_qty: number;
        promised_date: string;
        receiving_qty: number;
        receiving_price: number;
        receiving_date: string;
        receiving_location_id: number;
        input_date: string;
        is_type: boolean;
        name: string;
        partner_id: number;
        size: string;
        price: number;
        current_qty: number;
        partner_name: string;
        receiving_location_name: string;

    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
