export class Item {
    //id: number;
    totalCount: number;
    data: {
        id: number;
        mold_code: string;
        product_name: string;
        product_code: string;
        partner_name: string;
        partner_code: string;
        production_line: string;
        equipment_name: string;
        prod_partner_code: string;
        prod_partner_name: string;
        production_date: string;
        production_costs: number;
        mold_size: number;
        mold_material: string;
        production_limits: number;
        repair_date: string;
        remaining_limits: number;
        mold_stand_no: string;
        repair_company: string;
        repair_order_date: string;
        repair_rcv_req_date: string;
        management_no: string;
        product_type: string;
        sub_drawing_no: string;
        drawing_no: string;
        material: string;
        size: number;
        cut_length: number;
    };
    maxResultCount: number;
    result: string;
    errorMessage: string;
}
