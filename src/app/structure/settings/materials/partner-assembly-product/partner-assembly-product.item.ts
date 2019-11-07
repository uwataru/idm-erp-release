export class Item {
  //id: number;
  totalCount: number;
  data: {
    id: number;
    input_date: string;
    product_code: string;
    product_reg_no: string;
    assembly_partner_code: number;
    assembly_partner_name: string;
    material_supply_type: number;
    material_cost: number;
    assembly_cost: number;
    outsourcing_cost: number;
    partner_code: number;
    partner_name: string;
    product_type: string;
    product_name: string;
    production_line: string;
    product_price: string;
    is_tmp_price: string;
    material: string;
    size: string;
    st: number;
  };
  maxResultCount: number;
  result: string;
  errorMessage: string;
}

export class PartnerItem {
  partner_code: string;
  partner_name: string;
}
