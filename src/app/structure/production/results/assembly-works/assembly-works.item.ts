export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    sales_orders_detail_id: number;
    order_no: string;
    partner_name: string;
    product_name: string;
    product_type: string;
    line_no: string;
    production_work_line_id: string;
    promised_date: string;
    qty: number;
    start_date: string;
    end_date: string;
    personnel: string;
    personnel_id: number;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}

export class matlReceivingItem {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    material_code: number;
    material: string;
    size: number;
    steel_maker: string;
    rcv_date: string;
    ms_no: string;
    remaining_weight: number;
    partner_code: number;
    partner_name: string;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}
