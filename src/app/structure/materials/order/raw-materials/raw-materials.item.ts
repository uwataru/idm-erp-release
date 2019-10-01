export class Item {
    //id: number;
    totalCount: number;
    data: {
        code: string;
        material_code: number;
        material: string;
        material_name: string;
        material_size: string;
        size: string;
        maker_name: string;
        maker_code: string;
        maker: string;
        partner_code: string;
        partner_name: string;
        price_per_unit: string;
        price: string;
        order_date1: string;
        order_date2: string;
        order_date3: string;
        order_weight1: number;
        order_weight2: number;
        order_weight3: number;
        order_amount1: number;
        order_amount2: number;
        order_amount3: number;
        rcv_request_date1: string;
        rcv_request_date2: string;
        rcv_request_date3: string;
        rcv_location1: string;
        rcv_location2: string;
        rcv_location3: string;
        remaining_weight: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
