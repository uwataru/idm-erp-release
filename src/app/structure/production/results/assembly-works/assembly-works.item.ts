export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    order_no: string;
    poc_no: string;
    release_type: number;
    product_code: string;
    product_name: string;
    order_assembly_qty: number;
    order_qty: number;
    assembly_qty: number;
    assembly_total: number;
    order_material: string;
    production_line: string;
    material: string;
    order_size: number;
    size: number;
    order_input_weight: number;
    input_weight: number;
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
