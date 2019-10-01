export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        order_id: number;
        rcv_date: string;
        partner_code: number;
        partner_name: string;
        result_type: string;
        material_maker_name: string;
        material_maker: string;
        steel_maker: string;
        is_report: string;
        is_mealsheet: string;
        materials: string;
        material_code: number;
        material_name: string;
        ms_no: string;
        size: number;
        material_size: number;
        rcv_weight: string;
        price_per_unit: number;
        order_weight: number;
        order_amount: number;
        storage: string;
        rcv_location: string;

        // 재고수량 추가
        remaining_weight: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
